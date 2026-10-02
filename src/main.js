import './styles.css';
import { analyze } from './analysis.js';

const API_ROOT = 'https://api.twelvedata.com/time_series';
const markets = [
  { symbol: 'XAU/USD', name: 'Oro / Dólar', tag: 'METAL', decimals: 2 },
  { symbol: 'EUR/USD', name: 'Euro / Dólar', tag: 'FX', decimals: 5 },
  { symbol: 'GBP/USD', name: 'Libra / Dólar', tag: 'FX', decimals: 5 },
  { symbol: 'USD/JPY', name: 'Dólar / Yen', tag: 'FX', decimals: 3 },
];

const state = { selected: markets[0], candles: [], loading: false, error: '', result: null };
const keyName = 'aurum_twelve_data_key';

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a class="brand" href="#" aria-label="Aurum Señal, inicio"><span class="brand-mark">A</span><span>AURUM <b>SEÑAL</b></span></a>
    <div class="market-state"><span class="pulse"></span><span id="connectionLabel">Sin conectar</span></div>
    <button class="icon-button" id="settingsButton" aria-label="Configurar fuente de datos">⚙</button>
  </header>
  <main>
    <section class="hero">
      <p class="eyebrow">ANÁLISIS TÉCNICO · 5 MIN</p>
      <h1>Decisiones claras.<br><em>Riesgo bajo control.</em></h1>
      <p class="intro">Lectura técnica de oro y divisas basada únicamente en datos recibidos de una fuente identificada.</p>
    </section>
    <nav class="asset-tabs" aria-label="Seleccionar instrumento">
      ${markets.map((market, index) => `<button class="asset-tab ${index === 0 ? 'active' : ''}" data-symbol="${market.symbol}"><small>${market.tag}</small>${market.symbol.replace('/', ' / ')}</button>`).join('')}
    </nav>
    <section class="terminal" aria-live="polite">
      <div class="quote-head">
        <div><span class="asset-tag" id="assetTag">METAL</span><h2 id="assetName">Oro / Dólar</h2><p id="symbolName">XAU / USD</p></div>
        <button class="refresh" id="refreshButton">↻ <span>Actualizar</span></button>
      </div>
      <div id="content"></div>
    </section>
    <section class="method">
      <div><p class="eyebrow">CÓMO SE CALCULA</p><h2>Disciplina antes<br>que impulso.</h2></div>
      <div class="rules">
        <article><span>01</span><div><h3>Tendencia</h3><p>Cruce de medias exponenciales EMA 9 y EMA 21.</p></div></article>
        <article><span>02</span><div><h3>Confirmación</h3><p>RSI de 14 periodos evita señales sin momentum.</p></div></article>
        <article><span>03</span><div><h3>Riesgo</h3><p>Stop y objetivo se estiman con ATR; relación riesgo/beneficio 1:1,5.</p></div></article>
      </div>
    </section>
    <section class="notice"><span>!</span><div><strong>No es asesoramiento financiero</strong><p>Es una herramienta informativa. Verifica precio y niveles en MetaTrader 5 antes de operar. Ninguna señal garantiza resultados. MetaQuotes-Demo e INFINOX no están conectados a esta web.</p></div></section>
  </main>
  <footer><span>AURUM SEÑAL</span><p>Hecho para consultar desde iPad y móvil · Tus claves permanecen en este dispositivo</p></footer>
  <dialog id="settingsDialog">
    <form method="dialog" class="dialog-card">
      <button class="close" value="cancel" aria-label="Cerrar">×</button>
      <p class="eyebrow">FUENTE DE DATOS</p><h2>Conecta Twelve Data</h2>
      <p>Crea una clave gratuita en <a href="https://twelvedata.com/pricing" target="_blank" rel="noreferrer">Twelve Data</a>. No contrates ningún plan de pago sin revisarlo antes.</p>
      <label>API key<input id="apiKey" type="password" autocomplete="off" placeholder="Pega aquí tu clave" /></label>
      <p class="privacy">La clave se guarda solo en el almacenamiento local de este navegador. En una web estática no puede considerarse secreta: utiliza una clave gratuita y con límites.</p>
      <button class="primary" id="saveKey" value="default">Guardar y conectar</button>
      <button class="text-button" id="deleteKey" value="cancel" type="button">Eliminar clave guardada</button>
    </form>
  </dialog>`;

const $ = (selector) => document.querySelector(selector);

function format(value) {
  return Number(value).toLocaleString('es-ES', { minimumFractionDigits: state.selected.decimals, maximumFractionDigits: state.selected.decimals });
}

function render() {
  const content = $('#content');
  if (state.loading) {
    content.innerHTML = `<div class="empty"><div class="spinner"></div><h3>Consultando el mercado…</h3><p>Validando hora y calidad de los datos.</p></div>`;
    return;
  }
  if (state.error || !state.result) {
    content.innerHTML = `<div class="empty"><span class="wait-symbol">—</span><p class="signal wait">ESPERAR</p><h3>${state.error || 'Conecta una fuente para comenzar'}</h3><p>No se generan niveles sin una cotización válida y reciente.</p><button class="primary open-settings">Configurar fuente</button></div>`;
    $('.open-settings')?.addEventListener('click', openSettings);
    return;
  }
  const latest = state.candles.at(-1);
  const change = latest.close - state.candles.at(-2).close;
  const changePct = (change / state.candles.at(-2).close) * 100;
  const { signal, reason, levels, indicators } = state.result;
  const signalClass = signal === 'COMPRA' ? 'buy' : signal === 'VENTA' ? 'sell' : 'wait';
  content.innerHTML = `
    <div class="price-row">
      <div><p class="label">ÚLTIMO CIERRE</p><strong class="price">${format(latest.close)}</strong><span class="delta ${change >= 0 ? 'up' : 'down'}">${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%</span></div>
      <div class="source"><p><span class="live-dot"></span> DATO RECIBIDO</p><b>${new Date(latest.time).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</b><small>Fuente: Twelve Data · intervalo 5 min</small></div>
    </div>
    <div class="signal-panel ${signalClass}">
      <div class="signal-copy"><p class="label">SEÑAL TÉCNICA</p><p class="signal ${signalClass}">${signal}</p><p>${reason}</p></div>
      <div class="indicator"><span>RSI 14</span><strong>${indicators.rsi.toFixed(1)}</strong></div>
    </div>
    ${levels ? `<div class="levels">
      ${levelCard('Entrada', levels.entry, 'entry')}
      ${levelCard('Stop Loss', levels.stop, 'stop')}
      ${levelCard('Take Profit', levels.take, 'take')}
    </div><p class="mt5-note">Copia cada nivel y pégalo manualmente al crear la orden en MetaTrader 5. Confirma que coincide con la cotización de tu bróker.</p>` : `<div class="no-levels"><strong>Niveles bloqueados</strong><span>Solo aparecen con COMPRA o VENTA confirmada.</span></div>`}
  `;
  document.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', copyLevel));
}

function levelCard(label, value, kind) {
  return `<article class="level ${kind}"><p>${label}</p><strong>${format(value)}</strong><button data-copy="${value.toFixed(state.selected.decimals)}" aria-label="Copiar ${label}"><span>▣</span> Copiar</button></article>`;
}

async function copyLevel(event) {
  const button = event.currentTarget;
  await navigator.clipboard.writeText(button.dataset.copy);
  const previous = button.innerHTML;
  button.innerHTML = '✓ Copiado';
  setTimeout(() => { button.innerHTML = previous; }, 1400);
}

async function loadMarket() {
  const key = localStorage.getItem(keyName);
  if (!key) {
    state.error = 'Falta configurar la API key gratuita';
    state.result = null;
    $('#connectionLabel').textContent = 'Sin conectar';
    render();
    return;
  }
  state.loading = true; state.error = ''; render();
  try {
    const url = new URL(API_ROOT);
    url.search = new URLSearchParams({ symbol: state.selected.symbol, interval: '5min', outputsize: '80', timezone: 'UTC', apikey: key });
    const response = await fetch(url);
    if (!response.ok) throw new Error(`La fuente respondió ${response.status}`);
    const data = await response.json();
    if (data.status === 'error' || !Array.isArray(data.values)) throw new Error(data.message || 'La fuente no entregó cotizaciones');
    state.candles = data.values.map((item) => ({
      time: new Date(`${item.datetime.replace(' ', 'T')}Z`).getTime(),
      open: Number(item.open), high: Number(item.high), low: Number(item.low), close: Number(item.close),
    })).filter((item) => Object.values(item).every(Number.isFinite)).sort((a, b) => a.time - b.time);
    state.result = analyze(state.candles);
    state.error = '';
    $('#connectionLabel').textContent = state.result.reason === 'Cotización desactualizada' ? 'Datos desactualizados' : 'Fuente conectada';
  } catch (error) {
    state.candles = []; state.result = null; state.error = error.message;
    $('#connectionLabel').textContent = 'Sin datos';
  } finally { state.loading = false; render(); }
}

function selectMarket(event) {
  state.selected = markets.find((item) => item.symbol === event.currentTarget.dataset.symbol);
  document.querySelectorAll('.asset-tab').forEach((tab) => tab.classList.toggle('active', tab === event.currentTarget));
  $('#assetTag').textContent = state.selected.tag;
  $('#assetName').textContent = state.selected.name;
  $('#symbolName').textContent = state.selected.symbol.replace('/', ' / ');
  loadMarket();
}

function openSettings() {
  $('#apiKey').value = localStorage.getItem(keyName) || '';
  $('#settingsDialog').showModal();
}

document.querySelectorAll('.asset-tab').forEach((tab) => tab.addEventListener('click', selectMarket));
$('#refreshButton').addEventListener('click', loadMarket);
$('#settingsButton').addEventListener('click', openSettings);
$('#saveKey').addEventListener('click', () => {
  const key = $('#apiKey').value.trim();
  if (key) localStorage.setItem(keyName, key); else localStorage.removeItem(keyName);
  setTimeout(loadMarket);
});
$('#deleteKey').addEventListener('click', () => { localStorage.removeItem(keyName); $('#apiKey').value = ''; $('#settingsDialog').close(); loadMarket(); });
loadMarket();

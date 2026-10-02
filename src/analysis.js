export const STALE_AFTER_MS = 20 * 60 * 1000;

export function ema(values, period) {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let result = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  for (const value of values.slice(period)) result = value * k + result * (1 - k);
  return result;
}

export function rsi(values, period = 14) {
  if (values.length <= period) return null;
  const changes = values.slice(1).map((value, index) => value - values[index]);
  const recent = changes.slice(-period);
  const gains = recent.reduce((sum, value) => sum + Math.max(0, value), 0) / period;
  const losses = recent.reduce((sum, value) => sum + Math.max(0, -value), 0) / period;
  if (losses === 0) return 100;
  return 100 - 100 / (1 + gains / losses);
}

export function atr(candles, period = 14) {
  if (candles.length <= period) return null;
  const ranges = candles.slice(1).map((candle, index) => Math.max(
    candle.high - candle.low,
    Math.abs(candle.high - candles[index].close),
    Math.abs(candle.low - candles[index].close),
  ));
  return ranges.slice(-period).reduce((sum, value) => sum + value, 0) / period;
}

export function analyze(candles, now = Date.now()) {
  if (!Array.isArray(candles) || candles.length < 30) {
    return { signal: 'ESPERAR', reason: 'Historial insuficiente', levels: null };
  }
  const ordered = [...candles].sort((a, b) => a.time - b.time);
  const latest = ordered.at(-1);
  if (!Number.isFinite(latest?.close) || !Number.isFinite(latest?.time)) {
    return { signal: 'ESPERAR', reason: 'Datos incompletos', levels: null };
  }
  if (now - latest.time > STALE_AFTER_MS || latest.time > now + 60_000) {
    return { signal: 'ESPERAR', reason: 'Cotización desactualizada', levels: null };
  }

  const closes = ordered.map((item) => item.close);
  const fast = ema(closes, 9);
  const slow = ema(closes, 21);
  const strength = rsi(closes);
  const volatility = atr(ordered);
  if (![fast, slow, strength, volatility].every(Number.isFinite) || volatility <= 0) {
    return { signal: 'ESPERAR', reason: 'No se pueden validar los indicadores', levels: null };
  }

  let signal = 'ESPERAR';
  let reason = 'Sin confluencia suficiente entre tendencia y momentum';
  if (fast > slow && strength >= 52 && strength <= 70) {
    signal = 'COMPRA';
    reason = 'EMA 9 sobre EMA 21 y RSI confirma impulso alcista';
  } else if (fast < slow && strength >= 30 && strength <= 48) {
    signal = 'VENTA';
    reason = 'EMA 9 bajo EMA 21 y RSI confirma impulso bajista';
  }

  const levels = signal === 'ESPERAR' ? null : {
    entry: latest.close,
    stop: signal === 'COMPRA' ? latest.close - volatility * 1.5 : latest.close + volatility * 1.5,
    take: signal === 'COMPRA' ? latest.close + volatility * 2.25 : latest.close - volatility * 2.25,
  };
  return { signal, reason, levels, indicators: { fast, slow, rsi: strength, atr: volatility } };
}

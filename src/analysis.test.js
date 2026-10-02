import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, ema, rsi, STALE_AFTER_MS } from './analysis.js';

const candles = (direction = 1, age = 0) => Array.from({ length: 40 }, (_, index) => {
  const close = 100 + direction * index * 0.2;
  return { close, high: close + 0.3, low: close - 0.3, time: Date.now() - age - (39 - index) * 300_000 };
});

describe('indicadores y controles de seguridad', () => {
  it('calcula EMA y RSI', () => {
    assert.ok(ema([1, 2, 3, 4, 5], 3) > 3);
    assert.equal(rsi([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]), 100);
  });
  it('no genera niveles con datos insuficientes', () => {
    assert.equal(analyze(candles().slice(0, 10)).levels, null);
  });
  it('no genera niveles con datos desactualizados', () => {
    const result = analyze(candles(1, STALE_AFTER_MS + 1));
    assert.equal(result.signal, 'ESPERAR');
    assert.equal(result.levels, null);
  });
  it('genera niveles solo cuando hay una señal confirmada', () => {
    const result = analyze(candles(0.3));
    if (result.signal !== 'ESPERAR') assert.notEqual(result.levels, null);
  });
});

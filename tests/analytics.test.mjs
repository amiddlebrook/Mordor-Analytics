import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv, computeMetrics, correlation, ironCondor, makeDemoSeries, signals } from "../analytics.mjs";

test("CSV import groups sorted closes with quoted headers", () => {
  const data = parseCsv('"Date","Symbol","Close","Volume"\n2026-01-03,ABC,103,10\n2026-01-01,ABC,100,9\n2026-01-02,ABC,102,11\n2026-01-04,ABC,104,12\n2026-01-05,ABC,105,13');
  assert.deepEqual(data.ABC.map(row => row.close), [100, 102, 103, 104, 105]);
  assert.equal(data.ABC[0].volume, 9);
});
test("bad or too-short data is rejected", () => {
  assert.throws(() => parseCsv("date,price\n2026-01-01,99"), /at least five/i);
  assert.throws(() => parseCsv("foo,bar\nx,y"), /Required columns/i);
});
test("indicators are derived from prices", () => {
  const sample = Object.values(makeDemoSeries())[0];
  const m = computeMetrics(sample);
  assert.ok(m.last > 0);
  assert.ok(Number.isFinite(m.vol30));
  assert.ok(Number.isFinite(m.gap20));
  assert.ok(m.rsi14 >= 0 && m.rsi14 <= 100);
  assert.ok(signals(m).length >= 2);
});
test("correlation works with aligned price returns", () => {
  const one = Array.from({length: 30}, (_, i) => ({date: "D" + i, close: 100 + i * i}));
  const two = one.map(x => ({date: x.date, close: x.close * 3}));
  assert.ok(correlation(one, two) > .999);
});
test("iron condor payouts are correct per 100-share contract", () => {
  const s = ironCondor(100, 10, 5, 1.5);
  assert.deepEqual([s.longPut,s.shortPut,s.shortCall,s.longCall], [85,90,110,115]);
  assert.equal(s.maxProfit, 150);
  assert.equal(s.maxLoss, 350);
  assert.equal(s.breakevenLow, 88.5);
  assert.equal(s.breakevenHigh, 111.5);
  assert.throws(() => ironCondor(100, 10, 5, 5));
});

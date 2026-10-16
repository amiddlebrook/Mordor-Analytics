/**
 * Mordor analytics engine. Every reported indicator is computed from input prices.
 * The bundled example series are deterministic SYNTHETIC fixtures, never live quotes.
 */
export const DEMO_SYMBOLS = ["SPY", "QQQ", "NVDA", "BTC-USD"];

function splitCsv(csv) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (char === '"') {
      if (quoted && csv[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim()); cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && csv[i + 1] === "\n") i++;
      row.push(cell.trim()); cell = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quote.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parseCsv(csv) {
  if (typeof csv !== "string" || csv.length > 2_000_000) throw new Error("CSV must be under 2 MB.");
  const rows = splitCsv(csv.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("Add a header and at least one data row.");
  const header = rows[0].map(v => v.toLowerCase().replace(/[\s_-]+/g, ""));
  const column = aliases => aliases.map(alias => header.indexOf(alias)).find(n => n >= 0) ?? -1;
  const dateCol = column(["date", "timestamp", "time"]);
  const priceCol = column(["close", "adjclose", "price"]);
  const symbolCol = column(["symbol", "ticker", "asset"]);
  const volumeCol = column(["volume", "vol"]);
  if (dateCol < 0 || priceCol < 0) throw new Error("Required columns: Date and Close. Optional: Symbol and Volume.");
  const map = new Map();
  for (const row of rows.slice(1, 15001)) {
    const symbol = (symbolCol >= 0 ? row[symbolCol] : "IMPORTED")?.trim().toUpperCase().slice(0, 18);
    const rawDate = row[dateCol]?.trim();
    const price = Number(row[priceCol]?.replace(/[$,]/g, ""));
    const date = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : "";
    if (!symbol || !date || !Number.isFinite(price) || price <= 0) continue;
    const vol = volumeCol >= 0 ? Number(row[volumeCol]?.replace(/,/g, "")) : 0;
    if (!map.has(symbol)) {
      if (map.size >= 20) continue;
      map.set(symbol, new Map());
    }
    map.get(symbol).set(date, { date, close: price, volume: Number.isFinite(vol) && vol >= 0 ? vol : 0 });
  }
  const result = {};
  for (const [symbol, values] of map) {
    const sorted = [...values.values()].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length >= 5) result[symbol] = sorted;
  }
  if (!Object.keys(result).length) throw new Error("No valid symbols with at least five dated prices were found.");
  return result;
}

export function makeDemoSeries() {
  const all = {};
  const seeds = { SPY: [555, 0.0007, 1.8, 1], QQQ: [480, 0.001, 3.1, 2], NVDA: [132, 0.0015, 4.2, 3], "BTC-USD": [88000, 0.0013, 4.8, 4] };
  for (const [symbol, [start, drift, amplitude, phase]] of Object.entries(seeds)) {
    const series = []; let price = start;
    for (let i = 0; i < 180; i++) {
      const d = new Date(Date.UTC(2025, 0, 1 + i));
      if (d.getUTCDay() === 0 || d.getUTCDay() === 6) continue;
      price = price * (1 + drift + Math.sin(i * .43 + phase) * amplitude / 800 +
        Math.cos(i * .17 + phase * .53) * amplitude / 1100);
      series.push({ date: d.toISOString().slice(0, 10), close: Number(price.toFixed(2)),
        volume: Math.round(500000 + (Math.sin(i * .77 + phase) + 1.3) * 280000) });
    }
    all[symbol] = series;
  }
  return all;
}

export function computeMetrics(rows) {
  if (!Array.isArray(rows) || rows.length < 2) throw new Error("At least two prices are required.");
  const data = rows.map((r, i) => ({
    ...r,
    ma20: i >= 19 ? rows.slice(i - 19, i + 1).reduce((a, v) => a + v.close, 0) / 20 : null,
    ma50: i >= 49 ? rows.slice(i - 49, i + 1).reduce((a, v) => a + v.close, 0) / 50 : null
  }));
  const last = data[data.length - 1], prev = data[data.length - 2];
  const past30 = data[Math.max(0, data.length - 31)];
  const recent = data.slice(-31);
  const logReturns = recent.slice(1).map((p, i) => Math.log(p.close / recent[i].close));
  const average = logReturns.reduce((a, b) => a + b, 0) / Math.max(1, logReturns.length);
  const variance = logReturns.reduce((a, x) => a + (x - average) ** 2, 0) / Math.max(1, logReturns.length - 1);
  const period = data.slice(-15);
  const diffs = period.slice(1).map((p, i) => p.close - period[i].close);
  const gains = diffs.reduce((a, d) => a + Math.max(0, d), 0) / Math.max(1, diffs.length);
  const losses = diffs.reduce((a, d) => a + Math.max(0, -d), 0) / Math.max(1, diffs.length);
  const rsi = diffs.length === 14 ? (losses === 0 ? 100 : 100 - 100 / (1 + gains / losses)) : null;
  let peak = 0, maxDrawdown = 0;
  for (const p of data) {
    peak = Math.max(peak, p.close);
    maxDrawdown = Math.min(maxDrawdown, (p.close - peak) / peak * 100);
  }
  return {
    data,
    last: last.close,
    date: last.date,
    dayChange: (last.close / prev.close - 1) * 100,
    momentum30: (last.close / past30.close - 1) * 100,
    ma20: last.ma20,
    ma50: last.ma50,
    gap20: last.ma20 ? (last.close / last.ma20 - 1) * 100 : null,
    vol30: Math.sqrt(variance * 252) * 100,
    rsi14: rsi,
    drawdown: maxDrawdown,
    observations: data.length
  };
}

export function correlation(first, second) {
  const byDate = new Map(second.map(row => [row.date, row.close]));
  const paired = first.filter(row => byDate.has(row.date)).map(row => [row.close, byDate.get(row.date)]).slice(-91);
  if (paired.length < 6) return null;
  const x = [], y = [];
  for (let i = 1; i < paired.length; i++) {
    x.push(Math.log(paired[i][0] / paired[i - 1][0]));
    y.push(Math.log(paired[i][1] / paired[i - 1][1]));
  }
  const avg = a => a.reduce((s, v) => s + v, 0) / a.length;
  const mx = avg(x), my = avg(y);
  const xx = x.reduce((s, v) => s + (v - mx) ** 2, 0);
  const yy = y.reduce((s, v) => s + (v - my) ** 2, 0);
  if (xx === 0 || yy === 0) return null;
  const xy = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0);
  return Math.max(-1, Math.min(1, xy / Math.sqrt(xx * yy)));
}

export function signals(metrics) {
  const items = [];
  if (metrics.ma20 != null && metrics.ma50 != null) {
    items.push({
      title: "Moving-average regime",
      state: metrics.ma20 >= metrics.ma50 ? "Bullish" : "Bearish",
      detail: "SMA20 " + (metrics.ma20 >= metrics.ma50 ? "above" : "below") + " SMA50",
      tone: metrics.ma20 >= metrics.ma50 ? "up" : "down"
    });
  }
  if (metrics.gap20 != null) {
    const a = metrics.gap20;
    items.push({
      title: "Price / SMA20 divergence", state: a >= 2 ? "Extended" : a <= -2 ? "Discounted" : "Neutral",
      detail: a.toFixed(2) + "% versus the 20-session average",
      tone: Math.abs(a) >= 2 ? "watch" : "neutral"
    });
  }
  if (metrics.rsi14 != null) {
    const v = metrics.rsi14;
    items.push({
      title: "RSI (14)", state: v > 70 ? "Overbought" : v < 30 ? "Oversold" : "Balanced",
      detail: v.toFixed(1) + " based on 14 closing-price changes",
      tone: v > 70 || v < 30 ? "watch" : "neutral"
    });
  }
  return items;
}

export function ironCondor(spot, offset, width, credit) {
  for (const value of [spot, offset, width, credit])
    if (!Number.isFinite(value) || value <= 0) throw new Error("Enter positive numeric inputs.");
  if (offset >= spot || credit >= width) throw new Error("Offset must be under spot; credit must be under wing width.");
  const shortPut = spot - offset, longPut = shortPut - width;
  const shortCall = spot + offset, longCall = shortCall + width;
  const points = [];
  for (let i = 0; i <= 80; i++) {
    const expiry = Math.max(.01, spot - offset - width * 3 + i * (offset * 2 + width * 6) / 80);
    const profit = (credit - Math.max(shortPut - expiry, 0) + Math.max(longPut - expiry, 0)
      - Math.max(expiry - shortCall, 0) + Math.max(expiry - longCall, 0)) * 100;
    points.push({ expiry: Number(expiry.toFixed(2)), profit: Number(profit.toFixed(2)) });
  }
  return {
    shortPut, longPut, shortCall, longCall,
    maxProfit: credit * 100, maxLoss: (width - credit) * 100,
    breakevenLow: shortPut - credit, breakevenHigh: shortCall + credit, points
  };
}

import React, { useMemo, useRef, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { computeMetrics, correlation, ironCondor, makeDemoSeries, parseCsv, signals } from "./analytics.mjs";
import "./styles.css";

type Price = { date: string; close: number; volume: number };
type MarketData = Record<string, Price[]>;
type Tab = "overview" | "signals" | "strategies" | "insights";
const money = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n) ? "—" : "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n) ? "—" : (n > 0 ? "+" : "") + n.toFixed(2) + "%";
const decimal = (n: number | null | undefined, places = 2) =>
  n == null || !Number.isFinite(n) ? "—" : n.toFixed(places);
const tone = (n: number | null | undefined) => n == null ? "" : n >= 0 ? "positive" : "negative";
const nav: { id: Tab; title: string; glyph: string; description: string }[] = [
  { id: "overview", title: "Overview", glyph: "◫", description: "Market workspace" },
  { id: "signals", title: "Signal scanner", glyph: "⌁", description: "Technical analysis" },
  { id: "strategies", title: "Options lab", glyph: "◇", description: "Payoff simulation" },
  { id: "insights", title: "AI intelligence", glyph: "✳", description: "Workers AI analyst" }
];

function Brand() {
  return <div className="brand"><div className="brand-icon"><span>M</span></div>
    <div><div className="brand-title">MORDOR<span> / ANALYTICS</span></div><div className="brand-sub">THE EDGE INTELLIGENCE TERMINAL</div></div>
  </div>;
}
function SectionTitle({ eyebrow, title, subtitle, children }: {
  eyebrow: string; title: string; subtitle?: string; children?: React.ReactNode
}) {
  return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{children}</div>;
}
function Tag({ children, kind = "" }: { children: React.ReactNode; kind?: string }) {
  return <span className={"tag " + kind}>{children}</span>;
}
function MetricCard({ label, value, detail, change, icon }: {
  label: string; value: string; detail: string; change?: number | null; icon: string
}) {
  return <div className="metric-card">
    <div className="metric-label"><span>{label}</span><span className="metric-icon">{icon}</span></div>
    <div className="metric-number">{value}</div>
    <div className="metric-footer"><span className={tone(change)}>{detail}</span></div>
  </div>;
}
function PriceChart({ rows, range }: { rows: Array<Price & { ma20: number | null; ma50: number | null }>; range: number }) {
  const view = rows.slice(-range);
  return <div className="chart-wrap" role="img" aria-label="Historical price, 20 session and 50 session moving averages">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={view} margin={{ top: 12, right: 5, bottom: 0, left: -20 }}>
        <defs><linearGradient id="priceGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff684d" stopOpacity={0.32} />
          <stop offset="100%" stopColor="#ff684d" stopOpacity={0.005} />
        </linearGradient></defs>
        <CartesianGrid vertical={false} stroke="#242b39" strokeDasharray="4 7" />
        <XAxis dataKey="date" tick={{ fill: "#788399", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={40}
          tickFormatter={(value: string) => value.slice(5)} />
        <YAxis tick={{ fill: "#788399", fontSize: 11 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
        <Tooltip contentStyle={{ background: "#101724", border: "1px solid #344053", borderRadius: 10, color: "#f1f5fc" }}
          itemStyle={{ color: "#dee5f0" }} />
        <Area dataKey="close" name="Close" type="monotone" fill="url(#priceGlow)" stroke="#ff745d"
          strokeWidth={2.5} dot={false} isAnimationActive={false} />
        <Line dataKey="ma20" name="SMA 20" type="monotone" stroke="#e7c57d" strokeWidth={1.5}
          dot={false} connectNulls isAnimationActive={false} />
        <Line dataKey="ma50" name="SMA 50" type="monotone" stroke="#68adbf" strokeWidth={1.5}
          dot={false} connectNulls isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  </div>;
}
function SignalList({ items }: { items: ReturnType<typeof signals> }) {
  return <div className="signal-list">{items.length ? items.map((item, index) =>
    <div className="signal-row" key={index}>
      <div className="signal-indicator">{index === 0 ? "⌁" : index === 1 ? "∿" : "◎"}</div>
      <div className="signal-body"><strong>{item.title}</strong><small>{item.detail}</small></div>
      <Tag kind={item.tone}>{item.state}</Tag>
    </div>) : <div className="muted">Not enough observations for these indicators.</div>}</div>;
}
function DatasetTable({ data, selected, onSelect }: {
  data: MarketData; selected: string; onSelect: (symbol: string) => void
}) {
  return <div className="table-scroll"><table className="data-table">
    <thead><tr><th>Asset</th><th>Last close</th><th>Daily return</th><th>30-session return</th><th>Risk (annualized)</th><th>Sample size</th></tr></thead>
    <tbody>{Object.entries(data).map(([symbol, rows]) => {
      const m = computeMetrics(rows);
      return <tr key={symbol} onClick={() => onSelect(symbol)} className={selected === symbol ? "selected" : ""} tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(symbol); } }}>
        <td><span className="ticker-badge">{symbol.slice(0, 2)}</span><strong>{symbol}</strong></td>
        <td>{money(m.last)}</td><td className={tone(m.dayChange)}>{percent(m.dayChange)}</td>
        <td className={tone(m.momentum30)}>{percent(m.momentum30)}</td>
        <td>{percent(m.vol30)}</td><td>{m.observations}</td>
      </tr>;
    })}</tbody>
  </table></div>;
}

export default function App() {
  const [dataset, setDataset] = useState<MarketData>(() => makeDemoSeries() as MarketData);
  const [source, setSource] = useState<"demo" | "csv">("demo");
  const [selected, setSelected] = useState("SPY");
  const [tab, setTab] = useState<Tab>("overview");
  const [range, setRange] = useState(90);
  const [message, setMessage] = useState("");
  const [offset, setOffset] = useState(10);
  const [width, setWidth] = useState(5);
  const [credit, setCredit] = useState(1.5);
  const [question, setQuestion] = useState("What are the most important technical risks in this dataset?");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const symbols = Object.keys(dataset);
  const symbol = dataset[selected] ? selected : symbols[0];
  const metrics = useMemo(() => computeMetrics(dataset[symbol]), [dataset, symbol]);
  const activeSignals = useMemo(() => signals(metrics), [metrics]);
  const comparison = useMemo(() =>
    symbols.filter(s => s !== symbol).map(s => ({ symbol: s, value: correlation(dataset[symbol], dataset[s]) })),
    [dataset, symbol]);
  const condor = useMemo(() => {
    try { return ironCondor(metrics.last, offset, width, credit); }
    catch { return null; }
  }, [metrics.last, offset, width, credit]);

  const changeDataset = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = parseCsv(await file.text()) as MarketData;
      setDataset(parsed);
      setSelected(Object.keys(parsed)[0]);
      setSource("csv");
      setAnswer("");
      setMessage("Imported " + Object.keys(parsed).length + " symbol(s). Indicators recalculated from your CSV.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not import CSV."); }
  };
  const resetDataset = () => {
    setDataset(makeDemoSeries() as MarketData);
    setSelected("SPY");
    setSource("demo");
    setAnswer("");
    setMessage("Demo dataset restored. These are synthetic historical examples, not live quotes.");
  };
  const exportCsv = () => {
    const rows = [["Date", "Symbol", "Close", "Volume"].join(",")];
    for (const [s, values] of Object.entries(dataset))
      for (const row of values) rows.push([row.date, s, row.close, row.volume].join(","));
    const file = new Blob([rows.join("\n") + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mordor-" + source + "-prices.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  const askAI = async () => {
    if (!question.trim() || busy) return;
    setBusy(true); setAnswer("");
    const facts = [
      "Source: " + (source === "demo" ? "SYNTHETIC DEMO — NOT LIVE MARKET DATA" : "USER-UPLOADED CSV — NOT VERIFIED LIVE"),
      "Asset: " + symbol, "Last data date: " + metrics.date,
      "Last close: " + metrics.last, "1-day return %: " + decimal(metrics.dayChange),
      "30-session return %: " + decimal(metrics.momentum30),
      "SMA20: " + decimal(metrics.ma20), "SMA50: " + decimal(metrics.ma50),
      "SMA20 gap %: " + decimal(metrics.gap20), "Volatility annualized %: " + decimal(metrics.vol30),
      "RSI14: " + decimal(metrics.rsi14), "Maximum drawdown %: " + decimal(metrics.drawdown),
      "Total observations: " + metrics.observations
    ].join("\n");
    try {
      const response = await fetch("/api/insights", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: facts, question }) });
      const payload = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error || "AI request failed.");
      setAnswer(payload.answer);
    } catch (error) {
      setAnswer("Cloudflare AI could not complete the request: " +
        (error instanceof Error ? error.message : "Unknown error") +
        "\n\nThe quantitative dashboard, CSV imports and options calculator remain available without AI.");
    } finally { setBusy(false); }
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <Brand />
      <div className="side-section"><div className="side-label">WORKSPACE</div>
        <nav aria-label="Main navigation">{nav.map(item =>
          <button type="button" key={item.id} onClick={() => setTab(item.id)}
            className={"nav-link " + (tab === item.id ? "active" : "")} aria-current={tab === item.id ? "page" : undefined}>
            <span className="nav-icon">{item.glyph}</span><span>{item.title}</span><span className="nav-arrow">›</span>
          </button>)}</nav>
      </div>
      <div className="sidebar-bottom">
        <div className="status-card">
          <div className="status-card-title"><span className="online-dot" /> EDGE COMPUTE</div>
          <p>Cloudflare Workers for API logic. Analytics execute locally in your browser.</p>
          <Tag kind="dark">NO PAID DATA FEED</Tag>
        </div>
        <div className="sidebar-caption">MORDOR / v1.0.0 <span>OPEN WORKSPACE</span></div>
      </div>
    </aside>
    <div className="content-shell">
      <header className="topbar">
        <div className="breadcrumbs"><span>TERMINAL</span><span>/</span><b>{nav.find(n => n.id === tab)?.title}</b></div>
        <div className="topbar-right"><Tag kind={source === "demo" ? "warning" : "success"}>
          <span className="small-dot" /> {source === "demo" ? "SYNTHETIC DEMO" : "USER CSV"}
        </Tag><span className="top-divider" /><span className="top-symbol">{symbol}</span></div>
      </header>
      <main className="main">
        <div className="main-header">
          <div><div className="eyebrow">INTELLIGENCE / {tab.toUpperCase()}</div>
            <h1>{tab === "overview" ? "Market overview" : tab === "signals" ? "Signal scanner" :
              tab === "strategies" ? "Options strategy lab" : "AI intelligence"}</h1>
            <p>{nav.find(n => n.id === tab)?.description} <span className="header-separator">•</span>
              {source === "demo" ? "Explore a deterministic sample dataset" : "Explore your imported market data"}</p></div>
          <div className="header-actions">
            <input ref={fileRef} className="visually-hidden" type="file" accept=".csv,text/csv"
              onChange={changeDataset} aria-label="Import market CSV" />
            <button className="btn secondary" onClick={() => fileRef.current?.click()}>↑ Import CSV</button>
            <button className="btn primary" onClick={exportCsv}>↓ Export data</button>
          </div>
        </div>
        {message && <div className="flash" role="status">{message}<button onClick={() => setMessage("")} aria-label="Dismiss notification">×</button></div>}
        <div className="source-banner">
          <div className="source-icon">ⓘ</div>
          <div><strong>{source === "demo" ? "Illustrative dataset — not live market prices" : "User-provided dataset — source not independently verified"}</strong>
            <p>{source === "demo"
              ? "All 4 sample assets use reproducible synthetic prices dated in 2025. Every indicator is calculated, never randomly scored."
              : "Indicators use only the observations you imported. No price feed, broker link or exchange subscription is required."}</p></div>
          {source === "csv" && <button className="text-button" onClick={resetDataset}>Restore demo →</button>}
        </div>

        <div className="asset-toolbar">
          <div className="asset-tabs" role="group" aria-label="Choose asset">{symbols.map(s =>
            <button key={s} className={symbol === s ? "selected" : ""} onClick={() => setSelected(s)}>{s}</button>)}</div>
          <span className="last-data">LAST OBSERVATION <b>{metrics.date}</b></span>
        </div>

        {(tab === "overview" || tab === "signals") && <>
          <div className="metric-grid">
            <MetricCard label="Last closing price" value={money(metrics.last)} detail={percent(metrics.dayChange) + " vs prior session"}
              change={metrics.dayChange} icon="↗" />
            <MetricCard label="20-session divergence" value={percent(metrics.gap20)} detail={"SMA20 " + money(metrics.ma20)}
              change={metrics.gap20} icon="⌁" />
            <MetricCard label="30-session momentum" value={percent(metrics.momentum30)} detail="Rolling close-to-close return"
              change={metrics.momentum30} icon="◈" />
            <MetricCard label="Realized volatility" value={percent(metrics.vol30)} detail="30-session, annualized (252d)" icon="◉" />
          </div>

          {tab === "overview" ? <>
            <div className="dashboard-grid">
              <section className="panel chart-panel">
                <div className="panel-header"><div><div className="eyebrow">PRICE STRUCTURE</div>
                  <h3>{symbol} <span>Price performance</span></h3></div>
                  <div className="range-toggle">{[30, 90, 180].map(n =>
                    <button key={n} onClick={() => setRange(n)} className={range === n ? "selected" : ""}>{n}D</button>)}</div>
                </div>
                <div className="chart-legend"><span><i className="key-red" /> Close</span>
                  <span><i className="key-gold" /> SMA 20</span><span><i className="key-blue" /> SMA 50</span></div>
                <PriceChart rows={metrics.data} range={range} />
                <div className="panel-foot">Historical observations only <span>•</span> No forecasts or live quotes</div>
              </section>
              <section className="panel intelligence-panel"><div className="panel-header">
                <div><div className="eyebrow">DERIVED INDICATORS</div><h3>Signal intelligence</h3></div>
                <Tag kind="dark">{activeSignals.length} signals</Tag>
              </div><SignalList items={activeSignals} />
                <button className="panel-link" onClick={() => setTab("signals")}>Open full scanner <span>→</span></button>
              </section>
            </div>
            <div className="bottom-grid">
              <section className="panel"><div className="panel-header"><div>
                <div className="eyebrow">ASSET UNIVERSE</div><h3>Watchlist</h3></div><Tag kind="dark">{symbols.length} assets</Tag></div>
                <DatasetTable data={dataset} selected={symbol} onSelect={setSelected} /></section>
              <section className="panel"><div className="panel-header"><div>
                <div className="eyebrow">CO-MOVEMENT</div><h3>Return correlations</h3></div></div>
                <div className="correlation-list">{comparison.length ? comparison.map(item =>
                  <div className="correlation-item" key={item.symbol}><span>{symbol} / {item.symbol}</span>
                    <div className="correlation-track"><div style={{ width: ((item.value ?? 0) + 1) * 50 + "%" }} /></div>
                    <b>{decimal(item.value)}</b></div>) : <div className="empty">Import a CSV with multiple symbols to compare returns.</div>}</div>
                <div className="panel-foot">Pearson correlation of aligned log returns</div>
              </section>
            </div>
          </> : <>
            <div className="bottom-grid scanner-grid">
              <section className="panel"><div className="panel-header"><div><div className="eyebrow">TECHNICAL STATE</div>
                <h3>Signal diagnostics</h3></div></div><SignalList items={activeSignals} />
                <div className="explain-box">Signals identify mathematical conditions, not guaranteed predictions.
                  SMA20 and SMA50 need 20 and 50 data points respectively; RSI requires 15 closing prices.</div></section>
              <section className="panel"><div className="panel-header"><div><div className="eyebrow">RISK METRICS</div>
                <h3>Indicator breakdown</h3></div></div>
                <div className="facts">
                  <div><span>RSI (14)</span><strong>{decimal(metrics.rsi14, 1)}</strong></div>
                  <div><span>50-session average</span><strong>{money(metrics.ma50)}</strong></div>
                  <div><span>Maximum observed drawdown</span><strong className="negative">{percent(metrics.drawdown)}</strong></div>
                  <div><span>Observations</span><strong>{metrics.observations}</strong></div>
                  <div><span>Most recent observation</span><strong>{metrics.date}</strong></div>
                </div></section>
            </div>
            <section className="panel full-panel"><div className="panel-header"><div><div className="eyebrow">ASSET COVERAGE</div><h3>All imported assets</h3></div></div>
              <DatasetTable data={dataset} selected={symbol} onSelect={setSelected} /></section>
          </>}
        </>}

        {tab === "strategies" && <>
          <SectionTitle eyebrow="THEORETICAL OPTIONS ANALYSIS" title="Iron condor payoff model"
            subtitle="Model fixed-expiry P/L from hypothetical premiums and strikes. No broker or options chain required.">
            <Tag kind="warning">SIMULATION ONLY</Tag></SectionTitle>
          <div className="strategy-grid">
            <section className="panel form-panel"><div className="panel-header"><div>
              <div className="eyebrow">POSITION BUILDER</div><h3>Configure the trade</h3></div></div>
              <div className="form-content"><div className="form-field"><label>Underlying price</label>
                <div className="read-only-field">{money(metrics.last)} <small>CSV / sample close</small></div></div>
                <label className="form-field">Distance to short strikes ($)
                  <input type="number" min="0.01" max={metrics.last} step=".5" value={offset} onChange={e => setOffset(Number(e.target.value))} /></label>
                <label className="form-field">Wing width ($)
                  <input type="number" min="0.01" step=".5" value={width} onChange={e => setWidth(Number(e.target.value))} /></label>
                <label className="form-field">Net credit received ($ per share)
                  <input type="number" min="0.01" step=".05" value={credit} onChange={e => setCredit(Number(e.target.value))} /></label>
                <div className="explain-box">Standard equity option contract multiplier: 100. Estimates ignore fees,
                  early exercise, slippage and assignment risk. Premiums are user-entered, not market quotes.</div>
              </div></section>
            <section className="panel result-panel"><div className="panel-header"><div><div className="eyebrow">EXPIRY PAYOFF</div>
              <h3>Risk / reward distribution</h3></div></div>
              {condor ? <>
                <div className="payoff-stats">
                  <div><span>MAX PROFIT</span><strong className="positive">{money(condor.maxProfit)}</strong></div>
                  <div><span>MAX LOSS</span><strong className="negative">{money(condor.maxLoss)}</strong></div>
                  <div><span>BREAK-EVEN RANGE</span><strong>{money(condor.breakevenLow)} – {money(condor.breakevenHigh)}</strong></div>
                </div>
                <div className="payoff-chart"><ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={condor.points} margin={{ top: 15, right: 18, bottom: 4, left: 0 }}>
                    <CartesianGrid stroke="#252d3c" strokeDasharray="4 6" />
                    <XAxis dataKey="expiry" type="number" domain={["dataMin", "dataMax"]} tickCount={6}
                      tick={{ fill: "#8290a4", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#8290a4", fontSize: 11 }} />
                    <ReferenceLine y={0} stroke="#586475" />
                    <Tooltip contentStyle={{ background: "#111724", border: "1px solid #344053", borderRadius: 10 }} />
                    <Line dataKey="profit" name="P/L ($)" type="linear" dot={false} stroke="#ff775e"
                      strokeWidth={3} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer></div>
                <div className="strike-grid">{[
                  ["LONG PUT", condor.longPut], ["SHORT PUT", condor.shortPut],
                  ["SHORT CALL", condor.shortCall], ["LONG CALL", condor.longCall]
                ].map(([name, strike]) => <div key={name}><small>{name}</small><b>{money(Number(strike))}</b></div>)}</div>
              </> : <div className="empty">Enter valid positive inputs. Credit must be less than wing width, and strike offset must be less than spot.</div>}
            </section>
          </div>
        </>}

        {tab === "insights" && <>
          <SectionTitle eyebrow="SERVER-SIDE INFERENCE" title="Ask the edge analyst"
            subtitle="Interpret calculated indicators using the free Cloudflare Workers AI allocation.">
            <Tag kind="success">NO BROWSER API KEY</Tag></SectionTitle>
          <div className="insight-layout">
            <section className="panel ask-panel"><div className="panel-header"><div><div className="eyebrow">NATURAL LANGUAGE</div>
              <h3>Analysis request</h3></div></div>
              <div className="ask-inner"><label htmlFor="question">Your question</label>
                <textarea id="question" value={question} maxLength={500} onChange={e => setQuestion(e.target.value)}
                  rows={5} placeholder="Explain the volatility and trend conditions…" />
                <button className="btn primary wide" onClick={askAI} disabled={busy || !question.trim()}>
                  {busy ? "Analyzing at the edge…" : "✳ Generate interpretation"}</button>
                <p>Only derived numbers, selected symbol, and your question are sent to Cloudflare. Uploaded CSV files
                  stay in your browser.</p></div></section>
            <section className="panel response-panel"><div className="panel-header"><div><div className="eyebrow">CLOUDFLARE WORKERS AI</div>
              <h3>Analyst response</h3></div></div>
              <div className="response-body">{answer ? <p>{answer}</p> :
                <div className="empty-state"><div className="large-glyph">✳</div>
                  <h4>Standing by for analysis</h4>
                  <p>Responses are generated server-side and constrained to the data displayed here.
                    Cloudflare free-tier daily AI limits apply.</p></div>}</div>
            </section>
          </div>
        </>}

        <footer className="footer"><span>© MORDOR ANALYTICS · EDGE-FIRST MARKET RESEARCH</span>
          <span>Educational analytics only • Not investment advice • No live market feed</span></footer>
      </main>
    </div>
  </div>;
}

# Mordor Analytics

**Edge-first financial intelligence with no paid infrastructure or API keys.**

Mordor Analytics is a React/TypeScript financial analytics workspace hosted as a single **Cloudflare Worker + Static Assets** deployment. It calculates price signals and options payoff curves in the browser and offers optional natural-language interpretation through **Cloudflare Workers AI**, executed server-side.

> **Data accuracy notice:** The default four-asset dataset is synthetic, deterministic, and dated in 2025. It is NOT live market data. Import a CSV with genuine closing prices for real historical calculations. This is educational software, not trading advice.

## Features

- Responsive, accessible professional dashboard with dark visual design
- Multiple ticker analysis and CSV ingestion with validation (5+ dates, up to 2 MB)
- 20 / 50 session moving averages, divergence, RSI(14), 30-session returns and volatility, drawdown
- Return correlation for symbols with matching dates
- Iron-condor expiry P/L with transparent user-entered premiums and 100-share contract calculations
- Optional Workers AI signal explanations with **no browser-exposed keys**
- Offline local calculations; CSV data isn't sent to the Worker
- Unit tests, TypeScript validation, GitHub Actions CI and Cloudflare deployment

## Architecture

\`\`\`
Browser / Vite React
 ├─ analytics.mjs: CSV parser + calculations (local, no network)
 ├─ Overview / Signals / Strategy Lab
 └─ POST /api/insights (question + selected derived metrics only)
        Cloudflare Worker (worker/index.ts)
         └─ Workers AI (@cf/meta/llama-3.1-8b-instruct-fp8)
Cloudflare Static Assets (dist/) serve the application at the same origin
\`\`\`

No D1, R2, KV, third-party stock feed, backend server, hosted database, or recurring paid service is required.

## CSV format

\`\`\`csv
Date,Symbol,Close,Volume
2026-01-02,ABC,101.25,10000
2026-01-05,ABC,102.10,12300
\`\`\`

Columns **Date** (YYYY-MM-DD) and **Close** are required; **Symbol** and **Volume** are optional. Without Symbol, rows are grouped as IMPORTED. At least 5 valid dates per symbol are needed. For moving averages and RSI, use 50+ sessions. Files are processed locally and **not uploaded**.

## Run locally

Prerequisites: Node.js 22 and a free Cloudflare account for optional AI calls.

\`\`\`bash
npm ci --legacy-peer-deps
npm run check
npm run dev
\`\`\`

Vite runs on http://localhost:3000. For Workers AI routes in a separate terminal, run:

\`\`\`bash
npx --yes wrangler@4 dev
\`\`\`

No AI access? All visualizations, import and options simulations still run without it.

## Deploy to Cloudflare Workers (Free)

1. Create a free Cloudflare account. No payment method or paid plan is required for standard Workers + free AI allocation.
2. In the **GitHub repository** → Settings → Secrets and variables → Actions, add:
   - \`CLOUDFLARE_ACCOUNT_ID\` — your Cloudflare account ID
   - \`CLOUDFLARE_API_TOKEN\` — a scoped token permitted to edit Workers scripts and bindings
3. Push to \`main\`. The GitHub workflow runs typecheck, tests, build, then deploys with \`wrangler@4 deploy\`.
4. Site: \`https://mordor-analytics.<your-workers-subdomain>.workers.dev\`. The actual URL appears in the deployment log.

Alternatively deploy yourself with:

\`\`\`bash
npm ci --legacy-peer-deps
npm run build
npx --yes wrangler@4 login
npx --yes wrangler@4 deploy
\`\`\`

CI intentionally skips the deploy step with a warning when required secrets have not yet been configured; it cannot create your Cloudflare account or GitHub Actions secrets.

**Free-tier caveat:** Cloudflare Workers and Workers AI have request/daily quotas. Optional inference returns a clear error if the daily free allocation is exhausted. For strict $0 spending, stay on Workers Free and do not upgrade. Public AI endpoints can consume the shared free allocation; add Cloudflare Access or rate limiting if you expect significant public traffic.

## Test

\`\`\`bash
npm test
npm run typecheck
npm run build
\`\`\`

The tests cover parsing, indicators, correlation, and exact iron-condor contract payoffs. GitHub Actions validates all pull requests.

## Security

- No \`VITE_*\`/Gemini secrets are embedded in client JavaScript
- No browser AI SDK or external image generation API
- Same-origin Worker API, 12 KB request limit, no CORS enabling
- No source CSV transmitted to AI — only summary indicators
- No telemetry or user accounts; no storage of imported data server-side

## License / data

This repository contains an example synthetic data generator and does not provide live exchange data, broker integration, advice, or investment performance claims.

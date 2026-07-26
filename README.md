# CostLens

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

> An open-source AI cost intelligence dashboard that helps developers understand where every AI dollar goes.

CostLens turns raw AI API usage into practical cost insights. It's a focused developer tool for answering critical questions: how much you're spending, which models cost the most, what features drive spend, which customers consume budget, and what every request costs.

It is intentionally **not** an observability platform, prompt manager, LLMOps suite, or evaluation product.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [OpenRouter Integration](#openrouter-integration)
- [API](#api)
- [Application Integration](#application-integration)
- [Architecture](#architecture)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Features

### Dashboard

- **Spend overview** — Total AI spend, request volume, token usage, and average cost per request
- **Spend trends** — Daily cost visualization over your selected time range (7, 30, 90, or 365 days)
- **Cost breakdowns** — Spend attributed to models, providers, features, and customers
- **Request ledger** — Searchable, paginated history of every tracked request
- **Request details** — Token usage, metadata, latency, and cost breakdown for each request
- **Analytics** — Focused views for comparing cost drivers
- **Demo mode** — Explore with realistic, internally consistent sample data (browser-local, never mixed with live records)
- **CSV export** — Download your complete ledger for analysis

### Smart Setup

- **Guided onboarding** — 3-step wizard on first run (name your workspace, connect OpenRouter, set defaults)
- **Key management** — Paste API keys directly into the browser; CostLens saves securely to `.env.local` (local dev) or your hosting provider's environment
- **Workspace settings** — Revisit `/setup` anytime to update workspace info or rotate your API key

## Getting Started

### Prerequisites

- **Node.js** 20 or newer
- **npm** (or your preferred package manager)

### Installation & Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/costlens.git
cd costlens

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**On first run**, you'll see the onboarding screen:

1. **Name your workspace** — Enter your name and organization
2. **Connect OpenRouter** — Paste your OpenRouter API key (or skip if already set in `.env.local`)
3. **Set tracking defaults** — (Optional) Environment, example feature, example customer

You're done! Start using CostLens to track your AI costs.

### Revisiting Setup

You can return to the setup wizard anytime:
- Visit `/setup` directly, or
- Click **Settings** → **Workspace** → **Edit** (or **OpenRouter** → **Manage key**)

### Production Build

```bash
npm run build
npm start
```

## OpenRouter Integration

CostLens uses [OpenRouter](https://openrouter.ai/) exclusively for AI model access. Your API key is:
- Kept on your server (never sent to the browser after setup)
- Never exposed via `NEXT_PUBLIC_` variables
- Never committed to Git (stored in `.env.local`, which is gitignored)

### Setting Your API Key

**Local development:**
- Paste the key into the onboarding wizard (`/setup`), or
- Create `.env.local` and add: `OPENROUTER_API_KEY=sk-or-...`

**Hosted deployments:**
- Set `OPENROUTER_API_KEY` as a server-side environment variable in your hosting provider
- Redeploy
- The setup wizard will detect this and prompt you appropriately

## API

### Send a completion

POST `/api/openrouter/chat`:

```json
{
  "model": "openai/gpt-4o-mini",
  "messages": [{ "role": "user", "content": "Summarize this release." }],
  "feature": "release-summary",
  "customer": "acme-inc",
  "metadata": { "environment": "development" }
}
```

**Response:**
```json
{
  "completion": { ... },
  "usage": {
    "id": "gen-...",
    "timestamp": "2026-07-26T...",
    "provider": "OpenAI",
    "model": "openai/gpt-4o-mini",
    "inputTokens": 123,
    "outputTokens": 45,
    "latencyMs": 1234,
    "cost": 0.00123,
    "status": "success"
  },
  "persisted": true
}
```

Successful requests are automatically saved to `data/.ledger/usage.json` (gitignored).

### Read and export usage

```
GET  /api/usage?limit=100           → Recent records (newest first)
GET  /api/usage/:id                 → Single record by ID
GET  /api/usage/export              → Download all records as CSV
```

## Application Integration

For server-side applications, use the lightweight client helper in [`packages/costlens`](packages/costlens/src/index.ts):

```typescript
import { CostLens } from '@costlens/client';

const costlens = new CostLens('http://localhost:3000');

const result = await costlens.complete({
  model: "openai/gpt-4o-mini",
  messages: [{ role: "user", content: "Summarize this release." }],
  feature: "release-summary",
  customer: "acme-inc",
  metadata: { environment: "production" }
});
```

See the [Next.js example](examples/nextjs/README.md) for a complete integration.

**Security note:** Keep this call on your trusted server. CostLens intentionally leaves authentication to your host application or deployment perimeter.

## Architecture

### Tech Stack

- **Frontend:** React 19, Next.js 16, TypeScript
- **Backend:** Next.js API routes, Node.js
- **Storage:** Local JSON ledger (easily swappable with SQLite/Postgres)
- **Styling:** Plain CSS with CSS variables
- **Linting:** ESLint 9

### Project Structure

```
app/                    Next.js app directory (pages, routes, styles)
  api/                  Server-side API routes
  page.tsx              Dashboard / overview
  layout.tsx            Root layout
  globals.css           Global styles

components/
  costlens-app.tsx      Dashboard UI (pages, tables, charts)
  setup-wizard.tsx      Onboarding flow

lib/
  openrouter.ts         OpenRouter API client
  workspace-store.ts    Workspace profile persistence
  usage-record.ts       Normalized usage record model
  ledger-store.ts       Local JSON ledger adapter
  require-setup.ts      Setup gate for protected routes

data/
  mock-data.ts          Demo workspace data
  .ledger/              Local usage records (gitignored)

packages/costlens/      Client SDK for server applications
examples/               Integration examples
docs/                   Architecture and deployment guides
```

### Design Principles

- **Small and focused:** Only what you need for cost tracking
- **Self-hosted:** Full control over your data
- **Developer-first:** Guided setup, programmatic API, local defaults
- **Durable:** Usage ledger survives app restarts
- **Pluggable storage:** Easy to swap JSON for SQL later

## Development

### Scripts

```bash
npm run dev      # Start dev server (hot reload)
npm run build    # Production build
npm start        # Run production build
npm run lint     # ESLint
```

### Type Checking

TypeScript is strict (`"strict": true` in `tsconfig.json`). All code is type-safe.

## Roadmap

- [x] Polished UI and realistic mock data
- [x] OpenRouter ingestion (proxied requests)
- [x] Persistent local ledger
- [x] Advanced cost exploration and attribution
- [x] Developer tracking SDK
- [x] Open-source release (docs, contributing guide, issue templates)
- [ ] Multi-instance support (SQLite/Postgres adapters)
- [ ] Request replay and debugging
- [ ] Alerts and anomaly detection
- [ ] Team workspaces

## Contributing

Contributions are welcome! Please:

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
2. Open an issue before starting substantial work so we can discuss
3. Keep pull requests focused and explain the user impact
4. Update docs if behavior changes

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.

## Security

- API keys are kept server-side only
- `.env.local` and ledgers are gitignored
- Never commit secrets or user data to the repo

For security concerns, see [SECURITY.md](SECURITY.md).

## License

CostLens is released under the [MIT License](LICENSE). See [LICENSE](LICENSE) for details.

---

**Built with ❤️ for developers who care about understanding their AI costs.**

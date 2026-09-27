# CostLens

**Self-hosted cost intelligence for applications built with AI.**

[![License: MIT](https://img.shields.io/badge/license-MIT-white)](LICENSE)
[![Checks](https://github.com/siddharthprabhu8/Cost_Lens/actions/workflows/checks.yml/badge.svg)](https://github.com/siddharthprabhu8/Cost_Lens/actions/workflows/checks.yml)

CostLens connects request-level AI usage to the features and customers that generate it. Route chat completions through its server-side OpenRouter integration to capture token counts, latency, cost, and attribution in a searchable local ledger.

The dashboard answers four questions: **what are we spending, which models drive it, which features use it, and which customers account for it?**

## Contents

- [Capabilities](#capabilities)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Application integration](#application-integration)
- [API reference](#api-reference)
- [Architecture](#architecture)
- [Data and security](#data-and-security)
- [Development](#development)
- [Deployment](#deployment)
- [Current limitations](#current-limitations)
- [Recent improvements](#recent-improvements)
- [Contributing](#contributing)
- [License and attribution](#license-and-attribution)

## Capabilities

| Capability | What it provides |
| --- | --- |
| Spend overview | Total cost, request volume, input/output token usage, and average cost per request. |
| Time-based analysis | Daily spend over 7, 30, 90, or 365 days, with matching UTC calendar boundaries for charts and totals. |
| Cost attribution | Breakdowns by model, provider, feature, and customer. |
| Request history | Search, status/model/feature/customer filters, pagination, and individual request details. |
| Failure tracking | Failed completion attempts are recorded with model, attribution, latency, and a unique request ID. |
| CSV export | Download all retained ledger records, including successful and failed requests. |
| Workspace configuration | Guided setup, owner and organization details, and OpenRouter key configuration. |
| Server-side client | A lightweight TypeScript helper for calling a self-hosted CostLens instance. |

The interface uses a monochrome design system with locally hosted D-DIN fonts, high-contrast charts, responsive layouts, and keyboard focus states.

## Quick start

### Requirements

- Node.js **22 or 24 LTS**
- npm
- An OpenRouter API key for live completion requests
- A writable filesystem for local configuration and usage storage

### Install and run

```bash
git clone https://github.com/siddharthprabhu8/Cost_Lens.git
cd Cost_Lens
npm ci
cp .env.example .env.local
```

Set `OPENROUTER_API_KEY` in `.env.local`, then start the application:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). The first visit directs you to `/setup`, where you can enter workspace details and configure the provider connection. In local development, the setup form can also save an OpenRouter key to `.env.local`.

Once setup is complete, send requests through `/api/openrouter/chat`. The live dashboard remains empty until requests are recorded. Existing OpenRouter account history is not imported automatically.

### Production build

```bash
npm run build
npm start
```

See [Deployment](#deployment) before exposing the application outside a trusted environment.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | For live requests | Server-side credential used to call OpenRouter. |

The committed `.env.example` contains an empty value. Put actual credentials in `.env.local` or your hosting platform's environment configuration. Never use a `NEXT_PUBLIC_` prefix for credentials.

In production, the setup form does not write environment files. Configure the key through the hosting platform and restart or redeploy the application.

Workspace details are stored in `data/.ledger/workspace.json`. Environment, feature, and customer values entered during setup are integration examples; callers must supply attribution on each completion request.

## Application integration

The live request path is:

```text
Your application server
  → CostLens /api/openrouter/chat
  → OpenRouter
  → Usage ledger
  → Dashboard and CSV export
```

Call CostLens from a trusted application server:

```typescript
const response = await fetch("http://localhost:3000/api/openrouter/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "openai/gpt-4o-mini",
    messages: [
      { role: "user", content: "Summarize the release notes in three bullets." },
    ],
    feature: "release-summary",
    customer: "example-customer",
    metadata: { environment: "development" },
    maxTokens: 300,
  }),
});

const result = await response.json();
if (!response.ok) {
  throw new Error(result.error ?? "CostLens request failed.");
}

console.log(result.completion, result.usage, result.persisted);
```

### TypeScript client

The repository includes the local `@costlens/client` package. Build it from the repository root:

```bash
npm run build --prefix packages/costlens
```

Install the package into your server application using its local directory, or copy the helper into your project. This repository does not require a published npm package.

```typescript
import { CostLensClient } from "@costlens/client";

const costlens = new CostLensClient("http://localhost:3000");

const result = await costlens.complete({
  model: "openai/gpt-4o-mini",
  messages: [{ role: "user", content: "Summarize this release." }],
  feature: "release-summary",
  customer: "example-customer",
  metadata: { environment: "production" },
});
```

See the [Next.js integration example](examples/nextjs/README.md) for a server-route integration.

## API reference

All API routes rely on your deployment's authentication and network controls.

| Method | Route | Behavior |
| --- | --- | --- |
| `POST` | `/api/openrouter/chat` | Forward a chat completion and persist its usage or failure record. |
| `GET` | `/api/openrouter/status` | Report whether a server-side key is present; this does not validate the key with OpenRouter. |
| `GET` | `/api/usage?limit=100` | Return recent records, newest first; the default limit is 100 and the maximum is 10,000. |
| `GET` | `/api/usage/:id` | Return an individual record, or `404` if it is absent. |
| `GET` | `/api/usage/export` | Download retained records as CSV. |
| `GET` | `/api/setup` | Return workspace details and configuration availability, without returning the API key. |
| `POST` | `/api/setup` | Save workspace details and, in development, an optional OpenRouter key. |

### Completion request fields

| Field | Type | Description |
| --- | --- | --- |
| `model` | `string` | Required OpenRouter model identifier. |
| `messages` | `Array<{ role, content }>` | Required, nonempty list of text messages. Roles: `system`, `user`, or `assistant`. |
| `feature` | `string` | Optional feature attribution. |
| `customer` | `string` | Optional customer attribution; prefer an internal identifier over personal information. |
| `metadata` | `Record<string, string \| number \| boolean>` | Optional custom attributes. |
| `maxTokens` | `number` | Optional output token limit, forwarded as `max_tokens`. |
| `temperature` | `number` | Optional sampling setting. |

### Responses and failure behavior

A successful, persisted completion returns **`201`** with `completion`, `usage`, and `persisted: true`.

The usage record includes `id`, `timestamp`, `provider`, `model`, input/output/total tokens, `latencyMs`, `cost`, `status`, and `attribution`.

- Provider errors retain their HTTP status. Network failures return `502`, and an unconfigured provider returns `503`.
- Failed completion attempts are stored with `status: "failed"`, zero recorded tokens, and `cost: null` when usage is unavailable. Their responses include `usage` and `persisted`.
- Invalid request bodies return `400` before a provider request is attempted; they do not create ledger entries.
- If failure logging also fails, the response preserves the original error status and includes `persisted: false` and `persistenceError`.
- If OpenRouter succeeds but the ledger write fails, the response returns `500` with the completion and `persisted: false`. Check the response before retrying: the provider request may already have incurred a charge.

## Architecture

| Layer | Implementation |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| Provider access | Server-side OpenRouter chat completion adapter |
| Persistence | Local JSON ledger with atomic file replacement and an in-process write queue |
| Interface | CSS design tokens, locally hosted fonts, SVG charts |
| Validation | ESLint, TypeScript build checks, Node.js regression tests, Gitleaks |

```text
app/                  Pages, layouts, and API routes
components/           Dashboard, onboarding, and workspace interface
lib/                  Provider adapter, usage model, date ranges, and storage
data/                 Application data modules
packages/costlens/     Server-side TypeScript client
examples/nextjs/       Integration example
tests/                Regression tests
scripts/              Repository publication checks
public/               Fonts, imagery, and asset attribution
docs/                 Architecture and deployment guides
DESIGN.md             Interface design reference
```

See [Architecture](docs/architecture.md) for the live data flow and storage boundaries.

## Data and security

- **Credentials:** The OpenRouter key is read server-side. Locally entered keys are saved as plaintext in the ignored `.env.local` file; secure the host and its backups accordingly.
- **Stored usage:** The ledger contains request identifiers, models, attribution, timestamps, tokens, latency, status, and reported cost. Prompt and completion text are not deliberately written to the ledger. Caller-supplied metadata is stored as supplied, so keep sensitive content out of it.
- **Local profiles:** Owner and organization details are kept in `data/.ledger/workspace.json`, outside version control.
- **Git hygiene:** Environment files, credentials, local storage, usage exports, logs, build artifacts, and machine-specific settings are excluded. `npm run check:publish` additionally rejects private paths already tracked by Git.
- **Automated scanning:** CI runs a redacted Gitleaks scan across Git history. Secret scanning reduces risk; it does not replace reviewing changes before publication.
- **Access control:** CostLens does not provide production authentication or authorization. Protect all pages and APIs with a trusted perimeter or an authentication layer before public deployment.

Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md). Never include credentials or customer records in public issues.

## Development

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Compile the production application and check TypeScript. |
| `npm start` | Serve the production build. |
| `npm run lint` | Run ESLint. |
| `npm test` | Run regression tests without real provider calls or changes to the live ledger. |
| `npm run check:publish` | Check the Git index for private or generated files. |
| `npm run build --prefix packages/costlens` | Build the local TypeScript client. |

Before opening a pull request:

```bash
npm ci
npm run lint
npm test
npm run build
npm run check:publish
```

Tests cover date-range boundaries, failed request persistence, provider and network errors, storage failures, and consistent activity records. GitHub Actions runs validation and secret scanning on pushes and pull requests.

## Deployment

Use a Node.js host with persistent, writable storage. Set `OPENROUTER_API_KEY` in the server environment, build the application, and start it behind your authentication and network controls.

The JSON adapter is intended for a **single server process**. Its write queue does not coordinate multiple processes or instances. Ephemeral serverless filesystems do not provide durable storage for this adapter. Use a database-backed storage implementation before scaling beyond this model.

Back up `data/.ledger/` privately. Never commit it to the repository. See the [deployment guide](docs/deployment.md) for details.

## Current limitations

- Only requests sent through CostLens are tracked; historical account usage is not synchronized.
- Provider access is through OpenRouter; direct provider integrations and streaming responses are not implemented.
- The ledger retains the latest **10,000 records**, so long-range views include only retained history.
- Missing provider costs remain `null` in the API and blank in CSV; current dashboard totals treat those values as zero.
- Live ledger views load on page navigation; continuous ingestion does not automatically refresh an already-open live view.
- Authentication, team permissions, budget alerts, anomaly detection, and database adapters are not included.

## Recent improvements

- Persisted failed completion attempts while preserving provider error statuses.
- Kept successful provider responses distinct from storage failures.
- Aligned charts and summary metrics with the selected 7-, 30-, 90-, or 365-day UTC range.
- Applied a consistent monochrome interface across onboarding, dashboards, analytics, request details, and settings.
- Added regression coverage, repository publication checks, and automated secret scanning.
- Repaired dependency lockfile consistency for clean installations.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Keep changes focused, include relevant validation, and update documentation when behavior changes.

## License and attribution

Application code is licensed under the [MIT License](LICENSE).

D-DIN fonts are distributed under the SIL Open Font License 1.1. Imagery and font sources are documented in [public/ASSETS.md](public/ASSETS.md), with font license files included alongside the assets. The interface takes inspiration from the design reference in `DESIGN.md`; CostLens is not affiliated with or endorsed by SpaceX.

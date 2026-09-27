# Architecture

CostLens is deliberately small. A developer application sends an OpenRouter-compatible completion request to the CostLens server-side endpoint. CostLens forwards it to OpenRouter, normalizes the returned usage, attaches feature and customer attribution, and writes a durable local ledger record.

```text
Your server → CostLens ingestion API → OpenRouter → CostLens local ledger → Dashboard / CSV export
```

## Boundaries

- `lib/openrouter.ts` is the only provider adapter. The OpenRouter API key stays on the CostLens server.
- `lib/usage-record.ts` holds the provider-neutral record shape.
- `lib/ledger-store.ts` is the storage boundary. Today it writes a local JSON file; a future SQLite or Postgres adapter can preserve the same API.
- The dashboard reads the ledger through read-only API routes. Live views remain empty until records are persisted.

## Data and privacy

CostLens stores usage metadata, attribution, token counts, latency, cost, and the OpenRouter completion ID. It does not persist prompt or completion text. The local ledger and environment files are excluded from Git.

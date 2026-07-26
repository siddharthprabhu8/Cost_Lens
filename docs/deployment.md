# Deployment guide

CostLens is designed to be self-hosted. Deploy it where your application can safely reach it, set `OPENROUTER_API_KEY` in the host's server-side environment, and protect the ingestion and ledger endpoints with your existing authentication or network controls before exposing them outside a trusted environment.

The initial local JSON ledger is ideal for demos and single-instance development. For multi-instance or production use, replace the storage adapter with SQLite or Postgres before scaling.

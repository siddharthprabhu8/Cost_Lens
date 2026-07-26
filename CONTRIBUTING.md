# Contributing to CostLens

Thanks for contributing. Please open an issue before beginning substantial work so the change can be discussed first.

## Local workflow

1. Use Node.js 20+ and `npm install`.
2. Copy `.env.example` to `.env.local` and set `OPENROUTER_API_KEY` only if you need live ingestion.
3. Run `npm run dev` and validate changes with `npm run build`.
4. Keep provider secrets, local ledgers, and user data out of commits.

## Pull requests

Keep pull requests focused, explain the user impact, include screenshots for visual changes, and update documentation when behavior or setup changes.

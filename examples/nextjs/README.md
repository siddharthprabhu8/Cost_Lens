# Next.js integration example

Install or copy the local `@costlens/client` helper into a trusted server-side Next.js project. Set `COSTLENS_URL` to your self-hosted CostLens deployment, then use the example route to proxy a completion with feature and customer attribution.

Do not call CostLens's ingestion endpoint directly from an unauthenticated browser client. Put it behind your application's server and authentication layer.

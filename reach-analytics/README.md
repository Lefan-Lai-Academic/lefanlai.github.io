# Reach analytics backend

This Cloudflare Worker powers the integrated `#reach` page. It stores anonymous, city-level visit events in D1 and never stores raw IP addresses, cookies, or precise device fingerprints.

## Deployment

1. Sign in to Cloudflare with Wrangler.
2. Create a D1 database named `lefan-reach`.
3. Copy `wrangler.toml.example` to `wrangler.toml` and add the returned database ID.
4. Apply `schema.sql` to the remote database.
5. Deploy the Worker.
6. Add the Worker URL to `data-reach-endpoint` on the Reach dashboard in `index.html`.

The public API exposes `POST /collect`, `GET /summary?range=30d`, and `GET /health`. Requests are restricted to the configured website origins.

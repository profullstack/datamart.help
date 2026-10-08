# datamart.help

The Datamart web app: public libraries, schools, colleges and government services near
you, with the source of every fact. Mobile-first and installable (PWA).

The data, tools, CLI and MCP servers live in
[profullstack/mcp-server](https://github.com/profullstack/mcp-server) (`mcp_modules/datamart`,
`src/datamart`, `bin/datamart.js`; spec in `docs/datamart/prd.md`), served at
mcp.profullstack.com. This repo is the web surface (PRD `apps/datamart-web`): Next.js
16 + React 19 on Bun, with the versioned API mounted through Hono.

## What is where

| Path | What |
| --- | --- |
| `/` | Home and location search |
| `/search` | Everything near a ZIP, city or your location |
| `/lib`, `/lib/us/ca/:id` | Library branches near you; one branch |
| `/lib/us/loc`, `/lib/us/loc/items/:id` | Library of Congress search; one item |
| `/edu`, `/edu/us/ca/:id` | Schools and colleges near you; one school or campus |
| `/gov`, `/gov/us/irs`, `/gov/us/data`, `/gov/us/ca/{bizfile,ftb,dmv,edd}` | Government services, Data.gov search |
| `/contracts`, `/finance` | Procurement sources; private finance (not available yet) |
| `/developers`, `/about` | API and MCP docs; sources and capability labels |
| `/api/v1/*` | The Datamart API (Hono, `src/app/api/[[...route]]/route.ts`) |
| `/…/mcp` | MCP endpoints, passed through to the upstream |

Every page URL also answers as JSON for `Accept: application/json` or `?raw=1`
(`src/proxy.ts`), so people and agents share one set of links. Pages render on the
server; the browser never calls the upstream. Query parameters are whitelisted per page
(`src/lib/params.ts`).

`DATAMART_UPSTREAM` overrides the upstream (default `https://mcp.profullstack.com`).

## Develop

```sh
bun install
bun run dev                 # http://localhost:3000
bun run typecheck && bun run test
bun run build && bun run start
bun run smoke [base-url]    # end-to-end checks against a running site
```

## Deploy

Every push to `main` deploys to dev2 (`.github/workflows/deploy-dev2.yml`, cli-tools
`dev2/dev2-site`, host port 3310). The image is Next standalone on Bun, port 3000 inside,
`/healthz` for the health check.

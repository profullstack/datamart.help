# datamart.help

The public front door for Datamart: public libraries, schools, colleges and government
services near a ZIP code, with the source of every fact.

The data and tools live in [profullstack/mcp-server](https://github.com/profullstack/mcp-server)
(`mcp_modules/datamart`, served at mcp.profullstack.com). This repo is the site:

- `index.html` + `style.css`: the homepage, with a ZIP search.
- `server.ts`: a small Bun server. Datamart paths (`/search`, `/gov`, `/lib`, `/edu`,
  `/contracts`, `/finance`, `/api/v1/...`, and their `/mcp` endpoints) go to the upstream.
  Browsers get readable HTML pages; JSON clients (`Accept: application/json`, or `?raw=1`)
  and MCP get the upstream response as is. Anything else is a 404.

`DATAMART_UPSTREAM` overrides the upstream (default `https://mcp.profullstack.com`).

```sh
bun server.ts   # http://localhost:3000
bun test
```

Deploys to dev2 on every push to `main` (`.github/workflows/deploy-dev2.yml`, from
cli-tools `dev2/dev2-site`).

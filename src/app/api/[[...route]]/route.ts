import { Hono } from "hono";
import { handle } from "hono/vercel";
import { upstreamBase } from "@/lib/upstream";

// The versioned API (PRD 4.2, 5.2): /api/v1/... is the Datamart API, served here so
// datamart.help is one origin for people, scripts and agents.
const DROP_REQ = ["host", "connection", "keep-alive", "accept-encoding", "content-length", "transfer-encoding", "upgrade", "cookie"];
const DROP_RES = ["connection", "keep-alive", "content-encoding", "content-length", "transfer-encoding", "set-cookie"];

const app = new Hono().basePath("/api");

app.get("/", c =>
  c.json({
    name: "Datamart API",
    version: "v1",
    docs: "https://datamart.help/developers",
    endpoints: ["/api/v1/tools", "/api/v1/tools/:name", "/api/v1/providers", "/api/v1/providers/:id", "/api/v1/resources/:id", "/api/v1/health"],
  })
);

app.all("/v1/*", async c => {
  const src = new URL(c.req.url);
  const target = new URL(upstreamBase() + src.pathname + src.search);
  const headers = new Headers(c.req.raw.headers);
  for (const h of DROP_REQ) headers.delete(h);
  headers.set("x-forwarded-host", src.host);
  const method = c.req.method;
  try {
    const res = await fetch(target, {
      method,
      headers,
      body: method === "GET" || method === "HEAD" ? undefined : await c.req.arrayBuffer(),
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
    const out = new Headers(res.headers);
    for (const h of DROP_RES) out.delete(h);
    return new Response(res.body, { status: res.status, headers: out });
  } catch {
    return c.json({ error: { code: "upstream_unavailable", message: "Datamart did not answer. Try again in a minute." } }, 502);
  }
});

app.notFound(c => c.json({ error: { code: "not_found", message: `No API route ${new URL(c.req.url).pathname}` } }, 404));

export const GET = handle(app);
export const POST = handle(app);
export const HEAD = handle(app);
export const OPTIONS = handle(app);

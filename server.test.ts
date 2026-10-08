import { afterAll, beforeAll, expect, test } from "bun:test";

// A fake Datamart upstream: echoes what it received so the proxy can be checked.
let upstream: ReturnType<typeof Bun.serve>;
let handle: (req: Request) => Promise<Response>;
let isDatamartPath: (p: string) => boolean;

beforeAll(async () => {
  upstream = Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);
      if (url.pathname === "/lib") {
        return Response.json({
          meta: { origin: { label: "ZIP 95030" }, radius_miles: 3, total_matches: 1 },
          data: [{ kind: "library_outlet", name: "Los Gatos <Public> Library", address: { street: "100 Villa Avenue", city: "Los Gatos", state: "CA", zip: "95030" }, distance_miles: 0.27, website: "javascript:alert(1)" }],
          warnings: ["FY2024 survey data."],
          sources: [{ name: "IMLS PLS FY2024", url: "https://www.imls.gov/" }],
        });
      }
      if (url.pathname === "/gov/us/data") return Response.json({ error: { code: "source_unavailable", message: "paused", retry_after_seconds: 3600 } }, { status: 503 });
      return Response.json({
        path: url.pathname,
        query: url.search,
        method: req.method,
        accept: req.headers.get("accept"),
        body: req.method === "POST" ? await req.text() : null,
      });
    },
  });
  process.env.DATAMART_UPSTREAM = `http://127.0.0.1:${upstream.port}`;
  ({ handle, isDatamartPath } = await import("./server.ts"));
});
afterAll(() => upstream.stop(true));

const html = { accept: "text/html,application/xhtml+xml" };

test("homepage is the static index.html with the h1", async () => {
  const res = await handle(new Request("http://x/", { headers: html }));
  expect(res.status).toBe(200);
  expect(await res.text()).toContain("<h1>datamart.help</h1>");
});

test("healthz", async () => {
  expect(await (await handle(new Request("http://x/healthz"))).text()).toBe("ok\n");
});

test("only Datamart paths are proxied", () => {
  for (const p of ["/search", "/gov", "/gov/us/irs", "/lib/mcp", "/api/v1/tools", "/contracts"]) expect(isDatamartPath(p)).toBe(true);
  for (const p of ["/mcp", "/admin", "/government", "/api/v2/x", "/.env"]) expect(isDatamartPath(p)).toBe(false);
});

test("unknown paths 404 without touching the upstream", async () => {
  expect((await handle(new Request("http://x/mcp"))).status).toBe(404);
});

test("JSON clients get the upstream response untouched", async () => {
  const res = await handle(new Request("http://x/gov/us/irs?a=1", { headers: { accept: "application/json" } }));
  expect(await res.json()).toMatchObject({ path: "/gov/us/irs", query: "?a=1", method: "GET" });
});

test("raw=1 forces JSON for a browser and is not forwarded", async () => {
  const res = await handle(new Request("http://x/edu?zip=95032&raw=1", { headers: html }));
  expect(await res.json()).toMatchObject({ path: "/edu", query: "?zip=95032" });
});

test("MCP POST passes through with its body", async () => {
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" });
  const res = await handle(new Request("http://x/lib/mcp", { method: "POST", body, headers: { accept: "application/json, text/event-stream", "content-type": "application/json" } }));
  expect(await res.json()).toMatchObject({ path: "/lib/mcp", method: "POST", body });
});

test("browsers get escaped HTML results; unsafe links are dropped", async () => {
  const res = await handle(new Request("http://x/lib?zip=95030&radius_miles=3", { headers: html }));
  const text = await res.text();
  expect(res.headers.get("content-type")).toContain("text/html");
  expect(text).toContain("Near ZIP 95030, within 3 miles");
  expect(text).toContain("Los Gatos &lt;Public&gt; Library");
  expect(text).toContain("0.27 mi");
  expect(text).not.toContain("javascript:");
});

test("an upstream error renders as a page with its status", async () => {
  const res = await handle(new Request("http://x/gov/us/data?q=x", { headers: html }));
  expect(res.status).toBe(503);
  expect(await res.text()).toContain("Try again in about 60 minutes");
});

test("the homepage form's ns picks the namespace", async () => {
  const res = await handle(new Request("http://x/search?zip=95030&radius_miles=3&ns=lib", { headers: html }));
  expect(res.status).toBe(302);
  expect(res.headers.get("location")).toBe("/lib?zip=95030&radius_miles=3");
});

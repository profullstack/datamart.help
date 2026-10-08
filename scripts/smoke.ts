// End-to-end checks against a running site: `bun scripts/smoke.ts [base]`.
// Default base is http://127.0.0.1:3000. Checks pages people open, the JSON and MCP
// pass-through agents use, and the PWA files. Exits 1 on any failure.
export {};
const BASE = (process.argv[2] ?? process.env.SMOKE_BASE ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const HTML = { accept: "text/html,application/xhtml+xml" };
let failed = 0;

async function check(name: string, path: string, init: RequestInit, ok: (res: Response, body: string) => boolean | string) {
  try {
    const res = await fetch(BASE + path, { redirect: "manual", ...init, signal: AbortSignal.timeout(60_000) });
    const body = await res.text();
    const r = ok(res, body);
    if (r === true) console.log(`ok    ${name}`);
    else {
      failed++;
      console.log(`FAIL  ${name}: ${res.status} ${typeof r === "string" ? r : ""} ${body.slice(0, 200).replace(/\s+/g, " ")}`);
    }
  } catch (e) {
    failed++;
    console.log(`FAIL  ${name}: ${e}`);
  }
}

const page = (path: string, text: string) =>
  check(`page ${path}`, path, { headers: HTML }, (r, b) => (r.status === 200 && b.includes(text)) || `want 200 + "${text}"`);

await check("healthz", "/healthz", {}, (r, b) => r.status === 200 && b === "ok\n");
await page("/", "Public services near you");
await page("/search?zip=95030&radius_miles=3", "Los Gatos Public Library");
await page("/lib?zip=95030&radius_miles=3", "Los Gatos Public Library");
await page("/edu?zip=95032&type=university&radius_miles=15", "San Jose State University");
await page("/lib/us/ca/us.ca.lib.ca0164-002", "100 Villa Avenue");
await page("/gov", "Internal Revenue Service");
await page("/gov/us/irs", "What Datamart can do here");
await page("/gov/us/ca/ftb", "California Franchise Tax Board");
await page("/gov/us/data", "Data.gov");
await page("/lib/us/loc", "Library of Congress");
await page("/contracts", "SAM.gov");
await page("/finance", "Not available yet");
await page("/developers", "libraries_search");
await page("/about", "What each label means");
await check("404 page", "/gov/us/nope", { headers: HTML }, r => r.status === 404);
await check("alias redirect", "/gov/irs", { headers: HTML }, r => r.status === 308 && r.headers.get("location")?.endsWith("/gov/us/irs") === true);
await check("JSON by Accept", "/lib?zip=95030&radius_miles=3", { headers: { accept: "application/json" } }, (r, b) => r.status === 200 && JSON.parse(b).data[0].name === "Los Gatos Public Library");
await check("JSON by raw=1", "/gov/us/irs?raw=1", { headers: HTML }, (r, b) => r.status === 200 && JSON.parse(b).headline_state === "directory_only");
await check("api/v1 tools", "/api/v1/tools", {}, (r, b) => r.status === 200 && JSON.parse(b).tools.length > 5);
await check("api/v1 POST tool", "/api/v1/tools/libraries_search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ zip: "95030", radius_miles: 3 }) }, (r, b) => r.status === 200 && b.includes("Los Gatos Public Library"));
await check("MCP tools/call", "/lib/mcp", {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "libraries_search", arguments: { zip: "95030", radius_miles: 3 } } }),
}, (r, b) => r.status === 200 && b.includes("Los Gatos Public Library"));
await check("root /mcp is not exposed", "/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }, r => r.status === 404);
await check("manifest", "/manifest.webmanifest", {}, (r, b) => r.status === 200 && JSON.parse(b).icons.length === 3);
await check("icon 512", "/icons/512", {}, r => r.status === 200 && r.headers.get("content-type") === "image/png");
await check("service worker", "/sw.js", {}, (r, b) => r.status === 200 && b.includes("addEventListener(\"fetch\""));
await check("sitemap", "/sitemap.xml", {}, (r, b) => r.status === 200 && b.includes("/gov/us/ca/dmv"));
await check("iOS opt-in tag", "/", { headers: HTML }, (r, b) => b.includes('name="apple-mobile-web-app-capable"'));

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);

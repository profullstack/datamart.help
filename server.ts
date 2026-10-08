// datamart.help: the homepage and readable HTML pages over the Datamart API, which runs
// in profullstack/mcp-server (mcp_modules/datamart) at mcp.profullstack.com. Browsers get
// HTML; anything asking for JSON (or ?raw=1), MCP and /api/v1 is passed through as is.
const UPSTREAM = (process.env.DATAMART_UPSTREAM ?? "https://mcp.profullstack.com").replace(/\/$/, "");
const DIR = new URL("./", import.meta.url);
const STATIC: Record<string, string> = {
  "/": "index.html",
  "/index.html": "index.html",
  "/style.css": "style.css",
};
const TYPES: Record<string, string> = { html: "text/html; charset=utf-8", css: "text/css; charset=utf-8" };
const NAMESPACES = ["search", "gov", "lib", "edu", "contracts", "finance"];
// Hop-by-hop and transport headers that must not be copied between the two connections.
const DROP_REQ = ["host", "connection", "keep-alive", "accept-encoding", "content-length", "transfer-encoding", "upgrade"];
const DROP_RES = ["connection", "keep-alive", "content-encoding", "content-length", "transfer-encoding"];

export function isDatamartPath(pathname: string): boolean {
  if (pathname.startsWith("/api/v1/") || pathname === "/api/v1") return true;
  return NAMESPACES.some(ns => pathname === `/${ns}` || pathname.startsWith(`/${ns}/`));
}

function wantsHtml(req: Request, url: URL): boolean {
  if (req.method !== "GET" || url.searchParams.has("raw")) return false;
  if (url.pathname.startsWith("/api/") || url.pathname.endsWith("/mcp")) return false;
  return (req.headers.get("accept") ?? "").includes("text/html");
}

async function proxy(req: Request, url: URL): Promise<Response> {
  const target = new URL(UPSTREAM + url.pathname);
  for (const [k, v] of url.searchParams) if (k !== "raw") target.searchParams.append(k, v);
  const headers = new Headers(req.headers);
  for (const h of DROP_REQ) headers.delete(h);
  const ip = req.headers.get("x-real-ip");
  if (ip) headers.set("x-forwarded-for", ip);
  headers.set("x-forwarded-host", url.host);
  const res = await fetch(target, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
    redirect: "manual",
  });
  const out = new Headers(res.headers);
  for (const h of DROP_RES) out.delete(h);
  const loc = out.get("location");
  if (loc?.startsWith(UPSTREAM)) out.set("location", loc.slice(UPSTREAM.length) || "/");
  return new Response(res.body, { status: res.status, headers: out });
}

// ---------------------------------------------------------------- HTML rendering

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Only http(s) links and site-relative paths become hrefs; anything else is dropped.
const href = (u: unknown) => {
  const s = String(u ?? "");
  return /^https?:\/\//i.test(s) || (s.startsWith("/") && !s.startsWith("//")) ? esc(s) : "";
};
const link = (u: unknown, text: unknown) => (href(u) ? `<a href="${href(u)}">${esc(text)}</a>` : esc(text));

const KIND: Record<string, string> = {
  library_outlet: "Library",
  school_site: "School",
  campus: "College",
};

function page(title: string, body: string, status = 200): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · datamart.help</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header><h1><a href="/">datamart.help</a></h1></header>
<main>
${body}
</main>
<footer><p>Datamart is operated by Profullstack, Inc. It is not a government service and is not affiliated with, endorsed by, or acting for any agency or library listed. Always confirm with the official source.</p></footer>
</body>
</html>
`;
  return new Response(html, { status, headers: { "content-type": TYPES.html } });
}

function searchForm(url: URL): string {
  const zip = url.searchParams.get("zip") ?? "95032";
  const radius = url.searchParams.get("radius_miles") ?? "20";
  const ns = url.pathname.split("/")[1];
  const opt = (v: string, label: string, cur: string) =>
    `<option value="${v}"${v === cur ? " selected" : ""}>${label}</option>`;
  return `<form class="search" action="/search" method="get">
  <label>ZIP code <input name="zip" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" value="${esc(zip)}" required></label>
  <label>Within <select name="radius_miles">${["3", "5", "10", "20"].map(r => opt(r, `${r} miles`, radius)).join("")}</select></label>
  <label>Show <select name="ns">${opt("search", "Everything", ns)}${opt("lib", "Libraries", ns)}${opt("edu", "Schools and colleges", ns)}</select></label>
  <button type="submit">Search</button>
</form>`;
}

function itemHtml(it: any): string {
  const a = it.address ?? {};
  const addr = [a.street, a.city, a.state && `${a.state} ${a.zip ?? ""}`.trim()].filter(Boolean).join(", ");
  const kind = KIND[it.kind] ?? it.institution_type ?? it.kind ?? "";
  const grades = it.grades?.low ? ` · grades ${esc(it.grades.low)}-${esc(it.grades.high)}` : "";
  const dist = typeof it.distance_miles === "number" ? `${it.distance_miles} mi · ` : "";
  const site = it.website ?? it.official_url;
  const handoff = it.handoff?.url && it.handoff.url !== site ? ` · ${link(it.handoff.url, it.handoff.label ?? "Official source")}` : "";
  const title = it.title ?? it.name ?? it.id;
  return `<li>
  <div class="name">${site || it.url ? link(site ?? it.url, title) : esc(title)}${kind ? `<span class="tag">${esc(kind)}</span>` : ""}</div>
  <div class="meta">${dist}${esc(addr)}${grades}${it.phone ? ` · ${esc(it.phone)}` : ""}${handoff}</div>
  ${it.description ? `<div class="meta">${esc(String(it.description).slice(0, 300))}</div>` : ""}
</li>`;
}

function servicesHtml(services: any[]): string {
  if (!services?.length) return "";
  return `<h2>Government services</h2><ul class="cards">${services
    .map(s => `<li>${link(s.path, s.name)}<span>${esc(s.organization ?? "")}${s.official_url ? ` · ${link(s.official_url, "official site")}` : ""}</span></li>`)
    .join("")}</ul>`;
}

function notesHtml(d: any): string {
  const w = d.warnings?.length ? `<h2>Notes</h2><ul class="warnings">${d.warnings.map((x: string) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
  const s = d.sources?.length
    ? `<h2>Sources</h2><ul>${d.sources.map((x: any) => `<li>${link(x.url, x.name)}${x.retrieved_at ? ` <span class="muted">(retrieved ${esc(x.retrieved_at)})</span>` : ""}</li>`).join("")}</ul>`
    : "";
  return w + s;
}

function rawLink(url: URL): string {
  const u = new URL(url);
  u.searchParams.set("raw", "1");
  return `<p class="muted">${link(u.pathname + u.search, "This page as JSON")}</p>`;
}

export function render(url: URL, status: number, d: any): Response {
  if (d?.error) {
    const e = d.error;
    return page("Unavailable", `${searchForm(url)}<h2>Not available right now</h2><p>${esc(e.message ?? e.code)}</p>${
      e.retry_after_seconds ? `<p class="muted">Try again in about ${Math.ceil(e.retry_after_seconds / 60)} minutes.</p>` : ""
    }${e.handoff?.url ? `<p>${link(e.handoff.url, e.handoff.label ?? "Official source")}</p>` : ""}`, status);
  }
  if (Array.isArray(d?.data)) {
    const m = d.meta ?? {};
    const head = m.origin?.label
      ? `<h2>Near ${esc(m.origin.label)}${m.radius_miles ? `, within ${esc(m.radius_miles)} miles` : ""}</h2>`
      : `<h2>Results</h2>`;
    const count = typeof m.total_matches === "number" ? `<p class="muted">Showing ${d.data.length} of ${m.total_matches}${m.distance_note ? `. ${esc(m.distance_note)}` : ""}</p>` : "";
    const list = d.data.length ? `<ul class="results">${d.data.map(itemHtml).join("")}</ul>` : `<p>No matches.</p>`;
    return page(m.origin?.label ?? "Results", searchForm(url) + head + count + list + servicesHtml(d.services) + notesHtml(d) + rawLink(url), status);
  }
  if (Array.isArray(d?.providers)) {
    const provs = `<ul class="cards">${d.providers
      .map((p: any) => `<li>${link(p.path, p.name)}<span>${esc(p.organization ?? p.description ?? "")}${p.official_url ? ` · ${link(p.official_url, "official site")}` : ""}</span></li>`)
      .join("")}</ul>`;
    const tools = d.tools?.length ? `<p class="muted">MCP: <code>${esc(d.mcp_endpoint ?? "")}</code> · tools: ${d.tools.map((t: any) => `<code>${esc(t.name ?? t)}</code>`).join(", ")}</p>` : "";
    return page(d.title ?? "Datamart", `${searchForm(url)}<h2>${esc(d.title)}</h2><p>${esc(d.description)}</p>${provs}${tools}${rawLink(url)}`, status);
  }
  if (Array.isArray(d?.capabilities)) {
    const caps = `<table class="caps"><tr><th>Operation</th><th>State</th><th>Note</th></tr>${d.capabilities
      .map((c: any) => `<tr><td><code>${esc(c.operation)}</code></td><td>${esc(c.state)}</td><td>${esc(c.reason ?? c.note ?? "")}</td></tr>`)
      .join("")}</table>`;
    const facts = d.facts?.length ? `<ul>${d.facts.map((f: string) => `<li>${esc(f)}</li>`).join("")}</ul>` : "";
    const go = d.handoff?.url ? `<p><strong>${link(d.handoff.url, d.handoff.label ?? "Official site")}</strong></p>` : "";
    return page(d.name ?? "Service", `<h2>${esc(d.name)}</h2><p class="muted">${esc(d.organization ?? "")}</p>${go}${facts}<h2>What Datamart can do here</h2>${caps}${notesHtml(d)}${rawLink(url)}`, status);
  }
  return page("Datamart", `<pre>${esc(JSON.stringify(d, null, 2))}</pre>`, status);
}

async function htmlPage(req: Request, url: URL): Promise<Response> {
  // The homepage form sends ns=lib|edu to pick a namespace; the API itself has no ns.
  const ns = url.searchParams.get("ns");
  if (url.pathname === "/search" && ns) {
    const u = new URL(url);
    u.searchParams.delete("ns");
    if (ns === "lib" || ns === "edu") return new Response(null, { status: 302, headers: { location: `/${ns}${u.search}` } });
    if (ns !== "search") return new Response(null, { status: 302, headers: { location: `/search${u.search}` } });
    url = u;
  }
  const headers = { accept: "application/json", "x-real-ip": req.headers.get("x-real-ip") ?? "" };
  const res = await proxy(new Request(req.url, { headers }), url);
  if (res.status >= 300 && res.status < 400) return res;
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("json")) return res;
  return render(url, res.status, await res.json());
}

export async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (url.pathname === "/healthz") return new Response("ok\n");
  const file = STATIC[url.pathname];
  if (file && (req.method === "GET" || req.method === "HEAD")) {
    return new Response(Bun.file(new URL(file, DIR)), { headers: { "content-type": TYPES[file.split(".").pop()!] } });
  }
  if (!isDatamartPath(url.pathname)) return new Response("Not found\n", { status: 404 });
  try {
    return wantsHtml(req, url) ? await htmlPage(req, url) : await proxy(req, url);
  } catch (err) {
    console.error(`upstream ${url.pathname}: ${err}`);
    return wantsHtml(req, url)
      ? page("Unavailable", `<h2>Datamart is not answering</h2><p>Try again in a minute.</p>`, 502)
      : Response.json({ error: { code: "upstream_unavailable", message: "Datamart did not answer" } }, { status: 502 });
  }
}

if (import.meta.main) {
  const port = Number(process.env.PORT ?? 3000);
  Bun.serve({ port, hostname: "0.0.0.0", fetch: handle });
  console.log(`datamart.help on :${port} -> ${UPSTREAM}`);
}

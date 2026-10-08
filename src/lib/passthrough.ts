// Which requests skip the web pages and go straight to the Datamart API: MCP endpoints,
// and any page URL asked for as JSON (Accept without text/html, or ?raw=1). Agents and
// scripts use the same shareable URLs as people (PRD 5.2, 5.3).

export const NAMESPACES = ["search", "gov", "lib", "edu", "contracts", "finance"] as const;

export function isNamespacePath(pathname: string): boolean {
  return NAMESPACES.some(ns => pathname === `/${ns}` || pathname.startsWith(`/${ns}/`));
}

export function isMcpPath(pathname: string): boolean {
  return isNamespacePath(pathname) && pathname.endsWith("/mcp");
}

export function wantsJson(method: string, accept: string | null, raw: boolean): boolean {
  if (raw) return true;
  if (method !== "GET" && method !== "HEAD") return true;
  const a = (accept ?? "").toLowerCase();
  if (a.includes("text/html")) return false;
  return a.includes("application/json") || a.includes("text/event-stream");
}

export function shouldPassThrough(method: string, pathname: string, accept: string | null, raw: boolean): boolean {
  if (!isNamespacePath(pathname)) return false;
  return isMcpPath(pathname) || wantsJson(method, accept, raw);
}

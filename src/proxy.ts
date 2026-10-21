import { NextResponse, type NextRequest } from "next/server";
import { shouldPassThrough } from "@/lib/passthrough";
import { upstreamBase } from "@/lib/upstream";
import { gate } from "@/lib/crawl-gateway";

// Agents, scripts and MCP clients get the Datamart API response on the same URL a
// person opens in a browser. Everything else renders the web pages.
export async function proxy(req: NextRequest) {
  // Crawl gateway first: AI training crawlers get 402 Payment Required (or the pass
  // page at /crawl) unless they present a paid pass. Everyone else carries on.
  const answer = await gate(req);
  if (answer) return answer;

  const { pathname, searchParams } = req.nextUrl;
  const raw = searchParams.has("raw");
  if (!shouldPassThrough(req.method, pathname, req.headers.get("accept"), raw)) return NextResponse.next();
  const target = new URL(upstreamBase() + pathname);
  for (const [k, v] of searchParams) if (k !== "raw") target.searchParams.append(k, v);
  return NextResponse.rewrite(target);
}

export const config = {
  // Every page (the crawl gateway) minus static build output and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|css|js|map)$).*)"],
};

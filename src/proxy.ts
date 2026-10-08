import { NextResponse, type NextRequest } from "next/server";
import { shouldPassThrough } from "@/lib/passthrough";
import { upstreamBase } from "@/lib/upstream";

// Agents, scripts and MCP clients get the Datamart API response on the same URL a
// person opens in a browser. Everything else renders the web pages.
export function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const raw = searchParams.has("raw");
  if (!shouldPassThrough(req.method, pathname, req.headers.get("accept"), raw)) return NextResponse.next();
  const target = new URL(upstreamBase() + pathname);
  for (const [k, v] of searchParams) if (k !== "raw") target.searchParams.append(k, v);
  return NextResponse.rewrite(target);
}

export const config = {
  matcher: ["/search/:path*", "/gov/:path*", "/lib/:path*", "/edu/:path*", "/contracts/:path*", "/finance/:path*"],
};

import { createGateway } from "@profullstack/x402-gateway";
import { x402Proxy } from "@profullstack/x402-gateway/next";
import { isMcpPath } from "./passthrough";
import { SITE } from "./site";

// Sells crawl access to AI training crawlers (GPTBot, ClaudeBot, CCBot, ...) by the
// day over x402, settled by CoinPay in USDC, with a CoinPay checkout for people at
// /crawl. Browsers, Googlebot, AI chat/search fetchers and MCP clients pass through.
// Read through a computed key: Next inlines a literal process.env.NAME at build time.
const env = (name: string): string | undefined => process.env[name];

export const gateway = createGateway({
  siteUrl: (env("SITE_URL") || env("NEXT_PUBLIC_SITE_URL") || SITE).replace(/\/+$/, ""),
  siteName: "Datamart",
  coinpay: { apiKey: env("COINPAY_X402_KEY") },
  payTo: env("CRAWL_PAY_TO"),
  contact: "mailto:anthony@profullstack.com",
  // Health checks, the versioned API and the crawl manifests are never charged.
  openPaths: ["/healthz", "/api/", "/api", "/robots.txt", "/sitemap.xml", "/llms.txt", "/.well-known/", "/manifest.webmanifest", "/sw.js"],
  // MCP endpoints are the product for agents: never charged.
  exempt: (request: Request) => isMcpPath(new URL(request.url).pathname),
});

/** Resolves to a Response for a refused crawler, or undefined to carry on. */
export const gate = x402Proxy(gateway);

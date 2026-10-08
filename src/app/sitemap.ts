import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { api, type Provider } from "@/lib/upstream";

export const revalidate = 86400;

const STATIC = ["/", "/search", "/gov", "/lib", "/lib/us/loc", "/edu", "/contracts", "/finance", "/developers", "/about"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const providers = await api<{ providers: Provider[] }>("/api/v1/providers", undefined, 86400);
  const paths = new Set(STATIC);
  if (providers.ok) for (const p of providers.data.providers) if (p.path?.startsWith("/gov/us/")) paths.add(p.path);
  return [...paths].map(path => ({ url: `${SITE}${path === "/" ? "" : path}`, changeFrequency: "weekly", priority: path === "/" ? 1 : 0.6 }));
}

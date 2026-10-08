// The Datamart API runs in profullstack/mcp-server (mcp_modules/datamart) at
// mcp.profullstack.com. Every page here reads it server side; the browser never calls it.

// Read through a computed key: Next inlines a literal process.env.NAME at build time.
const env = (name: string): string | undefined => process.env[name];

export function upstreamBase(): string {
  return (env("DATAMART_" + "UPSTREAM") ?? "https://mcp.profullstack.com").replace(/\/$/, "");
}

export type Address = { street?: string; city?: string; state?: string; zip?: string };

export type Handoff = { label?: string; url?: string | null; phone?: string; note?: string };

export type Capability = { operation: string; state: string; reason?: string; note?: string };

export type Source = { name: string; url?: string; version?: string; retrieved_at?: string; license?: string };

export type Item = {
  id: string;
  kind?: string;
  name?: string;
  title?: string;
  url?: string;
  description?: string;
  date?: string;
  format?: string[] | string;
  outlet_type?: string;
  institution_type?: string;
  school_type?: string;
  sector?: string;
  charter?: boolean;
  types?: string[];
  grades?: { low?: string; high?: string };
  district?: { name?: string };
  system?: { id?: string; name?: string };
  address?: Address;
  county?: string;
  phone?: string;
  website?: string | null;
  official_url?: string | null;
  source_record_url?: string;
  lat?: number;
  lng?: number;
  distance_miles?: number;
  reported_status?: string;
  capability?: string;
  handoff?: Handoff;
  eligibility?: { status?: string; note?: string };
  namespace?: string;
  [key: string]: unknown;
};

export type Origin = {
  label?: string;
  defaulted?: boolean;
  note?: string;
  precision?: string;
};

export type Meta = {
  origin?: Origin;
  radius_miles?: number;
  total_matches?: number;
  next_cursor?: string | null;
  distance_note?: string;
  coverage?: string;
  coverage_area?: { label?: string };
  effective_filters?: Record<string, unknown>;
  retrieved_at?: string;
};

export type Provider = {
  id: string;
  namespace: string;
  name: string;
  organization?: string;
  description?: string;
  jurisdiction?: { level?: string; region?: string };
  path: string;
  official_url?: string | null;
  info_url?: string | null;
  headline_state?: string;
  facts?: string[];
  capabilities?: Capability[];
  handoff?: Handoff;
  mcp_endpoint?: string | null;
  tools?: (string | { name: string })[];
  sources?: (Source | string)[];
};

export type ResultList = {
  data: Item[];
  meta?: Meta;
  services?: Provider[];
  warnings?: string[];
  sources?: Source[];
  disclosure?: string;
};

export type NamespacePage = {
  namespace: string;
  title: string;
  description?: string;
  mcp_endpoint?: string | null;
  providers: Provider[];
  tools?: (string | { name: string })[];
  status?: string;
  note?: string;
};

export type ApiError = {
  code: string;
  message?: string;
  provider?: string;
  retry_after_seconds?: number;
  handoff_url?: string;
  handoff?: Handoff;
  sources?: Provider[];
};

export type Result<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: ApiError };

type Query = URLSearchParams | Record<string, string | undefined>;

export function toSearch(q?: Query): string {
  if (!q) return "";
  const p = new URLSearchParams();
  const entries = q instanceof URLSearchParams ? [...q.entries()] : Object.entries(q);
  for (const [k, v] of entries) if (v !== undefined && v !== "") p.append(k, v);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** GET a Datamart path. Upstream failures come back as a typed error, never a throw. */
export async function api<T>(path: string, q?: Query, revalidate = 300): Promise<Result<T>> {
  const url = upstreamBase() + path + toSearch(q);
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": "datamart.help web" },
      signal: AbortSignal.timeout(25_000),
      next: { revalidate },
    });
  } catch {
    return { ok: false, status: 502, error: { code: "upstream_unavailable", message: "Datamart did not answer. Try again in a minute." } };
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { ok: false, status: 502, error: { code: "upstream_unavailable", message: "Datamart sent an unreadable answer." } };
  }
  const err = (body as { error?: ApiError })?.error;
  if (!res.ok || err) {
    return { ok: false, status: res.status >= 400 ? res.status : 502, error: err ?? { code: "upstream_error", message: `Datamart answered ${res.status}` } };
  }
  return { ok: true, status: res.status, data: body as T };
}

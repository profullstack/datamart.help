import Link from "next/link";
import type { ApiError, Capability, Item, Meta, Provider, Source } from "@/lib/upstream";
import { safeUrl, stateLabel } from "@/lib/params";

const KIND: Record<string, string> = {
  library_outlet: "Library",
  school_site: "School",
  campus: "College",
};

const OUTLET: Record<string, string> = {
  central: "Central library",
  branch: "Branch",
  bookmobile: "Bookmobile",
  books_by_mail: "Books by mail",
};

export function Ext({ href, children }: { href: unknown; children: React.ReactNode }) {
  const u = safeUrl(href);
  if (!u) return <>{children}</>;
  return u.startsWith("/") ? <Link href={u}>{children}</Link> : <a href={u} rel="noopener noreferrer">{children}</a>;
}

export function detailPath(it: Item): string | null {
  if (!it.id) return null;
  if (it.kind === "library_outlet") return `/lib/us/ca/${encodeURIComponent(it.id)}`;
  if (it.kind === "school_site" || it.kind === "campus") return `/edu/us/ca/${encodeURIComponent(it.id)}`;
  if (it.namespace === "lib" && it.id.startsWith("us.loc")) return null;
  return null;
}

export function addressLine(it: Item): string {
  const a = it.address ?? {};
  const stateZip = [a.state, a.zip].filter(Boolean).join(" ");
  return [a.street, a.city, stateZip].filter(Boolean).join(", ");
}

export function grades(it: Item): string | null {
  if (!it.grades?.low) return null;
  const g = (s?: string) => (s === "KG" ? "K" : s === "PK" ? "Pre-K" : String(Number(s) || s));
  return it.grades.low === it.grades.high ? `Grade ${g(it.grades.low)}` : `Grades ${g(it.grades.low)} to ${g(it.grades.high)}`;
}

export function kindLabel(it: Item): string {
  if (it.kind === "library_outlet") return OUTLET[it.outlet_type ?? ""] ?? "Library";
  if (it.kind === "campus") return it.institution_type === "university" ? "University" : it.institution_type === "community_college" ? "Community college" : "College";
  if (it.kind === "school_site") {
    const t = it.types?.[0];
    return t ? `${t[0].toUpperCase()}${t.slice(1)} school` : "School";
  }
  return KIND[it.kind ?? ""] ?? it.format?.toString() ?? "";
}

export function ItemRow({ it }: { it: Item }) {
  const detail = detailPath(it);
  const title = it.name ?? it.title ?? it.id;
  const site = safeUrl(it.website ?? it.official_url ?? it.url);
  const g = grades(it);
  return (
    <li className="row">
      <div className="top">
        {detail ? (
          <Link className="name" href={detail}>{title}</Link>
        ) : site ? (
          <a className="name" href={site} rel="noopener noreferrer">{title}</a>
        ) : (
          <span className="name">{title}</span>
        )}
        {typeof it.distance_miles === "number" && <span className="dist">{it.distance_miles} mi</span>}
      </div>
      <div className="badges">
        {kindLabel(it) && <span className="badge">{kindLabel(it)}</span>}
        {g && <span className="badge">{g}</span>}
        {it.charter && <span className="badge">Charter</span>}
        {it.reported_status && !it.reported_status.startsWith("open") && (
          <span className="badge">{it.reported_status.replace(/_in_fy(\d{4})$/, " (FY$1)").replace(/_/g, " ")}</span>
        )}
        {it.district?.name && <span className="badge">{it.district.name}</span>}
        {it.date && <span className="badge">{it.date}</span>}
      </div>
      {addressLine(it) && <div className="muted small">{addressLine(it)}{it.phone ? ` · ${it.phone}` : ""}</div>}
      {it.description && <div className="muted small">{String(it.description).slice(0, 280)}</div>}
    </li>
  );
}

export function ResultsHeader({ meta, count, noun }: { meta?: Meta; count: number; noun: string }) {
  const o = meta?.origin;
  return (
    <div>
      <h2>
        {o?.label ? `${noun} near ${o.label}` : noun}
        {meta?.radius_miles ? `, within ${meta.radius_miles} miles` : ""}
      </h2>
      <p className="muted small">
        {typeof meta?.total_matches === "number" ? `${count} shown of ${meta.total_matches}. ` : ""}
        {meta?.distance_note ?? ""}
      </p>
      {o?.defaulted && (
        <div className="notice info">
          <p>No location was given, so this uses Datamart&apos;s default area ({o.label}). Enter a ZIP code or city to search near you.</p>
        </div>
      )}
      {o?.note && <p className="muted small">{o.note}</p>}
    </div>
  );
}

export function ErrorNotice({ error, children }: { error: ApiError; children?: React.ReactNode }) {
  const handoff = safeUrl(error.handoff_url ?? error.handoff?.url);
  const minutes = error.retry_after_seconds ? Math.ceil(error.retry_after_seconds / 60) : 0;
  const soft = ["configuration_required", "unsupported_operation", "source_rate_limited", "source_unavailable"].includes(error.code);
  return (
    <div className={`notice ${soft ? "warn" : "bad"}`} role="status">
      <p><strong>{TITLE[error.code] ?? "Something went wrong"}</strong></p>
      {error.message && <p>{error.message}</p>}
      {minutes > 0 && <p>Try again in about {minutes} minute{minutes === 1 ? "" : "s"}.</p>}
      {handoff && <p><a href={handoff} rel="noopener noreferrer">Continue on the official site</a></p>}
      {children}
    </div>
  );
}

const TITLE: Record<string, string> = {
  configuration_required: "Not configured yet",
  unsupported_operation: "Not available yet",
  source_rate_limited: "Paused to respect the source's limits",
  source_unavailable: "The source is not answering",
  upstream_unavailable: "Datamart is not answering",
  invalid_filters: "Check the search",
  invalid_location: "Check the location",
  location_not_found: "Location not found",
  location_unresolved: "Location not found",
  not_found: "Not found",
};

export function Notes({ warnings, sources }: { warnings?: string[]; sources?: (Source | string)[] }) {
  return (
    <>
      {warnings?.length ? (
        <>
          <h2>Good to know</h2>
          <ul className="notes">
            {warnings.map(w => <li key={w}>{w}</li>)}
          </ul>
        </>
      ) : null}
      {sources?.length ? (
        <>
          <h2>Sources</h2>
          <ul className="notes">
            {sources.map(src => {
              // Provider pages list sources as bare URLs; result lists as objects.
              const s: Source = typeof src === "string" ? { name: src.replace(/^https?:\/\//, ""), url: src } : src;
              return (
                <li key={s.version ?? s.url ?? s.name}>
                  <Ext href={s.url}>{s.name}</Ext>
                  {s.retrieved_at ? ` (retrieved ${s.retrieved_at})` : ""}
                  {s.license ? `. ${s.license}` : ""}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </>
  );
}

export function StateBadge({ state }: { state?: string }) {
  if (!state) return null;
  return <span className="badge state" title={state}>{stateLabel(state)}</span>;
}

export function ProviderCard({ p }: { p: Provider }) {
  const internal = safeUrl(p.path);
  return (
    <li className="card">
      <h3>{internal ? <Link href={internal}>{p.name}</Link> : p.name}</h3>
      {(p.organization || p.description) && <span className="muted small">{p.organization ?? p.description}</span>}
      <div className="badges">
        <StateBadge state={p.headline_state} />
        {p.jurisdiction?.level && <span className="badge">{p.jurisdiction.region ? `${p.jurisdiction.region} ` : ""}{p.jurisdiction.level}</span>}
      </div>
      {safeUrl(p.official_url) && (
        <span className="small"><a href={safeUrl(p.official_url)!} rel="noopener noreferrer">Official site</a></span>
      )}
    </li>
  );
}

// One row per operation, stacked: reads on a phone without a sideways scroll.
export function CapabilityTable({ caps }: { caps: Capability[] }) {
  return (
    <ul className="list">
      {caps.map(c => (
        <li key={c.operation} className="row">
          <div className="top">
            <code>{c.operation}</code>
            <StateBadge state={c.state} />
          </div>
          {(c.reason ?? c.note) && <div className="muted small">{c.reason ?? c.note}</div>}
        </li>
      ))}
    </ul>
  );
}

export function Pager({ next, prevHref }: { next?: string | null; prevHref?: string | null }) {
  if (!next && !prevHref) return null;
  return (
    <nav className="pager" aria-label="Pages">
      {prevHref ? <Link className="btn secondary" href={prevHref}>First page</Link> : <span />}
      {next ? <Link className="btn secondary" href={next}>Next page</Link> : <span />}
    </nav>
  );
}

export function JsonLink({ path, params }: { path: string; params?: Record<string, string> }) {
  const p = new URLSearchParams({ ...(params ?? {}), raw: "1" });
  return (
    <p className="muted small">
      For code and agents: <a href={`${path}?${p}`}>this page as JSON</a> · <Link href="/developers">API and MCP</Link>
    </p>
  );
}

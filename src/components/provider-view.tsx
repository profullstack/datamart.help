import Link from "next/link";
import { CapabilityTable, Ext, Notes, StateBadge } from "@/components/blocks";
import { safeUrl } from "@/lib/params";
import type { Item, Provider } from "@/lib/upstream";

// A government service or collection (PRD 8): what it is, the official way in, and
// exactly which operations Datamart supports there today.
export function ProviderView({ p, back, children }: { p: Provider; back: { href: string; label: string }; children?: React.ReactNode }) {
  const official = safeUrl(p.official_url);
  const handoff = safeUrl(p.handoff?.url);
  return (
    <>
      <p className="crumbs"><Link href={back.href}>{back.label}</Link></p>
      <h1>{p.name}</h1>
      {p.organization && <p className="lede">{p.organization}</p>}
      <div className="badges">
        <StateBadge state={p.headline_state} />
        {p.jurisdiction?.level && <span className="badge">{p.jurisdiction.region ? `${p.jurisdiction.region} ` : ""}{p.jurisdiction.level}</span>}
      </div>
      {(handoff || official) && (
        <p className="actions" style={{ marginTop: "1rem" }}>
          {handoff && <a className="btn" href={handoff} rel="noopener noreferrer">{p.handoff?.label ?? "Official site"}</a>}
          {official && official !== handoff && <a className="btn secondary" href={official} rel="noopener noreferrer">Official site</a>}
          {safeUrl(p.info_url) && <a className="btn secondary" href={safeUrl(p.info_url)!} rel="noopener noreferrer">More information</a>}
        </p>
      )}
      {children}
      {p.facts?.length ? (
        <>
          <h2>Worth knowing</h2>
          <ul className="notes">{p.facts.map(f => <li key={f}>{f}</li>)}</ul>
        </>
      ) : null}
      {p.capabilities?.length ? (
        <>
          <h2>What Datamart can do here</h2>
          <CapabilityTable caps={p.capabilities} />
        </>
      ) : null}
      {p.mcp_endpoint && (
        <p className="muted small">Agents: MCP at <code>https://datamart.help{p.mcp_endpoint}</code></p>
      )}
      <Notes sources={p.sources} />
      {p.official_url && (
        <p className="muted small">Datamart is not affiliated with {p.organization ?? p.name}. Confirm anything important on the <Ext href={p.official_url}>official site</Ext>.</p>
      )}
    </>
  );
}

/** A catalog record: a Data.gov dataset or a Library of Congress item. */
export function DocRow({ it, detail }: { it: Item; detail?: string | null }) {
  const title = it.title ?? it.name ?? it.id;
  const url = safeUrl(it.url ?? it.catalog_url ?? it.landing_page);
  const org = (it.organization as { name?: string } | null)?.name ?? (it.publisher as string | null);
  const formats = [...((it.online_format as string[]) ?? []), ...((it.original_format as string[]) ?? [])].slice(0, 3);
  return (
    <li className="row">
      <div className="top">
        {detail ? <Link className="name" href={detail}>{title}</Link> : url ? <a className="name" href={url} rel="noopener noreferrer">{title}</a> : <span className="name">{title}</span>}
        {it.date && <span className="dist">{it.date}</span>}
      </div>
      <div className="badges">
        {org && <span className="badge">{org}</span>}
        {formats.map(f => <span key={f} className="badge">{f}</span>)}
        {it.access_restricted === true && <span className="badge">Access restricted</span>}
      </div>
      {it.description && <div className="muted small">{String(it.description).slice(0, 300)}</div>}
    </li>
  );
}

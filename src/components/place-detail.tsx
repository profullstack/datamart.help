import Link from "next/link";
import { addressLine, grades, kindLabel, Notes, StateBadge } from "@/components/blocks";
import { safeUrl } from "@/lib/params";
import type { Item, ResultList } from "@/lib/upstream";

// One library branch, school or campus (PRD 5.1: /lib/us/ca/:id, /edu/us/ca/:id).
export function PlaceDetail({ it, list, back }: { it: Item; list: ResultList; back: { href: string; label: string } }) {
  const site = safeUrl(it.website ?? it.official_url);
  const handoff = safeUrl(it.handoff?.url);
  const record = safeUrl(it.source_record_url);
  const g = grades(it);
  const map =
    typeof it.lat === "number" && typeof it.lng === "number"
      ? `https://www.openstreetmap.org/?mlat=${it.lat}&mlon=${it.lng}#map=17/${it.lat}/${it.lng}`
      : null;
  const name = it.name ?? it.title ?? it.id;
  return (
    <>
      <p className="crumbs"><Link href={back.href}>{back.label}</Link></p>
      <h1>{name}</h1>
      <div className="badges">
        <span className="badge">{kindLabel(it)}</span>
        {g && <span className="badge">{g}</span>}
        {it.charter && <span className="badge">Charter</span>}
        <StateBadge state={it.capability} />
      </div>
      <div className="split" style={{ marginTop: "1.25rem" }}>
        <section className="panel">
          <dl className="facts">
            {addressLine(it) && (<><dt>Address</dt><dd>{addressLine(it)}{it.county ? ` (${it.county})` : ""}</dd></>)}
            {it.phone && (<><dt>Phone</dt><dd><a href={`tel:${it.phone.replace(/[^\d+]/g, "")}`}>{it.phone}</a></dd></>)}
            {site && (<><dt>Website</dt><dd><a href={site} rel="noopener noreferrer">{site.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a></dd></>)}
            {it.system?.name && (<><dt>Library system</dt><dd>{it.system.name}</dd></>)}
            {it.district?.name && (<><dt>District</dt><dd>{it.district.name}</dd></>)}
            {it.school_type && (<><dt>Type</dt><dd>{it.school_type}</dd></>)}
            {it.sector && (<><dt>Sector</dt><dd>{it.sector}</dd></>)}
            {it.reported_status && (<><dt>Status</dt><dd>{reportedStatus(it.reported_status)}</dd></>)}
            {map && (<><dt>Map</dt><dd><a href={map} rel="noopener noreferrer">OpenStreetMap</a></dd></>)}
          </dl>
        </section>
        <aside className="panel">
          <h3>Next step</h3>
          {it.handoff?.label && <p>{handoff ? <a href={handoff} rel="noopener noreferrer">{it.handoff.label}</a> : it.handoff.label}</p>}
          {it.handoff?.note && <p className="muted small">{it.handoff.note}</p>}
          {it.eligibility?.note && <p className="muted small">{it.eligibility.note}</p>}
          {record && <p className="small"><a href={record} rel="noopener noreferrer">Source record</a></p>}
        </aside>
      </div>
      <Notes warnings={list.warnings} sources={list.sources} />
    </>
  );
}

// "open_in_fy2024" -> "Open (FY2024 survey)": the status is what the survey year reported.
function reportedStatus(s: string): string {
  const m = s.match(/^(.*)_in_fy(\d{4})$/);
  const what = (m ? m[1] : s).replace(/_/g, " ");
  const label = what.charAt(0).toUpperCase() + what.slice(1);
  return m ? `${label} (FY${m[2]} survey)` : label;
}

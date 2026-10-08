import type { Metadata } from "next";
import { ErrorNotice, JsonLink, StateBadge } from "@/components/blocks";
import { safeUrl } from "@/lib/params";
import { api, type NamespacePage, type Provider } from "@/lib/upstream";

export const metadata: Metadata = {
  title: "Government contracts",
  description: "Where federal, California, Santa Clara County and city governments post contract opportunities.",
  alternates: { canonical: "/contracts" },
};

const LEVELS = [
  ["federal", "Federal"],
  ["state", "State"],
  ["county", "County"],
  ["city", "City"],
] as const;

export default async function ContractsPage() {
  const ns = await api<NamespacePage>("/contracts", undefined, 3600);
  if (!ns.ok) return (<><h1>Contracts</h1><ErrorNotice error={ns.error} /></>);
  const by = (level: string) => ns.data.providers.filter(p => p.jurisdiction?.level === level);
  return (
    <>
      <h1>Government contracts</h1>
      <p className="lede">{ns.data.description}</p>
      <div className="notice info">
        <p>Opportunity search, saved filters and application workspaces are being built. Until then, these are the official places each buyer posts work. County and City of Santa Clara are different buyers with different portals.</p>
      </div>
      {LEVELS.map(([level, label]) => {
        const list = by(level);
        if (!list.length) return null;
        return (
          <section key={level}>
            <h2>{label}</h2>
            <ul className="grid">{list.map(p => <SourceCard key={p.id} p={p} />)}</ul>
          </section>
        );
      })}
      <JsonLink path="/contracts" />
    </>
  );
}

function SourceCard({ p }: { p: Provider }) {
  const url = safeUrl(p.official_url);
  const where = (p.jurisdiction as { locality?: string; region?: string } | undefined);
  return (
    <li className="card">
      <h3>{url ? <a href={url} rel="noopener noreferrer">{p.name}</a> : p.name}</h3>
      <span className="muted small">{p.organization}{where?.locality ? ` · ${where.locality}` : ""}</span>
      <div className="badges"><StateBadge state={p.headline_state} /></div>
    </li>
  );
}

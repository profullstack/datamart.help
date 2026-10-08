import type { Metadata } from "next";
import { ErrorNotice, JsonLink, ProviderCard } from "@/components/blocks";
import { ALLOWED, pick, type SP } from "@/lib/params";
import { api, type NamespacePage, type Provider } from "@/lib/upstream";

export const metadata: Metadata = {
  title: "Government services",
  description: "IRS, California FTB, DMV, EDD, BizFile and the Data.gov catalog: the official way in, and what Datamart can do for each.",
  alternates: { canonical: "/gov" },
};

export default async function GovPage({ searchParams }: { searchParams: Promise<SP> }) {
  const p = pick(await searchParams, ALLOWED.gov);
  const ns = await api<NamespacePage>("/gov", undefined, 3600);
  const found = p.q ? await api<{ data: Provider[] }>("/gov", { q: p.q }) : null;
  return (
    <>
      <h1>Government services</h1>
      <p className="lede">{ns.ok ? ns.data.description : "U.S. federal and California services, with official links."}</p>
      <form className="panel form" action="/gov" method="get" role="search">
        <label className="field wide">
          What do you need to do?
          <input name="q" defaultValue={p.q ?? ""} placeholder="business filing, driver license, payroll tax…" />
        </label>
        <div className="actions wide"><button className="btn" type="submit">Find the service</button></div>
      </form>
      {found && (
        found.ok ? (
          <>
            <h2>Matching services</h2>
            {found.data.data.length ? (
              <ul className="grid">{found.data.data.map(s => <ProviderCard key={s.id} p={s} />)}</ul>
            ) : (
              <p>No service matched &ldquo;{p.q}&rdquo;. Browse the full list below.</p>
            )}
          </>
        ) : <ErrorNotice error={found.error} />
      )}
      <h2>All services</h2>
      {ns.ok ? <ul className="grid">{ns.data.providers.map(s => <ProviderCard key={s.id} p={s} />)}</ul> : <ErrorNotice error={ns.error} />}
      <JsonLink path="/gov" params={p} />
    </>
  );
}

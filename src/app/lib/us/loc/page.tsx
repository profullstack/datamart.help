import type { Metadata } from "next";
import { ErrorNotice, JsonLink, Pager } from "@/components/blocks";
import { DocRow, ProviderView } from "@/components/provider-view";
import { ALLOWED, LOC_FORMATS, hasAny, href, pick, type SP } from "@/lib/params";
import { api, type Item, type Provider } from "@/lib/upstream";

export const metadata: Metadata = {
  title: "Library of Congress collections",
  description: "Search the Library of Congress digital collections: books, maps, photos, newspapers, manuscripts and more.",
  alternates: { canonical: "/lib/us/loc" },
};

const PATH = "/lib/us/loc";

export default async function LocPage({ searchParams }: { searchParams: Promise<SP> }) {
  const q = pick(await searchParams, ALLOWED.loc);
  const [prov, found] = await Promise.all([
    api<Provider>(PATH, undefined, 3600),
    hasAny(q) ? api<{ data: Item[]; meta?: { next_cursor?: string | null } }>(PATH, q) : Promise.resolve(null),
  ]);
  const form = (
    <form className="panel form" action={PATH} method="get" role="search" style={{ marginTop: "1rem" }}>
      <label className="field wide">
        Search the collections
        <input name="q" defaultValue={q.q ?? ""} placeholder="los gatos, gold rush, lincoln…" />
      </label>
      <label className="field">
        Format
        <select name="format" defaultValue={q.format ?? ""}>
          {LOC_FORMATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <div className="actions wide"><button className="btn" type="submit">Search</button></div>
    </form>
  );
  const results = found && (found.ok ? (
    <>
      <h2>Results</h2>
      {found.data.data.length ? (
        <ul className="list">
          {found.data.data.map(d => <DocRow key={d.id} it={d} detail={`${PATH}/items/${encodeURIComponent(d.id)}`} />)}
        </ul>
      ) : <p>Nothing matched.</p>}
      <Pager next={found.data.meta?.next_cursor ? href(PATH, q, { cursor: found.data.meta.next_cursor }) : null} prevHref={q.cursor ? href(PATH, q) : null} />
      <JsonLink path={PATH} params={q} />
    </>
  ) : (
    <ErrorNotice error={found.error}>
      <p><a href={`https://www.loc.gov/search/?q=${encodeURIComponent(q.q ?? "")}`} rel="noopener noreferrer">Search on loc.gov instead</a></p>
    </ErrorNotice>
  ));
  if (!prov.ok) return <>{form}{results}<ErrorNotice error={prov.error} /></>;
  return (
    <ProviderView p={prov.data} back={{ href: "/lib", label: "Libraries" }}>
      {form}
      {results}
    </ProviderView>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ErrorNotice, ItemRow, JsonLink, Notes, Pager, ProviderCard, ResultsHeader } from "@/components/blocks";
import { LocationForm } from "@/components/location-form";
import { ALLOWED, LIB_TYPES, hasAny, href, pick, type SP } from "@/lib/params";
import { api, type NamespacePage, type ResultList } from "@/lib/upstream";

export const metadata: Metadata = {
  title: "Libraries near you",
  description: "Public library branches, bookmobiles and central libraries near a ZIP code or city, plus the Library of Congress collections.",
  alternates: { canonical: "/lib" },
};

export default async function LibPage({ searchParams }: { searchParams: Promise<SP> }) {
  const p = pick(await searchParams, ALLOWED.lib);
  const types = new Set((p.type ?? "").split(",").filter(Boolean));
  const form = (
    <LocationForm action="/lib" values={p}>
      <fieldset className="checks">
        <legend>Kind</legend>
        {LIB_TYPES.map(([v, l]) => (
          <label key={v}><input type="checkbox" name="type" value={v} defaultChecked={types.has(v)} /> {l}</label>
        ))}
      </fieldset>
    </LocationForm>
  );

  if (!hasAny(p)) {
    const ns = await api<NamespacePage>("/lib", undefined, 3600);
    return (
      <>
        <h1>Libraries</h1>
        <p className="lede">Public library branches near you, from the national Public Libraries Survey, and the Library of Congress digital collections.</p>
        {form}
        <h2>Collections and directories</h2>
        {ns.ok ? <ul className="grid">{ns.data.providers.map(pr => <ProviderCard key={pr.id} p={pr} />)}</ul> : <ErrorNotice error={ns.error} />}
        <p><Link href="/lib/us/loc">Search the Library of Congress</Link></p>
      </>
    );
  }

  const r = await api<ResultList>("/lib", p);
  const nextCursor = r.ok ? r.data.meta?.next_cursor : null;
  return (
    <>
      <h1>Libraries</h1>
      {form}
      {!r.ok ? (
        <ErrorNotice error={r.error} />
      ) : (
        <>
          <ResultsHeader meta={r.data.meta} count={r.data.data.length} noun="Libraries" />
          {r.data.data.length ? (
            <ul className="list">{r.data.data.map(it => <ItemRow key={it.id} it={it} />)}</ul>
          ) : (
            <p>No libraries in that radius. Try a wider radius.</p>
          )}
          <Pager next={nextCursor ? href("/lib", p, { cursor: nextCursor }) : null} prevHref={p.cursor ? href("/lib", p) : null} />
          <Notes warnings={r.data.warnings} sources={r.data.sources} />
          <JsonLink path="/lib" params={p} />
        </>
      )}
    </>
  );
}

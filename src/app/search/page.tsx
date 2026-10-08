import type { Metadata } from "next";
import Link from "next/link";
import { ErrorNotice, ItemRow, JsonLink, Notes, ProviderCard, ResultsHeader } from "@/components/blocks";
import { LocationForm } from "@/components/location-form";
import { ALLOWED, hasAny, href, pick, type SP } from "@/lib/params";
import { api, type ResultList } from "@/lib/upstream";

export const metadata: Metadata = {
  title: "Search near a place",
  description: "Libraries, schools, colleges and government services near a ZIP code or city.",
  alternates: { canonical: "/search" },
};

const NAMESPACE_OPTIONS = [
  ["all", "Everything"],
  ["lib", "Libraries"],
  ["edu", "Schools and colleges"],
  ["gov", "Government services"],
];

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const p = pick(await searchParams, ALLOWED.search);
  const form = (
    <LocationForm action="/search" values={p}>
      <label className="field">
        Show
        <select name="namespace" defaultValue={p.namespace ?? "all"}>
          {NAMESPACE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
    </LocationForm>
  );
  if (!hasAny(p)) {
    return (
      <>
        <h1>Search near a place</h1>
        <p className="lede">Libraries, schools, colleges and government services near a ZIP code or city.</p>
        {form}
      </>
    );
  }
  const r = await api<ResultList>("/search", p);
  const loc = { ...p };
  delete loc.namespace;
  delete loc.limit;
  return (
    <>
      <h1>Search</h1>
      {form}
      {!r.ok ? (
        <ErrorNotice error={r.error} />
      ) : (
        <>
          <ResultsHeader meta={r.data.meta} count={r.data.data.length} noun="Places" />
          {r.data.data.length ? (
            <ul className="list">{r.data.data.map(it => <ItemRow key={it.id} it={it} />)}</ul>
          ) : (
            p.namespace !== "gov" && <p>No libraries or schools in that radius. Try a wider radius.</p>
          )}
          {p.namespace !== "gov" && (
            <p className="actions" style={{ marginTop: "1rem" }}>
              <Link className="btn secondary" href={href("/lib", loc)}>All libraries here</Link>
              <Link className="btn secondary" href={href("/edu", loc)}>All schools and colleges here</Link>
            </p>
          )}
          {r.data.services?.length ? (
            <>
              <h2>Government services</h2>
              <ul className="grid">{r.data.services.map(s => <ProviderCard key={s.id} p={s} />)}</ul>
            </>
          ) : null}
          <Notes warnings={r.data.warnings} sources={r.data.sources} />
          <JsonLink path="/search" params={p} />
        </>
      )}
    </>
  );
}

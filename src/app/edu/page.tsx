import type { Metadata } from "next";
import { ErrorNotice, ItemRow, JsonLink, Notes, Pager, ProviderCard, ResultsHeader } from "@/components/blocks";
import { LocationForm } from "@/components/location-form";
import { ALLOWED, EDU_TYPES, hasAny, href, pick, type SP } from "@/lib/params";
import { api, type NamespacePage, type ResultList } from "@/lib/upstream";

export const metadata: Metadata = {
  title: "Schools and colleges near you",
  description: "Public preschools, K-12 schools, community colleges and universities near a ZIP code or city, with grades and districts.",
  alternates: { canonical: "/edu" },
};

export default async function EduPage({ searchParams }: { searchParams: Promise<SP> }) {
  const p = pick(await searchParams, ALLOWED.edu);
  const types = new Set((p.type ?? "").split(",").filter(Boolean));
  const form = (
    <LocationForm action="/edu" values={p}>
      <fieldset className="checks">
        <legend>Level</legend>
        {EDU_TYPES.map(([v, l]) => (
          <label key={v}><input type="checkbox" name="type" value={v} defaultChecked={types.has(v)} /> {l}</label>
        ))}
      </fieldset>
      <label className="field">
        Charter schools
        <select name="charter" defaultValue={p.charter ?? ""}>
          <option value="">Include</option>
          <option value="true">Only charter</option>
          <option value="false">Exclude charter</option>
        </select>
      </label>
    </LocationForm>
  );

  if (!hasAny(p)) {
    const ns = await api<NamespacePage>("/edu", undefined, 3600);
    return (
      <>
        <h1>Schools and colleges</h1>
        <p className="lede">Public schools from the NCES Common Core of Data and public colleges from IPEDS, measured from where you are.</p>
        {form}
        {ns.ok ? (
          <>
            <h2>Directories</h2>
            <ul className="grid">{ns.data.providers.map(pr => <ProviderCard key={pr.id} p={pr} />)}</ul>
          </>
        ) : <ErrorNotice error={ns.error} />}
      </>
    );
  }

  const r = await api<ResultList>("/edu", p);
  const nextCursor = r.ok ? r.data.meta?.next_cursor : null;
  return (
    <>
      <h1>Schools and colleges</h1>
      {form}
      {!r.ok ? (
        <ErrorNotice error={r.error} />
      ) : (
        <>
          <ResultsHeader meta={r.data.meta} count={r.data.data.length} noun="Schools and colleges" />
          {r.data.data.length ? (
            <ul className="list">{r.data.data.map(it => <ItemRow key={it.id} it={it} />)}</ul>
          ) : (
            <p>Nothing matched in that radius. Try a wider radius or fewer levels.</p>
          )}
          <Pager next={nextCursor ? href("/edu", p, { cursor: nextCursor }) : null} prevHref={p.cursor ? href("/edu", p) : null} />
          <div className="notice info"><p>A nearby school is not necessarily your assigned school. Attendance boundaries and district rules decide that; confirm with the district.</p></div>
          <Notes warnings={r.data.warnings} sources={r.data.sources} />
          <JsonLink path="/edu" params={p} />
        </>
      )}
    </>
  );
}

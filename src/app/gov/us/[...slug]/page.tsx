import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ErrorNotice, JsonLink, Pager } from "@/components/blocks";
import { DocRow, ProviderView } from "@/components/provider-view";
import { ALLOWED, hasAny, href, pick, type SP } from "@/lib/params";
import { api, type Item, type Provider } from "@/lib/upstream";

type Props = { params: Promise<{ slug: string[] }>; searchParams: Promise<SP> };

// /gov/us/irs, /gov/us/data, /gov/us/ca/{bizfile,ftb,dmv,edd}
const SLUG = /^[a-z0-9-]+$/;
const load = cache((path: string) => api<Provider>(path, undefined, 3600));

async function pathOf(params: Props["params"]): Promise<string | null> {
  const { slug } = await params;
  if (!slug.length || slug.length > 3 || !slug.every(s => SLUG.test(s))) return null;
  return `/gov/us/${slug.join("/")}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = await pathOf(params);
  if (!path) return {};
  const r = await load(path);
  if (!r.ok) return { title: "Government service" };
  return {
    title: r.data.name,
    description: `${r.data.name}: the official way in, and what Datamart can do for you there today.`,
    alternates: { canonical: path },
  };
}

export default async function GovProviderPage({ params, searchParams }: Props) {
  const path = await pathOf(params);
  if (!path) notFound();
  const r = await load(path);
  if (!r.ok) {
    if (r.status === 404 || r.error.code === "not_found") notFound();
    return <ErrorNotice error={r.error} />;
  }
  const back = { href: "/gov", label: "Government services" };
  if (r.data.id !== "us.gsa.datagov") return <ProviderView p={r.data} back={back}><JsonLink path={path} /></ProviderView>;

  // Data.gov: dataset search on its own page.
  const q = pick(await searchParams, ALLOWED.datagov);
  const found = hasAny(q) ? await api<{ data: Item[]; meta?: { next_cursor?: string | null; total?: number } }>(path, q) : null;
  return (
    <ProviderView p={r.data} back={back}>
      <form className="panel form" action={path} method="get" role="search" style={{ marginTop: "1rem" }}>
        <label className="field wide">
          Search datasets
          <input name="q" defaultValue={q.q ?? ""} placeholder="public libraries, school enrollment, air quality…" />
        </label>
        <div className="actions wide"><button className="btn" type="submit">Search Data.gov</button></div>
      </form>
      {found && (found.ok ? (
        <>
          <h2>Datasets</h2>
          {found.data.data.length ? <ul className="list">{found.data.data.map(d => <DocRow key={d.id} it={d} />)}</ul> : <p>No datasets matched.</p>}
          <Pager next={found.data.meta?.next_cursor ? href(path, q, { cursor: found.data.meta.next_cursor }) : null} prevHref={q.cursor ? href(path, q) : null} />
          <JsonLink path={path} params={q} />
        </>
      ) : <ErrorNotice error={found.error} />)}
    </ProviderView>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ErrorNotice, Notes } from "@/components/blocks";
import { safeUrl } from "@/lib/params";
import { api, type Item, type Source } from "@/lib/upstream";

type Params = { params: Promise<{ id: string }> };
type ItemResponse = { data: Item | Item[]; warnings?: string[]; sources?: Source[] };

const load = cache((id: string) => api<ItemResponse>(`/lib/us/loc/items/${encodeURIComponent(id)}`, undefined, 21600));
const one = (d: Item | Item[]) => (Array.isArray(d) ? d[0] : d);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const id = decodeURIComponent((await params).id);
  const r = await load(id);
  const it = r.ok ? one(r.data.data) : undefined;
  return it ? { title: it.title ?? "Library of Congress item", alternates: { canonical: `/lib/us/loc/items/${encodeURIComponent(id)}` } } : { title: "Library of Congress item" };
}

export default async function LocItemPage({ params }: Params) {
  const id = decodeURIComponent((await params).id);
  const back = <p className="crumbs"><Link href="/lib/us/loc">Library of Congress</Link></p>;
  const r = await load(id);
  if (!r.ok) {
    if (r.status === 404 || r.error.code === "not_found") notFound();
    return (
      <>
        {back}
        <ErrorNotice error={r.error}>
          <p><a href={`https://www.loc.gov/item/${encodeURIComponent(id)}/`} rel="noopener noreferrer">Open this item on loc.gov</a></p>
        </ErrorNotice>
      </>
    );
  }
  const it = one(r.data.data);
  if (!it) notFound();
  const url = safeUrl(it.url);
  const image = safeUrl(it.image_url);
  const subjects = (it.subjects as string[] | undefined) ?? [];
  return (
    <>
      {back}
      <h1>{it.title ?? id}</h1>
      {it.date && <p className="lede">{it.date}</p>}
      <div className="split">
        <section>
          {it.description && <p>{String(it.description)}</p>}
          {subjects.length > 0 && (
            <div className="badges">{subjects.map(s => <span key={s} className="badge">{s}</span>)}</div>
          )}
          {it.access_restricted === true && <div className="notice warn"><p>Access to this item is restricted. See the Library of Congress record for rights and access.</p></div>}
          {url && <p style={{ marginTop: "1rem" }}><a className="btn" href={url} rel="noopener noreferrer">View at the Library of Congress</a></p>}
        </section>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {image && <aside><img src={image} alt="" style={{ maxWidth: "100%", borderRadius: 8 }} loading="lazy" /></aside>}
      </div>
      <Notes warnings={r.data.warnings} sources={r.data.sources} />
    </>
  );
}

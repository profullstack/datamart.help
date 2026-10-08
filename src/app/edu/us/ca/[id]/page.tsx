import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ErrorNotice, addressLine, kindLabel } from "@/components/blocks";
import { PlaceDetail } from "@/components/place-detail";
import { api, type ResultList } from "@/lib/upstream";

type Params = { params: Promise<{ id: string }> };

const load = cache((id: string) => api<ResultList>(`/edu/us/ca/${encodeURIComponent(id)}`, undefined, 3600));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const id = decodeURIComponent((await params).id);
  const r = await load(id);
  const it = r.ok ? r.data.data[0] : undefined;
  if (!it) return { title: "School" };
  return {
    title: it.name,
    description: `${it.name}, ${kindLabel(it).toLowerCase()}: ${addressLine(it)}.`,
    alternates: { canonical: `/edu/us/ca/${encodeURIComponent(it.id)}` },
  };
}

export default async function SchoolPage({ params }: Params) {
  const id = decodeURIComponent((await params).id);
  const r = await load(id);
  if (!r.ok) {
    if (r.status === 404 || r.error.code === "not_found") notFound();
    return <ErrorNotice error={r.error} />;
  }
  const it = r.data.data[0];
  if (!it) notFound();
  return <PlaceDetail it={it} list={r.data} back={{ href: "/edu", label: "Schools and colleges" }} />;
}

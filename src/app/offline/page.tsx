import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

export default function OfflinePage() {
  return (
    <>
      <h1>You are offline</h1>
      <p className="lede">Datamart needs a connection to look things up. Pages you opened before may still work.</p>
      <p><Link className="btn" href="/">Try again</Link></p>
    </>
  );
}

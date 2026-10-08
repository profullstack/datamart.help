import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <h1>Not found</h1>
      <p className="lede">That page or record is not in Datamart.</p>
      <p className="actions">
        <Link className="btn" href="/search">Search near a place</Link>
        <Link className="btn secondary" href="/">Home</Link>
      </p>
    </>
  );
}

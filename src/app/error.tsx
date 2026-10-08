"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <h1>Something went wrong</h1>
      <p className="lede">This page could not be loaded. Trying again usually works.</p>
      <p className="actions">
        <button className="btn" type="button" onClick={reset}>Try again</button>
        <a className="btn secondary" href="/">Home</a>
      </p>
    </>
  );
}

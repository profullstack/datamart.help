"use client";

import { useState } from "react";

// Optional: the browser's location becomes lat/lng in the URL. The position goes only
// into the search link; nothing is stored.
export function LocateButton({ action, radius }: { action: string; radius?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "denied" | "unsupported">("idle");
  const go = () => {
    if (!("geolocation" in navigator)) return setState("unsupported");
    setState("busy");
    navigator.geolocation.getCurrentPosition(
      pos => {
        const p = new URLSearchParams({
          lat: pos.coords.latitude.toFixed(4),
          lng: pos.coords.longitude.toFixed(4),
          radius_miles: radius || "10",
        });
        window.location.assign(`${action}?${p}`);
      },
      () => setState("denied"),
      { timeout: 15_000, maximumAge: 600_000 }
    );
  };
  return (
    <span className="actions">
      <button type="button" className="btn secondary" onClick={go} disabled={state === "busy"}>
        {state === "busy" ? "Finding you…" : "Use my location"}
      </button>
      {state === "denied" && <span className="small muted" role="status">Location was not shared. Enter a ZIP code instead.</span>}
      {state === "unsupported" && <span className="small muted" role="status">This browser cannot share a location.</span>}
    </span>
  );
}

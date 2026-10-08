"use client";

import { useEffect } from "react";

// A service worker with a fetch handler is what makes Android install the PWA instead
// of saving a bookmark. It only caches the app shell and an offline page.
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

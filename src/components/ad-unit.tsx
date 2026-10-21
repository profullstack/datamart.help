"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** CrawlProof ad slot for datamart.help. Manage it at https://crawlproof.com/ads/slots */
const AD_SLOT = "04392e64-733a-48dd-b17b-c4dc9eb3a399";

declare global {
  interface Window {
    crawlproofAds?: { scan: () => void };
  }
}

/**
 * One low-profile CrawlProof text-link unit at the top of the content, on every page
 * but the homepage. The aside is server-rendered without data-slot, so ad.js's own
 * DOMContentLoaded pass skips it; on mount we set text_link + the slot and ask ad.js to scan (retrying briefly
 * until it has loaded, and giving up so an ad blocker leaves no timer running).
 * It stays zero-height until ad.js marks it data-cp-filled.
 */
export function AdUnit() {
  const pathname = usePathname() ?? "/";
  if (pathname === "/") return null;
  // Keyed by path so each client-side navigation gets a fresh unit.
  return <AdSlot key={pathname} />;
}

function AdSlot() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.format = "text_link";
    el.dataset.slot = AD_SLOT;

    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      if (window.crawlproofAds) return window.crawlproofAds.scan();
      if (++tries <= 25) timer = setTimeout(tick, 200);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return <aside ref={ref} className="ad-unit" data-cp-ad="" aria-label="Advertisement" />;
}

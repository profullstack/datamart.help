"use client";

import { useEffect, useRef } from "react";

/** CrawlProof ad slot for datamart.help. Manage it at https://crawlproof.com/ads/slots */
const AD_SLOT = "04392e64-733a-48dd-b17b-c4dc9eb3a399";

/** 728px banner plus the .wrap gutters; anything narrower gets the 300x250 rectangle. */
const LEADERBOARD_QUERY = "(min-width: 760px)";

declare global {
  interface Window {
    crawlproofAds?: { scan: () => void };
  }
}

/**
 * One CrawlProof unit above the footer. The aside is server-rendered without
 * data-slot, so ad.js's own DOMContentLoaded pass skips it; the format is picked
 * from the real viewport on mount, then we ask ad.js to scan (retrying briefly
 * until it has loaded, and giving up so an ad blocker leaves no timer running).
 * It stays zero-height until ad.js marks it data-cp-filled.
 */
export function AdUnit() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.format = window.matchMedia(LEADERBOARD_QUERY).matches ? "banner_728x90" : "banner_300x250";
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

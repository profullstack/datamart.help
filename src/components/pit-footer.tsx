const PIT_FOOTER_URL = "https://pit.world/snippets/footer.html?site=datamart.help";

/**
 * The pit.world network footer, fetched server side (cached an hour, 3s timeout).
 * Any failure renders nothing, so pit.world being down never breaks a page.
 */
export async function PitFooter() {
  try {
    const res = await fetch(PIT_FOOTER_URL, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const html = await res.text();
    if (!html.includes("data-pit-footer")) return null;
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return null;
  }
}

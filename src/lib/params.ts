// Which query parameters each page forwards to Datamart. Anything else in the URL is
// dropped, so a shareable link carries only public, non-sensitive criteria (PRD 5.3).

export type SP = Record<string, string | string[] | undefined>;

const LOCATION = ["zip", "lat", "lng", "address", "city", "state", "country", "radius_miles"];

export const ALLOWED = {
  search: [...LOCATION, "q", "namespace", "limit", "strict"],
  lib: [...LOCATION, "q", "type", "system", "strict", "include_unresolved", "limit", "cursor"],
  edu: [...LOCATION, "q", "type", "sector", "charter", "district", "strict", "include_unresolved", "limit", "cursor"],
  gov: ["q"],
  datagov: ["q", "org_slug", "org_type", "sort", "keyword", "per_page", "cursor"],
  loc: ["q", "format", "collection", "per_page", "cursor"],
} as const;

/** One value per key (the first), limited to the allowed keys and to 200 characters. */
export function pick(sp: SP, allowed: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of allowed) {
    const v = sp[k];
    const s = Array.isArray(v) ? v.join(",") : v;
    if (typeof s === "string" && s.trim() !== "") out[k] = s.trim().slice(0, 200);
  }
  return out;
}

export function hasLocation(p: Record<string, string>): boolean {
  return Boolean(p.zip || (p.lat && p.lng) || p.address || (p.city && p.state));
}

export function hasAny(p: Record<string, string>): boolean {
  return Object.keys(p).length > 0;
}

/** The same page with one parameter changed (undefined removes it); cursor resets unless set. */
export function href(path: string, p: Record<string, string>, change: Record<string, string | undefined> = {}): string {
  const next: Record<string, string> = { ...p };
  if (!("cursor" in change)) delete next.cursor;
  for (const [k, v] of Object.entries(change)) {
    if (v === undefined || v === "") delete next[k];
    else next[k] = v;
  }
  const s = new URLSearchParams(next).toString();
  return s ? `${path}?${s}` : path;
}

/** Only http(s) URLs and site-relative paths are ever rendered as links. */
export function safeUrl(u: unknown): string | null {
  if (typeof u !== "string") return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/") && !u.startsWith("//")) return u;
  return null;
}

export const LIB_TYPES = [
  ["central", "Central"],
  ["branch", "Branch"],
  ["bookmobile", "Bookmobile"],
  ["books_by_mail", "Books by mail"],
  ["other", "Other"],
] as const;

export const EDU_TYPES = [
  ["preschool", "Preschool"],
  ["elementary", "Elementary"],
  ["middle", "Middle"],
  ["high", "High school"],
  ["adult", "Adult education"],
  ["vocational", "Vocational"],
  ["college", "Community college"],
  ["university", "University"],
] as const;

export const LOC_FORMATS = [
  ["", "Any format"],
  ["books", "Books"],
  ["maps", "Maps"],
  ["photos", "Photos"],
  ["newspapers", "Newspapers"],
  ["manuscripts", "Manuscripts"],
  ["audio", "Audio"],
  ["film-and-videos", "Film and video"],
  ["notated-music", "Sheet music"],
  ["legislation", "Legislation"],
  ["web-archives", "Web archives"],
] as const;

export const RADII = ["1", "3", "5", "10", "20", "50"];

export const STATE_LABEL: Record<string, string> = {
  directory_only: "Directory and official links",
  public_read: "Public data, read live",
  authenticated_read: "Your account, read with your permission",
  prepare: "Prepares paperwork",
  assisted_action: "Assisted action",
  verified_action: "Verified action",
  unsupported: "Not supported yet",
  configuration_required: "Not configured yet",
  not_available: "Not available yet",
};

export function stateLabel(s?: string): string {
  return (s && STATE_LABEL[s]) ?? (s ? s.replace(/_/g, " ") : "");
}

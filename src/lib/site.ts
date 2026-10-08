export const SITE = "https://datamart.help";

export const DISCLOSURE =
  "Datamart is operated by Profullstack, Inc. It is not a government service and is not affiliated with, endorsed by, or acting for any agency or library listed. Always confirm with the official source.";

export const COVERAGE = "Local directories cover 75 miles around Los Gatos, CA (ZIP 95032) today.";

export const MCP_ENDPOINTS = [
  ["/search/mcp", "Everything near a place"],
  ["/gov/mcp", "Government services"],
  ["/gov/us/data/mcp", "Data.gov catalog"],
  ["/lib/mcp", "Libraries"],
  ["/lib/us/loc/mcp", "Library of Congress"],
  ["/edu/mcp", "Schools and colleges"],
  ["/contracts/mcp", "Procurement sources"],
] as const;

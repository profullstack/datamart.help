import { iconResponse } from "@/lib/icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds the corners itself, so the tile fills the square.
export default function AppleIcon() {
  return iconResponse(180, 1);
}

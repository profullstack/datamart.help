import { ImageResponse } from "next/og";

// The app mark: a rounded tile with a "D". `inset` shrinks it into the safe zone for
// maskable icons. Satori needs display:flex on any element with more than one child.
export function iconResponse(size: number, inset = 0) {
  const tile = size - inset * 2;
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: inset ? "#0f6b5c" : "transparent" }}>
        <div
          style={{
            width: tile,
            height: tile,
            borderRadius: inset ? 0 : Math.round(tile * 0.22),
            background: "#0f6b5c",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: Math.round(tile * 0.62),
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          D
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}

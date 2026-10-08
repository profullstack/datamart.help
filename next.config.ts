import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // The repo is the workspace root (a stray lockfile in $HOME otherwise confuses Turbopack).
  turbopack: { root: process.cwd() },
  // Short aliases redirect to the country-qualified canonical URLs (PRD 5.1).
  async redirects() {
    return [
      ["/gov/irs", "/gov/us/irs"],
      ["/gov/data", "/gov/us/data"],
      ["/gov/bizfile", "/gov/us/ca/bizfile"],
      ["/gov/ftb", "/gov/us/ca/ftb"],
      ["/gov/dmv", "/gov/us/ca/dmv"],
      ["/gov/edd", "/gov/us/ca/edd"],
      ["/lib/loc", "/lib/us/loc"],
    ].map(([source, destination]) => ({ source, destination, permanent: true }));
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};

export default nextConfig;

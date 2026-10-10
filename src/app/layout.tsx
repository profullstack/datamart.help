import type { Metadata, Viewport } from "next";
import { Footer } from "@profullstack/footer/react";
import Link from "next/link";
import { RegisterServiceWorker } from "@/components/register-sw";
import { DISCLOSURE } from "@/lib/site";
import "./globals.css";

// Pages prerender at build; revalidating hourly lets the shared footer pick up a new
// @profullstack/footer template (served from jsDelivr @latest) without a redeploy.
export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: new URL("https://datamart.help"),
  title: { default: "Datamart: public services near you", template: "%s · Datamart" },
  description:
    "Find public libraries, schools, colleges and government services near a ZIP code, with the source of every fact. For people and their agents: web, API and MCP.",
  applicationName: "Datamart",
  manifest: "/manifest.webmanifest",
  openGraph: { siteName: "Datamart", type: "website", locale: "en_US" },
  appleWebApp: { capable: true, title: "Datamart", statusBarStyle: "default" },
  // Safari reads only the prefixed tag; Next emits the unprefixed one.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f6b5c" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1214" },
  ],
};

const NAV = [
  ["/search", "Search"],
  ["/gov", "Government"],
  ["/lib", "Libraries"],
  ["/edu", "Education"],
  ["/contracts", "Contracts"],
  ["/developers", "Developers"],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* CrawlProof stats: a plain async tag so it is in the served HTML (next/script afterInteractive is not). */}
        <script data-site="6be9abdb-fd93-4756-bbf4-3ebefc3117c3" src="https://crawlproof.com/stats.js" async></script>
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand" aria-label="Datamart home">
              <span className="brand-mark" aria-hidden="true">D</span>
              datamart.help
            </Link>
            <nav className="nav" aria-label="Main">
              {NAV.map(([href, label]) => (
                <Link key={href} href={href}>{label}</Link>
              ))}
            </nav>
          </div>
        </header>
        <main id="main" className="wrap">{children}</main>
        <div className="site-footer">
          <div className="wrap">
            <p>{DISCLOSURE}</p>
          </div>
        </div>
        <Footer
          site="https://datamart.help/"
          links={[
            { label: "About", href: "/about" },
            { label: "API and MCP", href: "/developers" },
            { label: "Finance", href: "/finance" },
            { label: "Source", href: "https://github.com/profullstack/datamart.help" },
          ]}
        />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}

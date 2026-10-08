import type { Metadata } from "next";
import Link from "next/link";
import { COVERAGE, DISCLOSURE } from "@/lib/site";
import { STATE_LABEL } from "@/lib/params";

export const metadata: Metadata = {
  title: "About",
  description: "What Datamart is, where its data comes from, and what it will and will not do for you.",
  alternates: { canonical: "/about" },
};

const STATES = ["directory_only", "public_read", "authenticated_read", "prepare", "assisted_action", "verified_action"];

export default function AboutPage() {
  return (
    <>
      <h1>About Datamart</h1>
      <p className="lede">One place for people and their agents to find public services, read public records, and eventually prepare and complete the paperwork, without pretending a link is an integration.</p>

      <h2>Where the data comes from</h2>
      <ul className="notes">
        <li>Libraries: the Institute of Museum and Library Services Public Libraries Survey (FY2024).</li>
        <li>Schools: the NCES Common Core of Data with NCES EDGE geocodes; colleges: IPEDS.</li>
        <li>Locations: U.S. Census Bureau ZIP code tabulation areas and the Census geocoder.</li>
        <li>Collections and datasets: the Library of Congress and Data.gov APIs, read live.</li>
        <li>{COVERAGE}</li>
      </ul>

      <h2>What each label means</h2>
      <div className="table-scroll">
        <table className="caps">
          <tbody>
            {STATES.map(s => (
              <tr key={s}><td><span className="badge state">{STATE_LABEL[s]}</span></td><td><code>{s}</code></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted small">A service is listed with the highest level Datamart actually supports there today, and each operation is listed separately on its page.</p>

      <h2>What Datamart will not do</h2>
      <ul className="notes">
        <li>Claim to be, or speak for, a government agency, library or school.</li>
        <li>Sign, file, pay, apply or submit anything without your approval and the right authority.</li>
        <li>Ask for your bank password or MFA codes, or publish anything about children.</li>
        <li>Get around a source&apos;s rate limits or bot checks.</li>
      </ul>

      <p>{DISCLOSURE}</p>
      <p><Link href="/developers">API and MCP</Link> · <a href="https://github.com/profullstack/datamart.help">Source code</a></p>
    </>
  );
}

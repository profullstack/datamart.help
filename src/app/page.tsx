import Link from "next/link";
import { LocationForm } from "@/components/location-form";
import { COVERAGE } from "@/lib/site";

const AREAS = [
  { href: "/gov", title: "Government services", text: "IRS, California FTB, DMV, EDD and BizFile, plus the Data.gov catalog: official links and what each one supports." },
  { href: "/lib", title: "Libraries", text: "Public library branches near you, and the Library of Congress digital collections." },
  { href: "/edu", title: "Schools and colleges", text: "Public K-12 schools, community colleges and universities, with grades and districts." },
  { href: "/contracts", title: "Contracts", text: "Where federal, state, county and city governments post work, in one list." },
  { href: "/finance", title: "Your finances", text: "Your own accounts through CoinPay, private to you. Coming later." },
  { href: "/developers", title: "For agents and code", text: "Every page is also JSON, with a versioned API and MCP endpoints for agents." },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Public services near you, with the source of every fact.</h1>
        <p className="lede">
          Find libraries, schools, colleges and government services in one place. Every listing links to the official
          source and says plainly what Datamart can and cannot do for you there.
        </p>
        <LocationForm action="/search">
          <label className="field">
            Show
            <select name="namespace" defaultValue="all">
              <option value="all">Everything</option>
              <option value="lib">Libraries</option>
              <option value="edu">Schools and colleges</option>
              <option value="gov">Government services</option>
            </select>
          </label>
        </LocationForm>
        <p className="muted small">{COVERAGE}</p>
      </section>

      <h2>Browse</h2>
      <ul className="grid">
        {AREAS.map(a => (
          <li key={a.href} className="card">
            <Link href={a.href}>{a.title}</Link>
            <span className="muted small">{a.text}</span>
          </li>
        ))}
      </ul>

      <h2>How Datamart works</h2>
      <ul className="notes">
        <li>Every result names its source, when it was retrieved, and how distance was measured.</li>
        <li>Each service is labelled with what is actually possible today: a directory link, a live read, or more. A link is never presented as an integration.</li>
        <li>Datamart does not sign, file, pay or apply for you without your approval and the right authority.</li>
      </ul>
    </>
  );
}

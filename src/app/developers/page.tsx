import type { Metadata } from "next";
import { MCP_ENDPOINTS, SITE } from "@/lib/site";
import { api } from "@/lib/upstream";

export const metadata: Metadata = {
  title: "API and MCP",
  description: "Datamart for code and agents: every page as JSON, a versioned API, and MCP endpoints over Streamable HTTP.",
  alternates: { canonical: "/developers" },
};

type Tool = { name: string; description?: string; namespaces?: string[] };

export default async function DevelopersPage() {
  const tools = await api<{ tools: Tool[] }>("/api/v1/tools", undefined, 3600);
  return (
    <>
      <h1>For code and agents</h1>
      <p className="lede">The same answers as the web pages, as structured data. No key, no account; every tool is a read-only public lookup.</p>

      <h2>Every page is JSON</h2>
      <p>Ask any page URL for JSON with an <code>Accept: application/json</code> header, or add <code>raw=1</code>.</p>
      <pre>{`curl -s "${SITE}/lib?zip=95030&radius_miles=3" -H 'accept: application/json'
curl -s "${SITE}/edu?zip=95032&type=high&radius_miles=10&raw=1"
curl -s "${SITE}/gov/us/ca/ftb" -H 'accept: application/json'`}</pre>

      <h2>Versioned API</h2>
      <pre>{`GET  ${SITE}/api/v1/tools                 every tool and its JSON Schema
GET  ${SITE}/api/v1/tools/:name?…         run a tool with query parameters
POST ${SITE}/api/v1/tools/:name           run a tool with a JSON body
GET  ${SITE}/api/v1/providers[/:id]       providers and their capabilities
GET  ${SITE}/api/v1/resources/:id         one library, school or service
GET  ${SITE}/api/v1/health                provider configuration and health`}</pre>

      <h2>MCP</h2>
      <p>Streamable HTTP (protocol 2025-11-25). Point any MCP client at one of these:</p>
      <ul className="notes">
        {MCP_ENDPOINTS.map(([path, label]) => (
          <li key={path}><code>{SITE}{path}</code>: {label}</li>
        ))}
      </ul>
      <pre>{`curl -s -X POST ${SITE}/lib/mcp \\
  -H 'content-type: application/json' \\
  -H 'accept: application/json, text/event-stream' \\
  -H 'mcp-protocol-version: 2025-11-25' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"libraries_search","arguments":{"zip":"95030","radius_miles":3}}}'`}</pre>

      <h2>Location</h2>
      <p>Give one of <code>zip</code>, <code>lat</code> + <code>lng</code>, <code>address</code> (with <code>zip</code> or <code>city</code> + <code>state</code>), or <code>city</code> + <code>state</code>. Distances are straight-line miles. With no location, results use ZIP 95032 and say so.</p>

      <h2>Tools</h2>
      {tools.ok ? (
        <div className="table-scroll">
          <table className="caps">
            <thead><tr><th scope="col">Tool</th><th scope="col">Does</th></tr></thead>
            <tbody>
              {tools.data.tools.map(t => (
                <tr key={t.name}><td><code>{t.name}</code></td><td>{t.description}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="muted">The tool list is not available right now; see <a href="/api/v1/tools">/api/v1/tools</a>.</p>}

      <h2>Limits</h2>
      <p>Datamart stays inside each source&apos;s published limits: it caches answers, spends a per-minute budget per source, and pauses a source for an hour when it says slow down. A paused source returns a typed error with <code>retry_after_seconds</code>, never an empty result.</p>
    </>
  );
}

// The dev2 deploy and the Docker healthcheck probe this; it never calls the upstream.
export const dynamic = "force-static";

export function GET() {
  return new Response("ok\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
}

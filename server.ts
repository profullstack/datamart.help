// Serves index.html and nothing else. /healthz is for the dev2 deploy and the Docker healthcheck.
const page = Bun.file(new URL("./index.html", import.meta.url));
const port = Number(process.env.PORT ?? 3000);

Bun.serve({
  port,
  hostname: "0.0.0.0",
  fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname === "/healthz") return new Response("ok\n");
    if (pathname === "/" || pathname === "/index.html") {
      return new Response(page, { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    return new Response("Not found\n", { status: 404 });
  },
});
console.log(`datamart.help on :${port}`);

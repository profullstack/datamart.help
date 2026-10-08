import { iconResponse } from "@/lib/icon";

export const dynamic = "force-static";

const ICONS: Record<string, [number, number]> = {
  "192": [192, 0],
  "512": [512, 0],
  "512-maskable": [512, 80],
};

export function generateStaticParams() {
  return Object.keys(ICONS).map(name => ({ name }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const spec = ICONS[(await params).name];
  if (!spec) return new Response("Not found\n", { status: 404 });
  return iconResponse(spec[0], spec[1]);
}

import { preflight, fail } from "@/lib/api";
import { makeExtractHandler, readUrlFromBody } from "@/lib/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const handle = makeExtractHandler({ requireKey: true, cors: true });

export const OPTIONS = preflight;
export async function GET(req: Request) {
  return handle(req, new URL(req.url).searchParams.get("url"));
}
export async function POST(req: Request) {
  try {
    return handle(req, await readUrlFromBody(req));
  } catch (e) {
    return fail(e);
  }
}

import { fail } from "@/lib/api";
import { config } from "@/lib/config";
import { makeExtractHandler, readUrlFromBody } from "@/lib/handlers";

// Same-origin endpoint used by the website UI. No API key is ever sent to or stored in the browser.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const handle = makeExtractHandler({ requireKey: false, cors: false, max: config.webRateMax() });
    return handle(req, await readUrlFromBody(req));
  } catch (e) {
    return fail(e, {}, false);
  }
}

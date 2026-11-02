import { AppError } from "./errors";
import { config } from "./config";
import { fail, guard, json } from "./api";
import { extractMedia } from "@/services/extract";

export function makeExtractHandler(opts: { requireKey: boolean; cors: boolean; max?: number }) {
  return async function handle(req: Request, url: string | null | undefined) {
    let headers: Record<string, string> = {};
    try {
      headers = guard(req, { requireKey: opts.requireKey, max: opts.max });
      if (!url) throw new AppError(400, "MISSING_URL", "Provide a `url` parameter.");
      const info = await extractMedia(url, config.baseUrl(req));
      return json(info, 200, headers, opts.cors);
    } catch (e) {
      return fail(e, headers, opts.cors);
    }
  };
}

export async function readUrlFromBody(req: Request): Promise<string | undefined> {
  const body = await req.json().catch(() => {
    throw new AppError(400, "INVALID_JSON", 'Request body must be valid JSON: {"url": "..."}.');
  });
  return typeof body?.url === "string" ? body.url : undefined;
}

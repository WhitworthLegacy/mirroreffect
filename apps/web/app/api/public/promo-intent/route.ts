import { z } from "zod";
import { gasPost } from "@/lib/gas";

const PromoIntentSchema = z.object({
  request_id: z.string().optional(),
  email: z.string().email(),
  locale: z.enum(["fr", "nl"]).default("fr"),
  payload: z.record(z.string(), z.string()).optional()
});

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const forwardedId = req.headers.get("x-request-id") ?? undefined;
  console.log(`[promo][${requestId}] Received request`, { forwardedId });

  const body = await req.json().catch(() => null);
  const parsed = PromoIntentSchema.safeParse(body);

  if (!parsed.success) {
    console.warn(`[promo][${requestId}] Validation failed`, parsed.error.format());
    return Response.json(
      { error: "invalid_body", requestId, issues: parsed.error.format() },
      { status: 400 }
    );
  }

  const { request_id, email, locale, payload } = parsed.data;
  console.log(`[promo][${requestId}] Valid payload`, { request_id, email, locale });

  const sendAfter = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  try {
    const values = {
      Template: "B2C_PROMO_48H",
      Email: email,
      Locale: locale,
      Payload: JSON.stringify(payload ?? {}),
      "Send After": sendAfter,
      Status: "queued",
      "Created At": new Date().toISOString()
    };

    await gasPost({
      action: "appendRow",
      key: process.env.GAS_KEY,
      data: {
        sheetName: "Notifications",
        values
      }
    });

    console.log(`[promo][${requestId}] GAS appendRow success`, { forwardedId, request_id });
    return Response.json({ queued: true, requestId });
  } catch (error) {
    console.error(`[promo][${requestId}] GAS error`, error);
    return Response.json(
      { error: "internal_error", requestId },
      { status: 500 }
    );
  }
}

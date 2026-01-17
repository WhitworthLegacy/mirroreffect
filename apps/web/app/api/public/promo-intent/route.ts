import { z } from "zod";
import { gasPost } from "@/lib/gas";

const PromoIntentSchema = z.object({
  email: z.string().email(),
  locale: z.enum(["fr", "nl"]).default("fr"),
  payload: z.record(z.string(), z.string()).optional()
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = PromoIntentSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "invalid_body", issues: parsed.error.format() }, { status: 400 });
  }

  const { email, locale, payload } = parsed.data;
  const sendAfter = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  try {
    // GAS returns { success: true } for appendRow (errors throw)
    await gasPost({
      action: "appendRow",
      key: process.env.GAS_KEY,
      data: {
        sheetName: "Notifications",
        values: {
          "Template": "B2C_PROMO_48H",
          "Email": email,
          "Locale": locale,
          "Payload": JSON.stringify(payload ?? {}),
          "Send After": sendAfter,
          "Status": "queued",
          "Created At": new Date().toISOString()
        }
      }
    });

    return Response.json({ queued: true });
  } catch (error) {
    console.error("[promo-intent] Error:", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}

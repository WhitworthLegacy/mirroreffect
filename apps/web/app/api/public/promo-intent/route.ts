import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

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

  const supabase = createSupabaseServerClient();
  const { email, locale, payload } = parsed.data;

  const sendAfter = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  await supabase.from("notification_queue").insert({
    template_key: "B2C_PROMO_48H",
    to_email: email,
    locale,
    payload: payload ?? {},
    send_after: sendAfter,
    status: "queued"
  });

  return Response.json({ queued: true });
}

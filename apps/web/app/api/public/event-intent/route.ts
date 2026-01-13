import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const EventIntentSchema = z.object({
  event_id: z.string().uuid().optional(),
  language: z.enum(["fr", "nl"]).default("fr"),
  client_name: z.string().min(2),
  client_email: z.string().email(),
  client_phone: z.string().min(6),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  address: z.string().min(2),
  pack_code: z.enum(["DISCOVERY", "ESSENTIAL", "PREMIUM"]),
  options: z.array(z.string()).default([]),
  transport_fee_cents: z.number().int().min(0),
  total_cents: z.number().int().min(0),
  deposit_cents: z.number().int().min(0),
  balance_due_cents: z.number().int().min(0)
});

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = EventIntentSchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json({ error: "invalid_body", issues: parsed.error.format() }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const data = parsed.data;

  if (data.event_id) {
    const { error } = await supabase
      .from("events")
      .update({
        language: data.language,
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone,
        event_date: data.event_date,
        address: data.address,
        transport_fee_cents: data.transport_fee_cents,
        total_cents: data.total_cents,
        deposit_cents: data.deposit_cents,
        balance_due_cents: data.balance_due_cents,
        status: "active"
      })
      .eq("id", data.event_id);

    if (error) {
      return Response.json({ error: "event_update_failed" }, { status: 500 });
    }

    return Response.json({ event_id: data.event_id });
  }

  const { data: created, error } = await supabase
    .from("events")
    .insert({
      event_type: "b2c",
      language: data.language,
      client_name: data.client_name,
      client_email: data.client_email,
      client_phone: data.client_phone,
      event_date: data.event_date,
      address: data.address,
      transport_fee_cents: data.transport_fee_cents,
      total_cents: data.total_cents,
      deposit_cents: data.deposit_cents,
      balance_due_cents: data.balance_due_cents,
      status: "active"
    })
    .select("id")
    .single();

  if (error || !created?.id) {
    return Response.json({ error: "event_create_failed" }, { status: 500 });
  }

  return Response.json({ event_id: created.id });
}

import { z } from "zod";
import { gasPost } from "@/lib/gas";
import { generateLeadId, normalizeToFR } from "@/lib/date-utils";

const LeadPayloadSchema = z.object({
  lead_id: z.string().optional(),
  language: z.enum(["fr", "nl"]).default("fr"),
  client_name: z.string().min(1),
  client_email: z.string().email(),
  client_phone: z.string().min(6),
  event_date: z.string().min(1),
  address: z.string().min(2),
  pack_code: z.string().optional(),
  guests: z.string().optional(),
  transport_euros: z.string().optional(),
  total_euros: z.string().optional(),
  deposit_euros: z.string().optional(),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_medium: z.string().optional()
});

function sanitize(value?: string): string {
  return value ? value.trim() : "";
}

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = LeadPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "invalid_body", issues: parsed.error.format() }, { status: 400 });
  }

  const data = parsed.data;
  const leadId = data.lead_id || generateLeadId();
  const eventDateFr = normalizeToFR(data.event_date) || sanitize(data.event_date);

  try {
    const result = await gasPost({
      action: "appendRow",
      key: process.env.GAS_KEY,
      data: {
        sheetName: "Leads",
        values: {
          "Lead ID": leadId,
          "Created At": new Date().toISOString(),
          Step: "5",
          Status: "step5_completed",
          Nom: data.client_name,
          Email: data.client_email,
          Phone: data.client_phone,
          Language: data.language,
          "Date Event": eventDateFr,
          "Lieu Event": data.address,
          Pack: sanitize(data.pack_code),
          "Invités": sanitize(data.guests),
          "Transport (€)": sanitize(data.transport_euros),
          Total: sanitize(data.total_euros),
          Acompte: sanitize(data.deposit_euros),
          "UTM Source": sanitize(data.utm_source),
          "UTM Campaign": sanitize(data.utm_campaign),
          "UTM Medium": sanitize(data.utm_medium)
        }
      }
    });

    if (!result.ok) {
      console.error("[leads] GAS append failed", result.error);
      return Response.json({ error: "sheets_error" }, { status: 500 });
    }

    return Response.json({ lead_id: leadId });
  } catch (error) {
    console.error("[leads] Error:", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}

import { z } from "zod";
import { gasPost } from "@/lib/gas";

const EventIntentSchema = z.object({
  lead_id: z.string().optional(),
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

// Générer un ID unique pour le lead
function generateLeadId(): string {
  return `LEAD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// Convertir cents en euros formaté
function centsToEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = EventIntentSchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json({ error: "invalid_body", issues: parsed.error.format() }, { status: 400 });
  }

  const data = parsed.data;
  const leadId = data.lead_id || generateLeadId();

  try {
    if (data.lead_id) {
      // Update existing lead
      const result = await gasPost({
        action: "updateRowByLeadId",
        key: process.env.GAS_KEY,
        data: {
          sheetName: "Leads",
          leadId: data.lead_id,
          values: {
            "Language": data.language,
            "Nom": data.client_name,
            "Email": data.client_email,
            "Phone": data.client_phone,
            "Date Event": data.event_date,
            "Lieu Event": data.address,
            "Pack": data.pack_code,
            "Options": data.options.join(", "),
            "Transport (€)": centsToEuros(data.transport_fee_cents),
            "Total": centsToEuros(data.total_cents),
            "Acompte": centsToEuros(data.deposit_cents),
            "Solde Restant": centsToEuros(data.balance_due_cents),
            "Updated At": new Date().toISOString()
          }
        }
      });

      if (!result.ok) {
        console.error("[event-intent] Update failed:", result.error);
        return Response.json({ error: "lead_update_failed" }, { status: 500 });
      }

      return Response.json({ lead_id: data.lead_id });
    }

    // Create new lead
    const result = await gasPost({
      action: "appendRow",
      key: process.env.GAS_KEY,
      data: {
        sheetName: "Leads",
        values: {
          "Lead ID": leadId,
          "Type Event": "b2c",
          "Language": data.language,
          "Nom": data.client_name,
          "Email": data.client_email,
          "Phone": data.client_phone,
          "Date Event": data.event_date,
          "Lieu Event": data.address,
          "Pack": data.pack_code,
          "Options": data.options.join(", "),
          "Transport (€)": centsToEuros(data.transport_fee_cents),
          "Total": centsToEuros(data.total_cents),
          "Acompte": centsToEuros(data.deposit_cents),
          "Solde Restant": centsToEuros(data.balance_due_cents),
          "Status": "intent",
          "Created At": new Date().toISOString()
        }
      }
    });

    if (!result.ok) {
      console.error("[event-intent] Create failed:", result.error);
      return Response.json({ error: "lead_create_failed" }, { status: 500 });
    }

    return Response.json({ lead_id: leadId });
  } catch (error) {
    console.error("[event-intent] Error:", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}

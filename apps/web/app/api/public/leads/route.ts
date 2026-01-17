import { z } from "zod";
import { gasPost } from "@/lib/gas";
import { generateLeadId } from "@/lib/date-utils";
import { normalizeDateToISO } from "@/lib/date";

const LeadPayloadSchema = z.object({
  lead_id: z.string().optional(),
  language: z.enum(["fr", "nl"]).default("fr"),
  client_name: z.string().min(1).optional(),
  client_email: z.string().email().optional(),
  client_phone: z.string().min(6).optional(),
  event_date: z.string().optional(),
  address: z.string().min(2).optional(),
  pack_code: z.string().optional(),
  guests: z.string().optional(),
  transport_euros: z.string().optional(),
  total_euros: z.string().optional(),
  deposit_euros: z.string().optional(),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_medium: z.string().optional(),
  step: z.string().optional(),
  status: z.string().optional(),
  // CTA fields
  cta_id: z.string().optional(),
  cta_label: z.string().optional(),
  cta_value: z.string().optional(),
  updated_at: z.string().optional()
});

function sanitize(value?: string): string {
  return value ? value.trim() : "";
}

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = LeadPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[leads] Validation error:", parsed.error.format());
    }
    return Response.json({ error: "invalid_body", issues: parsed.error.format() }, { status: 400 });
  }

  const data = parsed.data;

  // Si c'est un CTA update uniquement (pas de client_name requis)
  if (data.cta_id && data.lead_id) {
    const leadId = data.lead_id;
    try {
      await gasPost({
        action: "updateRowByLeadId",
        key: process.env.GAS_KEY,
        data: {
          sheetName: "Leads",
          leadId,
          values: {
            "Last CTA": sanitize(data.cta_id),
            "Last CTA Label": sanitize(data.cta_label),
            "Last CTA Value": sanitize(data.cta_value),
            "Last CTA At": sanitize(data.updated_at) || new Date().toISOString()
          }
        }
      });

      if (process.env.NODE_ENV !== "production") {
        console.log(`[leads] CTA updated for lead ${leadId}:`, data.cta_id);
      }

      return Response.json({ lead_id: leadId });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[leads] CTA update error:", error);
      }
      console.error("[leads] Error:", error);
      return Response.json({ error: "internal_error" }, { status: 500 });
    }
  }

  // Validation pour les updates/create de leads complets
  if (!data.client_name || !data.client_email || !data.client_phone || !data.event_date || !data.address) {
    return Response.json(
      { error: "invalid_body", message: "client_name, client_email, client_phone, event_date, and address are required" },
      { status: 400 }
    );
  }

  const leadId = data.lead_id || generateLeadId();
  const eventDateIso = normalizeDateToISO(data.event_date) || sanitize(data.event_date);

  if (process.env.NODE_ENV !== "production") {
    console.log(`[leads] Processing lead ${leadId}, update: ${!!data.lead_id}, step: ${data.step || "5"}`);
  }

  try {
    if (data.lead_id) {
      // Update existing lead
      const updateValues: Record<string, string> = {
        Language: data.language || "",
        Nom: data.client_name,
        Email: data.client_email,
        Phone: data.client_phone,
        "Date Event": eventDateIso,
        "Lieu Event": data.address,
        Pack: sanitize(data.pack_code),
        "Invités": sanitize(data.guests),
        "Transport (€)": sanitize(data.transport_euros),
        Total: sanitize(data.total_euros),
        Acompte: sanitize(data.deposit_euros),
        "UTM Source": sanitize(data.utm_source),
        "UTM Campaign": sanitize(data.utm_campaign),
        "UTM Medium": sanitize(data.utm_medium),
        "Updated At": new Date().toISOString()
      };

      // Ajouter Step et Status si fournis
      if (data.step) {
        updateValues.Step = data.step;
      }
      if (data.status) {
        updateValues.Status = data.status;
      }

      await gasPost({
        action: "updateRowByLeadId",
        key: process.env.GAS_KEY,
        data: {
          sheetName: "Leads",
          leadId: data.lead_id,
          values: updateValues
        }
      });

      if (process.env.NODE_ENV !== "production") {
        console.log(`[leads] Lead ${leadId} updated`);
      }

      return Response.json({ lead_id: leadId });
    }

    // Create new lead
    const createValues: Record<string, string> = {
      "Lead ID": leadId,
      "Created At": new Date().toISOString(),
      Step: data.step || "5",
      Status: data.status || "step5_completed",
      Nom: data.client_name,
      Email: data.client_email,
      Phone: data.client_phone,
      Language: data.language,
      "Date Event": eventDateIso,
      "Lieu Event": data.address,
      Pack: sanitize(data.pack_code),
      "Invités": sanitize(data.guests),
      "Transport (€)": sanitize(data.transport_euros),
      Total: sanitize(data.total_euros),
      Acompte: sanitize(data.deposit_euros),
      "UTM Source": sanitize(data.utm_source),
      "UTM Campaign": sanitize(data.utm_campaign),
      "UTM Medium": sanitize(data.utm_medium)
    };

    const result = await gasPost({
      action: "appendRow",
      key: process.env.GAS_KEY,
      data: {
        sheetName: "Leads",
        values: createValues
      }
    });

    if (!result.ok) {
      console.error("[leads] GAS append failed", result.error);
      return Response.json({ error: "sheets_error" }, { status: 500 });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[leads] New lead created: ${leadId}`);
    }

    return Response.json({ lead_id: leadId });
  } catch (error) {
    console.error("[leads] Error:", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}

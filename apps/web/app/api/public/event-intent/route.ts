import { z } from "zod";
import { gasPost } from "@/lib/gas";
import { toDDMMYYYY, toDDMMYYYYHHmm } from "@/lib/date";

const EventIntentSchema = z.object({
  lead_id: z.string().optional(),
  language: z.enum(["fr", "nl"]).default("fr"),
  client_name: z.string().min(2),
  client_email: z.string().email(),
  client_phone: z.string().min(6),
  event_date: z.string(), // Accepte YYYY-MM-DD ou DD/MM/YYYY
  address: z.string().min(2),
  pack_code: z.enum(["DISCOVERY", "ESSENTIAL", "PREMIUM"]),
  options: z.array(z.string()).default([]),
  transport_fee_cents: z.number().int().min(0),
  total_cents: z.number().int().min(0),
  deposit_cents: z.number().int().min(0),
  balance_due_cents: z.number().int().min(0),
  // Champs optionnels pour Leads
  step: z.string().optional(),
  status: z.string().optional(),
  guests: z.string().optional(),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_medium: z.string().optional()
});

// Générer un ID unique pour le lead
function generateLeadId(): string {
  return `LEAD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// Convertir cents en euros formaté (texte pour Sheets)
function centsToEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

// Headers exacts de la feuille Leads (dans l'ordre)
const LEADS_HEADERS = [
  "Lead ID",
  "Created At",
  "Step",
  "Status",
  "Nom",
  "Email",
  "Phone",
  "Language",
  "Date Event",
  "Lieu Event",
  "Pack",
  "Invités",
  "Transport (€)",
  "Total",
  "Acompte",
  "UTM Source",
  "UTM Campaign",
  "UTM Medium"
];

/**
 * Construit un objet values mappé aux headers exacts
 */
function buildLeadValues(record: Record<string, unknown>): Record<string, string> {
  const values: Record<string, string> = {};
  for (const header of LEADS_HEADERS) {
    const value = record[header];
    values[header] = value !== undefined && value !== null ? String(value) : "";
  }
  return values;
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const hasGAS_URL = !!process.env.GAS_WEBAPP_URL;
  const hasGAS_KEY = !!process.env.GAS_KEY;

  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    return Response.json(
      {
        ok: false,
        requestId,
        error: {
          type: "INVALID_JSON",
          message: "Request body is not valid JSON",
          status: 400
        }
      },
      { status: 400 }
    );
  }

  const parsed = EventIntentSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        requestId,
        error: {
          type: "VALIDATION_ERROR",
          message: "Request body validation failed",
          status: 400,
          issues: parsed.error.format()
        }
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const leadId = data.lead_id || generateLeadId();

  // Normaliser la date en DD/MM/YYYY (texte pour Sheets)
  const dateEventDDMM = toDDMMYYYY(data.event_date);
  if (!dateEventDDMM) {
    return Response.json(
      {
        ok: false,
        requestId,
        error: {
          type: "INVALID_DATE",
          message: `Invalid date format: ${data.event_date}. Expected YYYY-MM-DD or DD/MM/YYYY`,
          status: 400
        }
      },
      { status: 400 }
    );
  }

  const now = new Date();
  const createdAtDDMM = toDDMMYYYYHHmm(now) || now.toISOString();

  // Normaliser invites/guests (peut être string ou number)
  const invitesValue = data.guests ? String(data.guests).trim() : "";

  if (process.env.NODE_ENV !== "production") {
    console.log(`[event-intent] Debug invites (${requestId}):`, {
      leadId,
      step: data.step,
      guests_received: data.guests,
      invites_final: invitesValue,
      typeof_guests: typeof data.guests
    });
  }

  try {
    const baseValues = {
      "Lead ID": leadId,
      Language: data.language,
      Nom: data.client_name,
      Email: data.client_email,
      Phone: data.client_phone,
      "Date Event": dateEventDDMM, // TEXTE DD/MM/YYYY
      "Lieu Event": data.address,
      Pack: data.pack_code,
      "Invités": invitesValue, // String normalisé depuis guests
      "Transport (€)": centsToEuros(data.transport_fee_cents),
      Total: centsToEuros(data.total_cents),
      Acompte: centsToEuros(data.deposit_cents),
      "UTM Source": data.utm_source || "",
      "UTM Campaign": data.utm_campaign || "",
      "UTM Medium": data.utm_medium || ""
    };

    if (data.lead_id) {
      // Update existing lead
      const updateValues = buildLeadValues({
        ...baseValues,
        Step: data.step || "",
        Status: data.status || ""
      });

      await gasPost({
        action: "updateRowByLeadId",
        key: process.env.GAS_KEY,
        data: {
          sheetName: "Leads",
          leadId: data.lead_id,
          values: updateValues
        }
      });

      return Response.json({ ok: true, requestId, lead_id: data.lead_id });
    }

    // Create new lead
    const createValues = buildLeadValues({
      ...baseValues,
      "Created At": createdAtDDMM, // TEXTE DD/MM/YYYY HH:mm
      Step: data.step || "5",
      Status: data.status || "step_5_completed"
    });

    await gasPost({
      action: "appendRow",
      key: process.env.GAS_KEY,
      data: {
        sheetName: "Leads",
        values: createValues
      }
    });

    return Response.json({ ok: true, requestId, lead_id: leadId });
  } catch (error) {
    // Extraire les détails de l'erreur GAS
    const gasError = error as Error & { type?: string; status?: number; preview?: string; url?: string; message?: string };
    const errorType = gasError.type || "UNKNOWN_ERROR";
    const errorStatus = gasError.status || 500;
    const errorPreview = gasError.preview || String(error).substring(0, 300);
    const errorLocation = gasError.url || "unknown";
    const errorMessage = gasError.message || String(error);

    console.error(`[event-intent] Error (${requestId}):`, {
      type: errorType,
      status: errorStatus,
      message: errorMessage,
      preview: errorPreview,
      location: errorLocation,
      hasGAS_URL,
      hasGAS_KEY,
      payload: {
        lead_id: data.lead_id,
        client_email: data.client_email,
        step: data.step
      }
    });

    return Response.json(
      {
        ok: false,
        requestId,
        error: {
          type: errorType,
          message: errorMessage,
          status: errorStatus,
          location: errorLocation,
          preview: errorPreview
        }
      },
      { status: errorStatus >= 400 && errorStatus < 600 ? errorStatus : 500 }
    );
  }
}

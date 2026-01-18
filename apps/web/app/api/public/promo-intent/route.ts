import { z } from "zod";
import { gasPost } from "@/lib/gas";
import { generateLeadId } from "@/lib/date-utils";
import { toDDMMYYYY, toDDMMYYYYHHmm } from "@/lib/date";

const PromoIntentSchema = z.object({
  request_id: z.string().optional(),
  email: z.string().email(),
  locale: z.enum(["fr", "nl"]).default("fr"),
  payload: z.object({
    email: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone: z.string().optional(),
    date: z.string().optional(),
    location: z.string().optional(),
    guests: z.string().optional(),
    theme: z.string().optional(),
    priority: z.string().optional()
  }).optional()
});

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
  console.log(`[promo][${requestId}] Valid payload`, { request_id, email, locale, payload });

  const sendAfter = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const createdAt = new Date().toISOString();

  try {
    // 1. Write to Notifications sheet
    const notificationValues = {
      Template: "B2C_PROMO_48H",
      Email: email,
      Locale: locale,
      Payload: JSON.stringify(payload ?? {}),
      "Send After": sendAfter,
      Status: "queued",
      "Created At": createdAt
    };

    await gasPost({
      action: "appendRow",
      key: process.env.GAS_KEY,
      data: {
        sheetName: "Notifications",
        values: notificationValues
      }
    });

    console.log(`[promo][${requestId}] Notifications appendRow success`);

    // 2. Write to Leads sheet (non-blocking - don't fail if this errors)
    let leadId: string | null = null;
    try {
      leadId = generateLeadId();
      const clientName = `${payload?.first_name?.trim() || ""} ${payload?.last_name?.trim() || ""}`.trim();
      const eventDate = payload?.date ? toDDMMYYYY(payload.date) || payload.date : "";

      const leadValues = buildLeadValues({
        "Lead ID": leadId,
        "Created At": toDDMMYYYYHHmm(new Date()) || createdAt,
        Step: "5",
        Status: "step_5_completed",
        Nom: clientName,
        Email: email,
        Phone: payload?.phone?.trim() || "",
        Language: locale,
        "Date Event": eventDate,
        "Lieu Event": payload?.location?.trim() || "",
        Pack: "",
        "Invités": payload?.guests?.trim() || "",
        "Transport (€)": "",
        Total: "",
        Acompte: "",
        "UTM Source": "",
        "UTM Campaign": "",
        "UTM Medium": ""
      });

      await gasPost({
        action: "appendRow",
        key: process.env.GAS_KEY,
        data: {
          sheetName: "Leads",
          values: leadValues
        }
      });

      console.log(`[promo][${requestId}] Leads appendRow success`, { leadId });
    } catch (leadsError) {
      console.error(`[promo][${requestId}] Leads appendRow failed (non-blocking)`, leadsError);
      leadId = null;
    }

    return Response.json({ queued: true, requestId, lead_id: leadId });
  } catch (error) {
    console.error(`[promo][${requestId}] Notifications GAS error`, error);
    return Response.json(
      { error: "internal_error", requestId },
      { status: 500 }
    );
  }
}

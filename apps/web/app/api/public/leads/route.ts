import { z } from "zod";
import { gasPost } from "@/lib/gas";
import { generateLeadId } from "@/lib/date-utils";
import { toDDMMYYYY, toDDMMYYYYHHmm } from "@/lib/date";

const LeadPayloadSchema = z.object({
  event: z.enum(["button_click", "lead_progress", "cta_update"]).optional().default("button_click"),
  step: z.string().optional(),
  buttonLabel: z.string().optional(),
  leadId: z.string().optional(),
  utm: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional()
  }).optional(),
  lead_id: z.string().optional(),
  language: z.string().optional(),
  client_name: z.string().optional(),
  client_email: z.string().email().optional(),
  client_phone: z.string().optional(),
  event_date: z.string().optional(),
  address: z.string().optional(),
  pack_code: z.string().optional(),
  guests: z.string().optional(),
  transport_euros: z.string().optional(),
  total_euros: z.string().optional(),
  deposit_euros: z.string().optional(),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_medium: z.string().optional(),
  status: z.string().optional(),
  cta_id: z.string().optional(),
  cta_label: z.string().optional(),
  cta_value: z.string().optional(),
  updated_at: z.string().optional()
}).passthrough();

function sanitize(value?: string): string {
  return value ? value.trim() : "";
}

const recentEvents = new Map<string, number>();
const DEDUP_WINDOW_MS = 3000;

function getDedupKey(leadId: string | undefined, step: string | undefined, buttonLabel: string | undefined): string {
  return `${leadId || "no-lead"}_${step || "no-step"}_${buttonLabel || "no-button"}`;
}

function isDuplicate(key: string): boolean {
  const now = Date.now();
  const lastTime = recentEvents.get(key);
  if (lastTime && now - lastTime < DEDUP_WINDOW_MS) {
    return true;
  }
  recentEvents.set(key, now);
  for (const [k, v] of recentEvents.entries()) {
    if (now - v > 10000) {
      recentEvents.delete(k);
    }
  }
  return false;
}

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
        skipped: true,
        error: {
          type: "INVALID_JSON",
          message: "Request body is not valid JSON",
          status: 400
        }
      },
      { status: 200 }
    );
  }

  const parsed = LeadPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        requestId,
        skipped: true,
        error: {
          type: "VALIDATION_ERROR",
          message: "Request body validation failed",
          issues: parsed.error.format()
        }
      },
      { status: 200 }
    );
  }

  const data = parsed.data;
  const event = data.event || "button_click";
  const leadId = data.leadId || data.lead_id;
  const step = data.step || "";
  const buttonLabel = data.buttonLabel || data.cta_label || "";
  const dedupKey = getDedupKey(leadId, step, buttonLabel);
  const isDup = isDuplicate(dedupKey);

  const logContext = {
    requestId,
    event,
    step,
    hasLeadId: Boolean(leadId),
    hasUTM: Boolean(data.utm || data.utm_source || data.utm_campaign || data.utm_medium),
    isDuplicate: isDup,
    isWriteAttempt: false,
    gasStatus: "none"
  };

  if (event === "button_click") {
    if (isDup) {
      console.log(`[leads] Event skipped (duplicate):`, logContext);
      return Response.json({ ok: true, requestId, skipped: true, reason: "duplicate" }, { status: 200 });
    }

    if (!leadId) {
      console.log(`[leads] button_click skipped (no leadId):`, logContext);
      return Response.json({ ok: true, requestId, skipped: true, reason: "no_lead_id" }, { status: 200 });
    }

    console.log(`[leads] button_click logged:`, {
      ...logContext,
      buttonLabel,
      leadId
    });

    return Response.json({ ok: true, requestId, skipped: true, reason: "button_click_log_only" }, { status: 200 });
  }

  if (event === "cta_update") {
    if (!leadId) {
      console.log(`[leads] cta_update skipped (no leadId):`, logContext);
      return Response.json({ ok: true, requestId, skipped: true, reason: "no_lead_id" }, { status: 200 });
    }

    const updatedLeadId = leadId;
    logContext.isWriteAttempt = true;

    try {
      await gasPost({
        action: "updateRowByLeadId",
        key: process.env.GAS_KEY,
        data: {
          sheetName: "Leads",
          leadId: updatedLeadId,
          values: {
            "Last CTA": sanitize(data.cta_id || ""),
            "Last CTA Label": sanitize(data.cta_label || ""),
            "Last CTA Value": sanitize(data.cta_value || ""),
            "Last CTA At": sanitize(data.updated_at) || new Date().toISOString()
          }
        }
      });

      logContext.gasStatus = "success";
      console.log(`[leads] cta_update success:`, logContext);

      return Response.json({ ok: true, requestId, lead_id: updatedLeadId }, { status: 200 });
    } catch (error) {
      const gasError = error as Error & { type?: string; status?: number; preview?: string; message?: string };
      logContext.gasStatus = `error:${gasError.type || "unknown"}`;
      console.warn(`[leads] cta_update error:`, { ...logContext, error: gasError.message });

      return Response.json(
        {
          ok: false,
          requestId,
          skipped: true,
          error: {
            type: gasError.type || "GAS_ERROR",
            message: gasError.message || String(error)
          }
        },
        { status: 200 }
      );
    }
  }

  if (event === "lead_progress") {
    const clientEmail = sanitize(data.client_email || "");
    if (!leadId && !clientEmail) {
      console.log(`[leads] lead_progress skipped (missing leadId/email):`, logContext);
      return Response.json({ ok: true, requestId, skipped: true, reason: "missing_lead_id_or_email" }, { status: 200 });
    }

    logContext.isWriteAttempt = true;

    const eventDate = data.event_date ? toDDMMYYYY(data.event_date) || data.event_date : "";
    const baseValues = {
      Language: sanitize(data.language || ""),
      Nom: sanitize(data.client_name || ""),
      Email: clientEmail,
      Phone: sanitize(data.client_phone || ""),
      "Date Event": eventDate,
      "Lieu Event": sanitize(data.address || ""),
      Pack: sanitize(data.pack_code || ""),
      "Invités": sanitize(data.guests || ""),
      "Transport (€)": sanitize(data.transport_euros || ""),
      Total: sanitize(data.total_euros || ""),
      Acompte: sanitize(data.deposit_euros || ""),
      "UTM Source": sanitize(data.utm_source || data.utm?.source || ""),
      "UTM Campaign": sanitize(data.utm_campaign || data.utm?.campaign || ""),
      "UTM Medium": sanitize(data.utm_medium || data.utm?.medium || "")
    } as Record<string, string>;

    try {
      if (leadId) {
        const updateValues = {
          ...baseValues,
          Step: step,
          Status: sanitize(data.status || ""),
          "Updated At": toDDMMYYYYHHmm(new Date()) || new Date().toISOString()
        };

        await gasPost({
          action: "updateRowByLeadId",
          key: process.env.GAS_KEY,
          data: {
            sheetName: "Leads",
            leadId,
            values: updateValues
          }
        });

        logContext.gasStatus = "success";
        console.log(`[leads] lead_progress update success:`, logContext);

        return Response.json({ ok: true, requestId, lead_id: leadId }, { status: 200 });
      }

      const newLeadId = generateLeadId();
      const createValues = buildLeadValues({
        ...baseValues,
        "Lead ID": newLeadId,
        "Created At": toDDMMYYYYHHmm(new Date()) || new Date().toISOString(),
        Step: step || "",
        Status: sanitize(data.status || "step_5_completed")
      });

      await gasPost({
        action: "appendRow",
        key: process.env.GAS_KEY,
        data: {
          sheetName: "Leads",
          values: createValues
        }
      });

      logContext.gasStatus = "success";
      console.log(`[leads] lead_progress create success:`, { ...logContext, leadId: newLeadId });

      return Response.json({ ok: true, requestId, lead_id: newLeadId, created: true }, { status: 200 });
    } catch (error) {
      const gasError = error as Error & { type?: string; status?: number; preview?: string; message?: string };
      logContext.gasStatus = `error:${gasError.type || "unknown"}`;
      console.warn(`[leads] lead_progress error:`, { ...logContext, error: gasError.message });

      return Response.json(
        {
          ok: false,
          requestId,
          skipped: true,
          error: {
            type: gasError.type || "GAS_ERROR",
            message: gasError.message || String(error)
          }
        },
        { status: 200 }
      );
    }
  }

  console.log(`[leads] Unknown event type:`, logContext);
  return Response.json({ ok: true, requestId, skipped: true, reason: "unknown_event_type" }, { status: 200 });
}

import { z } from "zod";
import { gasPost } from "@/lib/gas";
import { generateLeadId } from "@/lib/date-utils";
import { normalizeDateToISO, toDDMMYYYY, toDDMMYYYYHHmm } from "@/lib/date";

// Schema Zod très permissif - tous les champs optionnels sauf "event"
const LeadPayloadSchema = z.object({
  event: z.enum(["button_click", "lead_progress", "cta_update"]).optional().default("button_click"),
  // Champs minimalistes pour button_click
  step: z.string().optional(),
  buttonLabel: z.string().optional(),
  leadId: z.string().optional(),
  // UTM optionnels
  utm: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional()
  }).optional(),
  // Champs complets optionnels (pour lead_progress)
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
  // CTA fields
  cta_id: z.string().optional(),
  cta_label: z.string().optional(),
  cta_value: z.string().optional(),
  updated_at: z.string().optional()
}).passthrough(); // Ignorer les champs extra

function sanitize(value?: string): string {
  return value ? value.trim() : "";
}

// Anti-spam: déduplication in-memory par (leadId, step, buttonLabel) pendant 3s
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
  // Nettoyer les entrées anciennes (> 10s)
  for (const [k, v] of recentEvents.entries()) {
    if (now - v > 10000) {
      recentEvents.delete(k);
    }
  }
  return false;
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const hasGAS_URL = !!process.env.GAS_WEBAPP_URL;
  const hasGAS_KEY = !!process.env.GAS_KEY;

  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    // Ne jamais throw - retourner 200 même si JSON invalide (fire-and-forget)
    return Response.json({
      ok: false,
      requestId,
      skipped: true,
      error: {
        type: "INVALID_JSON",
        message: "Request body is not valid JSON"
      }
    }, { status: 200 });
  }

  const parsed = LeadPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    // Ne jamais throw - retourner 200 même si validation échoue (fire-and-forget)
    return Response.json({
      ok: false,
      requestId,
      skipped: true,
      error: {
        type: "VALIDATION_ERROR",
        message: "Request body validation failed",
        issues: parsed.error.format()
      }
    }, { status: 200 });
  }

  const data = parsed.data;
  const event = data.event || "button_click";
  const leadId = data.leadId || data.lead_id;
  const step = data.step || "";
  const buttonLabel = data.buttonLabel || data.cta_label || "";

  // Anti-spam: vérifier si duplicate
  const dedupKey = getDedupKey(leadId, step, buttonLabel);
  const isDup = isDuplicate(dedupKey);

  // Logs serveur utiles
  const logContext = {
    requestId,
    event,
    step,
    hasLeadId: !!leadId,
    hasUTM: !!(data.utm || data.utm_source || data.utm_campaign || data.utm_medium),
    isDuplicate: isDup,
    isWriteAttempt: false,
    gasStatus: "none"
  };

  if (isDup) {
    console.log(`[leads] Event skipped (duplicate):`, logContext);
    return Response.json({
      ok: true,
      requestId,
      skipped: true,
      reason: "duplicate"
    }, { status: 200 });
  }

  // Logique selon le type d'événement
  if (event === "button_click") {
    // button_click: NE PAS écrire dans Sheets si champs manquants, juste log
    if (!leadId) {
      console.log(`[leads] button_click skipped (no leadId):`, logContext);
      return Response.json({
        ok: true,
        requestId,
        skipped: true,
        reason: "no_lead_id"
      }, { status: 200 });
    }

    // Log seulement (pas d'écriture dans Sheets pour button_click minimal)
    console.log(`[leads] button_click logged:`, {
      ...logContext,
      buttonLabel,
      leadId
    });

    return Response.json({
      ok: true,
      requestId,
      skipped: true,
      reason: "button_click_log_only"
    }, { status: 200 });
  }

  if (event === "cta_update") {
    // CTA update: besoin de lead_id et cta_id
    if (!data.lead_id && !leadId) {
      console.log(`[leads] cta_update skipped (no leadId):`, logContext);
      return Response.json({
        ok: true,
        requestId,
        skipped: true,
        reason: "no_lead_id"
      }, { status: 200 });
    }

    const updateLeadId = data.lead_id || leadId;
    logContext.isWriteAttempt = true;

    try {
      await gasPost({
        action: "updateRowByLeadId",
        key: process.env.GAS_KEY,
        data: {
          sheetName: "Leads",
          leadId: updateLeadId,
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

      return Response.json({
        ok: true,
        requestId,
        lead_id: updateLeadId
      }, { status: 200 });
    } catch (error) {
      const gasError = error as Error & { type?: string; status?: number; preview?: string; message?: string };
      logContext.gasStatus = `error:${gasError.type || "unknown"}`;
      console.warn(`[leads] cta_update error:`, { ...logContext, error: gasError.message });

      // Ne jamais throw - retourner 200 même en cas d'erreur
      return Response.json({
        ok: false,
        requestId,
        skipped: true,
        error: {
          type: gasError.type || "GAS_ERROR",
          message: gasError.message || String(error)
        }
      }, { status: 200 });
    }
  }

  // event === "lead_progress": écrire UNIQUEMENT si Lead ID + Step présents
  if (event === "lead_progress") {
    if (!leadId || !step) {
      console.log(`[leads] lead_progress skipped (missing leadId or step):`, logContext);
      return Response.json({
        ok: true,
        requestId,
        skipped: true,
        reason: "missing_lead_id_or_step"
      }, { status: 200 });
    }

    logContext.isWriteAttempt = true;

    try {
      const eventDateIso = data.event_date ? (normalizeDateToISO(data.event_date) || toDDMMYYYY(data.event_date)) : "";
      const eventDateDDMM = eventDateIso ? toDDMMYYYY(eventDateIso) || eventDateIso : "";

      // Update existing lead (toujours update si lead_id existe)
      const updateValues: Record<string, string> = {
        Step: step,
        Status: sanitize(data.status || ""),
        Language: sanitize(data.language || ""),
        Nom: sanitize(data.client_name || ""),
        Email: sanitize(data.client_email || ""),
        Phone: sanitize(data.client_phone || ""),
        "Date Event": eventDateDDMM || "",
        "Lieu Event": sanitize(data.address || ""),
        Pack: sanitize(data.pack_code || ""),
        "Invités": sanitize(data.guests || ""),
        "Transport (€)": sanitize(data.transport_euros || ""),
        Total: sanitize(data.total_euros || ""),
        Acompte: sanitize(data.deposit_euros || ""),
        "UTM Source": sanitize(data.utm_source || data.utm?.source || ""),
        "UTM Campaign": sanitize(data.utm_campaign || data.utm?.campaign || ""),
        "UTM Medium": sanitize(data.utm_medium || data.utm?.medium || ""),
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
      console.log(`[leads] lead_progress success:`, logContext);

      return Response.json({
        ok: true,
        requestId,
        lead_id: leadId
      }, { status: 200 });
    } catch (error) {
      const gasError = error as Error & { type?: string; status?: number; preview?: string; message?: string };
      logContext.gasStatus = `error:${gasError.type || "unknown"}`;
      console.warn(`[leads] lead_progress error:`, { ...logContext, error: gasError.message });

      // Ne jamais throw - retourner 200 même en cas d'erreur
      return Response.json({
        ok: false,
        requestId,
        skipped: true,
        error: {
          type: gasError.type || "GAS_ERROR",
          message: gasError.message || String(error)
        }
      }, { status: 200 });
    }
  }

  // Fallback: retourner 200 même pour événements inconnus
  console.log(`[leads] Unknown event type:`, logContext);
  return Response.json({
    ok: true,
    requestId,
    skipped: true,
    reason: "unknown_event_type"
  }, { status: 200 });
}

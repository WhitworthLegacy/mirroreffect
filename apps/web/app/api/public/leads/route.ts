import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase";
import { generateLeadId } from "@/lib/date-utils";
import { normalizeDateToISO } from "@/lib/date";
import { trackLead } from "@/lib/metaCapi";

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
  event_type: z.string().optional(),
  event_date: z.string().optional(),
  address: z.string().optional(),
  zone: z.string().optional(),
  pack_code: z.string().optional(),
  guests: z.string().optional(),
  vibe: z.string().optional(),
  theme: z.string().optional(),
  priority: z.string().optional(),
  transport_euros: z.string().optional(),
  total_euros: z.string().optional(),
  deposit_euros: z.string().optional(),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_medium: z.string().optional(),
  request_id: z.string().optional(),
  status: z.string().optional(),
  cta_id: z.string().optional(),
  cta_label: z.string().optional(),
  cta_value: z.string().optional(),
  updated_at: z.string().optional(),
  is_new_lead: z.boolean().optional()
}).passthrough();

function sanitize(value?: string): string {
  return value ? value.trim() : "";
}

// Déduplication via Supabase (multi-serveur safe)
const DEDUP_WINDOW_MS = 3000;

async function isDuplicateInDatabase(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  leadId: string | undefined,
  clientEmail: string | undefined
): Promise<boolean> {
  // Ne vérifier que si on a un identifiant
  if (!leadId && !clientEmail) return false;

  const now = new Date();
  const cutoff = new Date(now.getTime() - DEDUP_WINDOW_MS);

  // Vérifier par lead_id ou email dans les 3 dernières secondes
  const query = supabase
    .from("leads")
    .select("lead_id, created_at")
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  if (leadId) {
    query.eq("lead_id", leadId);
  } else if (clientEmail) {
    query.eq("client_email", clientEmail.toLowerCase());
  }

  const { data } = await query.maybeSingle();
  return Boolean(data);
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const forwardedRequestId = req.headers.get("x-request-id") ?? undefined;
  console.log(`[leads][${requestId}] Requête reçue`, { forwardedRequestId });

  let raw: unknown = null;
  try {
    raw = await req.json();
    console.log(`[leads][${requestId}] Body brut`, raw);
  } catch {
    return Response.json(
      {
        ok: false,
        requestId,
        skipped: true,
        error: { type: "INVALID_JSON", message: "Body non valide JSON", status: 400 }
      },
      { status: 200 }
    );
  }

  const parsed = LeadPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn(`[leads][${requestId}] Validation échouée`, parsed.error.format());
    return Response.json(
      {
        ok: false,
        requestId,
        skipped: true,
        error: { type: "VALIDATION_ERROR", message: "Validation body échouée", issues: parsed.error.format() }
      },
      { status: 200 }
    );
  }

  const data = parsed.data;
  console.log(`[leads][${requestId}] Payload parsé`, { ...data, forwardedRequestId });

  const event = data.event || "button_click";
  const leadId = data.leadId || data.lead_id;
  const step = data.step || "";
  const buttonLabel = data.buttonLabel || data.cta_label || "";
  const clientEmail = sanitize(data.client_email || "");

  const logContext = {
    requestId,
    forwardedRequestId,
    event,
    step,
    hasLeadId: Boolean(leadId),
    hasUTM: Boolean(data.utm || data.utm_source || data.utm_campaign || data.utm_medium),
    isDuplicate: false,
    isWriteAttempt: false
  };

  const supabase = createSupabaseServerClient();

  // Vérification déduplication pour lead_progress et button_click
  if (event === "button_click" || event === "lead_progress") {
    const isDup = await isDuplicateInDatabase(supabase, leadId, clientEmail);
    logContext.isDuplicate = isDup;

    if (isDup) {
      console.log(`[leads][${requestId}] Événement ignoré (duplicate):`, logContext);
      return Response.json({ ok: true, requestId, skipped: true, reason: "duplicate" }, { status: 200 });
    }
  }

  // =============================================================================
  // Événement: button_click (log only, pas d'écriture)
  // =============================================================================
  if (event === "button_click") {
    if (!leadId) {
      console.log(`[leads][${requestId}] button_click ignoré (pas de leadId):`, logContext);
      return Response.json({ ok: true, requestId, skipped: true, reason: "no_lead_id" }, { status: 200 });
    }

    console.log(`[leads][${requestId}] button_click loggé:`, { ...logContext, buttonLabel, leadId });
    return Response.json({ ok: true, requestId, skipped: true, reason: "button_click_log_only" }, { status: 200 });
  }

  // =============================================================================
  // Événement: cta_update (mise à jour CTA)
  // =============================================================================
  if (event === "cta_update") {
    if (!leadId) {
      console.log(`[leads] cta_update ignoré (pas de leadId):`, logContext);
      return Response.json({ ok: true, requestId, skipped: true, reason: "no_lead_id" }, { status: 200 });
    }

    logContext.isWriteAttempt = true;

    try {
      const { error } = await supabase
        .from("leads")
        .update({
          updated_at: new Date().toISOString()
        })
        .eq("lead_id", leadId);

      if (error) throw error;

      console.log(`[leads][${requestId}] cta_update succès`, logContext);
      return Response.json({ ok: true, requestId, lead_id: leadId }, { status: 200 });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.warn(`[leads][${requestId}] cta_update erreur`, { ...logContext, error: errMsg });
      return Response.json(
        { ok: false, requestId, skipped: true, error: { type: "DB_ERROR", message: errMsg } },
        { status: 200 }
      );
    }
  }

  // =============================================================================
  // Événement: lead_progress (création/mise à jour lead)
  // =============================================================================
  if (event === "lead_progress") {
    const isNewLead = data.is_new_lead === true;

    if (!leadId && !clientEmail) {
      console.log(`[leads][${requestId}] lead_progress ignoré (manque leadId/email):`, logContext);
      return Response.json({ ok: true, requestId, skipped: true, reason: "missing_lead_id_or_email" }, { status: 200 });
    }

    logContext.isWriteAttempt = true;

    // Données de base du lead (column names match actual Supabase schema)
    const baseValues = {
      language: sanitize(data.language || "").toLowerCase() || "fr",
      client_name: sanitize(data.client_name || ""),
      client_email: clientEmail.toLowerCase(),
      client_phone: sanitize(data.client_phone || ""),
      event_type: sanitize(data.event_type || "") || null,
      event_date: normalizeDateToISO(sanitize(data.event_date || "")) || null,
      event_location: sanitize(data.address || ""),
      zone: sanitize(data.zone || "") || null,
      vibe: sanitize(data.vibe || "") || null,
      theme: sanitize(data.theme || "") || null,
      priority: sanitize(data.priority || "") || null,
      utm_source: sanitize(data.utm_source || data.utm?.source || ""),
      utm_campaign: sanitize(data.utm_campaign || data.utm?.campaign || ""),
      utm_medium: sanitize(data.utm_medium || data.utm?.medium || "")
    };

    try {
      // Si is_new_lead=true, créer directement sans chercher
      if (isNewLead && leadId) {
        console.log(`[leads][${requestId}] Création nouveau lead (is_new_lead=true)`, { leadId });

        const { error } = await supabase.from("leads").insert({
          lead_id: leadId,
          step: step ? parseInt(step, 10) : 5,
          status: sanitize(data.status || "progress"),
          ...baseValues
        });

        if (error) throw error;

        console.log(`[leads][${requestId}] lead_progress création succès (new lead)`, { ...logContext, leadId });

        // Meta CAPI - Track Lead event (non-bloquant)
        trackLead({
          email: clientEmail || undefined,
          phone: sanitize(data.client_phone || "") || undefined,
          firstName: sanitize(data.client_name || "") || undefined,
          leadId,
          value: data.total_euros ? parseFloat(data.total_euros) : undefined,
          clientIp: req.headers.get("x-forwarded-for")?.split(",")[0] || undefined,
          userAgent: req.headers.get("user-agent") || undefined
        }).catch((err) => console.error(`[leads][${requestId}] Meta CAPI erreur:`, err));

        return Response.json({ ok: true, requestId, lead_id: leadId, created: true }, { status: 200 });
      }

      // Lead existant - essayer de mettre à jour
      if (leadId) {
        // Vérifier si le lead existe
        const { data: existingLead } = await supabase
          .from("leads")
          .select("lead_id")
          .eq("lead_id", leadId)
          .single();

        if (existingLead) {
          // Mettre à jour
          const { error } = await supabase
            .from("leads")
            .update({
              step: step ? parseInt(step, 10) : undefined,
              status: sanitize(data.status || "") || undefined,
              updated_at: new Date().toISOString(),
              ...baseValues
            })
            .eq("lead_id", leadId);

          if (error) throw error;

          console.log(`[leads][${requestId}] lead_progress update succès`, logContext);
          return Response.json({ ok: true, requestId, lead_id: leadId }, { status: 200 });
        } else {
          // Lead non trouvé, créer
          console.log(`[leads][${requestId}] Lead non trouvé, création nouvelle ligne`, { leadId });

          const { error } = await supabase.from("leads").insert({
            lead_id: leadId,
            step: step ? parseInt(step, 10) : 5,
            status: sanitize(data.status || "progress"),
            ...baseValues
          });

          if (error) throw error;

          console.log(`[leads][${requestId}] lead_progress création succès (après update miss)`, { ...logContext, leadId });

          // Meta CAPI
          trackLead({
            email: clientEmail || undefined,
            phone: sanitize(data.client_phone || "") || undefined,
            firstName: sanitize(data.client_name || "") || undefined,
            leadId,
            value: data.total_euros ? parseFloat(data.total_euros) : undefined,
            clientIp: req.headers.get("x-forwarded-for")?.split(",")[0] || undefined,
            userAgent: req.headers.get("user-agent") || undefined
          }).catch((err) => console.error(`[leads][${requestId}] Meta CAPI erreur:`, err));

          return Response.json({ ok: true, requestId, lead_id: leadId, created: true }, { status: 200 });
        }
      }

      // Pas de leadId - générer et créer
      const newLeadId = generateLeadId();

      const { error } = await supabase.from("leads").insert({
        lead_id: newLeadId,
        step: step ? parseInt(step, 10) : 5,
        status: sanitize(data.status || "progress"),
        ...baseValues
      });

      if (error) throw error;

      console.log(`[leads][${requestId}] lead_progress création succès`, { ...logContext, leadId: newLeadId });

      // Meta CAPI
      trackLead({
        email: clientEmail || undefined,
        phone: sanitize(data.client_phone || "") || undefined,
        firstName: sanitize(data.client_name || "") || undefined,
        leadId: newLeadId,
        value: data.total_euros ? parseFloat(data.total_euros) : undefined,
        clientIp: req.headers.get("x-forwarded-for")?.split(",")[0] || undefined,
        userAgent: req.headers.get("user-agent") || undefined
      }).catch((err) => console.error(`[leads][${requestId}] Meta CAPI erreur:`, err));

      return Response.json({ ok: true, requestId, lead_id: newLeadId, created: true }, { status: 200 });
    } catch (error) {
      const errMsg = error instanceof Error
        ? error.message
        : (error && typeof error === "object" && "message" in error)
          ? String((error as { message: unknown }).message)
          : JSON.stringify(error);
      const errDetails = (error && typeof error === "object" && "details" in error)
        ? String((error as { details: unknown }).details)
        : undefined;
      console.warn(`[leads][${requestId}] lead_progress erreur`, { ...logContext, error: errMsg, details: errDetails });
      return Response.json(
        { ok: false, requestId, skipped: true, error: { type: "DB_ERROR", message: errMsg, details: errDetails } },
        { status: 200 }
      );
    }
  }

  console.log(`[leads][${requestId}] Type événement inconnu:`, logContext);
  return Response.json({ ok: true, requestId, skipped: true, reason: "unknown_event_type" }, { status: 200 });
}

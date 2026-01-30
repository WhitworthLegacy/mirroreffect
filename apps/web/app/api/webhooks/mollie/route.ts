import { createSupabaseServerClient } from "@/lib/supabase";
import { fetchMolliePaymentStatus } from "@/lib/payments/mollie";
import { trackPurchase } from "@/lib/metaCapi";
import { syncEventToSheets } from "@/lib/syncToSheets";

const DEPOSIT_CENTS = 18000;

// =============================================================================
// Verrou d'idempotence en mémoire (TTL 60s)
// Empêche le traitement concurrent du même paymentId
// =============================================================================
const processingLocks = new Map<string, number>();
const LOCK_TTL_MS = 60_000; // 60 secondes

function acquireLock(paymentId: string): boolean {
  const now = Date.now();
  // Nettoyer les verrous expirés
  for (const [key, timestamp] of processingLocks.entries()) {
    if (now - timestamp > LOCK_TTL_MS) {
      processingLocks.delete(key);
    }
  }
  // Vérifier si le verrou existe et est encore valide
  const existingLock = processingLocks.get(paymentId);
  if (existingLock && now - existingLock < LOCK_TTL_MS) {
    return false; // Verrou déjà détenu
  }
  // Acquérir le verrou
  processingLocks.set(paymentId, now);
  return true;
}

function releaseLock(paymentId: string): void {
  processingLocks.delete(paymentId);
}

/**
 * Cherche un lead par email (case-insensitive)
 * Retourne le lead avec status='progress' en priorité, sinon le plus récent
 */
async function findLeadByEmail(supabase: ReturnType<typeof createSupabaseServerClient>, email: string) {
  // Priorité 1: Lead en cours (status='progress')
  const { data: progressLead } = await supabase
    .from("leads")
    .select("lead_id, created_at, status")
    .eq("client_email", email.toLowerCase())
    .eq("status", "progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (progressLead) return progressLead;

  // Priorité 2: Sinon, le lead le plus récent (peu importe le statut)
  const { data, error } = await supabase
    .from("leads")
    .select("lead_id, created_at, status")
    .eq("client_email", email.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("[mollie-webhook] Erreur recherche lead:", error);
    return null;
  }

  return data;
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  // Logs structurés (sans secrets)
  const logHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (!key.toLowerCase().includes("secret") && !key.toLowerCase().includes("authorization")) {
      logHeaders[key] = value;
    } else {
      logHeaders[key] = "[MASQUÉ]";
    }
  });

  console.log(`[mollie-webhook] Requête reçue:`, {
    requestId,
    method: req.method,
    headers: Object.keys(logHeaders),
    timestamp: new Date().toISOString()
  });

  // Mollie envoie id=tr_... (form-urlencoded)
  let raw: string;
  try {
    raw = await req.text();
  } catch (error) {
    console.error(`[mollie-webhook] Échec lecture body:`, {
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });
    return Response.json(
      { ok: false, requestId, error: { type: "INVALID_BODY", message: "Échec lecture body" } },
      { status: 400 }
    );
  }

  const params = new URLSearchParams(raw);
  const molliePaymentId = params.get("id");

  if (!molliePaymentId) {
    console.warn(`[mollie-webhook] ID paiement manquant:`, { requestId, bodyPreview: raw.substring(0, 100) });
    return Response.json(
      { ok: false, requestId, error: { type: "VALIDATION_ERROR", message: "ID paiement manquant" } },
      { status: 400 }
    );
  }

  const logContext = { requestId, paymentId: molliePaymentId, timestamp: new Date().toISOString() };
  console.log(`[mollie-webhook] Traitement paiement:`, logContext);

  // Verrou d'idempotence
  if (!acquireLock(molliePaymentId)) {
    console.log(`[mollie-webhook] Verrou déjà détenu, ignoré:`, logContext);
    return Response.json({ ok: true, requestId, received: true, skipped: true, reason: "lock_held" });
  }

  const supabase = createSupabaseServerClient();

  try {
    // =============================================================================
    // Vérifier si déjà traité dans Supabase (idempotence)
    // =============================================================================
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("status")
      .eq("payment_id", molliePaymentId)
      .single();

    if (existingPayment?.status === "paid") {
      console.log(`[mollie-webhook] Paiement déjà traité:`, logContext);
      releaseLock(molliePaymentId);
      return Response.json({ ok: true, requestId, received: true, skipped: true, reason: "already_paid" });
    }

    // Fetch statut Mollie
    const payment = await fetchMolliePaymentStatus(molliePaymentId);
    if (!payment) {
      console.warn(`[mollie-webhook] Paiement non trouvé dans Mollie:`, logContext);
      releaseLock(molliePaymentId);
      return Response.json(
        { ok: false, requestId, error: { type: "PAYMENT_NOT_FOUND", message: "Paiement non trouvé" } },
        { status: 404 }
      );
    }

    console.log(`[mollie-webhook] Paiement récupéré de Mollie:`, {
      ...logContext,
      status: payment.status,
      amount_cents: payment.amount_cents,
      hasMetadata: !!payment.metadata
    });

    // Si pas "paid", mettre à jour le statut et retourner
    if (payment.status !== "paid") {
      await supabase
        .from("payments")
        .update({ status: payment.status, updated_at: new Date().toISOString() })
        .eq("payment_id", molliePaymentId);

      console.log(`[mollie-webhook] Statut mis à jour (non payé):`, { ...logContext, status: payment.status });
      releaseLock(molliePaymentId);
      return Response.json({ ok: true, requestId, received: true, status: payment.status });
    }

    // Valider le montant de l'acompte
    if (payment.amount_cents !== DEPOSIT_CENTS) {
      console.warn(`[mollie-webhook] Montant acompte invalide:`, {
        ...logContext,
        expected: DEPOSIT_CENTS,
        received: payment.amount_cents
      });
      releaseLock(molliePaymentId);
      return Response.json(
        { ok: false, requestId, error: { type: "INVALID_DEPOSIT_AMOUNT", message: `Attendu ${DEPOSIT_CENTS}, reçu ${payment.amount_cents}` } },
        { status: 400 }
      );
    }

    // Récupérer données depuis metadata
    const meta = payment.metadata || {};
    if (!meta.event_id) {
      console.warn(`[mollie-webhook] event_id manquant dans metadata:`, logContext);
      releaseLock(molliePaymentId);
      return Response.json(
        { ok: false, requestId, error: { type: "MISSING_EVENT_ID", message: "event_id requis dans metadata" } },
        { status: 400 }
      );
    }

    const eventId = meta.event_id as string;
    const paidAt = payment.paid_at || new Date().toISOString();

    // Récupérer email client depuis metadata (OBLIGATOIRE)
    const clientEmail =
      meta.client_email && typeof meta.client_email === "string"
        ? meta.client_email.trim().toLowerCase()
        : null;

    if (!clientEmail) {
      console.error(`[mollie-webhook] client_email MANQUANT dans metadata:`, {
        ...logContext,
        eventId,
        metadataKeys: meta ? Object.keys(meta) : []
      });
      releaseLock(molliePaymentId);
      return Response.json({
        ok: true,
        requestId,
        received: true,
        skipped: true,
        reason: "missing_client_email",
        eventId
      });
    }

    // =============================================================================
    // 1) Mettre à jour le paiement à "paid" (marqueur d'idempotence)
    // =============================================================================
    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({
        status: "paid",
        paid_at: paidAt,
        provider_payment_id: molliePaymentId,
        description: payment.description || null
      })
      .eq("payment_id", molliePaymentId);

    if (paymentUpdateError) {
      console.error(`[mollie-webhook] Échec mise à jour payment:`, { ...logContext, error: paymentUpdateError });
      throw new Error(paymentUpdateError.message);
    }

    console.log(`[mollie-webhook] Payment mis à jour à PAID:`, { ...logContext, paidAt });

    // =============================================================================
    // 2) Chercher et mettre à jour le lead
    // =============================================================================
    let leadId: string | null = null;
    let leadFound = false;

    const foundLead = await findLeadByEmail(supabase, clientEmail);
    if (foundLead) {
      leadId = foundLead.lead_id;
      leadFound = true;

      await supabase
        .from("leads")
        .update({
          status: "converted",
          converted_event_id: eventId,
          updated_at: new Date().toISOString()
        })
        .eq("lead_id", leadId);

      console.log(`[mollie-webhook] Lead mis à jour (converted):`, { ...logContext, leadId, eventId });
    }

    // =============================================================================
    // 3) Lookup pack_id from pack_code
    // =============================================================================
    let packId: string | null = null;
    const packCode = meta.pack_code as string | undefined;
    if (packCode) {
      const { data: packData } = await supabase
        .from("packs")
        .select("id")
        .eq("code", packCode)
        .single();
      packId = packData?.id || null;
    }

    // =============================================================================
    // 4) Créer l'événement dans la table events
    // =============================================================================
    const eventType = (meta.event_type as string) || "b2c";
    const guestCount = meta.guest_count ? Number(meta.guest_count) : null;

    const { data: eventData, error: eventInsertError } = await supabase.from("events").insert({
      event_id: eventId,
      payment_id: molliePaymentId,
      client_name: (meta.client_name as string) || "",
      client_email: clientEmail,
      client_phone: (meta.client_phone as string) || "",
      language: ((meta.language as string) || "fr").toUpperCase(),
      event_date: (meta.event_date as string) || null,
      address: (meta.address as string) || "",
      event_type: eventType,
      pack_id: packId,
      transport_fee_cents: meta.transport_fee_cents ? Number(meta.transport_fee_cents) : null,
      total_cents: meta.total_cents ? Number(meta.total_cents) : null,
      deposit_cents: DEPOSIT_CENTS,
      balance_due_cents: meta.balance_due_cents ? Number(meta.balance_due_cents) : null,
      guest_count: guestCount
    }).select("id").single();

    let eventUuid: string | null = null;

    if (eventInsertError) {
      // Ignorer si l'event existe déjà (unique constraint)
      if (!eventInsertError.message.includes("duplicate")) {
        console.error(`[mollie-webhook] Échec création event:`, { ...logContext, error: eventInsertError });
        throw new Error(eventInsertError.message);
      }
      console.log(`[mollie-webhook] Event déjà existant, ignoré:`, { ...logContext, eventId });

      // Récupérer l'UUID de l'event existant pour les notifications
      const { data: existingEvent } = await supabase
        .from("events")
        .select("id")
        .eq("event_id", eventId)
        .single();

      eventUuid = existingEvent?.id || null;
    } else {
      console.log(`[mollie-webhook] Event créé:`, { ...logContext, eventId });
      eventUuid = eventData?.id || null;

      // =============================================================================
      // 3b) Sync to Google Sheets (non-blocking)
      // =============================================================================
      syncEventToSheets({
        event_id: eventId,
        client_name: (meta.client_name as string) || "",
        client_email: clientEmail,
        client_phone: (meta.client_phone as string) || "",
        language: (meta.language as string) || "fr",
        event_date: (meta.event_date as string) || null,
        address: (meta.address as string) || "",
        event_type: eventType,
        guest_count: guestCount,
        pack_code: (meta.pack_code as string) || "",
        total_cents: meta.total_cents ? Number(meta.total_cents) : null,
        transport_fee_cents: meta.transport_fee_cents ? Number(meta.transport_fee_cents) : null,
        deposit_cents: DEPOSIT_CENTS,
        closing_date: paidAt,
      }).catch((err) => {
        console.error(`[mollie-webhook] Google Sheets sync error (non-blocking):`, {
          ...logContext,
          error: err instanceof Error ? err.message : String(err)
        });
      });
    }

    // =============================================================================
    // 4) Créer les notifications dans notifications_log
    // =============================================================================
    const locale = (meta.language as string) || "fr";

    if (eventUuid) {
      // Vérifier si la notification existe déjà (éviter les doublons)
      const { data: existingNotification } = await supabase
        .from("notifications")
        .select("id")
        .eq("template_key", "B2C_BOOKING_CONFIRMED")
        .eq("to_email", clientEmail)
        .eq("event_id", eventUuid)
        .maybeSingle();

      if (!existingNotification) {
        // Queue booking confirmation with full event payload
        const totalCentsVal = meta.total_cents ? Number(meta.total_cents) : null;
        const balanceCentsVal = meta.balance_due_cents ? Number(meta.balance_due_cents) : null;

        await supabase.from("notifications").insert({
          event_id: eventUuid,
          template_key: "B2C_BOOKING_CONFIRMED",
          to_email: clientEmail,
          locale,
          payload: {
            client_name: (meta.client_name as string) || "",
            event_date: (meta.event_date as string) || "",
            address: (meta.address as string) || "",
            pack_code: (meta.pack_code as string) || "",
            deposit: DEPOSIT_CENTS / 100,
            balance: balanceCentsVal ? balanceCentsVal / 100 : totalCentsVal ? (totalCentsVal - DEPOSIT_CENTS) / 100 : 0,
          },
          status: "queued"
        });

        console.log(`[mollie-webhook] Notification créée:`, { ...logContext, eventId, eventUuid });
      } else {
        console.log(`[mollie-webhook] Notification déjà existante, ignorée:`, { ...logContext, eventId });
      }
    } else {
      console.warn(`[mollie-webhook] Impossible de créer la notification: eventUuid manquant`, { ...logContext, eventId });
    }

    // =============================================================================
    // 5) Meta Conversions API - Track Purchase event
    // =============================================================================
    try {
      const totalCents = meta.total_cents ? Number(meta.total_cents) : DEPOSIT_CENTS;
      const totalEuros = totalCents / 100;

      await trackPurchase({
        email: clientEmail,
        phone: meta.client_phone as string | undefined,
        firstName: meta.client_name as string | undefined,
        value: totalEuros,
        currency: "EUR",
        orderId: eventId,
        contentName: (meta.pack_code as string) || "MirrorEffect Booking"
      });

      console.log(`[mollie-webhook] Meta CAPI Purchase envoyé:`, { ...logContext, eventId, value: totalEuros });
    } catch (error) {
      console.error(`[mollie-webhook] Meta CAPI erreur (non-bloquant):`, {
        ...logContext,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    const duration = Date.now() - startTime;

    console.log(`[mollie-webhook] Succès:`, {
      ...logContext,
      email: clientEmail,
      eventId,
      leadId: leadId || null,
      leadFound,
      duration: `${duration}ms`
    });

    releaseLock(molliePaymentId);

    return Response.json({
      ok: true,
      requestId,
      received: true,
      eventId,
      email: clientEmail,
      leadId: leadId || null,
      leadFound,
      duration: `${duration}ms`
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[mollie-webhook] Erreur:`, {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    });

    releaseLock(molliePaymentId);

    return Response.json(
      {
        ok: false,
        requestId,
        error: { type: "INTERNAL_ERROR", message: error instanceof Error ? error.message : String(error) },
        duration: `${duration}ms`
      },
      { status: 500 }
    );
  }
}

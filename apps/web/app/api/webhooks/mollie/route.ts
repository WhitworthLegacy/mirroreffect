import { gasPost } from "@/lib/gas";
import { fetchMolliePaymentStatus } from "@/lib/payments/mollie";

const DEPOSIT_CENTS = 18000;

// =============================================================================
// In-memory idempotency lock (60s TTL)
// Prevents concurrent processing of the same paymentId
// =============================================================================
const processingLocks = new Map<string, number>();
const LOCK_TTL_MS = 60_000; // 60 seconds

function acquireLock(paymentId: string): boolean {
  const now = Date.now();
  // Cleanup expired locks
  for (const [key, timestamp] of processingLocks.entries()) {
    if (now - timestamp > LOCK_TTL_MS) {
      processingLocks.delete(key);
    }
  }
  // Check if lock exists and is still valid
  const existingLock = processingLocks.get(paymentId);
  if (existingLock && now - existingLock < LOCK_TTL_MS) {
    return false; // Lock already held
  }
  // Acquire lock
  processingLocks.set(paymentId, now);
  return true;
}

function releaseLock(paymentId: string): void {
  processingLocks.delete(paymentId);
}

// Convertir cents en euros formaté
function centsToEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/**
 * Cherche une ligne dans Leads par email (case-insensitive)
 * Retourne la ligne la PLUS RÉCENTE si plusieurs matches (basé sur "Created At" ou index)
 * Retourne { leadId: string, rowIndex: number, createdAt: string } ou null
 */
async function findRowByEmail(email: string): Promise<{ leadId: string; rowIndex: number; createdAt: string } | null> {
  try {
    const result = await gasPost({
      action: "readSheet",
      key: process.env.GAS_KEY,
      data: { sheetName: "Leads" }
    });

    if (!result.values || !Array.isArray(result.values) || result.values.length < 2) {
      return null;
    }

    const rows = result.values as unknown[][];
    const headers = (rows[0] as string[]).map((h) => String(h).trim());
    const emailIdx = headers.findIndex((h) => h === "Email");
    const leadIdIdx = headers.findIndex((h) => h === "Lead ID");
    const createdAtIdx = headers.findIndex((h) => h === "Created At");

    if (emailIdx < 0 || leadIdIdx < 0) {
      return null;
    }

    const emailLower = email.trim().toLowerCase();
    const matches: Array<{ leadId: string; rowIndex: number; createdAt: string }> = [];

    // Chercher toutes les lignes correspondantes (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      const rowEmail = String(row[emailIdx] || "").trim().toLowerCase();

      if (rowEmail === emailLower) {
        const leadId = leadIdIdx >= 0 ? String(row[leadIdIdx] || "").trim() : null;
        const createdAt = createdAtIdx >= 0 ? String(row[createdAtIdx] || "").trim() : "";

        if (leadId) {
          matches.push({ leadId, rowIndex: i, createdAt });
        }
      }
    }

    if (matches.length === 0) {
      return null;
    }

    // Si plusieurs matches, prendre la plus récente (par "Created At" ou par index si Created At vide)
    if (matches.length === 1) {
      return matches[0];
    }

    // Trier par Created At (desc) puis par index (desc) comme fallback
    matches.sort((a, b) => {
      // Si Created At existe, comparer par date
      if (a.createdAt && b.createdAt) {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        if (!isNaN(dateA) && !isNaN(dateB)) {
          return dateB - dateA; // Plus récent en premier
        }
      }
      // Fallback: plus grand index = plus récent
      return b.rowIndex - a.rowIndex;
    });

    return matches[0]; // Retourner la plus récente
  } catch (error) {
    console.error("[mollie-webhook] findRowByEmail error:", error);
    return null;
  }
}

/**
 * Update une ligne Leads par Lead ID
 */
async function updateLeadRow(leadId: string, eventId: string): Promise<void> {
  await gasPost({
    action: "updateRowByLeadId",
    key: process.env.GAS_KEY,
    data: {
      sheetName: "Leads",
      leadId,
      values: {
        "Status": "converted",
        "Converted At": new Date().toISOString(),
        "Event ID": eventId
      }
    }
  });
}

/**
 * Crée une ligne minimale dans Clients avec les données disponibles
 */
async function appendClientRow(
  eventId: string,
  email: string,
  meta: Record<string, unknown>,
  paidAt: string
): Promise<void> {
  await gasPost({
    action: "appendRow",
    key: process.env.GAS_KEY,
    data: {
      sheetName: "Clients",
      values: {
        "Event ID": eventId,
        "Type Event": "b2c",
        "Email": email,
        "Nom": (meta.client_name as string) || "",
        "Phone": (meta.client_phone as string) || "",
        "Language": (meta.language as string) || "fr",
        "Date Event": (meta.event_date as string) || "",
        "Lieu Event": (meta.address as string) || "",
        "Pack": (meta.pack_code as string) || "",
        "Transport (€)": centsToEuros(Number(meta.transport_fee_cents) || 0),
        "Total": centsToEuros(Number(meta.total_cents) || 0),
        "Acompte": centsToEuros(Number(meta.deposit_cents) || DEPOSIT_CENTS),
        "Solde Restant": centsToEuros(Number(meta.balance_due_cents) || 0),
        "Date Acompte Payé": paidAt,
        "Created At": new Date().toISOString()
      }
    }
  });
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  // Logs structurés (sans secrets)
  const logHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    // Ne pas logger les secrets
    if (!key.toLowerCase().includes("secret") && !key.toLowerCase().includes("authorization")) {
      logHeaders[key] = value;
    } else {
      logHeaders[key] = "[REDACTED]";
    }
  });

  console.log(`[mollie-webhook] Request received:`, {
    requestId,
    method: req.method,
    headers: Object.keys(logHeaders),
    timestamp: new Date().toISOString()
  });

  // Sécurité: On ne valide pas via token/secret car Mollie n'envoie pas de header custom.
  // La sécurité est assurée par la validation du payment via l'API Mollie:
  // - On reçoit juste un `id=tr_xxx`
  // - On fetch le vrai statut depuis Mollie API (authentifié avec notre API key)
  // - Un attaquant ne peut pas forger un payment "paid" sans accès à notre compte Mollie

  // Mollie envoie id=tr_... (form-urlencoded)
  let raw: string;
  try {
    raw = await req.text();
  } catch (error) {
    console.error(`[mollie-webhook] Failed to read body:`, {
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });
    return Response.json(
      {
        ok: false,
        requestId,
        error: {
          type: "INVALID_BODY",
          message: "Failed to read request body"
        }
      },
      { status: 400 }
    );
  }

  const params = new URLSearchParams(raw);
  const molliePaymentId = params.get("id");

  if (!molliePaymentId) {
    console.warn(`[mollie-webhook] Missing payment ID in body:`, {
      requestId,
      bodyPreview: raw.substring(0, 100)
    });
    return Response.json(
      {
        ok: false,
        requestId,
        error: {
          type: "VALIDATION_ERROR",
          message: "Missing payment ID"
        }
      },
      { status: 400 }
    );
  }

  const logContext = {
    requestId,
    paymentId: molliePaymentId,
    timestamp: new Date().toISOString()
  };

  console.log(`[mollie-webhook] Processing payment:`, logContext);

  // =============================================================================
  // Idempotency Layer 1: In-memory lock (60s TTL)
  // Prevents concurrent/duplicate webhook calls for the same paymentId
  // =============================================================================
  if (!acquireLock(molliePaymentId)) {
    console.log(`[mollie-webhook] Lock already held, skipping:`, logContext);
    return Response.json({
      ok: true,
      requestId,
      received: true,
      skipped: true,
      reason: "lock_held"
    });
  }

  try {
    // =============================================================================
    // Idempotency Layer 2: Check Payments sheet for existing "paid" status
    // =============================================================================
    const paymentsResult = await gasPost({
      action: "readSheet",
      key: process.env.GAS_KEY,
      data: { sheetName: "Payments" }
    });

    // GAS returns { values: [...] } for readSheet action
    if (paymentsResult.values) {
      const rows = paymentsResult.values as unknown[][];
      if (rows.length >= 2) {
        const headers = (rows[0] as string[]).map((h) => String(h).trim());
        const paymentIdIdx = headers.findIndex((h) => h === "Payment ID");
        const statusIdx = headers.findIndex((h) => h === "Status");

        const existingPayment = rows.slice(1).find(
          (row) => String(row[paymentIdIdx]).trim() === molliePaymentId
        );

        if (existingPayment && String(existingPayment[statusIdx]).trim().toLowerCase() === "paid") {
          // Déjà traité
          console.log(`[mollie-webhook] Payment already processed:`, logContext);
          releaseLock(molliePaymentId);
          return Response.json({ ok: true, requestId, received: true, skipped: true, reason: "already_paid" });
        }
      }
    }

    // Fetch status Mollie
    const payment = await fetchMolliePaymentStatus(molliePaymentId);
    if (!payment) {
      console.warn(`[mollie-webhook] Payment not found in Mollie API:`, {
        ...logContext,
        mollieApiStatus: "not_found"
      });
      releaseLock(molliePaymentId);
      return Response.json(
        {
          ok: false,
          requestId,
          error: {
            type: "PAYMENT_NOT_FOUND",
            message: "Payment not found in Mollie"
          }
        },
        { status: 404 }
      );
    }

    console.log(`[mollie-webhook] Payment fetched from Mollie:`, {
      ...logContext,
      status: payment.status,
      amount_cents: payment.amount_cents,
      hasMetadata: !!payment.metadata
    });

    // On ne traite que paid
    if (payment.status !== "paid") {
      // Update payment status dans Payments sheet
      try {
        // Lire Payments pour trouver la ligne
        const paymentsResult = await gasPost({
          action: "readSheet",
          key: process.env.GAS_KEY,
          data: { sheetName: "Payments" }
        });

        if (paymentsResult.values) {
          const rows = paymentsResult.values as unknown[][];
          if (rows.length >= 2) {
            const headers = (rows[0] as string[]).map((h) => String(h).trim());
            const paymentIdIdx = headers.findIndex((h) => h === "Payment ID");

            const rowIndex = rows.slice(1).findIndex(
              (row) => String(row[paymentIdIdx]).trim() === molliePaymentId
            );

            if (rowIndex >= 0) {
              // Construire values array dans l'ordre des colonnes
              const valuesArray = headers.map((header) => {
                if (header === "Payment ID") return molliePaymentId;
                if (header === "Status") return payment.status;
                if (header === "Updated At") return new Date().toISOString();
                return ""; // Garder les autres colonnes vides (sera ignoré par updateRow)
              });

              await gasPost({
                action: "updateRow",
                key: process.env.GAS_KEY,
                data: {
                  sheetName: "Payments",
                  id: molliePaymentId,
                  values: valuesArray
                }
              });

              console.log(`[mollie-webhook] Payment status updated (not paid):`, {
                ...logContext,
                status: payment.status,
                updatePaymentsSuccess: true
              });
            }
          }
        }
      } catch (error) {
        console.error(`[mollie-webhook] Failed to update payment status:`, {
          ...logContext,
          status: payment.status,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      releaseLock(molliePaymentId);
      return Response.json({ ok: true, requestId, received: true, status: payment.status });
    }

    // Validate acompte
    if (payment.amount_cents !== DEPOSIT_CENTS) {
      console.warn(`[mollie-webhook] Invalid deposit amount:`, {
        ...logContext,
        expected: DEPOSIT_CENTS,
        received: payment.amount_cents
      });
      releaseLock(molliePaymentId);
      return Response.json(
        {
          ok: false,
          requestId,
          error: {
            type: "INVALID_DEPOSIT_AMOUNT",
            message: `Expected ${DEPOSIT_CENTS} cents, got ${payment.amount_cents}`
          }
        },
        { status: 400 }
      );
    }

    // Récupérer données depuis metadata
    const meta = payment.metadata || {};
    if (!meta.event_id) {
      console.warn(`[mollie-webhook] Missing event_id in metadata:`, logContext);
      releaseLock(molliePaymentId);
      return Response.json(
        {
          ok: false,
          requestId,
          error: {
            type: "MISSING_EVENT_ID",
            message: "event_id is required in payment metadata"
          }
        },
        { status: 400 }
      );
    }

    const eventId = meta.event_id as string;
    const paidAt = payment.paid_at || new Date().toISOString();

    // 1) Récupérer email du client depuis metadata (OBLIGATOIRE)
    // CRITIQUE: On ne dépend JAMAIS de billingAddress.email
    const clientEmail =
      meta.client_email && typeof meta.client_email === "string"
        ? meta.client_email.trim().toLowerCase()
        : null;

    if (!clientEmail) {
      console.error(`[mollie-webhook] MISSING client_email in metadata:`, {
        ...logContext,
        eventId,
        hasMetadata: !!meta,
        metadataKeys: meta ? Object.keys(meta) : []
      });
      // Return received:true mais NE PAS append Clients
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

    // 2) Chercher lead dans Leads par email (case-insensitive)
    // Prendre la ligne la plus récente si plusieurs matches
    let leadId: string | null = null;
    let leadIdFound = false;

    // Si meta.lead_id existe, l'utiliser directement (mais on vérifie quand même dans Leads)
    if (meta.lead_id && typeof meta.lead_id === "string") {
      const providedLeadId = meta.lead_id.trim();
      // Vérifier que ce lead_id existe bien dans Leads avec cet email
      const found = await findRowByEmail(clientEmail);
      if (found && found.leadId === providedLeadId) {
        leadId = providedLeadId;
        leadIdFound = true;
        console.log(`[mollie-webhook] Using lead_id from metadata (verified):`, {
          ...logContext,
          email: clientEmail,
          leadId,
          leadIdFound: true
        });
      } else {
        // lead_id dans metadata ne correspond pas à l'email, chercher par email uniquement
        if (found) {
          leadId = found.leadId;
          leadIdFound = true;
          console.warn(`[mollie-webhook] lead_id in metadata doesn't match email, using found lead:`, {
            ...logContext,
            email: clientEmail,
            metadataLeadId: providedLeadId,
            foundLeadId: found.leadId,
            leadIdFound: true
          });
        } else {
          console.warn(`[mollie-webhook] lead_id in metadata but no matching lead found by email:`, {
            ...logContext,
            email: clientEmail,
            metadataLeadId: providedLeadId,
            leadIdFound: false
          });
        }
      }
    } else {
      // Pas de lead_id dans metadata, chercher uniquement par email
      const found = await findRowByEmail(clientEmail);
      if (found) {
        leadId = found.leadId;
        leadIdFound = true;
        console.log(`[mollie-webhook] Lead found by email:`, {
          ...logContext,
          email: clientEmail,
          leadId,
          rowIndex: found.rowIndex,
          createdAt: found.createdAt,
          leadIdFound: true
        });
      } else {
        console.warn(`[mollie-webhook] No lead found by email:`, {
          ...logContext,
          email: clientEmail,
          leadIdFound: false
        });
      }
    }

    // 3) Update Leads si trouvé (AVANT append Clients)
    if (leadIdFound && leadId) {
      try {
        await updateLeadRow(leadId, eventId);
        console.log(`[mollie-webhook] Lead updated (Status=converted):`, {
          ...logContext,
          email: clientEmail,
          leadId,
          eventId,
          leadIdFound: true
        });
      } catch (error) {
        console.error(`[mollie-webhook] Failed to update lead:`, {
          ...logContext,
          email: clientEmail,
          leadId,
          error: error instanceof Error ? error.message : String(error),
          leadIdFound: true
        });
        // Continue quand même (non-blocking) mais on log l'erreur
      }
    }

    // 4) Append Clients (toujours, même si lead non trouvé)
    try {
      await appendClientRow(eventId, clientEmail, meta, paidAt);
      console.log(`[mollie-webhook] Client row appended:`, {
        ...logContext,
        email: clientEmail,
        eventId,
        leadIdFound,
        appendClientsSuccess: true
      });
    } catch (error) {
      console.error(`[mollie-webhook] Failed to append client row:`, {
        ...logContext,
        email: clientEmail,
        error: error instanceof Error ? error.message : String(error),
        appendClientsSuccess: false
      });
      // Erreur critique - on throw pour que le webhook soit retenté
      throw error;
    }

    // 5) Update payment status dans Payments sheet (CRITIQUE: doit être fait)
    try {
      // Lire Payments pour trouver la ligne et mapper les colonnes
      const paymentsResult = await gasPost({
        action: "readSheet",
        key: process.env.GAS_KEY,
        data: { sheetName: "Payments" }
      });

      if (paymentsResult.values) {
        const rows = paymentsResult.values as unknown[][];
        if (rows.length >= 2) {
          const headers = (rows[0] as string[]).map((h) => String(h).trim());
          const paymentIdIdx = headers.findIndex((h) => h === "Payment ID");

          const rowIndex = rows.slice(1).findIndex(
            (row) => String(row[paymentIdIdx]).trim() === molliePaymentId
          );

          if (rowIndex >= 0) {
            // Construire values array dans l'ordre des colonnes
            const existingRow = rows[rowIndex + 1] as unknown[];
            const valuesArray = headers.map((header, idx) => {
              if (header === "Payment ID") return molliePaymentId;
              if (header === "Status") return "paid";
              if (header === "Paid At") return paidAt;
              if (header === "Updated At") return new Date().toISOString();
              if (header === "Provider Payment ID") return molliePaymentId; // Stocker aussi le Payment ID de Mollie
              // Garder les valeurs existantes pour les autres colonnes
              return existingRow[idx] || "";
            });

            await gasPost({
              action: "updateRow",
              key: process.env.GAS_KEY,
              data: {
                sheetName: "Payments",
                id: molliePaymentId,
                values: valuesArray
              }
            });

            console.log(`[mollie-webhook] Payment updated in Payments sheet:`, {
              ...logContext,
              status: "paid",
              paidAt,
              updatePaymentsSuccess: true
            });
          } else {
            console.warn(`[mollie-webhook] Payment ID not found in Payments sheet:`, {
              ...logContext,
              updatePaymentsSuccess: false
            });
          }
        }
      }
    } catch (error) {
      console.error(`[mollie-webhook] Failed to update Payments sheet:`, {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
        updatePaymentsSuccess: false
      });
      // Erreur critique - on throw pour que le webhook soit retenté
      throw error;
    }

    // 5) Ajouter notifications
    if (clientEmail) {
      await gasPost({
        action: "appendRow",
        key: process.env.GAS_KEY,
        data: {
          sheetName: "Notifications",
          values: {
            "Template": "B2C_BOOKING_CONFIRMED",
            "Email": clientEmail,
            "Event ID": eventId,
            "Locale": (meta.language as string) || "fr",
            "Status": "queued",
            "Created At": new Date().toISOString()
          }
        }
      });

      await gasPost({
        action: "appendRow",
        key: process.env.GAS_KEY,
        data: {
          sheetName: "Notifications",
          values: {
            "Template": "B2C_EVENT_RECAP",
            "Email": clientEmail,
            "Event ID": eventId,
            "Locale": (meta.language as string) || "fr",
            "Status": "queued",
            "Created At": new Date().toISOString()
          }
        }
      });
    }

    const duration = Date.now() - startTime;
    const gasResults = {
      updateLeads: leadIdFound ? "success" : "skipped",
      appendClients: "success",
      updatePayments: "success",
      appendNotifications: clientEmail ? "success" : "skipped"
    };

    console.log(`[mollie-webhook] Success:`, {
      ...logContext,
      mollieStatus: payment.status,
      email: clientEmail,
      eventId,
      leadId: leadId || null,
      leadIdFound,
      gasResults,
      duration: `${duration}ms`
    });

    // Release lock on success (allow future retries if needed)
    releaseLock(molliePaymentId);

    return Response.json({
      ok: true,
      requestId,
      received: true,
      eventId,
      email: clientEmail,
      leadId: leadId || null,
      leadIdFound,
      gasResults,
      duration: `${duration}ms`
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[mollie-webhook] Error:`, {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    });

    // Release lock on error to allow retry
    releaseLock(molliePaymentId);

    return Response.json(
      {
        ok: false,
        requestId,
        error: {
          type: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : String(error)
        },
        duration: `${duration}ms`
      },
      { status: 500 }
    );
  }
}

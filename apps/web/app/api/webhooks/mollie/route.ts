import { gasPost } from "@/lib/gas";
import { fetchMolliePaymentStatus } from "@/lib/payments/mollie";

const DEPOSIT_CENTS = 18000;

// Convertir cents en euros formaté
function centsToEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export async function POST(req: Request) {
  // Protection webhook
  const secret = req.headers.get("x-webhook-secret");
  if (!process.env.MOLLIE_WEBHOOK_SECRET || secret !== process.env.MOLLIE_WEBHOOK_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // Mollie envoie id=tr_... (form-urlencoded)
  const raw = await req.text();
  const params = new URLSearchParams(raw);
  const molliePaymentId = params.get("id");

  if (!molliePaymentId) {
    return Response.json({ error: "missing_id" }, { status: 400 });
  }

  try {
    // Idempotence: vérifier si payment déjà traité dans Payments sheet
    const paymentsResult = await gasPost({
      action: "readSheet",
      key: process.env.GAS_KEY,
      data: { sheetName: "Payments" }
    });

    if (paymentsResult.ok && paymentsResult.data) {
      const rows = paymentsResult.data as unknown[][];
      if (rows.length >= 2) {
        const headers = (rows[0] as string[]).map(h => String(h).trim());
        const paymentIdIdx = headers.findIndex(h => h === "Payment ID");
        const statusIdx = headers.findIndex(h => h === "Status");

        const existingPayment = rows.slice(1).find(row =>
          String(row[paymentIdIdx]).trim() === molliePaymentId
        );

        if (existingPayment && String(existingPayment[statusIdx]).trim().toLowerCase() === "paid") {
          // Déjà traité
          return Response.json({ received: true });
        }
      }
    }

    // Fetch status Mollie
    const payment = await fetchMolliePaymentStatus(molliePaymentId);
    if (!payment) return Response.json({ error: "payment_not_found" }, { status: 404 });

    // On ne traite que paid
    if (payment.status !== "paid") {
      // Update payment status
      await gasPost({
        action: "updateRowByPaymentId",
        key: process.env.GAS_KEY,
        data: {
          sheetName: "Payments",
          paymentId: molliePaymentId,
          values: {
            "Status": payment.status,
            "Updated At": new Date().toISOString()
          }
        }
      });
      return Response.json({ received: true });
    }

    // Validate acompte
    if (payment.amount_cents !== DEPOSIT_CENTS) {
      return Response.json({ error: "invalid_deposit_amount" }, { status: 400 });
    }

    // Récupérer données depuis metadata
    const meta = payment.metadata;
    if (!meta?.event_id) {
      return Response.json({ error: "missing_event_id" }, { status: 400 });
    }

    const eventId = meta.event_id as string;
    const paidAt = payment.paid_at || new Date().toISOString();

    // 1) Créer l'event dans Clients sheet (acompte payé = client confirmé)
    // Date réservation = date acompte payé
    await gasPost({
      action: "appendRow",
      key: process.env.GAS_KEY,
      data: {
        sheetName: "Clients",
        values: {
          "Event ID": eventId,
          "Lead ID": meta.lead_id || "",
          "Type Event": "b2c",
          "Language": meta.language || "fr",
          "Nom": meta.client_name || "",
          "Email": meta.client_email || "",
          "Phone": meta.client_phone || "",
          "Date Event": meta.event_date || "",
          "Lieu Event": meta.address || "",
          "Pack": meta.pack_code || "",
          "Transport (€)": centsToEuros(Number(meta.transport_fee_cents) || 0),
          "Total": centsToEuros(Number(meta.total_cents) || 0),
          "Acompte": centsToEuros(Number(meta.deposit_cents) || DEPOSIT_CENTS),
          "Solde Restant": centsToEuros(Number(meta.balance_due_cents) || 0),
          "Date Acompte Payé": paidAt,
          "Created At": new Date().toISOString()
        }
      }
    });

    // 2) Update payment status dans Payments sheet
    await gasPost({
      action: "updateRowByPaymentId",
      key: process.env.GAS_KEY,
      data: {
        sheetName: "Payments",
        paymentId: molliePaymentId,
        values: {
          "Status": "paid",
          "Paid At": paidAt,
          "Updated At": new Date().toISOString()
        }
      }
    });

    // 3) Ajouter notifications
    await gasPost({
      action: "appendRow",
      key: process.env.GAS_KEY,
      data: {
        sheetName: "Notifications",
        values: {
          "Template": "B2C_BOOKING_CONFIRMED",
          "Email": meta.client_email || "",
          "Event ID": eventId,
          "Locale": meta.language || "fr",
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
          "Email": meta.client_email || "",
          "Event ID": eventId,
          "Locale": meta.language || "fr",
          "Status": "queued",
          "Created At": new Date().toISOString()
        }
      }
    });

    // 4) Marquer lead comme converted (si existe)
    if (meta.lead_id) {
      await gasPost({
        action: "updateRowByLeadId",
        key: process.env.GAS_KEY,
        data: {
          sheetName: "Leads",
          leadId: meta.lead_id,
          values: {
            "Status": "converted",
            "Converted At": new Date().toISOString(),
            "Event ID": eventId
          }
        }
      });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("[mollie-webhook] Error:", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}

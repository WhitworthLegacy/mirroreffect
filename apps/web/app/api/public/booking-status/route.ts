import { z } from "zod";
import { gasPost } from "@/lib/gas";

const BookingStatusQuerySchema = z.object({
  event_id: z.string().min(1)
});

const DEPOSIT_CENTS = 18000;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = BookingStatusQuerySchema.safeParse(params);

  if (!parsed.success) {
    return Response.json({ error: "invalid_query", issues: parsed.error.format() }, { status: 400 });
  }

  const { event_id } = parsed.data;

  try {
    // Lire Clients sheet pour trouver l'event
    const clientsResult = await gasPost({
      action: "readSheet",
      key: process.env.GAS_KEY,
      data: { sheetName: "Clients" }
    });

    // GAS returns { values: [...] } for readSheet action
    const values = clientsResult.values as unknown[][] | undefined;
    if (!values) {
      console.error("[booking-status] No values in GAS response:", clientsResult);
      return Response.json({ error: "sheets_error" }, { status: 500 });
    }

    const rows = values;
    if (rows.length < 2) {
      return Response.json({ error: "event_not_found" }, { status: 404 });
    }

    const headers = (rows[0] as string[]).map(h => String(h).trim());
    const eventIdIdx = headers.findIndex(h => h === "Event ID");
    const clientNameIdx = headers.findIndex(h => h === "Nom");
    const eventDateIdx = headers.findIndex(h => h === "Date Event");
    const totalIdx = headers.findIndex(h => h === "Total");

    // Chercher l'event par ID
    const eventRow = rows.slice(1).find(row => String(row[eventIdIdx]).trim() === event_id);

    if (!eventRow) {
      // Si pas dans Clients, vérifier dans Payments uniquement
      // Lire Payments sheet
      const paymentsResult = await gasPost({
        action: "readSheet",
        key: process.env.GAS_KEY,
        data: { sheetName: "Payments" }
      });

      if (paymentsResult.values) {
        const paymentRows = paymentsResult.values as unknown[][];
        if (paymentRows.length >= 2) {
          const paymentHeaders = (paymentRows[0] as string[]).map(h => String(h).trim());
          const pEventIdIdx = paymentHeaders.findIndex(h => h === "Event ID");
          const pStatusIdx = paymentHeaders.findIndex(h => h === "Status");

          const eventPayment = paymentRows.slice(1).find(row =>
            String(row[pEventIdIdx]).trim() === event_id
          );

          if (eventPayment) {
            const paymentStatus = String(eventPayment[pStatusIdx] || "unknown").trim();
            return Response.json({
              ok: true,
              event_id,
              client_name: null,
              event_date: null,
              total_cents: null,
              status: "pending",
              deposit_paid: paymentStatus === "paid",
              payment_status: paymentStatus,
              paid_at: null
            });
          }
        }
      }

      return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    // Parser le total en cents
    const parseCents = (val: unknown): number | null => {
      if (!val) return null;
      const str = String(val).trim().replace(/\s/g, "").replace(",", ".");
      const num = parseFloat(str);
      return isNaN(num) ? null : Math.round(num * 100);
    };

    // Lire Payments sheet pour vérifier le statut
    const paymentsResult = await gasPost({
      action: "readSheet",
      key: process.env.GAS_KEY,
      data: { sheetName: "Payments" }
    });

    let depositPaid = false;
    let paymentStatus = "unknown";
    let paidAt: string | null = null;

    // GAS returns { values: [...] } for readSheet action
    if (paymentsResult.values) {
      const paymentRows = paymentsResult.values as unknown[][];
      if (paymentRows.length >= 2) {
        const paymentHeaders = (paymentRows[0] as string[]).map(h => String(h).trim());
        const pEventIdIdx = paymentHeaders.findIndex(h => h === "Event ID");
        const pStatusIdx = paymentHeaders.findIndex(h => h === "Status");
        const pAmountIdx = paymentHeaders.findIndex(h => h === "Amount Cents");
        const pPaidAtIdx = paymentHeaders.findIndex(h => h === "Paid At");

        const eventPayments = paymentRows.slice(1).filter(row =>
          String(row[pEventIdIdx]).trim() === event_id
        );

        // Vérifier si acompte payé
        const paidPayment = eventPayments.find(row => {
          const status = String(row[pStatusIdx] || "").trim().toLowerCase();
          const amount = parseCents(row[pAmountIdx]);
          return status === "paid" && amount === DEPOSIT_CENTS;
        });

        if (paidPayment) {
          depositPaid = true;
          if (pPaidAtIdx >= 0) {
            paidAt = String(paidPayment[pPaidAtIdx] || "").trim() || null;
          }
        }

        // Dernier statut (prendre le plus récent)
        if (eventPayments.length > 0) {
          // Trier par Created At ou prendre le premier
          paymentStatus = String(eventPayments[eventPayments.length - 1][pStatusIdx] || "unknown").trim();
        }
      }
    }

    // Si dans Clients sheet = acompte payé (par définition de la règle)
    // Clients ne contient que les events avec acompte payé
    if (eventRow) {
      depositPaid = true;
    }

    return Response.json({
      ok: true,
      event_id,
      client_name: eventRow[clientNameIdx] ? String(eventRow[clientNameIdx]).trim() : null,
      event_date: eventRow[eventDateIdx] ? String(eventRow[eventDateIdx]).trim() : null,
      total_cents: parseCents(eventRow[totalIdx]),
      status: "active",
      deposit_paid: depositPaid,
      payment_status: paymentStatus,
      paid_at: paidAt
    });
  } catch (error) {
    console.error("[booking-status] Error:", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }
}

import { createSupabaseServerClient } from "@/lib/supabase";

/**
 * Webhook Google Sheets → Supabase
 *
 * Reçoit une ligne du sheet "Clients" (via Google Apps Script onEdit trigger)
 * et upsert dans public.events.
 *
 * Sécurité : vérifie SHEETS_WEBHOOK_SECRET
 */

/**
 * Parse un nombre au format européen ("1.234,56") vers des centimes (123456)
 */
function euroToCents(value: string | null | undefined): number | null {
  if (!value || value.trim() === "") return null;
  // "1.234,56" → "1234.56" → 123456
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return Math.round(num * 100);
}

/**
 * Parse une date DD/MM/YYYY ou YYYY-MM-DD vers YYYY-MM-DD
 */
function parseDate(value: string | null | undefined): string | null {
  if (!value || value.trim() === "") return null;
  // Déjà au format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  // Format DD/MM/YYYY
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return null;
}

export async function POST(req: Request) {
  const secret = process.env.SHEETS_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[sheets-webhook] SHEETS_WEBHOOK_SECRET not configured");
    return Response.json({ ok: false, error: "Webhook not configured" }, { status: 500 });
  }

  // Vérifier le secret
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (body.secret !== secret) {
    console.warn("[sheets-webhook] Invalid secret");
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const row = body.row as unknown as Record<string, string> | undefined;
  if (!row) {
    return Response.json({ ok: false, error: "Missing row data" }, { status: 400 });
  }

  // Mapper les colonnes du sheet vers les champs Supabase
  const clientName = row["Nom"] || "";
  const clientEmail = row["Email"] || "";

  if (!clientName && !clientEmail) {
    return Response.json({ ok: false, error: "Row must have at least Nom or Email" }, { status: 400 });
  }

  // Générer un event_id si absent
  const eventId = row["Event ID"] || `EVT-sheets-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Pack (€) = prix du pack seul = total_cents en DB
  // Total = Pack (€) + Transport (€) (valeur dérivée, pas stockée)
  const packCents = euroToCents(row["Pack (€)"]);
  const transportCents = euroToCents(row["Transport (€)"]);
  const depositCents = euroToCents(row["Acompte"]);

  // balance_due = Total - Acompte
  const totalSheetCents = euroToCents(row["Total"]);
  const balanceCents = totalSheetCents && depositCents
    ? totalSheetCents - depositCents
    : null;

  const eventData = {
    event_id: eventId,
    client_name: clientName,
    client_email: clientEmail.toLowerCase(),
    client_phone: row["Phone"] || null,
    language: (row["Language"] || "fr").toLowerCase(),
    event_date: parseDate(row["Date Event"]) || null,
    event_type: row["Type Event"] || null,
    address: row["Lieu Event"] || null,
    guest_count: row["Invités"] ? parseInt(row["Invités"], 10) || null : null,
    pack_id: row["Pack"] || null,
    total_cents: packCents,
    transport_fee_cents: transportCents,
    deposit_cents: depositCents,
    balance_due_cents: balanceCents,
    balance_status: balanceCents === 0 ? "paid" : "pending",
    closing_date: parseDate(row["Date acompte payé"]) || parseDate(row["Date Formulaire"]) || null,
    student_name: row["Etudiant"] || null,
    commercial_name: row["Commercial"] || null,
  };

  const supabase = createSupabaseServerClient();

  try {
    // Upsert: insert ou update si event_id existe déjà
    const { error } = await supabase
      .from("events")
      .upsert(eventData, { onConflict: "event_id" });

    if (error) {
      console.error("[sheets-webhook] Supabase upsert error:", error);
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log("[sheets-webhook] Event upserted:", { event_id: eventId, client: clientName });
    return Response.json({ ok: true, event_id: eventId });
  } catch (err) {
    console.error("[sheets-webhook] Exception:", err);
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

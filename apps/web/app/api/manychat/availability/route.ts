import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// Capacité : nombre de miroirs disponibles par jour
const MIRROR_CAPACITY = 4;

/**
 * API pour Manychat External Request
 * Vérifie si une date est disponible pour une réservation
 *
 * POST /api/manychat/availability
 * Body: { "date": "2026-06-15" }  (format YYYY-MM-DD ou DD/MM/YYYY)
 */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const body = await req.json();
    const dateInput = body.date;

    if (!dateInput) {
      return Response.json({
        ok: false,
        error: "Missing date parameter",
        requestId,
      }, { status: 400 });
    }

    // Normaliser la date au format YYYY-MM-DD
    const normalizedDate = normalizeDateToISO(dateInput);

    if (!normalizedDate) {
      return Response.json({
        ok: false,
        error: "Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY",
        date: dateInput,
        requestId,
      }, { status: 400 });
    }

    // Compter les réservations confirmées pour cette date
    const supabase = createSupabaseServerClient();

    const { data: events, error } = await supabase
      .from("events")
      .select("event_id, client_name")
      .eq("event_date", normalizedDate);

    if (error) {
      console.error(`[manychat-availability][${requestId}] Supabase error:`, error);
      return Response.json({
        ok: false,
        error: "Database error",
        requestId,
      }, { status: 500 });
    }

    const booked = events?.length || 0;
    const available = booked < MIRROR_CAPACITY;
    const remaining = Math.max(0, MIRROR_CAPACITY - booked);

    // Formater la date pour l'affichage (DD/MM/YYYY)
    const displayDate = formatDateDDMMYYYY(normalizedDate);

    const message = available
      ? `✅ Votre date est bien disponible le ${displayDate} (reste ${remaining} place${remaining > 1 ? 's' : ''}).`
      : `❌ Désolé, on est complet le ${displayDate}.`;

    console.log(`[manychat-availability][${requestId}] Date: ${normalizedDate}, Booked: ${booked}/${MIRROR_CAPACITY}, Available: ${available}`);

    return Response.json({
      ok: true,
      date: normalizedDate,
      capacity: MIRROR_CAPACITY,
      booked,
      available,
      remaining,
      message,
      requestId,
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[manychat-availability][${requestId}] Error:`, errorMsg);

    return Response.json({
      ok: false,
      error: errorMsg,
      requestId,
    }, { status: 500 });
  }
}

/**
 * Normalise une date vers le format YYYY-MM-DD
 * Accepte: YYYY-MM-DD, DD/MM/YYYY, ou Date object
 */
function normalizeDateToISO(dateInput: string | Date): string | null {
  if (!dateInput) return null;

  // Si c'est déjà une Date
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return dateInput.toISOString().split('T')[0];
  }

  const s = String(dateInput).trim();

  // Déjà au format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }

  // Format DD/MM/YYYY
  const match = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Formate une date YYYY-MM-DD vers DD/MM/YYYY
 */
function formatDateDDMMYYYY(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

import { createSupabaseServerClient } from "@/lib/supabase";

// Health check - miroirs codés en dur à 4 pour le MVP
const TOTAL_MIRRORS = 4;

export async function GET() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    const supabase = createSupabaseServerClient();

    // Compter les réservations du jour depuis la table events
    const { count, error } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("event_date", today)
      .not("deposit_cents", "is", null);

    if (error) {
      console.error("[health] Erreur Supabase:", error);
      return Response.json({
        ok: true,
        mirrors_total: TOTAL_MIRRORS,
        today_reservations: 0,
        today_remaining: TOTAL_MIRRORS,
        date: today,
        error: "database_unavailable"
      });
    }

    const todayReservations = count || 0;

    return Response.json({
      ok: true,
      mirrors_total: TOTAL_MIRRORS,
      today_reservations: todayReservations,
      today_remaining: Math.max(0, TOTAL_MIRRORS - todayReservations),
      date: today
    });
  } catch (error) {
    console.error("[health] Erreur:", error);
    return Response.json({
      ok: true,
      mirrors_total: TOTAL_MIRRORS,
      today_reservations: 0,
      today_remaining: TOTAL_MIRRORS,
      date: today,
      error: "internal_error"
    });
  }
}

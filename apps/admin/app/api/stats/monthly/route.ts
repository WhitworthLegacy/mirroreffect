import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Stats mensuelles - Lecture depuis la View Supabase v_monthly_stats
 * La View calcule automatiquement les agrégats depuis la table events
 * Plus besoin de Google Sheets !
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Format: YYYY-MM

    const supabase = createSupabaseServerClient();

    let query = supabase
      .from("v_monthly_stats")
      .select("*")
      .order("month", { ascending: false });

    // Filtrer par mois si spécifié
    if (month) {
      query = query.eq("month", month);
    }

    const { data: stats, error } = await query;

    if (error) {
      console.error("[stats/monthly] Erreur Supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: stats || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Note: POST et PATCH supprimés car les stats sont calculées automatiquement par la View
// Si tu as besoin de stocker des données manuelles, créer une table séparée

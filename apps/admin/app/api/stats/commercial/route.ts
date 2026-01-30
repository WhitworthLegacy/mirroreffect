import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Stats commerciaux - Lecture depuis la View Supabase v_commercial_monthly_stats
 * La View calcule automatiquement les agrégats depuis la table events
 * Plus besoin de Google Sheets !
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Format: YYYY-MM
    const commercialName = searchParams.get("commercial_name");

    const supabase = createSupabaseServerClient();

    let query = supabase
      .from("v_commercial_monthly_stats")
      .select("*")
      .order("month", { ascending: false });

    // Filtrer par mois si spécifié
    if (month) {
      query = query.eq("month", month);
    }

    // Filtrer par commercial si spécifié
    if (commercialName) {
      query = query.eq("commercial_name", commercialName);
    }

    const { data: stats, error } = await query;

    if (error) {
      console.error("[stats/commercial] Erreur Supabase:", error);
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

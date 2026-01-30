import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Lit les statistiques mensuelles depuis la View Supabase v_monthly_stats
 * Remplace la lecture depuis Google Sheets
 */
export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    const { data: stats, error } = await supabase
      .from("v_monthly_stats")
      .select("*")
      .order("month", { ascending: false });

    if (error) {
      console.error("[stats/google-sheets] Erreur Supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Les Views Supabase retournent déjà les montants en cents
    // Pas besoin de conversion
    return NextResponse.json(stats || []);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

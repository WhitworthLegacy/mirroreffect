import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET - Récupérer toutes les stats marketing
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data, error } = await supabase
      .from("monthly_marketing_stats")
      .select("*")
      .order("month", { ascending: false });

    if (error) {
      console.error("[API] Error fetching marketing stats:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[API] Exception:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST - Créer ou mettre à jour les stats d'un mois
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const body = await request.json();
    const { month, leads_meta, spent_meta_cents, leads_total, notes } = body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Invalid month format. Use YYYY-MM" },
        { status: 400 }
      );
    }

    // Upsert (insert or update on conflict)
    const { data, error } = await supabase
      .from("monthly_marketing_stats")
      .upsert(
        {
          month,
          leads_meta: leads_meta ?? 0,
          spent_meta_cents: spent_meta_cents ?? 0,
          leads_total: leads_total ?? 0,
          notes: notes ?? null,
        },
        { onConflict: "month" }
      )
      .select()
      .single();

    if (error) {
      console.error("[API] Error saving marketing stats:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[API] Exception:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { writeEventToSheets } from "@/lib/googleSheets";
import type { EventRow } from "@/lib/adminData";

/**
 * Synchronise tous les events de Supabase vers Google Sheets
 * Cette route peut être appelée par un cron job (Vercel Cron) toutes les 15 minutes
 */
export async function GET(request: Request) {
  // Vérifier l'authentification (optionnel, mais recommandé)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Si CRON_SECRET est défini, vérifier l'authentification
    // Sinon, permettre l'accès (pour les tests)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServerClient();
    
    // Récupérer tous les events
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!events || events.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: "No events to sync",
      });
    }

    // Écrire chaque event dans Google Sheets
    let synced = 0;
    let errors = 0;

    for (const event of events as EventRow[]) {
      try {
        await writeEventToSheets(event);
        synced++;
      } catch (error) {
        console.error(`Failed to sync event ${event.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      errors,
      total: events.length,
      message: `Synced ${synced} events to Google Sheets${errors > 0 ? ` (${errors} errors)` : ""}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

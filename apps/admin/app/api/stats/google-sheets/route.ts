import { NextResponse } from "next/server";
import { readMonthlyStatsFromSheets } from "@/lib/googleSheets";

/**
 * Lit les statistiques mensuelles depuis Google Sheets
 * Cette route remplace la lecture depuis Supabase pour le dashboard
 */
export async function GET() {
  try {
    const stats = await readMonthlyStatsFromSheets();

    // Convertir les données au format attendu par le dashboard
    const formattedStats = stats.map((stat) => {
      // Convertir les valeurs numériques depuis Google Sheets (qui sont en euros)
      const convertCents = (value: unknown): number | null => {
        if (value === null || value === undefined || value === "") return null;
        const num = typeof value === "string" ? parseFloat(value) : Number(value);
        return Number.isNaN(num) ? null : Math.round(num * 100); // Convertir en centimes
      };

      const convertNumber = (value: unknown): number | null => {
        if (value === null || value === undefined || value === "") return null;
        const num = typeof value === "string" ? parseFloat(value) : Number(value);
        return Number.isNaN(num) ? null : num;
      };

      return {
        month: stat.month || null,
        // Closings
        closing_total: convertNumber(stat.closing_total),
        closing_decouverte: convertNumber(stat.closing_decouverte),
        closing_essentiel: convertNumber(stat.closing_essentiel),
        closing_premium: convertNumber(stat.closing_premium),
        deposits_signed_cents: convertCents(stat.deposits_signed_cents),
        // Events
        events_count: convertNumber(stat.events_count),
        events_decouverte: convertNumber(stat.events_decouverte),
        events_essentiel: convertNumber(stat.events_essentiel),
        events_premium: convertNumber(stat.events_premium),
        // Revenus
        total_event_cents: convertCents(stat.total_event_cents),
        deposits_event_cents: convertCents(stat.deposits_event_cents),
        remaining_event_cents: convertCents(stat.remaining_event_cents),
        transport_cents: convertCents(stat.transport_cents),
        ca_total_cents: convertCents(stat.ca_total_cents),
        // Coûts
        student_hours: convertNumber(stat.student_hours),
        student_cost_cents: convertCents(stat.student_cost_cents),
        fuel_cost_cents: convertCents(stat.fuel_cost_cents),
        commercial_commission_cents: convertCents(stat.commercial_commission_cents),
        pack_cost_cents: convertCents(stat.pack_cost_cents),
        // Marges
        gross_margin_cents: convertCents(stat.gross_margin_cents),
        cashflow_gross_cents: convertCents(stat.cashflow_gross_cents),
        // Marketing
        leads_meta: convertNumber(stat.leads_meta),
        spent_meta_cents: convertCents(stat.spent_meta_cents),
      };
    });

    return NextResponse.json(formattedStats);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

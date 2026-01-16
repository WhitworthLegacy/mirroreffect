import DashboardPageClient from "@/components/DashboardPageClient";

// Type combiné: v_monthly_stats (calculé) + monthly_stats (marketing)
type MonthlyStats = {
  month: string;
  // Closings (depuis v_monthly_stats)
  closing_total: number | null;
  closing_decouverte: number | null;
  closing_essentiel: number | null;
  closing_premium: number | null;
  deposits_signed_cents: number | null;
  // Events (depuis v_monthly_stats)
  events_count: number | null;
  events_decouverte: number | null;
  events_essentiel: number | null;
  events_premium: number | null;
  // Revenus (depuis v_monthly_stats)
  total_event_cents: number | null;
  deposits_event_cents: number | null;
  remaining_event_cents: number | null;
  transport_cents: number | null;
  ca_total_cents: number | null;
  // Coûts (depuis v_monthly_stats)
  student_hours: number | null;
  student_cost_cents: number | null;
  fuel_cost_cents: number | null;
  commercial_commission_cents: number | null;
  pack_cost_cents: number | null;
  // Marges (depuis v_monthly_stats)
  gross_margin_cents: number | null;
  cashflow_gross_cents: number | null;
  // Marketing (depuis monthly_stats table)
  leads_meta: number | null;
  spent_meta_cents: number | null;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const selectedYear = params.year ? parseInt(params.year) : new Date().getFullYear();

  let monthlyStats: MonthlyStats[] = [];
  let statsError: string | null = null;

  try {
    // ✅ Events viennent maintenant du store client (pas de fetch server-side)

    // ✅ Lire les stats depuis Google Sheets (feuille "Stats")
    try {
      const { readMonthlyStatsFromSheets } = await import("@/lib/googleSheets");
      console.log("[Dashboard] Loading stats from Google Sheets (sheet: 'Stats')");
      const sheetsStats = await readMonthlyStatsFromSheets();
      console.log(`[Dashboard] Loaded ${sheetsStats.length} stats from Google Sheets`);
      
      if (sheetsStats && sheetsStats.length > 0) {
        // Convertir les données au format attendu
        monthlyStats = sheetsStats.map((stat) => {
          const convertCents = (value: unknown): number | null => {
            if (value === null || value === undefined || value === "") return null;
            const num = typeof value === "string" ? parseFloat(value) : Number(value);
            return Number.isNaN(num) ? null : Math.round(num * 100);
          };
          const convertNumber = (value: unknown): number | null => {
            if (value === null || value === undefined || value === "") return null;
            const num = typeof value === "string" ? parseFloat(value) : Number(value);
            return Number.isNaN(num) ? null : num;
          };
          return {
            month: stat.month || null,
            closing_total: convertNumber(stat.closing_total),
            closing_decouverte: convertNumber(stat.closing_decouverte),
            closing_essentiel: convertNumber(stat.closing_essentiel),
            closing_premium: convertNumber(stat.closing_premium),
            deposits_signed_cents: convertCents(stat.deposits_signed_cents),
            events_count: convertNumber(stat.events_count),
            events_decouverte: convertNumber(stat.events_decouverte),
            events_essentiel: convertNumber(stat.events_essentiel),
            events_premium: convertNumber(stat.events_premium),
            total_event_cents: convertCents(stat.total_event_cents),
            deposits_event_cents: convertCents(stat.deposits_event_cents),
            remaining_event_cents: convertCents(stat.remaining_event_cents),
            transport_cents: convertCents(stat.transport_cents),
            ca_total_cents: convertCents(stat.ca_total_cents),
            student_hours: convertNumber(stat.student_hours),
            student_cost_cents: convertCents(stat.student_cost_cents),
            fuel_cost_cents: convertCents(stat.fuel_cost_cents),
            commercial_commission_cents: convertCents(stat.commercial_commission_cents),
            pack_cost_cents: convertCents(stat.pack_cost_cents),
            gross_margin_cents: convertCents(stat.gross_margin_cents),
            cashflow_gross_cents: convertCents(stat.cashflow_gross_cents),
            leads_meta: convertNumber(stat.leads_meta),
            spent_meta_cents: convertCents(stat.spent_meta_cents),
          } as MonthlyStats;
        });
      } else {
        throw new Error("No data from Google Sheets");
      }
    } catch (sheetsError) {
      console.error("Failed to load stats from Google Sheets:", sheetsError);
      statsError = sheetsError instanceof Error ? sheetsError.message : "Failed to load stats from Google Sheets";
      // ❌ NO FALLBACK - Google Sheets is the only source for stats
    }
  } catch (error) {
    statsError = error instanceof Error ? error.message : "Impossible de charger les stats.";
  }

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 24 }}>
        <h1>Dashboard MirrorEffect</h1>
        <p className="admin-muted">
          Vue d&apos;ensemble des performances et métriques clés.
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>
          📊 Données lues depuis Google Sheets (feuille "Stats" + "Clients" via store)
        </p>
      </header>

      {statsError && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h2>Erreur de chargement stats</h2>
          <p className="admin-muted">{statsError}</p>
        </div>
      )}

      <DashboardPageClient monthlyStats={monthlyStats} selectedYear={selectedYear} />
    </main>
  );
}


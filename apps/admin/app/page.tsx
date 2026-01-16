import { getAdminSnapshot, type EventRow } from "@/lib/adminData";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { formatCurrency } from "@/lib/format";
import DashboardCharts from "@/components/DashboardCharts";

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

  let eventsError: string | null = null;
  let events: EventRow[] = [];
  let monthlyStats: MonthlyStats[] = [];

  try {
    const supabase = createSupabaseServerClient();

    // Get events
    const snapshot = await getAdminSnapshot();
    events = snapshot.events;
    eventsError = snapshot.error;

    // Lire les stats depuis Google Sheets au lieu de Supabase
    try {
      const { readMonthlyStatsFromSheets } = await import("@/lib/googleSheets");
      const sheetsStats = await readMonthlyStatsFromSheets();
      
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
      console.error("Failed to load stats from Google Sheets, falling back to Supabase:", sheetsError);
      // Fallback vers Supabase
      const [viewResult, marketingResult] = await Promise.all([
        supabase.from("v_monthly_stats").select("*").order("month", { ascending: false }),
        supabase.from("monthly_stats").select("month, leads_meta, spent_meta_cents")
      ]);

      if (viewResult.error) {
        eventsError = eventsError || viewResult.error.message;
      } else {
        const marketingByMonth = new Map(
          (marketingResult.data || []).map(m => [m.month?.substring(0, 7), m])
        );

        monthlyStats = (viewResult.data || []).map(stat => {
          const monthKey = stat.month?.substring(0, 7);
          const marketing = marketingByMonth.get(monthKey);
          return {
            ...stat,
            leads_meta: marketing?.leads_meta ?? null,
            spent_meta_cents: marketing?.spent_meta_cents ?? null,
          };
        }) as MonthlyStats[];
      }
    }
  } catch (error) {
    eventsError = error instanceof Error ? error.message : "Impossible de charger les données.";
  }

  // Filter events by year for CA calculation
  const eventsForYear = events.filter((event) => {
    if (!event.event_date) return false;
    return new Date(event.event_date).getFullYear() === selectedYear;
  });

  const totalRevenue = eventsForYear.reduce((sum, event) => sum + (event.total_cents ?? 0), 0);

  // Upcoming events (future only)
  const upcomingEvents = events.filter((event) => {
    if (!event.event_date) return false;
    return new Date(event.event_date) >= new Date();
  });

  // Solde restant = only future events
  const futureBalance = upcomingEvents.reduce((sum, event) => sum + (event.balance_due_cents ?? 0), 0);

  const leadCandidates = events.filter((event) => !event.pack_id);

  // Get available years from data
  const yearsFromEvents = events
    .map(e => e.event_date ? new Date(e.event_date).getFullYear() : null)
    .filter((y): y is number => y !== null);
  const yearsFromStats = monthlyStats
    .map(s => new Date(s.month).getFullYear())
    .filter(y => !isNaN(y));
  const years = [...new Set([...yearsFromEvents, ...yearsFromStats])].sort((a, b) => b - a);
  if (!years.includes(selectedYear)) years.unshift(selectedYear);

  // Calculate stats from monthly_stats for selected year
  const statsForYear = monthlyStats.filter(s => {
    const year = new Date(s.month).getFullYear();
    return year === selectedYear;
  });

  const yearlyTotalCA = statsForYear.reduce((sum, s) => sum + (s.ca_total_cents ?? 0), 0);
  const yearlyGrossMargin = statsForYear.reduce((sum, s) => sum + (s.gross_margin_cents ?? 0), 0);
  const yearlyCashflow = statsForYear.reduce((sum, s) => sum + (s.cashflow_gross_cents ?? 0), 0);
  const yearlyLeads = statsForYear.reduce((sum, s) => sum + (s.leads_meta ?? 0), 0);
  const yearlyClosings = statsForYear.reduce((sum, s) => sum + (s.closing_total ?? 0), 0);
  const yearlyEventsCount = statsForYear.reduce((sum, s) => sum + (s.events_count ?? 0), 0);
  const yearlyAdSpend = statsForYear.reduce((sum, s) => sum + (s.spent_meta_cents ?? 0), 0);

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 24 }}>
        <h1>Dashboard MirrorEffect</h1>
        <p className="admin-muted">
          Vue d&apos;ensemble des performances et métriques clés.
        </p>
      </header>

      {/* Year selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {years.slice(0, 5).map(y => (
          <a
            key={y}
            href={`?year=${y}`}
            className={selectedYear === y ? "admin-chip primary" : "admin-chip"}
          >
            {y}
          </a>
        ))}
      </div>

      {/* Main KPIs */}
      <section className="admin-kpi">
        <div className="admin-kpi-card">
          <h3>CA Total</h3>
          <p>{formatCurrency(yearlyTotalCA || totalRevenue)}</p>
          <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
            {yearlyEventsCount || eventsForYear.length} événements
          </span>
        </div>
        <div className="admin-kpi-card">
          <h3>Marge brute</h3>
          <p>{formatCurrency(yearlyGrossMargin)}</p>
          {yearlyTotalCA > 0 && (
            <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
              {((yearlyGrossMargin / yearlyTotalCA) * 100).toFixed(1)}% du CA
            </span>
          )}
        </div>
        <div className="admin-kpi-card">
          <h3>Cashflow brut</h3>
          <p>{formatCurrency(yearlyCashflow)}</p>
          {yearlyTotalCA > 0 && (
            <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
              {((yearlyCashflow / yearlyTotalCA) * 100).toFixed(1)}% du CA
            </span>
          )}
        </div>
        <div className="admin-kpi-card">
          <h3>Événements à venir</h3>
          <p>{upcomingEvents.length}</p>
          <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
            {formatCurrency(futureBalance)} à encaisser
          </span>
        </div>
      </section>

      {/* Secondary KPIs */}
      <section className="admin-kpi" style={{ marginTop: 16 }}>
        <div className="admin-kpi-card">
          <h3>Leads générés</h3>
          <p>{yearlyLeads}</p>
        </div>
        <div className="admin-kpi-card">
          <h3>Closings</h3>
          <p>{yearlyClosings}</p>
          {yearlyLeads > 0 && (
            <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
              {((yearlyClosings / yearlyLeads) * 100).toFixed(1)}% conversion
            </span>
          )}
        </div>
        <div className="admin-kpi-card">
          <h3>Dépenses Pub</h3>
          <p>{formatCurrency(yearlyAdSpend)}</p>
          {yearlyLeads > 0 && (
            <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
              {formatCurrency(yearlyAdSpend / yearlyLeads)} / lead
            </span>
          )}
        </div>
        <div className="admin-kpi-card">
          <h3>Leads à convertir</h3>
          <p>{leadCandidates.length}</p>
          <a href="/crm" className="admin-muted" style={{ fontSize: "0.875rem" }}>
            Voir CRM →
          </a>
        </div>
      </section>

      {eventsError && (
        <div className="admin-card" style={{ marginTop: 24 }}>
          <h2>Erreur de chargement</h2>
          <p className="admin-muted">{eventsError}</p>
        </div>
      )}

      {/* Interactive Charts Section */}
      <DashboardCharts
        monthlyStats={monthlyStats}
        events={events}
        selectedYear={selectedYear}
      />
    </main>
  );
}

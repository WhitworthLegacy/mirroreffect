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

    // Get v_monthly_stats (vue calculée) et monthly_stats (données marketing)
    const [viewResult, marketingResult] = await Promise.all([
      supabase.from("v_monthly_stats").select("*").order("month", { ascending: false }),
      supabase.from("monthly_stats").select("month, leads_meta, spent_meta_cents")
    ]);

    if (viewResult.error) {
      eventsError = eventsError || viewResult.error.message;
    } else {
      // Combiner les données de la vue avec les données marketing
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

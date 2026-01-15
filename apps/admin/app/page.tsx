import { getAdminSnapshot, type EventRow } from "@/lib/adminData";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { formatCurrency } from "@/lib/format";
import DashboardCharts from "@/components/DashboardCharts";

type MonthlyStats = {
  id: string;
  month: string;
  leads_meta: number | null;
  spent_meta_cents: number | null;
  cpl_meta_cents: number | null;
  closing_meta: number | null;
  conversion_meta_pct: number | null;
  cpa_meta_cents: number | null;
  leads_total: number | null;
  cpl_total_cents: number | null;
  closing_total: number | null;
  conversion_total_pct: number | null;
  cpa_total_cents: number | null;
  closing_decouverte: number | null;
  closing_essentiel: number | null;
  closing_premium: number | null;
  deposits_paid_cents: number | null;
  events_count: number | null;
  events_decouverte: number | null;
  events_essentiel: number | null;
  events_premium: number | null;
  total_event_cents: number | null;
  deposits_event_cents: number | null;
  remaining_event_cents: number | null;
  ca_total_cents: number | null;
  ca_generated_cents: number | null;
  transport_cents: number | null;
  pack_cost_cents: number | null;
  student_hours: number | null;
  student_cost_cents: number | null;
  fuel_cost_cents: number | null;
  commercial_commission_cents: number | null;
  fixed_charges_cents: number | null;
  gross_margin_cents: number | null;
  net_margin_cents: number | null;
  cashflow_gross_cents: number | null;
  cashflow_net_cents: number | null;
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

    // Get monthly_stats
    const { data: statsData, error: statsError } = await supabase
      .from("monthly_stats")
      .select("*")
      .order("month", { ascending: false });

    if (statsError) {
      eventsError = eventsError || statsError.message;
    } else {
      monthlyStats = (statsData || []) as MonthlyStats[];
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
  const yearlyNetMargin = statsForYear.reduce((sum, s) => sum + (s.net_margin_cents ?? 0), 0);
  const yearlyLeads = statsForYear.reduce((sum, s) => sum + (s.leads_total ?? 0), 0);
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
          <h3>Marge nette</h3>
          <p>{formatCurrency(yearlyNetMargin)}</p>
          {yearlyTotalCA > 0 && (
            <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
              {((yearlyNetMargin / yearlyTotalCA) * 100).toFixed(1)}% du CA
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

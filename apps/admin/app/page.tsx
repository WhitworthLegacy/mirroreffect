import { getAdminSnapshot, type EventRow } from "@/lib/adminData";
import { formatCurrency } from "@/lib/format";

type PeriodOption = "12months" | "year" | "quarter" | "month";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; year?: string }>;
}) {
  const params = await searchParams;
  const selectedYear = params.year ? parseInt(params.year) : new Date().getFullYear();
  const selectedPeriod = (params.period as PeriodOption) || "12months";

  let eventsError: string | null = null;
  let events: EventRow[] = [];
  try {
    const snapshot = await getAdminSnapshot();
    events = snapshot.events;
    eventsError = snapshot.error;
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
  const urgentBalances = upcomingEvents.filter((event) => (event.balance_due_cents ?? 0) > 0);

  const leadCandidates = events.filter((event) => !event.pack_id);

  // Get available years from data
  const years = [...new Set(events.map(e => e.event_date ? new Date(e.event_date).getFullYear() : null).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0));
  if (!years.includes(selectedYear)) years.unshift(selectedYear);

  // Calculate chart data based on selected period
  const now = new Date();
  let chartStats: { label: string; revenue: number; count: number }[] = [];

  if (selectedPeriod === "12months") {
    chartStats = Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const monthEvents = events.filter(event => {
        if (!event.event_date) return false;
        const eventDate = new Date(event.event_date);
        return eventDate.getMonth() === monthDate.getMonth() &&
               eventDate.getFullYear() === monthDate.getFullYear();
      });
      const revenue = monthEvents.reduce((sum, e) => sum + (e.total_cents ?? 0), 0);
      return {
        label: monthDate.toLocaleDateString('fr-FR', { month: 'short' }),
        revenue,
        count: monthEvents.length
      };
    });
  } else if (selectedPeriod === "year") {
    chartStats = Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(selectedYear, i, 1);
      const monthEvents = eventsForYear.filter(event => {
        if (!event.event_date) return false;
        return new Date(event.event_date).getMonth() === i;
      });
      const revenue = monthEvents.reduce((sum, e) => sum + (e.total_cents ?? 0), 0);
      return {
        label: monthDate.toLocaleDateString('fr-FR', { month: 'short' }),
        revenue,
        count: monthEvents.length
      };
    });
  } else if (selectedPeriod === "quarter") {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
    chartStats = Array.from({ length: 3 }, (_, i) => {
      const monthDate = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + i, 1);
      const monthEvents = events.filter(event => {
        if (!event.event_date) return false;
        const eventDate = new Date(event.event_date);
        return eventDate.getMonth() === monthDate.getMonth() &&
               eventDate.getFullYear() === monthDate.getFullYear();
      });
      const revenue = monthEvents.reduce((sum, e) => sum + (e.total_cents ?? 0), 0);
      return {
        label: monthDate.toLocaleDateString('fr-FR', { month: 'long' }),
        revenue,
        count: monthEvents.length
      };
    });
  } else if (selectedPeriod === "month") {
    // Weekly breakdown for current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weeksInMonth = Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()) / 7);
    chartStats = Array.from({ length: weeksInMonth }, (_, i) => {
      const weekStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 + i * 7);
      const weekEnd = new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(7 + i * 7, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()));
      const weekEvents = events.filter(event => {
        if (!event.event_date) return false;
        const eventDate = new Date(event.event_date);
        return eventDate >= weekStart && eventDate <= weekEnd;
      });
      const revenue = weekEvents.reduce((sum, e) => sum + (e.total_cents ?? 0), 0);
      return {
        label: `Sem ${i + 1}`,
        revenue,
        count: weekEvents.length
      };
    });
  }

  const maxChartRevenue = Math.max(...chartStats.map(m => m.revenue), 1);

  const periodLabels: Record<PeriodOption, string> = {
    "12months": "12 derniers mois",
    "year": `Année ${selectedYear}`,
    "quarter": "Ce trimestre",
    "month": "Ce mois-ci",
  };

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 24 }}>
        <h1>Dashboard MirrorEffect</h1>
        <p className="admin-muted">
          Vue d&apos;ensemble des performances et métriques clés.
        </p>
      </header>

      <section className="admin-kpi">
        <div className="admin-kpi-card">
          <h3>Événements à venir</h3>
          <p>{upcomingEvents.length}</p>
          <span className="admin-muted" style={{ fontSize: '0.875rem' }}>
            {events.length - upcomingEvents.length} passés
          </span>
        </div>
        <div className="admin-kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Chiffre d&apos;affaires</h3>
            <select
              defaultValue={selectedYear}
              onChange={(e) => {
                const url = new URL(window.location.href);
                url.searchParams.set('year', e.target.value);
                window.location.href = url.toString();
              }}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid #ddd',
                fontSize: '0.75rem',
                background: '#fff',
              }}
            >
              {years.map(y => (
                <option key={y} value={y!}>{y}</option>
              ))}
            </select>
          </div>
          <p>{formatCurrency(totalRevenue)}</p>
          <span className="admin-muted" style={{ fontSize: '0.875rem' }}>
            {eventsForYear.length} événements en {selectedYear}
          </span>
        </div>
        <div className="admin-kpi-card">
          <h3>Solde restant</h3>
          <p>{formatCurrency(futureBalance)}</p>
          <span className="admin-muted" style={{ fontSize: '0.875rem' }}>
            {urgentBalances.length} événements futurs
          </span>
        </div>
      </section>

      {eventsError && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h2>Erreur de chargement</h2>
          <p className="admin-muted">{eventsError}</p>
        </div>
      )}

      <section className="admin-grid">
        {/* Revenue Chart */}
        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Chiffre d&apos;affaires</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {(["12months", "year", "quarter", "month"] as PeriodOption[]).map((period) => (
                <a
                  key={period}
                  href={`?period=${period}&year=${selectedYear}`}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: '0.75rem',
                    textDecoration: 'none',
                    backgroundColor: selectedPeriod === period ? '#333' : '#eee',
                    color: selectedPeriod === period ? '#fff' : '#333',
                  }}
                >
                  {period === "12months" && "12 mois"}
                  {period === "year" && "Année"}
                  {period === "quarter" && "Trimestre"}
                  {period === "month" && "Mois"}
                </a>
              ))}
            </div>
          </div>
          <p className="admin-muted" style={{ marginBottom: 16 }}>{periodLabels[selectedPeriod]}</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 200 }}>
            {chartStats.map((stat, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: '0.65rem', color: '#666', textAlign: 'center' }}>
                  {formatCurrency(stat.revenue)}
                </div>
                <div
                  style={{
                    width: '100%',
                    backgroundColor: '#333',
                    height: Math.max((stat.revenue / maxChartRevenue) * 140, 4),
                    borderRadius: 4,
                    transition: 'height 0.3s ease'
                  }}
                />
                <div style={{ fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#666' }}>
                  {stat.count} ev.
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leads */}
        <div className="admin-card">
          <h2>Leads à convertir</h2>
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>
              {leadCandidates.length}
            </div>
            <div className="admin-muted" style={{ marginTop: 8 }}>
              prospects en attente
            </div>
          </div>
          <a href="/crm" style={{ display: 'block', textAlign: 'center', marginTop: 16, textDecoration: 'underline' }}>
            Voir tous les leads →
          </a>
        </div>
      </section>
    </main>
  );
}

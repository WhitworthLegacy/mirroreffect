"use client";

"use client";

import { useMemo } from "react";
import { useClientsStore } from "@/lib/clientsStore";
import { formatCurrency } from "@/lib/format";
import DashboardCharts from "@/components/DashboardCharts";

// Type combiné: v_monthly_stats (calculé) + monthly_stats (marketing)
type MonthlyStats = {
  month: string;
  closing_total: number | null;
  closing_decouverte: number | null;
  closing_essentiel: number | null;
  closing_premium: number | null;
  deposits_signed_cents: number | null;
  events_count: number | null;
  events_decouverte: number | null;
  events_essentiel: number | null;
  events_premium: number | null;
  total_event_cents: number | null;
  deposits_event_cents: number | null;
  remaining_event_cents: number | null;
  transport_cents: number | null;
  ca_total_cents: number | null;
  student_hours: number | null;
  student_cost_cents: number | null;
  fuel_cost_cents: number | null;
  commercial_commission_cents: number | null;
  pack_cost_cents: number | null;
  gross_margin_cents: number | null;
  cashflow_gross_cents: number | null;
  leads_meta: number | null;
  spent_meta_cents: number | null;
};

type Props = {
  monthlyStats: MonthlyStats[];
  selectedYear: number;
};

export default function DashboardPageClient({ monthlyStats, selectedYear }: Props) {
  const { rows: events, loading, error } = useClientsStore();

  // Filter events by year for CA calculation
  const eventsForYear = useMemo(() => {
    return events.filter((event) => {
      if (!event.event_date) return false;
      return new Date(event.event_date).getFullYear() === selectedYear;
    });
  }, [events, selectedYear]);

  const totalRevenue = useMemo(() => {
    return eventsForYear.reduce((sum, event) => sum + (event.total_cents ?? 0), 0);
  }, [eventsForYear]);

  // Upcoming events (future only)
  const upcomingEvents = useMemo(() => {
    return events.filter((event) => {
      if (!event.event_date) return false;
      return new Date(event.event_date) >= new Date();
    });
  }, [events]);

  // Solde restant = only future events
  const futureBalance = useMemo(() => {
    return upcomingEvents.reduce((sum, event) => sum + (event.balance_due_cents ?? 0), 0);
  }, [upcomingEvents]);

  const leadCandidates = useMemo(() => {
    return events.filter((event) => !event.pack_id);
  }, [events]);

  // Get available years from data
  const years = useMemo(() => {
    const yearsFromEvents = events
      .map(e => e.event_date ? new Date(e.event_date).getFullYear() : null)
      .filter((y): y is number => y !== null);
    const yearsFromStats = monthlyStats
      .map(s => new Date(s.month).getFullYear())
      .filter(y => !isNaN(y));
    const allYears = [...new Set([...yearsFromEvents, ...yearsFromStats])].sort((a, b) => b - a);
    if (!allYears.includes(selectedYear)) allYears.unshift(selectedYear);
    return allYears;
  }, [events, monthlyStats, selectedYear]);

  // Calculate stats from monthly_stats for selected year
  const statsForYear = useMemo(() => {
    return monthlyStats.filter(s => {
      const year = new Date(s.month).getFullYear();
      return year === selectedYear;
    });
  }, [monthlyStats, selectedYear]);

  const yearlyTotalCA = useMemo(() => {
    return statsForYear.reduce((sum, s) => sum + (s.ca_total_cents ?? 0), 0);
  }, [statsForYear]);

  const yearlyGrossMargin = useMemo(() => {
    return statsForYear.reduce((sum, s) => sum + (s.gross_margin_cents ?? 0), 0);
  }, [statsForYear]);

  const yearlyCashflow = useMemo(() => {
    return statsForYear.reduce((sum, s) => sum + (s.cashflow_gross_cents ?? 0), 0);
  }, [statsForYear]);

  const yearlyLeads = useMemo(() => {
    return statsForYear.reduce((sum, s) => sum + (s.leads_meta ?? 0), 0);
  }, [statsForYear]);

  const yearlyClosings = useMemo(() => {
    return statsForYear.reduce((sum, s) => sum + (s.closing_total ?? 0), 0);
  }, [statsForYear]);

  const yearlyEventsCount = useMemo(() => {
    return statsForYear.reduce((sum, s) => sum + (s.events_count ?? 0), 0);
  }, [statsForYear]);

  const yearlyAdSpend = useMemo(() => {
    return statsForYear.reduce((sum, s) => sum + (s.spent_meta_cents ?? 0), 0);
  }, [statsForYear]);

  if (loading && !events.length) {
    return (
      <div className="admin-card">
        <p className="admin-muted">Chargement des événements...</p>
      </div>
    );
  }

  return (
    <>
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

      {error && (
        <div className="admin-card" style={{ marginTop: 24 }}>
          <h2>Erreur de chargement</h2>
          <p className="admin-muted">{error}</p>
        </div>
      )}

      {/* Interactive Charts Section */}
      <DashboardCharts
        monthlyStats={monthlyStats}
        events={events}
        selectedYear={selectedYear}
      />
    </>
  );
}

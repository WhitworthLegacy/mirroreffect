"use client";

import { useMemo, useEffect, useState } from "react";
import { useSheetsStore } from "@/lib/sheetsStore";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { formatCurrency } from "@/lib/format";
import DashboardCharts from "@/components/DashboardCharts";

type Props = {
  selectedYear: number;
};

// Type for monthly stats from Supabase view
type MonthlyStatRow = {
  month: string;
  month_start: string;
  closing_total: number;
  closing_decouverte: number;
  closing_essentiel: number;
  closing_premium: number;
  deposits_signed_cents: number;
  events_count: number;
  events_decouverte: number;
  events_essentiel: number;
  events_premium: number;
  total_event_cents_ht: number;
  deposits_event_cents_ht: number;
  remaining_event_cents_ht: number;
  ca_acomptes_restants_cents_ht: number;
  ca_total_cents_ht: number;
  transport_cents_ht: number;
  pack_cost_cents: number;
  student_hours: number;
  student_cost_cents: number;
  fuel_cost_cents: number;
  commercial_commission_cents: number;
  fixed_charges_cents: number;
  gross_margin_cents: number;
  cashflow_gross_cents: number;
  cashflow_net_cents: number;
};

export default function DashboardPageClient({ selectedYear }: Props) {
  const { events, isLoading: eventsLoading, error: eventsError } = useSheetsStore();

  // Local state for monthly stats from Supabase view
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatRow[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Load monthly stats from Supabase view
  useEffect(() => {
    async function loadMonthlyStats() {
      setStatsLoading(true);
      setStatsError(null);

      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) {
          throw new Error("Supabase non configuré");
        }

        const { data, error } = await supabase
          .from("v_monthly_stats")
          .select("*")
          .order("month", { ascending: false });

        if (error) throw error;

        setMonthlyStats(data as MonthlyStatRow[] || []);
      } catch (err) {
        console.error("[Dashboard] Error loading monthly stats:", err);
        setStatsError(err instanceof Error ? err.message : "Erreur de chargement des stats");
      } finally {
        setStatsLoading(false);
      }
    }

    loadMonthlyStats();
  }, []);

  const isLoading = eventsLoading || statsLoading;
  const error = eventsError || statsError;

  // Filter stats for selected year
  const statsForYear = useMemo(() => {
    return monthlyStats.filter((stat) => {
      const year = parseInt(stat.month.substring(0, 4), 10);
      return year === selectedYear;
    });
  }, [monthlyStats, selectedYear]);

  // Calculate KPIs from Supabase view data
  const kpis = useMemo(() => {
    let caTotal = 0;
    let caGenere = 0;
    let margeBruteOpe = 0;
    let margeNetteOpe = 0;
    let cashflowBrut = 0;
    let cashflowNet = 0;
    let eventsCount = 0;

    for (const stat of statsForYear) {
      // CA (Acomptes + Restants) - already in cents HT
      caTotal += stat.ca_acomptes_restants_cents_ht || 0;

      // CA généré (Event + Transport)
      caGenere += stat.ca_total_cents_ht || 0;

      // Marge brute opé. (Events)
      margeBruteOpe += stat.gross_margin_cents || 0;

      // Marge nette = Marge brute - staff - fuel - commission
      margeNetteOpe += (stat.gross_margin_cents || 0) -
        (stat.student_cost_cents || 0) -
        (stat.fuel_cost_cents || 0) -
        (stat.commercial_commission_cents || 0);

      // Cashflow Brut (mensuel)
      cashflowBrut += stat.cashflow_gross_cents || 0;

      // Cashflow Net (mensuel)
      cashflowNet += stat.cashflow_net_cents || 0;

      // # Events
      eventsCount += stat.events_count || 0;
    }

    return {
      caTotal,
      caGenere,
      margeBruteOpe,
      margeNetteOpe,
      cashflowBrut,
      cashflowNet,
      eventsCount,
    };
  }, [statsForYear]);

  // Filter events by year for fallback calculations
  const eventsForYear = useMemo(() => {
    return events.filter((event) => {
      if (!event.event_date) return false;
      return new Date(event.event_date).getFullYear() === selectedYear;
    });
  }, [events, selectedYear]);

  // Upcoming events (future only)
  const upcomingEvents = useMemo(() => {
    return events.filter((event) => {
      if (!event.event_date) return false;
      return new Date(event.event_date) >= new Date();
    });
  }, [events]);

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
      .map(stat => parseInt(stat.month.substring(0, 4), 10))
      .filter((y): y is number => !isNaN(y));

    const allYears = [...new Set([...yearsFromEvents, ...yearsFromStats])].sort((a, b) => b - a);
    if (!allYears.includes(selectedYear)) allYears.unshift(selectedYear);
    return allYears;
  }, [events, monthlyStats, selectedYear]);

  // Convert Supabase stats to format for DashboardCharts
  const monthlyStatsForCharts = useMemo(() => {
    return statsForYear.map((stat) => ({
      month: stat.month,
      closing_total: stat.closing_total,
      closing_decouverte: stat.closing_decouverte,
      closing_essentiel: stat.closing_essentiel,
      closing_premium: stat.closing_premium,
      deposits_signed_cents: stat.deposits_signed_cents,
      events_count: stat.events_count,
      events_decouverte: stat.events_decouverte,
      events_essentiel: stat.events_essentiel,
      events_premium: stat.events_premium,
      total_event_cents: stat.total_event_cents_ht,
      deposits_event_cents: stat.deposits_event_cents_ht,
      remaining_event_cents: stat.remaining_event_cents_ht,
      transport_cents: stat.transport_cents_ht,
      ca_total_cents: stat.ca_acomptes_restants_cents_ht,
      student_hours: stat.student_hours,
      student_cost_cents: stat.student_cost_cents,
      fuel_cost_cents: stat.fuel_cost_cents,
      commercial_commission_cents: stat.commercial_commission_cents,
      pack_cost_cents: stat.pack_cost_cents,
      gross_margin_cents: stat.gross_margin_cents,
      cashflow_gross_cents: stat.cashflow_gross_cents,
      leads_meta: null,
      spent_meta_cents: null,
    }));
  }, [statsForYear]);

  if (isLoading && !events.length) {
    return (
      <div className="admin-card">
        <p className="admin-muted">Chargement des données...</p>
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

      {/* Main KPIs - 3 columns as per design spec */}
      <section className="admin-kpi" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="admin-kpi-card">
          <h3>CA Total</h3>
          <p>{formatCurrency(kpis.caTotal)}</p>
          <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
            {kpis.eventsCount || eventsForYear.length} événements
          </span>
          {!kpis.caTotal && (
            <span className="admin-muted" style={{ fontSize: "0.75rem", color: "var(--warning)", display: "block", marginTop: 4 }}>
              ⚠️ Données Stats manquantes
            </span>
          )}
        </div>
        <div className="admin-kpi-card">
          <h3>CA généré</h3>
          <p>{formatCurrency(kpis.caGenere)}</p>
          {kpis.caTotal > 0 && (
            <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
              {((kpis.caGenere / kpis.caTotal) * 100).toFixed(1)}% du CA total
            </span>
          )}
        </div>
        <div className="admin-kpi-card">
          <h3>Cashflow net</h3>
          <p>{formatCurrency(kpis.cashflowNet)}</p>
          {kpis.caTotal > 0 && (
            <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
              {((kpis.cashflowNet / kpis.caTotal) * 100).toFixed(1)}% du CA
            </span>
          )}
        </div>
      </section>

      {/* Secondary KPIs - Collapsible section */}
      <details style={{ marginTop: 16 }}>
        <summary style={{
          cursor: "pointer",
          padding: "12px 0",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "var(--text-secondary)",
          borderBottom: "1px solid var(--border)",
          marginBottom: 16
        }}>
          Plus de métriques
        </summary>
        <section className="admin-kpi" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div className="admin-kpi-card">
            <h3>Marge brute opé.</h3>
            <p>{formatCurrency(kpis.margeBruteOpe)}</p>
            {kpis.caTotal > 0 && (
              <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
                {((kpis.margeBruteOpe / kpis.caTotal) * 100).toFixed(1)}% du CA
              </span>
            )}
          </div>
          <div className="admin-kpi-card">
            <h3>Cashflow brut</h3>
            <p>{formatCurrency(kpis.cashflowBrut)}</p>
            {kpis.caTotal > 0 && (
              <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
                {((kpis.cashflowBrut / kpis.caTotal) * 100).toFixed(1)}% du CA
              </span>
            )}
          </div>
          <div className="admin-kpi-card">
            <h3>Marge nette opé.</h3>
            <p>{formatCurrency(kpis.margeNetteOpe)}</p>
            {kpis.caTotal > 0 && (
              <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
                {((kpis.margeNetteOpe / kpis.caTotal) * 100).toFixed(1)}% du CA
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
          <div className="admin-kpi-card">
            <h3>Leads à convertir</h3>
            <p>{leadCandidates.length}</p>
            <a href="/crm" className="admin-muted" style={{ fontSize: "0.875rem" }}>
              Voir CRM →
            </a>
          </div>
        </section>
      </details>

      {error && (
        <div className="admin-card" style={{ marginTop: 24 }}>
          <h2>Erreur de chargement</h2>
          <p className="admin-muted">{error}</p>
        </div>
      )}

      {/* Interactive Charts Section */}
      <DashboardCharts
        monthlyStats={monthlyStatsForCharts}
        events={events}
        selectedYear={selectedYear}
      />
    </>
  );
}

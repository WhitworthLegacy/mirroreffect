"use client";

import { useMemo, useEffect, useState } from "react";
import { useSheetsStore } from "@/lib/sheetsStore";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { formatCurrency } from "@/lib/format";
import DashboardCharts from "@/components/DashboardCharts";
import MarketingStatsModal from "@/components/MarketingStatsModal";

type Props = {
  selectedYear: number;
};

// Type for monthly stats from Supabase view
type MonthlyStatRow = {
  month: string;
  month_start: string;
  // Marketing stats (manual)
  leads_meta: number;
  spent_meta_cents: number;
  leads_total: number;
  // Closings
  closing_total: number;
  closing_decouverte: number;
  closing_essentiel: number;
  closing_premium: number;
  deposits_signed_cents: number;
  // Events
  events_count: number;
  events_decouverte: number;
  events_essentiel: number;
  events_premium: number;
  // Revenue
  total_event_cents_ht: number;
  deposits_event_cents_ht: number;
  remaining_event_cents_ht: number;
  ca_acomptes_restants_cents_ht: number;
  ca_total_cents_ht: number;
  transport_cents_ht: number;
  // Costs
  pack_cost_cents: number;
  student_hours: number;
  student_cost_cents: number;
  fuel_cost_cents: number;
  commercial_commission_cents: number;
  fixed_charges_cents: number;
  // Margins
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

  // Marketing stats modal
  const [isMarketingModalOpen, setIsMarketingModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Load monthly stats from Supabase view
  const loadMonthlyStats = async () => {
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
  };

  useEffect(() => {
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

  // Calculate KPIs from Supabase view data OR fallback to events data
  const kpis = useMemo(() => {
    // First try from the stats view
    let caTotal = 0;
    let caGenere = 0;
    let margeBruteOpe = 0;
    let margeNetteOpe = 0;
    let cashflowBrut = 0;
    let cashflowNet = 0;
    let eventsCount = 0;

    for (const stat of statsForYear) {
      caTotal += stat.ca_acomptes_restants_cents_ht || 0;
      caGenere += stat.ca_total_cents_ht || 0;
      margeBruteOpe += stat.gross_margin_cents || 0;
      margeNetteOpe += (stat.gross_margin_cents || 0) -
        (stat.student_cost_cents || 0) -
        (stat.fuel_cost_cents || 0) -
        (stat.commercial_commission_cents || 0);
      cashflowBrut += stat.cashflow_gross_cents || 0;
      cashflowNet += stat.cashflow_net_cents || 0;
      eventsCount += stat.events_count || 0;
    }

    // Fallback: calculate from events if stats view returns 0
    if (caTotal === 0 && eventsForYear.length > 0) {
      // Filter events for selected year
      for (const event of eventsForYear) {
        // CA Total = sum of total_cents (HT = /1.21)
        const totalHT = Math.round((event.total_cents ?? 0) / 1.21);
        const transportHT = Math.round((event.transport_fee_cents ?? 0) / 1.21);
        const depositHT = Math.round((event.deposit_cents ?? 0) / 1.21);
        const balanceHT = Math.round((event.balance_due_cents ?? 0) / 1.21);

        caTotal += depositHT + balanceHT;
        caGenere += totalHT + transportHT;

        // Costs
        const studentCost = event.student_rate_cents ?? 0;
        const fuelCost = event.fuel_cost_cents ?? 0;
        const commCost = event.commercial_commission_cents ?? 0;

        // Marge brute = Revenue - Pack cost (estimate 50€ per event)
        const packCost = 5000; // 50€ average pack cost
        margeBruteOpe += totalHT - packCost;

        // Marge nette
        margeNetteOpe += totalHT - packCost - studentCost - fuelCost - commCost;

        eventsCount++;
      }

      // Cashflow (simplified)
      const monthlyCharges = 90536; // 905.36€ in cents
      const monthsInYear = 12;
      cashflowBrut = margeBruteOpe;
      cashflowNet = margeBruteOpe - (monthlyCharges * monthsInYear);
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
  }, [statsForYear, eventsForYear]);

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

  // Calculate marketing KPIs
  const marketingKpis = useMemo(() => {
    let leadsMeta = 0;
    let spentMeta = 0;
    let leadsTotal = 0;
    let closings = 0;

    for (const stat of statsForYear) {
      leadsMeta += stat.leads_meta || 0;
      spentMeta += stat.spent_meta_cents || 0;
      leadsTotal += stat.leads_total || 0;
      closings += stat.closing_total || 0;
    }

    const cplMeta = leadsMeta > 0 ? Math.round(spentMeta / leadsMeta) : 0;
    const conversionRate = leadsMeta > 0 ? (closings / leadsMeta) * 100 : 0;
    const cpa = closings > 0 ? Math.round(spentMeta / closings) : 0;

    return {
      leadsMeta,
      spentMeta,
      leadsTotal,
      closings,
      cplMeta,
      conversionRate,
      cpa,
    };
  }, [statsForYear]);

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
      leads_meta: stat.leads_meta,
      spent_meta_cents: stat.spent_meta_cents,
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
      {/* Year selector + Marketing Stats button */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        {years.slice(0, 5).map(y => (
          <a
            key={y}
            href={`?year=${y}`}
            className={selectedYear === y ? "admin-chip primary" : "admin-chip"}
          >
            {y}
          </a>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => {
            setSelectedMonth(null);
            setIsMarketingModalOpen(true);
          }}
          className="admin-chip secondary"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Stats Marketing
        </button>
      </div>

      {/* Main KPIs - 3 columns as per design spec */}
      <section className="admin-kpi" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="admin-kpi-card">
          <h3>CA Total</h3>
          <p>{formatCurrency(kpis.caTotal)}</p>
          <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
            {kpis.eventsCount || eventsForYear.length} événements
          </span>
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

      {/* Marketing KPIs */}
      {marketingKpis.leadsMeta > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 16, color: "var(--text-primary)" }}>
            Performance Marketing META
          </h2>
          <div className="admin-kpi" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <div className="admin-kpi-card">
              <h3># Leads META</h3>
              <p>{marketingKpis.leadsMeta}</p>
            </div>
            <div className="admin-kpi-card">
              <h3>Spent META</h3>
              <p>{formatCurrency(marketingKpis.spentMeta)}</p>
            </div>
            <div className="admin-kpi-card">
              <h3>CPL META</h3>
              <p>{formatCurrency(marketingKpis.cplMeta)}</p>
            </div>
            <div className="admin-kpi-card">
              <h3># Closings</h3>
              <p>{marketingKpis.closings}</p>
            </div>
            <div className="admin-kpi-card">
              <h3>Conversion %</h3>
              <p>{marketingKpis.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="admin-kpi-card">
              <h3>CPA</h3>
              <p>{formatCurrency(marketingKpis.cpa)}</p>
            </div>
          </div>
        </section>
      )}

      {/* Interactive Charts Section */}
      <DashboardCharts
        monthlyStats={monthlyStatsForCharts}
        events={events}
        selectedYear={selectedYear}
      />

      {/* Marketing Stats Modal */}
      <MarketingStatsModal
        isOpen={isMarketingModalOpen}
        onClose={() => setIsMarketingModalOpen(false)}
        onSaved={loadMonthlyStats}
        selectedMonth={selectedMonth || undefined}
        existingData={selectedMonth ? {
          month: selectedMonth,
          leads_meta: statsForYear.find(s => s.month === selectedMonth)?.leads_meta || 0,
          spent_meta_cents: statsForYear.find(s => s.month === selectedMonth)?.spent_meta_cents || 0,
          leads_total: statsForYear.find(s => s.month === selectedMonth)?.leads_total || 0,
        } : null}
      />
    </>
  );
}

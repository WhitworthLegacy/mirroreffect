"use client";

import { useMemo, useCallback } from "react";
import { useSheetsStore } from "@/lib/sheetsStore";
import { formatCurrency } from "@/lib/format";
import DashboardCharts from "@/components/DashboardCharts";

type Props = {
  selectedYear: number;
};

// Helper pour parser un nombre européen (1.234,56) en centimes
function parseEuropeanNumberToCents(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  let num: number;
  if (typeof value === "string") {
    const cleaned = value.trim().replace(/\s/g, "");
    if (cleaned.includes(",")) {
      const normalized = cleaned.replace(/\./g, "").replace(",", ".");
      num = parseFloat(normalized);
    } else {
      num = parseFloat(cleaned);
    }
  } else {
    num = Number(value);
  }
  return Number.isNaN(num) ? null : Math.round(num * 100);
}

// Helper pour parser un nombre européen simple
function parseEuropeanNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  let num: number;
  if (typeof value === "string") {
    const cleaned = value.trim().replace(/\s/g, "");
    if (cleaned.includes(",")) {
      const normalized = cleaned.replace(/\./g, "").replace(",", ".");
      num = parseFloat(normalized);
    } else {
      num = parseFloat(cleaned);
    }
  } else {
    num = Number(value);
  }
  return Number.isNaN(num) ? null : num;
}

export default function DashboardPageClient({ selectedYear }: Props) {
  const { events, statsRows, statsHeaders, isLoading, error, getCell, findRowByDate } = useSheetsStore();

  // Helper pour obtenir une valeur depuis Stats par header exact
  const getStatsValue = useCallback((row: unknown[], headerName: string, asCents = false): number | null => {
    const headerIndex = statsHeaders.findIndex((h) => String(h).trim() === headerName);
    if (headerIndex < 0) {
      console.warn(`[Dashboard] Header "${headerName}" not found in Stats`);
      return null;
    }
    const value = row[headerIndex];
    return asCents ? parseEuropeanNumberToCents(value) : parseEuropeanNumber(value);
  }, [statsHeaders]);

  // Filtrer les lignes Stats pour l'année sélectionnée
  const statsForYear = useMemo(() => {
    if (!statsRows.length || !statsHeaders.length) return [];
    
    const dateIndex = statsHeaders.findIndex((h) => String(h).trim() === "Date");
    if (dateIndex < 0) return [];

    return statsRows.filter((row) => {
      const dateValue = String(row[dateIndex] || "").trim();
      if (!dateValue) return false;
      
      // Parser la date (format peut être YYYY-MM ou YYYY-MM-DD)
      const dateMatch = dateValue.match(/^(\d{4})-(\d{2})/);
      if (!dateMatch) return false;
      
      const rowYear = parseInt(dateMatch[1], 10);
      return rowYear === selectedYear;
    });
  }, [statsRows, statsHeaders, selectedYear]);

  // Calculer les KPI depuis Stats avec headers exacts
  const kpis = useMemo(() => {
    let caTotal = 0;
    let caGenere = 0;
    let margeBruteOpe = 0;
    let margeNetteOpe = 0;
    let cashflowBrut = 0;
    let cashflowNet = 0;
    let eventsCount = 0;

    for (const row of statsForYear) {
      // CA (Acomptes + Restants)
      const ca = getStatsValue(row, "CA (Acomptes + Restants)", true);
      if (ca !== null) caTotal += ca;

      // CA généré (Event + Transport)
      const caGen = getStatsValue(row, "CA généré (Event + Transport)", true);
      if (caGen !== null) caGenere += caGen;

      // Marge brute opé. (Events)
      const margeBrute = getStatsValue(row, "Marge brute opé. (Events)", true);
      if (margeBrute !== null) margeBruteOpe += margeBrute;

      // Marge nette opé. (Events)
      const margeNette = getStatsValue(row, "Marge nette opé. (Events)", true);
      if (margeNette !== null) margeNetteOpe += margeNette;

      // Cashflow Brut (mensuel)
      const cfBrut = getStatsValue(row, "Cashflow Brut (mensuel)", true);
      if (cfBrut !== null) cashflowBrut += cfBrut;

      // Cashflow Net (mensuel)
      const cfNet = getStatsValue(row, "Cashflow Net (mensuel)", true);
      if (cfNet !== null) cashflowNet += cfNet;

      // # Events
      const evCount = getStatsValue(row, "# Events", false);
      if (evCount !== null) eventsCount += evCount;
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
  }, [statsForYear, getStatsValue]);

  // Filter events by year for fallback calculations
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
    
    const yearsFromStats: number[] = [];
    if (statsHeaders.length > 0) {
      const dateIndex = statsHeaders.findIndex((h) => String(h).trim() === "Date");
      if (dateIndex >= 0) {
        for (const row of statsRows) {
          const dateValue = String(row[dateIndex] || "").trim();
          const dateMatch = dateValue.match(/^(\d{4})/);
          if (dateMatch) {
            const year = parseInt(dateMatch[1], 10);
            if (!isNaN(year)) yearsFromStats.push(year);
          }
        }
      }
    }
    
    const allYears = [...new Set([...yearsFromEvents, ...yearsFromStats])].sort((a, b) => b - a);
    if (!allYears.includes(selectedYear)) allYears.unshift(selectedYear);
    return allYears;
  }, [events, statsRows, statsHeaders, selectedYear]);

  // Convertir statsRows en format MonthlyStats pour DashboardCharts (compatibilité)
  const monthlyStatsForCharts = useMemo(() => {
    return statsForYear
      .map((row) => {
        const dateIndex = statsHeaders.findIndex((h) => String(h).trim() === "Date");
        const month = dateIndex >= 0 ? String(row[dateIndex] || "").trim() : "";
        
        // Filtrer les lignes sans mois valide
        if (!month) return null;
        
        return {
          month: month,
        closing_total: getStatsValue(row, "# closing Total", false),
        closing_decouverte: getStatsValue(row, "# C.Découverte", false),
        closing_essentiel: getStatsValue(row, "# C.Essentiel", false),
        closing_premium: getStatsValue(row, "# C.Premium", false),
        deposits_signed_cents: getStatsValue(row, "Acomptes (payés)", true),
        events_count: getStatsValue(row, "# Events", false),
        events_decouverte: getStatsValue(row, "# E.Découverte", false),
        events_essentiel: getStatsValue(row, "# E.Essentiel", false),
        events_premium: getStatsValue(row, "# E.Premium", false),
        total_event_cents: getStatsValue(row, "Total (event)", true),
        deposits_event_cents: getStatsValue(row, "Acomptes (event)", true),
        remaining_event_cents: getStatsValue(row, "Restants (event)", true),
        transport_cents: getStatsValue(row, "€ transport (Ev. Réalisés)", true),
        ca_total_cents: getStatsValue(row, "CA (Acomptes + Restants)", true),
        student_hours: getStatsValue(row, "Heures étudiants", false),
        student_cost_cents: getStatsValue(row, "Coût staff étudiants", true),
        fuel_cost_cents: getStatsValue(row, "Essence", true),
        commercial_commission_cents: getStatsValue(row, "Comm Commerciaux", true),
        pack_cost_cents: getStatsValue(row, "Coût packs (Ev. Réalisés)", true),
        gross_margin_cents: getStatsValue(row, "Marge brute opé. (Events)", true),
        cashflow_gross_cents: getStatsValue(row, "Cashflow Brut (mensuel)", true),
        leads_meta: getStatsValue(row, "# Leads META", false),
        spent_meta_cents: getStatsValue(row, "Spent META", true),
        };
      })
      .filter((stat): stat is NonNullable<typeof stat> => stat !== null);
  }, [statsForYear, getStatsValue]);

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

      {/* Main KPIs */}
      <section className="admin-kpi">
        <div className="admin-kpi-card">
          <h3>CA Total</h3>
          <p>{formatCurrency(kpis.caTotal || totalRevenue)}</p>
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
          <h3>Cashflow net</h3>
          <p>{formatCurrency(kpis.cashflowNet)}</p>
          {kpis.caTotal > 0 && (
            <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
              {((kpis.cashflowNet / kpis.caTotal) * 100).toFixed(1)}% du CA
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
          <h3>Marge nette opé.</h3>
          <p>{formatCurrency(kpis.margeNetteOpe)}</p>
          {kpis.caTotal > 0 && (
            <span className="admin-muted" style={{ fontSize: "0.875rem" }}>
              {((kpis.margeNetteOpe / kpis.caTotal) * 100).toFixed(1)}% du CA
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
        monthlyStats={monthlyStatsForCharts}
        events={events}
        selectedYear={selectedYear}
      />
    </>
  );
}

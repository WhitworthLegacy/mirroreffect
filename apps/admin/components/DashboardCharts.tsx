"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/format";
import type { EventRow } from "@/lib/adminData";

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

type ChartType = "revenue" | "margin" | "leads" | "costs" | "events";

type Props = {
  monthlyStats: MonthlyStats[];
  events: EventRow[];
  selectedYear: number;
};

const CHART_CONFIGS: Record<ChartType, { label: string; color: string }> = {
  revenue: { label: "Chiffre d'affaires", color: "var(--gradient-accent)" },
  margin: { label: "Marges", color: "var(--gradient-success)" },
  leads: { label: "Leads & Conversions", color: "#f59e0b" },
  costs: { label: "Coûts", color: "#ef4444" },
  events: { label: "Événements", color: "#8b5cf6" },
};

export default function DashboardCharts({ monthlyStats, events, selectedYear }: Props) {
  const [activeChart, setActiveChart] = useState<ChartType>("revenue");
  const [showComparison, setShowComparison] = useState(false);

  // Filter stats for selected year and sort by month
  const statsForYear = useMemo(() => {
    return monthlyStats
      .filter(s => new Date(s.month).getFullYear() === selectedYear)
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [monthlyStats, selectedYear]);

  // Get previous year stats for comparison
  const statsPreviousYear = useMemo(() => {
    return monthlyStats
      .filter(s => new Date(s.month).getFullYear() === selectedYear - 1)
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [monthlyStats, selectedYear]);

  // Calculate events per month from events data
  const eventsPerMonth = useMemo(() => {
    const byMonth: Record<string, { count: number; revenue: number }> = {};
    for (const event of events) {
      if (!event.event_date) continue;
      const monthKey = event.event_date.substring(0, 7);
      if (!byMonth[monthKey]) byMonth[monthKey] = { count: 0, revenue: 0 };
      byMonth[monthKey].count += 1;
      byMonth[monthKey].revenue += event.total_cents ?? 0;
    }
    return byMonth;
  }, [events]);

  // Generate chart data based on active chart type
  const chartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, "0");
      return `${selectedYear}-${month}`;
    });

    return months.map(monthKey => {
      const stat = statsForYear.find(s => s.month.startsWith(monthKey));
      const prevStat = statsPreviousYear.find(s => s.month.startsWith(`${selectedYear - 1}-${monthKey.split("-")[1]}`));
      const eventData = eventsPerMonth[monthKey] || { count: 0, revenue: 0 };

      const date = new Date(monthKey + "-01");
      const label = date.toLocaleDateString("fr-FR", { month: "short" });

      switch (activeChart) {
        case "revenue":
          return {
            label,
            value1: stat?.ca_total_cents ?? eventData.revenue,
            value2: showComparison ? (prevStat?.ca_total_cents ?? 0) : 0,
            label1: "CA",
            label2: `CA ${selectedYear - 1}`,
          };
        case "margin":
          return {
            label,
            value1: stat?.gross_margin_cents ?? 0,
            value2: stat?.cashflow_gross_cents ?? 0,
            label1: "Marge brute",
            label2: "Cashflow brut",
          };
        case "leads":
          return {
            label,
            value1: stat?.leads_meta ?? 0,
            value2: stat?.closing_total ?? 0,
            label1: "Leads Meta",
            label2: "Closings",
            isCount: true,
          };
        case "costs":
          return {
            label,
            value1: stat?.spent_meta_cents ?? 0,
            value2: (stat?.student_cost_cents ?? 0) + (stat?.fuel_cost_cents ?? 0) + (stat?.commercial_commission_cents ?? 0),
            label1: "Publicité",
            label2: "Opérationnel",
          };
        case "events":
          return {
            label,
            value1: stat?.events_count ?? eventData.count,
            value2: 0,
            label1: "Événements",
            label2: "",
            isCount: true,
          };
        default:
          return { label, value1: 0, value2: 0, label1: "", label2: "" };
      }
    });
  }, [activeChart, statsForYear, statsPreviousYear, eventsPerMonth, selectedYear, showComparison]);

  const maxValue = Math.max(...chartData.flatMap(d => [d.value1, d.value2]), 1);
  const isCountChart = chartData[0]?.isCount;

  const formatValue = (value: number, isCount?: boolean) => {
    if (isCount) return value.toString();
    return formatCurrency(value);
  };

  // Monthly stats table data
  const tableData = useMemo(() => {
    return statsForYear.map(stat => {
      const date = new Date(stat.month);
      return {
        month: date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
        ca: stat.ca_total_cents ?? 0,
        grossMargin: stat.gross_margin_cents ?? 0,
        cashflow: stat.cashflow_gross_cents ?? 0,
        leads: stat.leads_meta ?? 0,
        closings: stat.closing_total ?? 0,
        events: stat.events_count ?? 0,
        adSpend: stat.spent_meta_cents ?? 0,
      };
    });
  }, [statsForYear]);

  return (
    <section style={{ marginTop: 32 }}>
      {/* Chart Type Tabs */}
      <div className="admin-tabs" style={{ marginBottom: 0 }}>
        {(Object.keys(CHART_CONFIGS) as ChartType[]).map(type => (
          <button
            key={type}
            className={`admin-tab ${activeChart === type ? "active" : ""}`}
            onClick={() => setActiveChart(type)}
          >
            {CHART_CONFIGS[type].label}
          </button>
        ))}
      </div>

      {/* Chart Card */}
      <div className="admin-card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{CHART_CONFIGS[activeChart].label}</h2>
          {activeChart === "revenue" && (
            <button
              className={`admin-chip ${showComparison ? "primary" : ""}`}
              onClick={() => setShowComparison(!showComparison)}
              style={{ fontSize: "0.75rem" }}
            >
              Comparer à {selectedYear - 1}
            </button>
          )}
        </div>

        {/* Legend */}
        {chartData[0]?.label1 && (
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: CHART_CONFIGS[activeChart].color }} />
              <span className="admin-muted" style={{ fontSize: "0.75rem" }}>{chartData[0].label1}</span>
            </div>
            {chartData[0].label2 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: "var(--text-muted)", opacity: 0.5 }} />
                <span className="admin-muted" style={{ fontSize: "0.75rem" }}>{chartData[0].label2}</span>
              </div>
            )}
          </div>
        )}

        {/* Bar Chart */}
        <div className="admin-chart">
          {chartData.map((data, i) => (
            <div key={i} className="admin-chart-bar">
              <div className="admin-chart-value">
                {formatValue(data.value1, isCountChart)}
              </div>
              <div
                className="admin-chart-fill"
                style={{
                  height: Math.max((data.value1 / maxValue) * 180, 4),
                  background: CHART_CONFIGS[activeChart].color,
                }}
              />
              {data.value2 > 0 && (
                <div
                  style={{
                    width: "100%",
                    height: Math.max((data.value2 / maxValue) * 180, 4),
                    background: "var(--text-muted)",
                    opacity: 0.4,
                    borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                    marginTop: -4,
                  }}
                />
              )}
              <div className="admin-chart-label">{data.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Table */}
      {tableData.length > 0 && (
        <div className="admin-card" style={{ marginTop: 20 }}>
          <h2>Détail mensuel {selectedYear}</h2>
          <div className="admin-list" style={{ border: "none", marginTop: 16 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mois</th>
                  <th style={{ textAlign: "right" }}>CA</th>
                  <th style={{ textAlign: "right" }}>Marge brute</th>
                  <th style={{ textAlign: "right" }}>Cashflow</th>
                  <th style={{ textAlign: "right" }}>Leads</th>
                  <th style={{ textAlign: "right" }}>Closings</th>
                  <th style={{ textAlign: "right" }}>Events</th>
                  <th style={{ textAlign: "right" }}>Pub</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => (
                  <tr key={i}>
                    <td style={{ textTransform: "capitalize" }}>{row.month}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(row.ca)}</td>
                    <td style={{ textAlign: "right" }}>
                      <span className={row.grossMargin > 0 ? "admin-badge success" : "admin-badge danger"}>
                        {formatCurrency(row.grossMargin)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className={row.cashflow > 0 ? "admin-badge success" : "admin-badge danger"}>
                        {formatCurrency(row.cashflow)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>{row.leads}</td>
                    <td style={{ textAlign: "right" }}>{row.closings}</td>
                    <td style={{ textAlign: "right" }}>{row.events}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrency(row.adSpend)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "var(--bg-tertiary)", fontWeight: 700 }}>
                  <td>Total</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(tableData.reduce((s, r) => s + r.ca, 0))}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(tableData.reduce((s, r) => s + r.grossMargin, 0))}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(tableData.reduce((s, r) => s + r.cashflow, 0))}</td>
                  <td style={{ textAlign: "right" }}>{tableData.reduce((s, r) => s + r.leads, 0)}</td>
                  <td style={{ textAlign: "right" }}>{tableData.reduce((s, r) => s + r.closings, 0)}</td>
                  <td style={{ textAlign: "right" }}>{tableData.reduce((s, r) => s + r.events, 0)}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(tableData.reduce((s, r) => s + r.adSpend, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {tableData.length === 0 && (
        <div className="admin-card" style={{ marginTop: 20, textAlign: "center", padding: 40 }}>
          <p className="admin-muted">
            Aucune donnée monthly_stats pour {selectedYear}.
          </p>
          <p className="admin-muted" style={{ fontSize: "0.875rem", marginTop: 8 }}>
            Les graphiques utilisent les données des événements disponibles.
          </p>
        </div>
      )}
    </section>
  );
}

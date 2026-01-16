"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/format";
import CommercialModal, { type CommercialMonthlyStats } from "@/components/CommercialModal";

type Props = {
  initialStats: Array<{
    month: string;
    commercial_name: string;
    [key: string]: unknown;
  }>;
  error: string | null;
};

export default function CommercialPageClient({ initialStats, error: initialError }: Props) {
  const [stats, setStats] = useState<CommercialMonthlyStats[]>(initialStats as CommercialMonthlyStats[]);
  const [error, setError] = useState<string | null>(initialError);
  const [selectedStat, setSelectedStat] = useState<CommercialMonthlyStats | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedCommercial, setSelectedCommercial] = useState<string | null>(null);

  const months = useMemo(() => 
    [...new Set(stats.map(s => s.month?.substring(0, 7)))]
      .filter(Boolean)
      .sort((a, b) => (b || "").localeCompare(a || "")),
    [stats]
  );

  const commercials = useMemo(() => 
    [...new Set(stats.map(s => s.commercial_name))]
      .filter(Boolean)
      .sort(),
    [stats]
  );

  const filteredStats = useMemo(() => 
    stats.filter(s => {
      if (selectedMonth && !s.month?.startsWith(selectedMonth)) return false;
      if (selectedCommercial && s.commercial_name !== selectedCommercial) return false;
      return true;
    }),
    [stats, selectedMonth, selectedCommercial]
  );

  const handleSaved = () => {
    window.location.reload();
  };

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 24 }}>
        <h1>Commerciaux</h1>
        <p className="admin-muted">Performance des commerciaux par mois</p>
      </header>

      {error && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h2>Erreur de chargement</h2>
          <p className="admin-muted">{error}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <select
          value={selectedMonth || ""}
          onChange={(e) => setSelectedMonth(e.target.value || null)}
          style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
        >
          <option value="">Tous les mois</option>
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={selectedCommercial || ""}
          onChange={(e) => setSelectedCommercial(e.target.value || null)}
          style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
        >
          <option value="">Tous les commerciaux</option>
          {commercials.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mois</th>
              <th>Commercial</th>
              <th>Appels totaux</th>
              <th>Appels &gt; 5 min</th>
              <th>Deals fermés</th>
              <th>% Conversion</th>
              <th>Commissions</th>
              <th>Bonus total</th>
              <th>Total TVAC</th>
            </tr>
          </thead>
          <tbody>
            {filteredStats.map((stat, idx) => (
              <tr key={idx} className="admin-row" onClick={() => setSelectedStat(stat)} style={{ cursor: "pointer" }}>
                <td>{stat.month ? new Date(stat.month).toLocaleDateString("fr-BE", { year: "numeric", month: "short" }) : "—"}</td>
                <td style={{ fontWeight: 600 }}>{stat.commercial_name || "—"}</td>
                <td>{stat.total_calls ?? 0}</td>
                <td>{stat.calls_over_5min ?? 0}</td>
                <td>{stat.closed_deals ?? 0}</td>
                <td>{stat.conversion_pct ? `${stat.conversion_pct.toFixed(1)}%` : "—"}</td>
                <td>{formatCurrency(stat.commissions_cents)}</td>
                <td>{formatCurrency(stat.total_bonus_cents)}</td>
                <td>{formatCurrency(stat.total_tvac_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredStats.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
            Aucune donnée trouvée
          </div>
        )}
      </div>

      {selectedStat && (
        <CommercialModal
          stat={selectedStat}
          onClose={() => setSelectedStat(null)}
          onSaved={handleSaved}
        />
      )}
    </main>
  );
}

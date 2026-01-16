"use client";

import { useState } from "react";
import StudentModal, { type StudentMonthlyStats } from "./StudentModal";
import { formatCurrency } from "@/lib/format";

type Props = {
  initialStats: StudentMonthlyStats[];
};

export default function StudentsList({ initialStats }: Props) {
  const [selectedStat, setSelectedStat] = useState<StudentMonthlyStats | null>(null);

  return (
    <>
      <div className="admin-card">
        <h2>Détail mensuel</h2>
        <p className="admin-muted" style={{ marginBottom: 16, fontSize: '0.875rem' }}>
          Calculé automatiquement depuis les événements.
        </p>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mois</th>
              <th>Étudiant</th>
              <th style={{ textAlign: "right" }}>Events</th>
              <th style={{ textAlign: "right" }}>Heures</th>
              <th style={{ textAlign: "right" }}>Rémunération</th>
            </tr>
          </thead>
          <tbody>
            {initialStats.map((stat, idx) => (
              <tr
                key={`${stat.month}-${stat.student_name}-${idx}`}
                onClick={() => setSelectedStat(stat)}
                style={{ cursor: "pointer" }}
              >
                <td>{new Date(stat.month).toLocaleDateString('fr-BE', { year: 'numeric', month: 'long' })}</td>
                <td style={{ fontWeight: 700 }}>{stat.student_name}</td>
                <td style={{ textAlign: "right" }}>{stat.event_count ?? 0}</td>
                <td style={{ textAlign: "right" }}>{stat.total_hours ? `${stat.total_hours}h` : "—"}</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(stat.total_remuneration_cents)}</td>
              </tr>
            ))}
            {initialStats.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-muted">
                  Aucune donnée mensuelle.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <StudentModal
        stat={selectedStat}
        onClose={() => setSelectedStat(null)}
      />
    </>
  );
}

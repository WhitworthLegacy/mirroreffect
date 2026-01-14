"use client";

import { useState } from "react";
import StudentModal, { type StudentMonthlyStats } from "./StudentModal";
import { formatCurrency } from "@/lib/format";

type Props = {
  initialStats: StudentMonthlyStats[];
};

export default function StudentsList({ initialStats }: Props) {
  const [stats, setStats] = useState<StudentMonthlyStats[]>(initialStats);
  const [selectedStat, setSelectedStat] = useState<StudentMonthlyStats | null>(null);

  const handleSaved = (updated: StudentMonthlyStats) => {
    setStats((prev) =>
      prev.map((s) =>
        s.month === updated.month && s.student_name === updated.student_name ? updated : s
      )
    );
  };

  const handleDeleted = (month: string, student_name: string) => {
    setStats((prev) => prev.filter((s) => !(s.month === month && s.student_name === student_name)));
  };

  return (
    <>
      <div className="admin-card">
        <h2>Détail mensuel</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mois</th>
              <th>Étudiant</th>
              <th>Heures</th>
              <th>Heures corrigées</th>
              <th>Rémunération</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat, idx) => (
              <tr
                key={`${stat.month}-${stat.student_name}-${idx}`}
                onClick={() => setSelectedStat(stat)}
                style={{ cursor: "pointer" }}
              >
                <td>{new Date(stat.month).toLocaleDateString('fr-BE', { year: 'numeric', month: 'long' })}</td>
                <td style={{ fontWeight: 700 }}>{stat.student_name}</td>
                <td>{stat.hours_raw ? `${stat.hours_raw}h` : "—"}</td>
                <td>{stat.hours_adjusted ? `${stat.hours_adjusted}h` : "—"}</td>
                <td>{formatCurrency(stat.remuneration_cents)}</td>
              </tr>
            ))}
            {stats.length === 0 && (
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
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </>
  );
}

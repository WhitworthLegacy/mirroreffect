"use client";

import { formatCurrency } from "@/lib/format";

// Type aligné avec v_student_monthly_stats (vue calculée)
export type StudentMonthlyStats = {
  month: string;
  student_name: string;
  total_hours: number | null;
  total_remuneration_cents: number | null;
  event_count: number | null;
  avg_rate_cents: number | null;
};

type Props = {
  stat: StudentMonthlyStats | null;
  onClose: () => void;
};

export default function StudentModal({ stat, onClose }: Props) {
  if (!stat) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const monthLabel = new Date(stat.month).toLocaleDateString('fr-BE', { year: 'numeric', month: 'long' });

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h2>{stat.student_name}</h2>
            <p className="admin-muted">{monthLabel}</p>
          </div>
          <button type="button" className="admin-chip" onClick={onClose}>
            Fermer
          </button>
        </div>
        <div className="admin-modal-body">
          <p className="admin-muted" style={{ marginBottom: 16, fontSize: '0.875rem' }}>
            Données calculées automatiquement depuis les événements.
            Pour modifier, éditez les événements correspondants.
          </p>
          <div className="admin-form-grid">
            <div className="admin-field">
              <span>Mois</span>
              <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                {monthLabel}
              </div>
            </div>
            <div className="admin-field">
              <span>Événements</span>
              <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                {stat.event_count ?? 0}
              </div>
            </div>
            <div className="admin-field">
              <span>Heures totales</span>
              <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                {stat.total_hours ? `${stat.total_hours}h` : "—"}
              </div>
            </div>
            <div className="admin-field">
              <span>Taux moyen</span>
              <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                {stat.avg_rate_cents ? formatCurrency(stat.avg_rate_cents) + "/h" : "—"}
              </div>
            </div>
            <div className="admin-field" style={{ gridColumn: 'span 2' }}>
              <span>Rémunération totale</span>
              <div style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                {formatCurrency(stat.total_remuneration_cents)}
              </div>
            </div>
          </div>
        </div>
        <div className="admin-modal-footer">
          <button type="button" className="admin-chip primary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

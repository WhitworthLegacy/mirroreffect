import { getAdminSnapshot } from "@/lib/adminData";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function NotificationsPage() {
  const { events, error } = await getAdminSnapshot();
  const upcoming = events.filter((event) => {
    if (!event.event_date) return false;
    const date = new Date(event.event_date);
    const now = new Date();
    const diffDays = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 14;
  });
  const due = upcoming.filter((event) => (event.balance_due_cents ?? 0) > 0);

  return (
    <main className="admin-page">
      <h1>Alertes</h1>
      <p className="admin-muted">Points critiques, urgences et rappels.</p>
      {error && <p className="admin-muted">Erreur: {error}</p>}

      <div className="admin-card" style={{ marginTop: 20 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Alerte</th>
            </tr>
          </thead>
          <tbody>
            {due.map((event) => (
              <tr key={event.id}>
                <td>{formatDate(event.event_date)}</td>
                <td>{event.client_name || "—"}</td>
                <td>Solde a regler: {formatCurrency(event.balance_due_cents)}</td>
              </tr>
            ))}
            {due.length === 0 && (
              <tr>
                <td colSpan={3} className="admin-muted">
                  Aucun signal prioritaire.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

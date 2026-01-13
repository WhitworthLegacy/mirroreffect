import { getAdminSnapshot } from "@/lib/adminData";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function PaymentsPage() {
  const { events, error } = await getAdminSnapshot();
  const due = events.filter((event) => (event.balance_due_cents ?? 0) > 0);

  return (
    <main className="admin-page">
      <h1>Paiements</h1>
      <p className="admin-muted">Suivi des acomptes, soldes et transactions.</p>
      {error && <p className="admin-muted">Erreur: {error}</p>}

      <div className="admin-card" style={{ marginTop: 20 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Total</th>
              <th>Solde</th>
            </tr>
          </thead>
          <tbody>
            {due.map((event) => (
              <tr key={event.id}>
                <td>{formatDate(event.event_date)}</td>
                <td>{event.client_name || "—"}</td>
                <td>{formatCurrency(event.total_cents)}</td>
                <td>{formatCurrency(event.balance_due_cents)}</td>
              </tr>
            ))}
            {due.length === 0 && (
              <tr>
                <td colSpan={4} className="admin-muted">
                  Aucun solde en attente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

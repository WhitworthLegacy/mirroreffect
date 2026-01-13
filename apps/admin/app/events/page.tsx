import { getAdminSnapshot } from "@/lib/adminData";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function EventsPage() {
  const { events, packs, error } = await getAdminSnapshot();
  const packMap = new Map(packs.map((pack) => [pack.id, pack.name || pack.code || "Pack"]));

  return (
    <main className="admin-page">
      <h1>Events</h1>
      <p className="admin-muted">Vue detaillee des reservations et statuts.</p>
      {error && <p className="admin-muted">Erreur: {error}</p>}

      <div className="admin-card" style={{ marginTop: 20 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Contact</th>
              <th>Pack</th>
              <th>Statut</th>
              <th>Total</th>
              <th>Solde</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{formatDate(event.event_date)}</td>
                <td>{event.client_name || "—"}</td>
                <td>{event.client_email || event.client_phone || "—"}</td>
                <td>{event.pack_id ? packMap.get(event.pack_id) : "—"}</td>
                <td>{event.status || "—"}</td>
                <td>{formatCurrency(event.total_cents)}</td>
                <td>{formatCurrency(event.balance_due_cents)}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-muted">
                  Aucun event disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

import { getAdminSnapshot } from "@/lib/adminData";
import { formatDate } from "@/lib/format";

export default async function AvailabilityPage() {
  const { events, error } = await getAdminSnapshot();
  const upcoming = events.filter((event) => {
    if (!event.event_date) return false;
    return new Date(event.event_date) >= new Date();
  });

  return (
    <main className="admin-page">
      <h1>Disponibilites</h1>
      <p className="admin-muted">Planning des dates bloquees et capacites.</p>
      {error && <p className="admin-muted">Erreur: {error}</p>}

      <div className="admin-card" style={{ marginTop: 20 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Lieu</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map((event) => (
              <tr key={event.id}>
                <td>{formatDate(event.event_date)}</td>
                <td>{event.client_name || "—"}</td>
                <td>{event.address || "—"}</td>
                <td>{event.status || "—"}</td>
              </tr>
            ))}
            {upcoming.length === 0 && (
              <tr>
                <td colSpan={4} className="admin-muted">
                  Aucun blocage a venir.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

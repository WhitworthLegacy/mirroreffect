import { getAdminSnapshot } from "@/lib/adminData";

export default async function CrmPage() {
  const { events, error } = await getAdminSnapshot();
  const leads = events.filter((event) => !event.pack_id);

  return (
    <main className="admin-page">
      <h1>CRM</h1>
      <p className="admin-muted">Leads, relances et qualification commerciale.</p>
      {error && <p className="admin-muted">Erreur: {error}</p>}

      <div className="admin-card" style={{ marginTop: 20 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Email</th>
              <th>Tel.</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((event) => (
              <tr key={event.id}>
                <td>{event.client_name || "—"}</td>
                <td>{event.client_email || "—"}</td>
                <td>{event.client_phone || "—"}</td>
                <td>{event.status || "—"}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={4} className="admin-muted">
                  Aucun lead a relancer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

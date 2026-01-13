import { getAdminSnapshot, type EventRow, type PackRow } from "@/lib/adminData";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function Page() {
  let eventsError: string | null = null;
  let events: EventRow[] = [];
  let packs: PackRow[] = [];

  try {
    const snapshot = await getAdminSnapshot();
    events = snapshot.events;
    packs = snapshot.packs;
    eventsError = snapshot.error;
  } catch (error) {
    eventsError = error instanceof Error ? error.message : "Impossible de charger les donnees.";
  }

  const packMap = new Map<string, string>();
  packs.forEach((pack) => {
    if (!pack.id) return;
    const label = pack.name || pack.code || "Pack";
    packMap.set(pack.id, label);
  });

  const totalRevenue = events.reduce((sum, event) => sum + (event.total_cents ?? 0), 0);
  const totalBalance = events.reduce((sum, event) => sum + (event.balance_due_cents ?? 0), 0);
  const upcomingEvents = events.filter((event) => {
    if (!event.event_date) return false;
    return new Date(event.event_date) >= new Date();
  });
  const urgentBalances = upcomingEvents.filter((event) => (event.balance_due_cents ?? 0) > 0);

  const packStats = events.reduce<Record<string, number>>((acc, event) => {
    const key = event.pack_id ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const leadCandidates = events.filter((event) => !event.pack_id);

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 24 }}>
        <h1>Dashboard MirrorEffect</h1>
        <p className="admin-muted">
          Pilotage rapide des reservations, paiements, disponibilites et performance.
        </p>
      </header>

      <section className="admin-kpi">
        <div className="admin-kpi-card">
          <h3>Evenements a venir</h3>
          <p>{upcomingEvents.length}</p>
        </div>
        <div className="admin-kpi-card">
          <h3>Chiffre d&apos;affaires (20)</h3>
          <p>{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="admin-kpi-card">
          <h3>Solde restant</h3>
          <p>{formatCurrency(totalBalance)}</p>
        </div>
        <div className="admin-kpi-card">
          <h3>Alertes paiement</h3>
          <p>{urgentBalances.length}</p>
        </div>
      </section>

      {eventsError && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h2>Erreur de chargement</h2>
          <p className="admin-muted">{eventsError}</p>
        </div>
      )}

      <section className="admin-grid">
        <div className="admin-card">
          <h2>Module 1 · Events</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Contact</th>
                <th>Statut</th>
                <th>Solde</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 8).map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.event_date)}</td>
                  <td>{event.client_name || "—"}</td>
                  <td>{event.client_email || event.client_phone || "—"}</td>
                  <td>{event.status || "—"}</td>
                  <td>{formatCurrency(event.balance_due_cents)}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-muted">
                    Aucun event pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-card">
          <h2>Module 2 · Disponibilites</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Lieu</th>
              </tr>
            </thead>
            <tbody>
              {upcomingEvents.slice(0, 6).map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.event_date)}</td>
                  <td>{event.client_name || "—"}</td>
                  <td>{event.address || "—"}</td>
                </tr>
              ))}
              {upcomingEvents.length === 0 && (
                <tr>
                  <td colSpan={3} className="admin-muted">
                    Aucun blocage a venir.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-card">
          <h2>Module 3 · Paiements</h2>
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
              {urgentBalances.slice(0, 6).map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.event_date)}</td>
                  <td>{event.client_name || "—"}</td>
                  <td>{formatCurrency(event.total_cents)}</td>
                  <td>{formatCurrency(event.balance_due_cents)}</td>
                </tr>
              ))}
              {urgentBalances.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-muted">
                    Aucun solde en attente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-card">
          <h2>Module 4 · Inventaire</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pack</th>
                <th>Volume</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(packStats).map(([packId, count]) => (
                <tr key={packId}>
                  <td>{packId === "unknown" ? "Non choisi" : packMap.get(packId) || "Pack"}</td>
                  <td>{count}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={2} className="admin-muted">
                    Aucun historique disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="admin-muted">Suivi des packs et materiels les plus demandes.</p>
        </div>

        <div className="admin-card">
          <h2>Module 5 · CRM / Leads</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Email</th>
                <th>Tel.</th>
              </tr>
            </thead>
            <tbody>
              {leadCandidates.slice(0, 6).map((event) => (
                <tr key={event.id}>
                  <td>{event.client_name || "—"}</td>
                  <td>{event.client_email || "—"}</td>
                  <td>{event.client_phone || "—"}</td>
                </tr>
              ))}
              {leadCandidates.length === 0 && (
                <tr>
                  <td colSpan={3} className="admin-muted">
                    Aucun lead a relancer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="admin-muted">Relances automatiques et suivi des prospects.</p>
        </div>

        <div className="admin-card">
          <h2>Module 6 · Alertes</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Alerte</th>
              </tr>
            </thead>
            <tbody>
              {urgentBalances.slice(0, 6).map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.event_date)}</td>
                  <td>{event.client_name || "—"}</td>
                  <td>Solde a regler: {formatCurrency(event.balance_due_cents)}</td>
                </tr>
              ))}
              {urgentBalances.length === 0 && (
                <tr>
                  <td colSpan={3} className="admin-muted">
                    Aucun signal prioritaire.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="admin-muted">Paiements en attente, urgences et suivi client.</p>
        </div>
      </section>
    </main>
  );
}

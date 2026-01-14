import { getAdminSnapshot, type EventRow } from "@/lib/adminData";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function Page() {
  let eventsError: string | null = null;
  let events: EventRow[] = [];
  try {
    const snapshot = await getAdminSnapshot();
    events = snapshot.events;
    eventsError = snapshot.error;
  } catch (error) {
    eventsError = error instanceof Error ? error.message : "Impossible de charger les donnees.";
  }

  const totalRevenue = events.reduce((sum, event) => sum + (event.total_cents ?? 0), 0);
  const totalPaid = events.reduce((sum, event) => sum + ((event.total_cents ?? 0) - (event.balance_due_cents ?? 0)), 0);
  const totalBalance = events.reduce((sum, event) => sum + (event.balance_due_cents ?? 0), 0);

  const upcomingEvents = events.filter((event) => {
    if (!event.event_date) return false;
    return new Date(event.event_date) >= new Date();
  });
  const pastEvents = events.filter((event) => {
    if (!event.event_date) return false;
    return new Date(event.event_date) < new Date();
  });

  const urgentBalances = upcomingEvents.filter((event) => (event.balance_due_cents ?? 0) > 0);
  const leadCandidates = events.filter((event) => !event.pack_id);

  // Calculate payment completion rate
  const paymentCompletionRate = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;

  // Events by status
  const confirmedEvents = events.filter(e => e.status === 'confirmed').length;
  const pendingEvents = events.filter(e => e.status === 'pending').length;
  const cancelledEvents = events.filter(e => e.status === 'cancelled').length;

  // Monthly revenue (last 6 months)
  const now = new Date();
  const monthlyStats = Array.from({ length: 6 }, (_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthEvents = events.filter(event => {
      if (!event.event_date) return false;
      const eventDate = new Date(event.event_date);
      return eventDate.getMonth() === monthDate.getMonth() &&
             eventDate.getFullYear() === monthDate.getFullYear();
    });
    const revenue = monthEvents.reduce((sum, e) => sum + (e.total_cents ?? 0), 0);
    return {
      month: monthDate.toLocaleDateString('fr-FR', { month: 'short' }),
      revenue,
      count: monthEvents.length
    };
  });

  const maxMonthlyRevenue = Math.max(...monthlyStats.map(m => m.revenue), 1);

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 24 }}>
        <h1>Dashboard MirrorEffect</h1>
        <p className="admin-muted">
          Vue d&apos;ensemble des performances et metriques cles.
        </p>
      </header>

      <section className="admin-kpi">
        <div className="admin-kpi-card">
          <h3>Evenements a venir</h3>
          <p>{upcomingEvents.length}</p>
          <span className="admin-muted" style={{ fontSize: '0.875rem' }}>
            {pastEvents.length} passes
          </span>
        </div>
        <div className="admin-kpi-card">
          <h3>Chiffre d&apos;affaires</h3>
          <p>{formatCurrency(totalRevenue)}</p>
          <span className="admin-muted" style={{ fontSize: '0.875rem' }}>
            {events.length} evenements
          </span>
        </div>
        <div className="admin-kpi-card">
          <h3>Solde restant</h3>
          <p>{formatCurrency(totalBalance)}</p>
          <span className="admin-muted" style={{ fontSize: '0.875rem' }}>
            {urgentBalances.length} en attente
          </span>
        </div>
        <div className="admin-kpi-card">
          <h3>Taux de paiement</h3>
          <p>{paymentCompletionRate.toFixed(0)}%</p>
          <span className="admin-muted" style={{ fontSize: '0.875rem' }}>
            {formatCurrency(totalPaid)} encaisses
          </span>
        </div>
      </section>

      {eventsError && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h2>Erreur de chargement</h2>
          <p className="admin-muted">{eventsError}</p>
        </div>
      )}

      <section className="admin-grid">
        {/* Revenue Chart */}
        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <h2>Chiffre d&apos;affaires (6 derniers mois)</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 200, marginTop: 24 }}>
            {monthlyStats.map((stat, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                  {formatCurrency(stat.revenue)}
                </div>
                <div
                  style={{
                    width: '100%',
                    backgroundColor: '#333',
                    height: Math.max((stat.revenue / maxMonthlyRevenue) * 150, 4),
                    borderRadius: 4,
                    transition: 'height 0.3s ease'
                  }}
                />
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {stat.month}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                  {stat.count} ev.
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="admin-card">
          <h2>Statut des evenements</h2>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Confirmes</span>
                <span style={{ fontWeight: 700 }}>{confirmedEvents}</span>
              </div>
              <div style={{ height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${events.length > 0 ? (confirmedEvents / events.length) * 100 : 0}%`,
                    height: '100%',
                    backgroundColor: '#22c55e',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>En attente</span>
                <span style={{ fontWeight: 700 }}>{pendingEvents}</span>
              </div>
              <div style={{ height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${events.length > 0 ? (pendingEvents / events.length) * 100 : 0}%`,
                    height: '100%',
                    backgroundColor: '#f59e0b',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Annules</span>
                <span style={{ fontWeight: 700 }}>{cancelledEvents}</span>
              </div>
              <div style={{ height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${events.length > 0 ? (cancelledEvents / events.length) * 100 : 0}%`,
                    height: '100%',
                    backgroundColor: '#ef4444',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Progress */}
        <div className="admin-card">
          <h2>Progression paiements</h2>
          <div style={{ marginTop: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>
                {paymentCompletionRate.toFixed(0)}%
              </div>
              <div className="admin-muted">de completion</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="admin-muted">Encaisses</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(totalPaid)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="admin-muted">Restant</span>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>{formatCurrency(totalBalance)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #eee' }}>
                <span style={{ fontWeight: 700 }}>Total</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(totalRevenue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Urgent Payments */}
        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <h2>Paiements urgents ({urgentBalances.length})</h2>
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
              {urgentBalances.slice(0, 5).map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.event_date)}</td>
                  <td>{event.client_name || "—"}</td>
                  <td>{formatCurrency(event.total_cents)}</td>
                  <td style={{ color: '#ef4444', fontWeight: 700 }}>
                    {formatCurrency(event.balance_due_cents)}
                  </td>
                </tr>
              ))}
              {urgentBalances.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-muted">
                    Aucun paiement urgent.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Leads */}
        <div className="admin-card">
          <h2>Leads a convertir</h2>
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>
              {leadCandidates.length}
            </div>
            <div className="admin-muted" style={{ marginTop: 8 }}>
              prospects en attente
            </div>
          </div>
          <a href="/crm" style={{ display: 'block', textAlign: 'center', marginTop: 16, textDecoration: 'underline' }}>
            Voir tous les leads →
          </a>
        </div>

      </section>
    </main>
  );
}

import { getAdminSnapshot, type EventRow } from "@/lib/adminData";
import { formatCurrency, formatDate } from "@/lib/format";

type StudentStats = {
  name: string;
  totalEvents: number;
  totalHours: number;
  totalRevenue: number;
  totalKm: number;
  totalFuelCost: number;
  events: EventRow[];
};

export default async function ÉtudiantPage() {
  let error: string | null = null;
  let events: EventRow[] = [];

  try {
    const snapshot = await getAdminSnapshot();
    events = snapshot.events;
    error = snapshot.error;
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de charger les données.";
  }

  // Filter events with student assignments
  const eventsWithStudents = events.filter(event => {
    const finance = Array.isArray(event.event_finance) ? event.event_finance[0] : event.event_finance;
    return finance?.student_name;
  });

  // Calculate stats by student
  const studentStatsMap = new Map<string, StudentStats>();

  eventsWithStudents.forEach(event => {
    const finance = Array.isArray(event.event_finance) ? event.event_finance[0] : event.event_finance;
    if (!finance?.student_name) return;

    const studentName = finance.student_name;
    const existing = studentStatsMap.get(studentName);

    if (existing) {
      existing.totalEvents++;
      existing.totalHours += finance.student_hours || 0;
      existing.totalRevenue += finance.student_rate_cents || 0;
      existing.totalKm += finance.km_total || 0;
      existing.totalFuelCost += finance.fuel_cost_cents || 0;
      existing.events.push(event);
    } else {
      studentStatsMap.set(studentName, {
        name: studentName,
        totalEvents: 1,
        totalHours: finance.student_hours || 0,
        totalRevenue: finance.student_rate_cents || 0,
        totalKm: finance.km_total || 0,
        totalFuelCost: finance.fuel_cost_cents || 0,
        events: [event]
      });
    }
  });

  const studentStats = Array.from(studentStatsMap.values()).sort((a, b) =>
    b.totalEvents - a.totalEvents
  );

  const totalStudents = studentStats.length;
  const totalEventsAssigned = eventsWithStudents.length;
  const totalHoursWorked = studentStats.reduce((sum, s) => sum + s.totalHours, 0);
  const totalStudentCost = studentStats.reduce((sum, s) => sum + s.totalRevenue, 0);

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 24 }}>
        <h1>Étudiants & Freelances</h1>
        <p className="admin-muted">
          Performance et statistiques des collaborateurs.
        </p>
      </header>

      <section className="admin-kpi">
        <div className="admin-kpi-card">
          <h3>Collaborateurs actifs</h3>
          <p>{totalStudents}</p>
        </div>
        <div className="admin-kpi-card">
          <h3>Events assignés</h3>
          <p>{totalEventsAssigned}</p>
        </div>
        <div className="admin-kpi-card">
          <h3>Heures totales</h3>
          <p>{totalHoursWorked.toFixed(1)}h</p>
        </div>
        <div className="admin-kpi-card">
          <h3>Cout total</h3>
          <p>{formatCurrency(totalStudentCost)}</p>
        </div>
      </section>

      {error && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h2>Erreur de chargement</h2>
          <p className="admin-muted">{error}</p>
        </div>
      )}

      <section className="admin-grid">
        {/* Stats by student */}
        {studentStats.map((student) => (
          <div key={student.name} className="admin-card">
            <h2>{student.name}</h2>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="admin-muted">Events</span>
                <span style={{ fontWeight: 700 }}>{student.totalEvents}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="admin-muted">Heures</span>
                <span style={{ fontWeight: 700 }}>{student.totalHours.toFixed(1)}h</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="admin-muted">Revenue</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(student.totalRevenue)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="admin-muted">Distance</span>
                <span style={{ fontWeight: 700 }}>{student.totalKm} km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #eee' }}>
                <span className="admin-muted">Essence</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(student.totalFuelCost)}</span>
              </div>
            </div>
          </div>
        ))}

        {studentStats.length === 0 && (
          <div className="admin-card">
            <h2>Aucune donnee</h2>
            <p className="admin-muted">
              Aucun étudiant assigné pour le moment.
            </p>
          </div>
        )}
      </section>

      {/* Recent events by student */}
      <section style={{ marginTop: 32 }}>
        <div className="admin-card">
          <h2>Derniers événements assignés</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Étudiant</th>
                <th>Heures</th>
                <th>Rémunération</th>
              </tr>
            </thead>
            <tbody>
              {eventsWithStudents.slice(0, 20).map((event) => {
                const finance = Array.isArray(event.event_finance) ? event.event_finance[0] : event.event_finance;
                return (
                  <tr key={event.id}>
                    <td>{formatDate(event.event_date)}</td>
                    <td>{event.client_name || "—"}</td>
                    <td style={{ fontWeight: 700 }}>{finance?.student_name || "—"}</td>
                    <td>{finance?.student_hours ? `${finance.student_hours}h` : "—"}</td>
                    <td>{formatCurrency(finance?.student_rate_cents)}</td>
                  </tr>
                );
              })}
              {eventsWithStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-muted">
                    Aucun événement assigné.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

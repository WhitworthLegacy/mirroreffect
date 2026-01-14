import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { formatCurrency } from "@/lib/format";

type StudentMonthlyStats = {
  month: string;
  student_name: string;
  hours_raw: number | null;
  hours_adjusted: number | null;
  remuneration_cents: number | null;
};

type StudentSummary = {
  name: string;
  totalHours: number;
  totalHoursAdjusted: number;
  totalRemuneration: number;
  monthlyData: StudentMonthlyStats[];
};

export default async function ÉtudiantPage() {
  let error: string | null = null;
  let studentStats: StudentMonthlyStats[] = [];

  try {
    const supabase = createSupabaseServerClient();
    const { data, error: fetchError } = await supabase
      .from("student_monthly_stats")
      .select("*")
      .order("month", { ascending: false });

    if (fetchError) {
      error = fetchError.message;
    } else {
      studentStats = data || [];
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de charger les données.";
  }

  // Group by student name
  const studentMap = new Map<string, StudentSummary>();

  studentStats.forEach(stat => {
    if (!stat.student_name) return;

    const existing = studentMap.get(stat.student_name);
    const hours = stat.hours_adjusted || stat.hours_raw || 0;
    const hoursRaw = stat.hours_raw || 0;

    if (existing) {
      existing.totalHours += hoursRaw;
      existing.totalHoursAdjusted += hours;
      existing.totalRemuneration += stat.remuneration_cents || 0;
      existing.monthlyData.push(stat);
    } else {
      studentMap.set(stat.student_name, {
        name: stat.student_name,
        totalHours: hoursRaw,
        totalHoursAdjusted: hours,
        totalRemuneration: stat.remuneration_cents || 0,
        monthlyData: [stat]
      });
    }
  });

  const students = Array.from(studentMap.values()).sort((a, b) =>
    b.totalRemuneration - a.totalRemuneration
  );

  const totalStudents = students.length;
  const totalHours = students.reduce((sum, s) => sum + s.totalHoursAdjusted, 0);
  const totalRemuneration = students.reduce((sum, s) => sum + s.totalRemuneration, 0);
  const totalMonths = new Set(studentStats.map(s => s.month)).size;

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 24 }}>
        <h1>Étudiants</h1>
        <p className="admin-muted">
          Performance et statistiques des étudiants.
        </p>
      </header>

      <section className="admin-kpi">
        <div className="admin-kpi-card">
          <h3>Étudiants actifs</h3>
          <p>{totalStudents}</p>
        </div>
        <div className="admin-kpi-card">
          <h3>Mois de données</h3>
          <p>{totalMonths}</p>
        </div>
        <div className="admin-kpi-card">
          <h3>Heures totales</h3>
          <p>{totalHours.toFixed(1)}h</p>
        </div>
        <div className="admin-kpi-card">
          <h3>Rémunération totale</h3>
          <p>{formatCurrency(totalRemuneration)}</p>
        </div>
      </section>

      {error && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h2>Erreur de chargement</h2>
          <p className="admin-muted">{error}</p>
        </div>
      )}

      <section className="admin-grid">
        {students.map((student) => (
          <div key={student.name} className="admin-card">
            <h2>{student.name}</h2>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="admin-muted">Heures brutes</span>
                <span style={{ fontWeight: 700 }}>{student.totalHours.toFixed(1)}h</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="admin-muted">Heures corrigées</span>
                <span style={{ fontWeight: 700 }}>{student.totalHoursAdjusted.toFixed(1)}h</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #eee' }}>
                <span className="admin-muted">Rémunération</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(student.totalRemuneration)}</span>
              </div>
            </div>
          </div>
        ))}

        {students.length === 0 && (
          <div className="admin-card">
            <h2>Aucune donnée</h2>
            <p className="admin-muted">
              Aucun étudiant trouvé. Exécutez le script d'import pour charger les données.
            </p>
          </div>
        )}
      </section>

      {/* Monthly breakdown */}
      <section style={{ marginTop: 32 }}>
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
              {studentStats.map((stat, idx) => (
                <tr key={`${stat.month}-${stat.student_name}-${idx}`}>
                  <td>{new Date(stat.month).toLocaleDateString('fr-BE', { year: 'numeric', month: 'long' })}</td>
                  <td style={{ fontWeight: 700 }}>{stat.student_name}</td>
                  <td>{stat.hours_raw ? `${stat.hours_raw}h` : "—"}</td>
                  <td>{stat.hours_adjusted ? `${stat.hours_adjusted}h` : "—"}</td>
                  <td>{formatCurrency(stat.remuneration_cents)}</td>
                </tr>
              ))}
              {studentStats.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-muted">
                    Aucune donnée mensuelle.
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

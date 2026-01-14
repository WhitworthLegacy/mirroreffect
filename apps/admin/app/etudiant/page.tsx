import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { formatCurrency } from "@/lib/format";
import StudentsList from "@/components/StudentsList";

type StudentMonthlyStats = {
  month: string;
  student_name: string;
  hours_raw: number | null;
  hours_adjusted: number | null;
  remuneration_cents: number | null;
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

  // Calculate totals
  const uniqueStudents = new Set(studentStats.map(s => s.student_name)).size;
  const totalMonths = new Set(studentStats.map(s => s.month)).size;
  const totalHours = studentStats.reduce((sum, s) => sum + (s.hours_adjusted || s.hours_raw || 0), 0);
  const totalRemuneration = studentStats.reduce((sum, s) => sum + (s.remuneration_cents || 0), 0);

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
          <p>{uniqueStudents}</p>
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

      <section style={{ marginTop: 32 }}>
        <StudentsList initialStats={studentStats} />
      </section>
    </main>
  );
}

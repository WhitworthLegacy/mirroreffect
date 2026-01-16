import { formatCurrency } from "@/lib/format";
import StudentsList from "@/components/StudentsList";
import { readStudentStatsFromSheets } from "@/lib/googleSheets";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

// Type pour student monthly stats
type StudentMonthlyStats = {
  month: string;
  student_name: string;
  total_hours: number | null;
  total_remuneration_cents: number | null;
  event_count: number | null;
  avg_rate_cents: number | null;
};

export default async function ÉtudiantPage() {
  let error: string | null = null;
  let studentStats: StudentMonthlyStats[] = [];

  try {
    // Read from Google Sheets (primary source)
    const sheetsStats = await readStudentStatsFromSheets();
    
    if (sheetsStats && sheetsStats.length > 0) {
      // Convert data to expected format
      studentStats = sheetsStats.map((stat) => {
        const convertCents = (value: unknown): number | null => {
          if (value === null || value === undefined || value === "") return null;
          const num = typeof value === "string" ? parseFloat(value.replace(",", ".")) : Number(value);
          return Number.isNaN(num) ? null : Math.round(num * 100); // Convert to cents
        };
        const convertNumber = (value: unknown): number | null => {
          if (value === null || value === undefined || value === "") return null;
          const num = typeof value === "string" ? parseFloat(value.replace(",", ".")) : Number(value);
          return Number.isNaN(num) ? null : num;
        };
        return {
          month: stat.month || "",
          student_name: stat.student_name || "",
          total_hours: convertNumber(stat.total_hours || stat.hours_raw || stat.hours_adjusted),
          total_remuneration_cents: convertCents(stat.total_remuneration_cents || stat.remuneration_cents),
          event_count: convertNumber(stat.event_count),
          avg_rate_cents: convertCents(stat.avg_rate_cents),
        } as StudentMonthlyStats;
      }).sort((a, b) => b.month.localeCompare(a.month));
    } else {
      throw new Error("No data from Google Sheets");
    }
  } catch (sheetsError) {
    console.error("Failed to load student stats from Google Sheets, falling back to Supabase:", sheetsError);
    // Fallback to Supabase
    try {
      const supabase = createSupabaseServerClient();
      const { data, error: fetchError } = await supabase
        .from("v_student_monthly_stats")
        .select("*")
        .order("month", { ascending: false });

      if (fetchError) {
        error = fetchError.message;
      } else {
        studentStats = (data || []) as StudentMonthlyStats[];
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Impossible de charger les données.";
    }
  }

  // Calculate totals
  const uniqueStudents = new Set(studentStats.map(s => s.student_name)).size;
  const totalMonths = new Set(studentStats.map(s => s.month)).size;
  const totalHours = studentStats.reduce((sum, s) => sum + (s.total_hours || 0), 0);
  const totalRemuneration = studentStats.reduce((sum, s) => sum + (s.total_remuneration_cents || 0), 0);

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

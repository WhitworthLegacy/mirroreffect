import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { formatCurrency } from "@/lib/format";
import StudentsView from "@/components/StudentsView";
import type { EventRow, EventFinanceRow } from "@/lib/adminData";

export default async function StudentsPage() {
  let error: string | null = null;
  let events: (EventRow & { event_finance: EventFinanceRow | EventFinanceRow[] | null })[] = [];

  try {
    const supabase = createSupabaseServerClient();
    const { data, error: fetchError } = await supabase
      .from("events")
      .select(`
        id,
        event_date,
        event_type,
        client_name,
        address,
        pack_id,
        total_cents,
        event_finance(*)
      `)
      .order("event_date", { ascending: false })
      .limit(500);

    if (fetchError) {
      error = fetchError.message;
    } else {
      events = (data || []) as typeof events;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Impossible de charger les données.";
  }

  // Extract student data from events
  const studentEvents: {
    event_id: string;
    event_date: string;
    client_name: string | null;
    student_name: string;
    student_hours: number | null;
    student_rate_cents: number | null;
    total_cents: number | null;
  }[] = [];

  for (const event of events) {
    const finance = Array.isArray(event.event_finance)
      ? event.event_finance[0]
      : event.event_finance;

    if (finance?.student_name) {
      studentEvents.push({
        event_id: event.id,
        event_date: event.event_date,
        client_name: event.client_name,
        student_name: finance.student_name,
        student_hours: finance.student_hours ?? null,
        student_rate_cents: finance.student_rate_cents ?? null,
        total_cents: event.total_cents,
      });
    }
  }

  // Group by month
  const byMonth: Record<string, typeof studentEvents> = {};
  for (const se of studentEvents) {
    const monthKey = se.event_date.substring(0, 7); // YYYY-MM
    if (!byMonth[monthKey]) byMonth[monthKey] = [];
    byMonth[monthKey].push(se);
  }

  // Calculate monthly totals per student
  const monthlyTotals: {
    month: string;
    student_name: string;
    total_hours: number;
    total_remuneration_cents: number;
    event_count: number;
  }[] = [];

  for (const [month, evts] of Object.entries(byMonth)) {
    const byStudent: Record<string, { hours: number; remuneration: number; count: number }> = {};
    for (const e of evts) {
      if (!byStudent[e.student_name]) {
        byStudent[e.student_name] = { hours: 0, remuneration: 0, count: 0 };
      }
      byStudent[e.student_name].hours += e.student_hours ?? 0;
      byStudent[e.student_name].remuneration += (e.student_hours ?? 0) * (e.student_rate_cents ?? 0);
      byStudent[e.student_name].count += 1;
    }
    for (const [studentName, data] of Object.entries(byStudent)) {
      monthlyTotals.push({
        month,
        student_name: studentName,
        total_hours: data.hours,
        total_remuneration_cents: data.remuneration,
        event_count: data.count,
      });
    }
  }

  // Sort by month descending, then by student name
  monthlyTotals.sort((a, b) => {
    if (a.month !== b.month) return b.month.localeCompare(a.month);
    return a.student_name.localeCompare(b.student_name);
  });

  // KPI calculations
  const uniqueStudents = new Set(studentEvents.map(s => s.student_name)).size;
  const totalHours = studentEvents.reduce((sum, s) => sum + (s.student_hours ?? 0), 0);
  const avgRate = studentEvents.length > 0
    ? studentEvents.reduce((sum, s) => sum + (s.student_rate_cents ?? 0), 0) / studentEvents.length
    : 0;
  const totalRemuneration = studentEvents.reduce((sum, s) => {
    return sum + ((s.student_hours ?? 0) * (s.student_rate_cents ?? 0));
  }, 0);

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 24 }}>
        <h1>Étudiants</h1>
        <p className="admin-muted">
          Performance et rémunération des étudiants par événement.
        </p>
      </header>

      <section className="admin-kpi">
        <div className="admin-kpi-card">
          <h3>Étudiants actifs</h3>
          <p>{uniqueStudents}</p>
        </div>
        <div className="admin-kpi-card">
          <h3>Total événements</h3>
          <p>{studentEvents.length}</p>
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

      <StudentsView
        studentEvents={studentEvents}
        monthlyTotals={monthlyTotals}
      />
    </main>
  );
}

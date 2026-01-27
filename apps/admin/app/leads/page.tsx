import LeadsList from "@/components/LeadsList";
import { getLeads } from "@/lib/adminData";

export default async function LeadsPage() {
  const { leads, error } = await getLeads();

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 4 }}>Leads</h1>
        <p className="admin-muted">Prospects du funnel de réservation</p>
      </header>
      {error && (
        <div className="admin-card" style={{ marginBottom: 24, backgroundColor: "rgba(205, 27, 23, 0.05)", borderColor: "var(--fire-red)" }}>
          <p style={{ color: "var(--fire-red)", margin: 0 }}>{error}</p>
        </div>
      )}
      <LeadsList leads={leads} />
    </main>
  );
}

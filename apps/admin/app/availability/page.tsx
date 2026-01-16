import AvailabilityPageClient from "@/components/AvailabilityPageClient";

export default function AvailabilityPage() {
  return (
    <main className="admin-page">
      <h1>Disponibilités</h1>
      <p className="admin-muted">Planning des dates bloquées et capacités.</p>
      <AvailabilityPageClient />
    </main>
  );
}

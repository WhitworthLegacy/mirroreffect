import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import { getAdminSnapshot } from "@/lib/adminData";

export default async function AvailabilityPage() {
  const { events, error } = await getAdminSnapshot();

  return (
    <main className="admin-page">
      <h1>Disponibilités</h1>
      <p className="admin-muted">Planning des dates bloquées et capacités.</p>
      {error && <p className="admin-muted">Erreur: {error}</p>}
      <AvailabilityCalendar events={events} />
    </main>
  );
}

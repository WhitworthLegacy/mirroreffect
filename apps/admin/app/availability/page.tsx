import AvailabilityPageClient from "@/components/AvailabilityPageClient";

export default function AvailabilityPage() {
  return (
    <main className="admin-page">
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 4 }}>Availability Calendar</h1>
        <p className="admin-muted">View event availability and mirror capacity</p>
      </header>
      <AvailabilityPageClient />
    </main>
  );
}

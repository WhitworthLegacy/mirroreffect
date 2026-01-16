import StudentsPageClient from "@/components/StudentsPageClient";

export default function StudentsPage() {
  return (
    <main className="admin-page">
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 4 }}>Students</h1>
        <p className="admin-muted">Manage student hours and costs</p>
      </header>
      <StudentsPageClient />
    </main>
  );
}

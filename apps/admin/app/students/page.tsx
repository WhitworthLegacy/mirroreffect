import StudentsPageClient from "@/components/StudentsPageClient";

export default function StudentsPage() {
  return (
    <main className="admin-page">
      <header style={{ marginBottom: 24 }}>
        <h1>Étudiants</h1>
        <p className="admin-muted">
          Performance et rémunération des étudiants par événement.
        </p>
      </header>
      <StudentsPageClient />
    </main>
  );
}

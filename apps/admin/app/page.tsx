import DashboardPageClient from "@/components/DashboardPageClient";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const selectedYear = params.year ? parseInt(params.year) : new Date().getFullYear();

  // ✅ Events et Stats viennent maintenant du store client (pas de fetch server-side)
  // Le store charge les deux feuilles en parallèle au démarrage

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 24 }}>
        <h1>Dashboard MirrorEffect</h1>
        <p className="admin-muted">
          Vue d&apos;ensemble des performances et métriques clés.
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>
          📊 Données lues depuis Google Sheets (feuilles "Stats" + "Clients" via store unifié)
        </p>
      </header>

      <DashboardPageClient selectedYear={selectedYear} />
    </main>
  );
}


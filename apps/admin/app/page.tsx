import DashboardPageClient from "@/components/DashboardPageClient";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const selectedYear = params.year ? parseInt(params.year) : new Date().getFullYear();

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 4 }}>Dashboard</h1>
        <p className="admin-muted">CEO / Ops Overview</p>
      </header>

      <DashboardPageClient selectedYear={selectedYear} />
    </main>
  );
}


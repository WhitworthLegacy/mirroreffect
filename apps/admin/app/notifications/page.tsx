import NotificationsPageClient from "@/components/NotificationsPageClient";

export default function NotificationsPage() {
  return (
    <main className="admin-page">
      <h1>Alertes</h1>
      <p className="admin-muted">Points critiques, urgences et rappels.</p>
      <NotificationsPageClient />
    </main>
  );
}

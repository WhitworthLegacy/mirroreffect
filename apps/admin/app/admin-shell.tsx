"use client";

import { usePathname } from "next/navigation";
import { useClientsStore } from "@/lib/clientsStore";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/students", label: "Étudiants" },
  { href: "/availability", label: "Disponibilités" },
  { href: "/crm", label: "CRM" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname === "/health" || pathname === "/login";
  const { refreshClients, loading, hasAnyDirty, lastLoadedAt } = useClientsStore();

  const handleRefresh = async () => {
    await refreshClients();
  };

  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <div className="admin-content">
        {/* Topbar globale avec bouton Refresh */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16,
          padding: '8px 0',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {hasAnyDirty() && (
              <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>
                ⚠️ Modifications non sauvegardées
              </span>
            )}
            {lastLoadedAt && (
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                Dernière sync: {formatLastSync(lastLoadedAt)}
              </span>
            )}
          </div>
          <button
            type="button"
            className="admin-chip"
            onClick={handleRefresh}
            disabled={loading}
            style={{ padding: '6px 12px', fontSize: '0.875rem' }}
          >
            {loading ? "Rafraîchissement..." : "🔄 Rafraîchir"}
          </button>
        </div>
        {children}
      </div>
      <nav className="admin-bottom-nav" aria-label="Admin navigation">
        <div className="nav-grid">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : undefined}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}

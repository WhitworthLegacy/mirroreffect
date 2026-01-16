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
  const { refreshClients, loading, hasAnyDirty } = useClientsStore();

  const handleRefresh = async () => {
    await refreshClients();
  };

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <div className="admin-content">
        {pathname === "/events" && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 8 }}>
            {hasAnyDirty() && (
              <span style={{ fontSize: '0.75rem', color: 'var(--warning)', alignSelf: 'center' }}>
                ⚠️ Modifications non sauvegardées
              </span>
            )}
            <button
              type="button"
              className="admin-chip"
              onClick={handleRefresh}
              disabled={loading}
              style={{ padding: '6px 12px', fontSize: '0.875rem' }}
            >
              {loading ? "Rafraîchissement..." : "🔄 Refresh"}
            </button>
          </div>
        )}
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

"use client";

import { usePathname } from "next/navigation";
import { useSheetsStore } from "@/lib/sheetsStore";

// SVG Icons as components
const DashboardIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const EventsIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const AvailabilityIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="12" cy="16" r="2" />
  </svg>
);

const StudentsIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/events", label: "Events", icon: EventsIcon },
  { href: "/availability", label: "Availability", icon: AvailabilityIcon },
  { href: "/students", label: "Students", icon: StudentsIcon },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname === "/health" || pathname === "/login";
  const { refresh, isLoading, hasAnyDirty, lastSyncAt } = useSheetsStore();

  const handleRefresh = async () => {
    await refresh();
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
      {/* Header */}
      <header className="admin-header">
        <h1>MirrorEffect</h1>
      </header>

      <div className="admin-content">
        {/* Topbar with Refresh button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          padding: '12px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {hasAnyDirty() && (
              <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>
                ⚠️ Unsaved changes
              </span>
            )}
            {lastSyncAt && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Last sync: {formatLastSync(lastSyncAt)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              fontSize: '0.875rem',
              fontWeight: 500,
              border: '2px solid var(--satin-gold)',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'var(--satin-gold)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
        {children}
      </div>

      {/* Bottom Navigation */}
      <nav className="admin-bottom-nav" aria-label="Admin navigation">
        <div className="nav-grid">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "active" : undefined}
              >
                <Icon />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

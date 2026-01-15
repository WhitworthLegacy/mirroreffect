"use client";

import { usePathname } from "next/navigation";

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

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <div className="admin-content">{children}</div>
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

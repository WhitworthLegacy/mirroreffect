import "./globals.css";
import AdminGuard from "./admin-guard";
import AdminShell from "./admin-shell";

export const metadata = {
  title: "MirrorEffect Admin",
  description: "Ops-first admin"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AdminGuard>
          <AdminShell>{children}</AdminShell>
        </AdminGuard>
      </body>
    </html>
  );
}

import AdminGuard from "./admin-guard";

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
        <AdminGuard>{children}</AdminGuard>
      </body>
    </html>
  );
}

import "./globals.css";
import { Aleo } from "next/font/google";
import AdminGuard from "./admin-guard";
import AdminShell from "./admin-shell";

const aleo = Aleo({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap"
});

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
      <body className={aleo.className}>
        <AdminGuard>
          <AdminShell>{children}</AdminShell>
        </AdminGuard>
      </body>
    </html>
  );
}

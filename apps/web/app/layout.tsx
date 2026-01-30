import "./globals.css";
import { Aleo } from "next/font/google";

const aleo = Aleo({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
  variable: "--font-aleo"
});

export const metadata = {
  title: "MirrorEffect",
  description: "Ops-first web platform"
};

export const viewport = {
  themeColor: "#12130F"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={aleo.variable}>{children}</body>
    </html>
  );
}

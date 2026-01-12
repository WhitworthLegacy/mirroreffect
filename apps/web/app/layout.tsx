import "./globals.css";

export const metadata = {
  title: "MirrorEffect",
  description: "Ops-first web platform"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

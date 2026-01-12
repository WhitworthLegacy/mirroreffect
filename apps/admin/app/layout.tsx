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
      <body>{children}</body>
    </html>
  );
}

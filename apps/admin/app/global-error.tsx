"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{ padding: "2.5rem", fontFamily: "system-ui, sans-serif" }}>
          <h1>Erreur critique</h1>
          <p>Un probleme est survenu. Rechargez la page.</p>
          <button type="button" onClick={() => reset()}>
            Reessayer
          </button>
        </main>
      </body>
    </html>
  );
}

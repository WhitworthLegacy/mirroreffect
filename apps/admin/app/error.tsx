"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <main style={{ padding: "2.5rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Une erreur est survenue</h1>
      <p>Essayez de recharger la page.</p>
      <button type="button" onClick={() => reset()}>
        Reessayer
      </button>
    </main>
  );
}

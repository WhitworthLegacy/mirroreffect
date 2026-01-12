"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type GuardStatus = "checking" | "authed" | "unauth" | "misconfigured" | "error";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<GuardStatus>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (pathname === "/health" || pathname === "/login") {
    return <>{children}</>;
  }

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) {
          if (isMounted) setStatus("misconfigured");
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          if (isMounted) {
            setErrorMessage(error.message);
            setStatus("error");
          }
          return;
        }

        if (!data.session) {
          if (isMounted) setStatus("unauth");
          return;
        }

        if (isMounted) setStatus("authed");
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unknown error");
          setStatus("error");
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (status === "unauth") {
      const timeout = setTimeout(() => {
        router.replace("/login");
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [status, router]);

  if (status === "authed") {
    return <>{children}</>;
  }

  return (
    <main style={{ padding: "2.5rem", fontFamily: "system-ui, sans-serif" }}>
      {status === "checking" && <p>Chargement de la session...</p>}
      {status === "unauth" && (
        <>
          <h1>Session requise</h1>
          <p>Redirection vers la page de connexion...</p>
        </>
      )}
      {status === "misconfigured" && (
        <>
          <h1>Configuration manquante</h1>
          <p>Variables NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY absentes.</p>
        </>
      )}
      {status === "error" && (
        <>
          <h1>Erreur de session</h1>
          <p>{errorMessage ?? "Impossible de verifier la session."}</p>
        </>
      )}
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Configuration Supabase manquante.");
      return;
    }

    setIsSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setIsSubmitting(false);

    if (signInError) {
      setError("Identifiants invalides. Merci de réessayer.");
      return;
    }

    setMessage("Connexion réussie. Redirection...");
    router.replace("/");
  };

  return (
    <main style={{ padding: "2.5rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Connexion</h1>
      <p>Veuillez vous connecter pour accéder à l&apos;admin.</p>
      <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem", maxWidth: 360 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          style={{
            width: "100%",
            padding: "0.75rem 0.9rem",
            borderRadius: 10,
            border: "1px solid #e0e0e0"
          }}
        />
        <label style={{ display: "block", fontWeight: 600, marginTop: 14, marginBottom: 6 }} htmlFor="password">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          style={{
            width: "100%",
            padding: "0.75rem 0.9rem",
            borderRadius: 10,
            border: "1px solid #e0e0e0"
          }}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            marginTop: 18,
            width: "100%",
            padding: "0.8rem 1rem",
            borderRadius: 999,
            border: "none",
            background: "#12130F",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </button>
        {error && <p style={{ marginTop: 12, color: "#b42318" }}>{error}</p>}
        {message && <p style={{ marginTop: 12, color: "#1a7f37" }}>{message}</p>}
      </form>
    </main>
  );
}

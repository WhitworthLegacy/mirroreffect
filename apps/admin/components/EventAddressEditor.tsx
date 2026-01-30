"use client";

import { useState } from "react";

type Props = {
  eventId: string;
  initialAddress: string | null;
};

export default function EventAddressEditor({ eventId, initialAddress }: Props) {
  const [address, setAddress] = useState(initialAddress ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/events/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, address })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erreur de recalcul");
      }
      setStatus("saved");
      setMessage("Recalcul OK");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Erreur de recalcul");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-inline-form">
      <input
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        placeholder="Adresse event"
      />
      <button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "..." : "Recalculer"}
      </button>
      {message && <span className={status === "error" ? "error" : "ok"}>{message}</span>}
    </form>
  );
}

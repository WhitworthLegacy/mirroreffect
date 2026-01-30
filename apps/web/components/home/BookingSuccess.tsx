"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type BookingStatus = {
  event_id: string;
  client_name: string;
  event_date: string;
  total_cents: number;
  status: string;
  deposit_paid: boolean;
  payment_status: string;
};

const copy = {
  fr: {
    badge: "Confirmation de reservation",
    successTitle: "Votre acompte est bien recu.",
    pendingTitle: "Votre paiement est en cours de confirmation.",
    failedTitle: "Le paiement n'a pas abouti.",
    loading: "Verification de votre reservation...",
    error:
      "Nous n'avons pas pu verifier votre reservation. Merci de nous contacter.",
    thanks: "Merci",
    lockInfo: "Votre date est en cours de verrouillage.",
    date: "Date",
    deposit: "Acompte",
    paid: "Paye",
    pending: "En attente",
    status: "Statut",
    emailInfo: "Vous recevez un email de confirmation. Le solde se paye le jour J.",
    retry: "Recommencer la reservation",
    home: "Retour a l'accueil",
    contact: "Nous contacter"
  },
  nl: {
    badge: "Reservatie bevestigd",
    successTitle: "Uw voorschot is ontvangen.",
    pendingTitle: "Uw betaling wordt bevestigd.",
    failedTitle: "De betaling is mislukt.",
    loading: "Uw reservatie wordt gecontroleerd...",
    error:
      "We konden uw reservatie niet controleren. Contacteer ons.",
    thanks: "Bedankt",
    lockInfo: "Uw datum wordt vastgelegd.",
    date: "Datum",
    deposit: "Voorschot",
    paid: "Betaald",
    pending: "In afwachting",
    status: "Status",
    emailInfo: "U ontvangt een bevestigingsmail. Het saldo betaalt u op de dag zelf.",
    retry: "Opnieuw reserveren",
    home: "Terug naar home",
    contact: "Contacteer ons"
  }
};

export function BookingSuccess() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event_id") ?? "";
  const lang = searchParams.get("lang") === "nl" ? "nl" : "fr";
  const t = (key: keyof typeof copy.fr) => copy[lang][key] ?? copy.fr[key];

  const [status, setStatus] = useState<BookingStatus | null>(null);
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    if (!eventId) {
      setState("error");
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(`/api/public/booking-status?event_id=${eventId}`);
        const data = await res.json();
        if (!res.ok) {
          setState("error");
          return;
        }
        setStatus(data);
        setState("ready");
      } catch {
        setState("error");
      }
    };

    load();
  }, [eventId]);

  const failedStatuses = new Set(["failed", "canceled", "expired"]);
  const isFailed = state === "ready" && status && failedStatuses.has(status.payment_status);
  const isPaid = state === "ready" && status?.deposit_paid;

  return (
    <section className="mx-auto max-w-[900px] px-4 py-16 text-center">
      <span className="inline-flex rounded-full bg-gradient-to-r from-[#C1950E] to-[#e3c04a] px-3 py-1 text-xs font-black text-[#14140f] shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
        {t("badge")}
      </span>
      <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight">
        {isFailed ? t("failedTitle") : isPaid ? t("successTitle") : t("pendingTitle")}
      </h1>

      {state === "loading" && <p className="mt-3 text-sm text-[#666]">{t("loading")}</p>}

      {state === "error" && (
        <p className="mt-3 text-sm text-[#666]">{t("error")}</p>
      )}

      {state === "ready" && status && (
        <div className="mt-6 rounded-3xl bg-white/90 px-6 py-6 text-left shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
          <p className="text-sm text-[#555]">
            {t("thanks")} {status.client_name || "!"} {t("lockInfo")}
          </p>
          <div className="mt-4 text-sm text-[#444]">
            <p>
              <strong>{t("date")}:</strong> {status.event_date}
            </p>
            <p>
              <strong>{t("deposit")}:</strong> {status.deposit_paid ? t("paid") : t("pending")}
            </p>
            <p>
              <strong>{t("status")}:</strong> {status.payment_status}
            </p>
          </div>
          {!isFailed && (
            <p className="mt-4 text-xs text-[#6b6b6b]">{t("emailInfo")}</p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {isFailed ? (
          <a className="btn btn-gold" href={`/reservation?lang=${lang}`}>
            {t("retry")}
          </a>
        ) : (
          <a className="btn btn-gold" href="/">
            {t("home")}
          </a>
        )}
        <a className="btn btn-dark" href="mailto:mirror@mirroreffect.co">
          {t("contact")}
        </a>
      </div>
    </section>
  );
}

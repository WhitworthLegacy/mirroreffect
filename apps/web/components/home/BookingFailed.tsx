"use client";

import { useSearchParams } from "next/navigation";

const copy = {
  fr: {
    badge: "Paiement non valide",
    title: "Votre paiement n'a pas abouti.",
    subtitle:
      "Aucun souci, vous pouvez relancer la reservation en quelques clics.",
    retry: "Relancer la reservation",
    contact: "Nous contacter"
  },
  nl: {
    badge: "Betaling mislukt",
    title: "Uw betaling is niet gelukt.",
    subtitle:
      "Geen probleem, u kunt uw reservatie opnieuw starten.",
    retry: "Reservatie opnieuw starten",
    contact: "Contacteer ons"
  }
};

export function BookingFailed() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "nl" ? "nl" : "fr";
  const t = (key: keyof typeof copy.fr) => copy[lang][key] ?? copy.fr[key];

  return (
    <section className="mx-auto max-w-[800px] px-4 py-16 text-center">
      <span className="inline-flex rounded-full bg-gradient-to-r from-[#C1950E] to-[#e3c04a] px-3 py-1 text-xs font-black text-[#14140f] shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
        {t("badge")}
      </span>
      <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight">
        {t("title")}
      </h1>
      <p className="mt-3 text-sm text-[#666]">{t("subtitle")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a className="btn btn-gold" href={`/reservation?lang=${lang}`}>
          {t("retry")}
        </a>
        <a className="btn btn-dark" href="mailto:mirror@mirroreffect.co">
          {t("contact")}
        </a>
      </div>
    </section>
  );
}

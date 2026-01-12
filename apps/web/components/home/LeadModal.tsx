"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbypyjYSnd-yRYZkMlJbfAFju-I38TX5yfjxvvKW8IaXYM6lrKM2kPx4_bk4fNPQPCII/exec";

const prefixes: Record<string, string> = {
  BE: "+32",
  FR: "+33",
  OTHER: ""
};

const fieldClass =
  "w-full rounded-xl border border-[#E6E6E6] bg-white px-4 py-3 text-base text-[#12130F] focus:outline-none focus:ring-2 focus:ring-[#C1950E]/40";

type LeadModalProps = {
  mode: "b2c" | "b2b";
};

export function LeadModal({ mode }: LeadModalProps) {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [country, setCountry] = useState("BE");
  const [telephone, setTelephone] = useState("+32 ");
  const [pageUrl, setPageUrl] = useState("");
  const [pageTitle, setPageTitle] = useState("");

  const utm = useMemo(() => {
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    return keys
      .filter((key) => searchParams.get(key))
      .map((key) => `${key}=${searchParams.get(key)}`)
      .join("&");
  }, [searchParams]);

  const gclid = searchParams.get("gclid") || "";

  useEffect(() => {
    setPageUrl(window.location.href);
    setPageTitle(document.title || "");
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const trigger = target.closest(".openLead");
      if (!trigger) return;
      event.preventDefault();
      lastActiveRef.current = trigger as HTMLElement;
      setIsOpen(true);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    if (isOpen) {
      const dialog = dialogRef.current;
      const focusTarget =
        dialog?.querySelector<HTMLElement>("#prenom") ?? dialog?.querySelector<HTMLElement>("button");
      focusTarget?.focus();
    } else {
      lastActiveRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!telephone) {
      const prefix = prefixes[country] ?? "";
      setTelephone(prefix ? `${prefix} ` : "");
    }
  }, [country, telephone]);

  const placeholder =
    country === "OTHER" ? "+ ..." : `${prefixes[country] ?? ""} ...`;

  const handleCountryChange = (value: string) => {
    setCountry(value);
    if (value === "OTHER") {
      if (telephone === "+32 " || telephone === "+33 ") {
        setTelephone("+");
      }
      return;
    }
    const prefix = prefixes[value];
    if (!telephone || telephone.trim() === "+" || telephone.startsWith("+32") || telephone.startsWith("+33")) {
      setTelephone(`${prefix} `);
    }
  };

  const handlePhoneChange = (value: string) => {
    if (country === "OTHER") {
      setTelephone(value);
      return;
    }
    const prefix = prefixes[country];
    if (!value.startsWith(prefix)) {
      const cleanContent = value.replace(/^[+\\d\\s-]*/, "");
      setTelephone(`${prefix} ${cleanContent}`.trimEnd());
      return;
    }
    setTelephone(value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formRef.current) return;
    setIsSending(true);
    setHasError(false);

    const formData = new FormData(formRef.current);
    const rawData = Object.fromEntries(formData.entries()) as Record<string, string>;
    if (rawData.telephone) {
      rawData.telephone = rawData.telephone.replace(/\s+/g, "");
      if (!rawData.telephone.startsWith("+") && !rawData.telephone.startsWith("00")) {
        if (rawData.telephone.startsWith("32") || rawData.telephone.startsWith("33")) {
          rawData.telephone = `+${rawData.telephone}`;
        }
      }
    }

    const payload = {
      ...rawData,
      meta: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ts: new Date().toISOString()
      }
    };

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let data: { ok?: boolean; error?: string } | null = null;
      try {
        data = JSON.parse(text) as { ok?: boolean; error?: string };
      } catch {
        data = null;
      }

      if (!res.ok || (data && data.ok === false)) {
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      setIsSent(true);
      setTimeout(() => {
        setIsOpen(false);
        formRef.current?.reset();
        setTelephone(prefixes[country] ? `${prefixes[country]} ` : "");
        setIsSent(false);
        setIsSending(false);
      }, 1100);
    } catch (error) {
      console.error("Erreur Apps Script :", error);
      alert("L'envoi n'a pas abouti. Merci de réessayer.");
      setHasError(true);
      setIsSending(false);
    }
  };

  return (
    <div
      id="leadModal"
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[100] ${isOpen ? "flex" : "hidden"} items-start justify-center bg-black/60 p-[clamp(16px,3vh,40px)]`}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          setIsOpen(false);
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leadTitle"
        aria-describedby="leadDesc"
        tabIndex={-1}
        ref={dialogRef}
        className={`w-full max-w-2xl overflow-hidden rounded-[22px] border ${
          mode === "b2b" ? "border-[#e9e9e9] bg-white" : "border-[#f0e6c7] bg-gradient-to-b from-white to-[#fffdf6]"
        } shadow-[0_30px_80px_rgba(0,0,0,0.28)]`}
      >
        <header
          className={`sticky top-0 flex items-center justify-between border-b ${
            mode === "b2b" ? "border-[#eee] bg-white" : "border-[#f4ead2] bg-gradient-to-b from-white to-[#fffdf6]"
          } px-6 py-6`}
        >
          <h3 id="leadTitle" className="text-xl font-black text-[#12130F]">
            Recevoir les offres 📩
          </h3>
          <button
            type="button"
            aria-label="Fermer"
            className="text-2xl font-semibold text-[#12130F]"
            onClick={() => setIsOpen(false)}
          >
            ×
          </button>
        </header>
        <div className={`mx-6 mt-4 h-2 rounded-full ${mode === "b2b" ? "bg-[#eee]" : "bg-[#f4ead2]"}`}>
          <i
            className={`block h-full w-full rounded-full ${
              mode === "b2b" ? "bg-[#CCCCCC]" : "bg-gradient-to-r from-[#C1950E] to-[#e3c04a]"
            }`}
          />
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className="px-6 pb-8 pt-6">
          <div id="leadDesc" className="px-2 pb-4 text-center text-lg font-semibold text-[#6b6b6b]">
            <strong>
              Remplissez le formulaire pour recevoir instantanément nos offres et prix par e-mail.
              <br /> Ou appelez-nous au +32 460 24 24 30 !
            </strong>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-[#12130F]" htmlFor="prenom">
                Prénom *
              </label>
              <input id="prenom" className={`${fieldClass} mt-2`} name="prenom" required />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#12130F]" htmlFor="nom">
                Nom *
              </label>
              <input id="nom" className={`${fieldClass} mt-2`} name="nom" required />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-[#12130F]" htmlFor="email">
                Adresse e-mail *
              </label>
              <input
                id="email"
                className={`${fieldClass} mt-2`}
                name="email"
                type="email"
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#12130F]" htmlFor="country">
                Pays
              </label>
              <select
                id="country"
                className={`${fieldClass} mt-2`}
                name="country"
                value={country}
                onChange={(event) => handleCountryChange(event.target.value)}
              >
                <option value="BE">🇧🇪 Belgique (+32)</option>
                <option value="FR">🇫🇷 France (+33)</option>
                <option value="OTHER">🌍 Autre</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#12130F]" htmlFor="telephone">
                Téléphone *
              </label>
              <input
                id="telephone"
                className={`${fieldClass} mt-2`}
                name="telephone"
                type="tel"
                required
                pattern="[+0-9\\s\\-]{6,}"
                placeholder={placeholder}
                value={telephone}
                onChange={(event) => handlePhoneChange(event.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-[#12130F]" htmlFor="type">
                Type d’événement*
              </label>
              <select id="type" className={`${fieldClass} mt-2`} name="type" required>
                <option value="">Sélectionnez…</option>
                <option value="Mariage">Mariage</option>
                <option value="Anniversaire">Anniversaire</option>
                <option value="Baptême">Baptême</option>
                <option value="Soirée corporate">Soirée corporate</option>
                <option value="Team building">Team building</option>
                <option value="Salon / stand">Salon / stand</option>
                <option value="Activation retail">Activation retail</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#12130F]" htmlFor="invites">
                Nombre d’invités*
              </label>
              <input id="invites" className={`${fieldClass} mt-2`} name="invites" required />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#12130F]" htmlFor="date">
                Date de l&apos;événement*
              </label>
              <input id="date" className={`${fieldClass} mt-2`} name="date" type="date" required />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#12130F]" htmlFor="lieu">
                Lieu (Ville / salle)*
              </label>
              <input id="lieu" className={`${fieldClass} mt-2`} name="lieu" required />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#12130F]" htmlFor="budget">
                Budget approximatif
              </label>
              <input id="budget" className={`${fieldClass} mt-2`} name="budget" />
            </div>
          </div>

          <input type="hidden" name="source" id="sourceField" value={mode === "b2b" ? "Landing B2B" : "Landing B2C"} />
          <input type="hidden" name="utm" id="utmField" value={utm} />
          <input type="hidden" name="mode" id="modeField" value={mode} />
          <input type="hidden" name="url" id="urlField" value={pageUrl} />
          <input type="hidden" name="pageTitle" id="titleField" value={pageTitle} />
          <input type="hidden" name="gclid" id="gclidField" value={gclid} />

          <div className="mt-5 flex justify-center">
            <button
              className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-black transition hover:-translate-y-0.5 ${
                mode === "b2b"
                  ? "bg-[#CCCCCC] text-[#12130F] shadow-[0_6px_18px_rgba(0,0,0,0.18)]"
                  : "bg-gradient-to-r from-[#C1950E] to-[#d8b73b] text-[#14140f] shadow-[0_6px_18px_rgba(193,149,14,0.28)]"
              }`}
              id="leadSubmit"
              type="submit"
              disabled={isSending}
            >
              {isSent
                ? "Envoyé ✔"
                : isSending
                  ? "Envoi…"
                  : hasError
                    ? "Réessayer"
                    : "Envoyer ma demande"}
            </button>
          </div>

          <p
            id="leadMsg"
            className={`mt-2 text-center font-semibold text-[#1a7f37] ${isSent ? "block" : "hidden"}`}
          >
            Merci ! Nous revenons vers vous très vite.
          </p>
        </form>
      </div>
    </div>
  );
}

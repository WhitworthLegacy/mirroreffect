"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type AvailabilityState = "idle" | "checking" | "available" | "unavailable" | "error";

const packs = [
  {
    code: "DISCOVERY",
    name: "200 impressions",
    promo: 390,
    original: 450,
    description: "Parfait pour une réception intime."
  },
  {
    code: "ESSENTIAL",
    name: "400 impressions",
    promo: 440,
    original: 500,
    description: "Le favori des mariages."
  },
  {
    code: "PREMIUM",
    name: "800 impressions",
    promo: 490,
    original: 550,
    description: "Pour une scénographie généreuse."
  }
] as const;

const vibeOptions = [
  {
    id: "chic",
    label: "Chic & élégant",
    image: "/images/IMG_0487.jpg"
  },
  {
    id: "gold",
    label: "Glamour doré",
    image: "/images/IMG_0496.jpg"
  },
  {
    id: "romance",
    label: "Romance classique",
    image: "/images/IMG_0494.jpg"
  },
  {
    id: "party",
    label: "Soirée festive",
    image: "/images/IMG_0488.jpg"
  }
];

const budgetOptions = [
  { id: "lt500", label: "Moins de 500€", min: 0 },
  { id: "500-800", label: "500€ — 800€", min: 500 },
  { id: "800-1200", label: "800€ — 1 200€", min: 800 },
  { id: "1200+", label: "1 200€+", min: 1200 }
];

const optionLabels: Record<string, string> = {
  RED_CARPET: "Tapis rouge",
  STANCHIONS: "Potelets + cordes",
  DIGITAL_ALBUM: "Album digital"
};

const baseClass =
  "w-full rounded-xl border border-[#E6E6E6] bg-white px-4 py-3 text-base text-[#12130F] focus:outline-none focus:ring-2 focus:ring-[#C1950E]/40";

const mailto = (subject: string, body: string) =>
  `mailto:mirror@mirroreffect.co?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export function ReservationFlow() {
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [zone, setZone] = useState<"BE" | "FR_NORD">("BE");
  const [availability, setAvailability] = useState<AvailabilityState>("idle");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [vibe, setVibe] = useState("");
  const [guests, setGuests] = useState("");
  const [budget, setBudget] = useState("500-800");
  const [packCode, setPackCode] = useState<(typeof packs)[number]["code"] | "">("");
  const [options, setOptions] = useState<string[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const transportFee = zone === "BE" ? 90 : 110;
  const selectedPack = packs.find((pack) => pack.code === packCode) ?? null;
  const totalPrice = selectedPack ? selectedPack.promo + transportFee : null;

  const budgetOk = useMemo(() => {
    const match = budgetOptions.find((item) => item.id === budget);
    return (match?.min ?? 0) >= 500;
  }, [budget]);

  const canContinueStep1 = Boolean(eventType && eventDate && location && availability === "available");
  const canContinueStep2 = Boolean(vibe);
  const canContinueStep3 = Boolean(guests && budgetOk);
  const canContinueStep4 = Boolean(packCode);
  const canContinueStep5 = Boolean(contactName && contactEmail && contactPhone);

  const toggleOption = (code: string) => {
    setOptions((prev) => (prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]));
  };

  const handleAvailability = async () => {
    if (!eventDate) return;
    setAvailability("checking");
    setRemaining(null);
    try {
      const res = await fetch(`/api/public/availability?date=${eventDate}`);
      const data = await res.json();
      if (!res.ok) {
        setAvailability("error");
        return;
      }
      setRemaining(data.remaining_mirrors ?? null);
      setAvailability(data.available ? "available" : "unavailable");
    } catch {
      setAvailability("error");
    }
  };

  const handleCheckout = async () => {
    if (!selectedPack) return;
    setIsSubmitting(true);
    setCheckoutError("");

    try {
      const res = await fetch("/api/public/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: "fr",
          client_name: contactName,
          client_email: contactEmail,
          client_phone: contactPhone,
          event_date: eventDate,
          zone_code: zone,
          pack_code: selectedPack.code,
          options
        })
      });

      const data = await res.json();
      if (!res.ok || !data?.checkout_url) {
        setCheckoutError("Une erreur est survenue. Merci de réessayer.");
        setIsSubmitting(false);
        return;
      }

      window.location.href = data.checkout_url;
    } catch {
      setCheckoutError("Une erreur est survenue. Merci de réessayer.");
      setIsSubmitting(false);
    }
  };

  const waitlistLink = mailto(
    "Liste d'attente — MirrorEffect",
    `Bonjour,\n\nLa date ${eventDate || "[date]"} n'est pas disponible. Nous souhaitons rejoindre la liste d'attente.\n\nNom: ${contactName || "[nom]"}\nEmail: ${waitlistEmail || contactEmail || "[email]"}\nTéléphone: ${waitlistPhone || contactPhone || "[telephone]"}\nLieu: ${location || "[lieu]"}\n\nMerci !`
  );

  const impressionsLink = mailto(
    "Demande impressions supplémentaires — MirrorEffect",
    `Bonjour,\n\nNous souhaitons un pack avec plus d'impressions.\n\nNom: ${contactName || "[nom]"}\nEmail: ${contactEmail || "[email]"}\nTéléphone: ${contactPhone || "[telephone]"}\nDate: ${eventDate || "[date]"}\nLieu: ${location || "[lieu]"}\nNombre d'invités: ${guests || "[invites]"}\n\nMerci !`
  );

  return (
    <section className="mx-auto max-w-[1100px] px-4 py-16">
      <header className="text-center">
        <span className="inline-flex rounded-full bg-gradient-to-r from-[#C1950E] to-[#e3c04a] px-3 py-1 text-xs font-black text-[#14140f] shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
          Reservation directe en ligne
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight">
          Votre photobooth miroir, reserve en quelques minutes.
        </h1>
        <p className="mt-3 text-sm text-[#666]">
          Un parcours emotionnel et clair, avec acompte de 180€ puis solde le jour J.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="glow-card rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-black text-[#12130F]">Etape {step} sur 5</div>
            <div className="flex h-2 w-40 overflow-hidden rounded-full bg-[#f2ead2]">
              <div
                className="h-full bg-gradient-to-r from-[#C1950E] to-[#e3c04a]"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

          {step === 1 && (
            <div className="mt-6 space-y-4">
              <h2 className="text-2xl font-black">1. Votre date, votre lieu, votre histoire.</h2>
              <p className="text-sm text-[#666]">
                On commence par l'essentiel pour verifier la disponibilite.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold" htmlFor="eventType">
                    Type d'evenement
                  </label>
                  <select
                    id="eventType"
                    className={`${baseClass} mt-2`}
                    value={eventType}
                    onChange={(event) => setEventType(event.target.value)}
                  >
                    <option value="">Selectionnez...</option>
                    <option value="Mariage">Mariage</option>
                    <option value="Anniversaire">Anniversaire</option>
                    <option value="Bapteme">Bapteme</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold" htmlFor="eventDate">
                    Date de l'evenement
                  </label>
                  <input
                    id="eventDate"
                    type="date"
                    className={`${baseClass} mt-2`}
                    value={eventDate}
                    onChange={(event) => setEventDate(event.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold" htmlFor="location">
                    Lieu (ville + salle)
                  </label>
                  <input
                    id="location"
                    className={`${baseClass} mt-2`}
                    placeholder="Bruxelles, Chateau..."
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold" htmlFor="zone">
                    Zone
                  </label>
                  <select
                    id="zone"
                    className={`${baseClass} mt-2`}
                    value={zone}
                    onChange={(event) => setZone(event.target.value as "BE" | "FR_NORD")}
                  >
                    <option value="BE">Belgique</option>
                    <option value="FR_NORD">Nord de la France</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="btn btn-gold w-full"
                    onClick={handleAvailability}
                    disabled={!eventDate || availability === "checking"}
                  >
                    {availability === "checking" ? "Verification..." : "Verifier la disponibilite"}
                  </button>
                </div>
              </div>

              {availability === "available" && (
                <div className="rounded-2xl border border-[#e8d082] bg-white px-4 py-3 text-sm text-[#3a3a3a]">
                  Disponible pour votre date. {remaining !== null && `Il reste ${remaining} miroir(s).`}
                </div>
              )}

              {availability === "unavailable" && (
                <div className="rounded-2xl border border-[#f2dede] bg-white px-4 py-3 text-sm text-[#5a3a3a]">
                  Cette date est deja reservee. Laissez-nous vos coordonnees pour la liste d'attente ou
                  recevoir des alternatives.
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input
                      className={baseClass}
                      placeholder="Votre email"
                      value={waitlistEmail}
                      onChange={(event) => setWaitlistEmail(event.target.value)}
                    />
                    <input
                      className={baseClass}
                      placeholder="Votre telephone"
                      value={waitlistPhone}
                      onChange={(event) => setWaitlistPhone(event.target.value)}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <a className="btn btn-dark" href={waitlistLink}>
                      Rejoindre la liste d'attente
                    </a>
                    <a className="btn btn-gold" href="mailto:mirror@mirroreffect.co">
                      Voir nos partenaires
                    </a>
                  </div>
                </div>
              )}

              {availability === "error" && (
                <div className="rounded-2xl border border-[#f2dede] bg-white px-4 py-3 text-sm text-[#5a3a3a]">
                  Impossible de verifier la disponibilite pour l'instant. Merci de reessayer.
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 space-y-4">
              <h2 className="text-2xl font-black">2. L'ambiance que vous voulez offrir.</h2>
              <p className="text-sm text-[#666]">
                Choisissez l'univers qui correspond a votre mariage. On s'adapte a votre deco.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {vibeOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`rounded-2xl border p-3 text-left transition ${
                      vibe === item.id ? "border-[#C1950E] shadow-[0_10px_28px_rgba(193,149,14,0.18)]" : "border-[#eee]"
                    }`}
                    onClick={() => setVibe(item.id)}
                  >
                    <div className="relative h-[180px] overflow-hidden rounded-xl">
                      <Image src={item.image} alt={item.label} fill className="object-cover" />
                    </div>
                    <p className="mt-3 text-sm font-black">{item.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mt-6 space-y-4">
              <h2 className="text-2xl font-black">3. Votre reception, votre energie.</h2>
              <p className="text-sm text-[#666]">
                Cela nous aide a dimensionner l'experience et garantir un rendu premium.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold" htmlFor="guests">
                    Nombre d'invites
                  </label>
                  <input
                    id="guests"
                    className={`${baseClass} mt-2`}
                    placeholder="Ex: 120"
                    value={guests}
                    onChange={(event) => setGuests(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold" htmlFor="budget">
                    Budget
                  </label>
                  <select
                    id="budget"
                    className={`${baseClass} mt-2`}
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                  >
                    {budgetOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {!budgetOk && (
                <div className="rounded-2xl border border-[#f2dede] bg-white px-4 py-3 text-sm text-[#5a3a3a]">
                  MirrorEffect est une experience premium a partir de 500€. Pour un budget plus bas,
                  nous pouvons recommander des partenaires.
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="mt-6 space-y-4">
              <h2 className="text-2xl font-black">4. Choisissez votre pack.</h2>
              <p className="text-sm text-[#666]">
                Prix promo valables pour une reservation directe aujourd'hui.
              </p>
              <div className="grid gap-4 lg:grid-cols-3">
                {packs.map((pack) => (
                  <button
                    key={pack.code}
                    type="button"
                    className={`rounded-2xl border p-4 text-left transition ${
                      packCode === pack.code
                        ? "border-[#C1950E] shadow-[0_12px_28px_rgba(193,149,14,0.18)]"
                        : "border-[#eee]"
                    }`}
                    onClick={() => setPackCode(pack.code)}
                  >
                    <h3 className="text-lg font-black">{pack.name}</h3>
                    <p className="mt-1 text-xs text-[#6b6b6b]">{pack.description}</p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#12130F]">{pack.promo}€</span>
                      <span className="text-xs text-[#9a9a9a] line-through">{pack.original}€</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    code: "RED_CARPET",
                    title: "Tapis rouge",
                    desc: "Effet entree de gala."
                  },
                  {
                    code: "STANCHIONS",
                    title: "Potelets + cordes",
                    desc: "Mise en scene premium."
                  },
                  {
                    code: "DIGITAL_ALBUM",
                    title: "Album digital",
                    desc: "Galerie apres l'event."
                  }
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    className={`rounded-2xl border px-4 py-3 text-left ${
                      options.includes(item.code)
                        ? "border-[#C1950E] bg-white shadow-[0_10px_28px_rgba(193,149,14,0.18)]"
                        : "border-[#eee] bg-white"
                    }`}
                    onClick={() => toggleOption(item.code)}
                  >
                    <div className="text-sm font-black">{item.title}</div>
                    <p className="mt-1 text-xs text-[#6b6b6b]">{item.desc}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-[#e8d082] bg-white px-4 py-4 text-sm text-[#3a3a3a]">
                <div className="font-black">Besoin de plus d'impressions ?</div>
                <p className="mt-2 text-xs text-[#6b6b6b]">
                  Laissez votre email et votre numero pour une proposition sur-mesure.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    className={baseClass}
                    placeholder="Votre email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                  />
                  <input
                    className={baseClass}
                    placeholder="Votre telephone"
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                  />
                </div>
                <div className="mt-3">
                  <a className="btn btn-dark" href={impressionsLink}>
                    Cliquez ici pour demander
                  </a>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="mt-6 space-y-4">
              <h2 className="text-2xl font-black">5. Finalisez votre reservation.</h2>
              <p className="text-sm text-[#666]">
                Acompte de 180€ aujourd'hui. Solde le jour J.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold" htmlFor="name">
                    Prenom et nom
                  </label>
                  <input
                    id="name"
                    className={`${baseClass} mt-2`}
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`${baseClass} mt-2`}
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold" htmlFor="phone">
                    Telephone
                  </label>
                  <input
                    id="phone"
                    className={`${baseClass} mt-2`}
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#eee] bg-white px-4 py-4 text-sm text-[#4a4a4a]">
                <div className="font-black">Recapitulatif</div>
                <p className="mt-2">Pack: {selectedPack ? selectedPack.name : "—"}</p>
                {options.length > 0 && (
                  <p>
                    Options: {options.map((item) => optionLabels[item] ?? item).join(", ")}
                  </p>
                )}
                <p>Transport: {transportFee}€</p>
                <p className="mt-2 font-black">
                  Total: {totalPrice ? `${totalPrice}€` : "—"}
                </p>
                <p className="text-xs text-[#6b6b6b]">Acompte aujourd'hui: 180€</p>
              </div>

              {checkoutError && (
                <div className="rounded-2xl border border-[#f2dede] bg-white px-4 py-3 text-sm text-[#5a3a3a]">
                  {checkoutError}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              disabled={step === 1}
            >
              Retour
            </button>
            {step < 5 && (
              <button
                type="button"
                className="btn btn-gold"
                disabled={
                  (step === 1 && !canContinueStep1) ||
                  (step === 2 && !canContinueStep2) ||
                  (step === 3 && !canContinueStep3) ||
                  (step === 4 && !canContinueStep4)
                }
                onClick={() => setStep((prev) => Math.min(5, prev + 1))}
              >
                Continuer
              </button>
            )}
            {step === 5 && (
              <button
                type="button"
                className="btn btn-gold"
                disabled={!canContinueStep5 || !selectedPack || isSubmitting}
                onClick={handleCheckout}
              >
                {isSubmitting ? "Redirection..." : "Payer l'acompte de 180€"}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="polaroid-card rounded-3xl p-4">
            <Image
              src="/images/IMG_0492.jpg"
              alt="Moment miroir photobooth MirrorEffect"
              width={520}
              height={640}
              className="h-[320px] w-full object-cover"
            />
            <p className="mt-3 text-sm font-black">
              "Le miroir a immediatement reuni nos invites."
            </p>
            <p className="text-xs text-[#6b6b6b]">Cools Florence — Mariage 21/09/2024</p>
          </div>
          <div className="glow-card rounded-3xl p-5 text-sm text-[#3d3d3d]">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#C1950E]">
              Pourquoi ca marche
            </div>
            <ul className="mt-3 list-disc pl-5 text-sm">
              <li>Miroir premium + animation qui attire tout le monde.</li>
              <li>Equipe dediee, rassurante, reactive depuis 2017.</li>
              <li>Cadre personnalise, tirages immediats, galerie elegante.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

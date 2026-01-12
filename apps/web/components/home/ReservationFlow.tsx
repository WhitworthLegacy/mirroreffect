"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type AvailabilityState = "idle" | "checking" | "available" | "unavailable" | "error";
type PackCode = "DISCOVERY" | "ESSENTIAL" | "PREMIUM";

const baseClass =
  "w-full rounded-xl border border-[#E6E6E6] bg-white px-4 py-3 text-base text-[#12130F] focus:outline-none focus:ring-2 focus:ring-[#C1950E]/40";

const mailto = (subject: string, body: string) =>
  `mailto:mirror@mirroreffect.co?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const copy = {
  fr: {
    badge: "Reservation directe en ligne",
    title: "Votre photobooth miroir, reserve en quelques minutes.",
    subtitle: "Un parcours emotionnel et clair, avec acompte de 180€ puis solde le jour J.",
    stories: [
      {
        title: "Le miroir qui fait parler tout le mariage.",
        text:
          "Chaque couple veut un moment qui rassemble, qui fait rire, qui devient un souvenir qu'on garde et qu'on montre. Notre miroir crée ce moment-là."
      },
      {
        title: "Un instant signature pour vos invités.",
        text:
          "Une animation élégante qui attire naturellement les regards, libère les sourires et crée des photos que l'on adore partager."
      },
      {
        title: "Le cadre photo qui raconte votre histoire.",
        text:
          "Couleurs, prénoms, date, ambiance : on personnalise pour que chaque photo porte votre signature."
      },
      {
        title: "Une expérience fluide et rassurante.",
        text:
          "Notre équipe gère tout avec discrétion pour que vous profitiez du moment, sans stress."
      },
      {
        title: "La montée en valeur qui change tout.",
        text:
          "Quand l'expérience est premium, le souvenir devient précieux. C'est ce que vos proches garderont."
      },
      {
        title: "Votre date est sur le point d'être réservée.",
        text:
          "On confirme votre acompte, on verrouille la date, et vous profitez d'un parcours sans friction."
      }
    ],
    testimonials: [
      {
        quote:
          "Mirror Effect est un concept testé lors de notre event à Liège : beaucoup de joie et de bonne humeur pour nos 214 invités.",
        author: "Christian Bléser — CEO HD4You"
      },
      {
        quote:
          "Qualité au top, photos personnalisables, équipe disponible. À recommander.",
        author: "Cools Florence — Mariage 21/09/2024"
      },
      {
        quote:
          "Un cadre original avec tapis rouge et barrières : on se sent comme des stars.",
        author: "Amélie Schwanen"
      },
      {
        quote:
          "Le photobooth miroir, une expérience unique. Merci pour ce super moment.",
        author: "Sabrina Leclergé"
      }
    ],
    stepLabel: "Etape",
    step1Title: "1. Votre date, votre lieu, votre histoire.",
    step1Desc: "On commence par l'essentiel pour verifier la disponibilite.",
    eventTypeLabel: "Type d'evenement",
    eventDateLabel: "Date de l'evenement",
    locationLabel: "Lieu (ville + salle)",
    locationPlaceholder: "Bruxelles, Chateau...",
    zoneLabel: "Zone",
    zoneBe: "Belgique",
    zoneFr: "Nord de la France",
    checkAvailability: "Verifier la disponibilite",
    checking: "Verification...",
    redirecting: "Redirection...",
    available: "Disponible pour votre date.",
    remaining: "Il reste",
    mirrors: "miroir(s).",
    unavailableTitle:
      "Cette date est deja reservee. Laissez-nous vos coordonnees pour la liste d'attente ou recevoir des alternatives.",
    waitlistEmail: "Votre email",
    waitlistPhone: "Votre telephone",
    waitlistCta: "Rejoindre la liste d'attente",
    partnersCta: "Voir nos partenaires",
    availabilityError: "Impossible de verifier la disponibilite pour l'instant. Merci de reessayer.",
    step2Title: "2. L'ambiance que vous voulez offrir.",
    step2Desc: "Choisissez l'univers qui correspond a votre mariage. On s'adapte a votre deco.",
    step3Title: "3. Votre theme de couleur.",
    step3Desc: "Choisissez le style visuel du cadre photo, on le declinera a votre nom.",
    themeClassic: "Ivoire & chic",
    themeGold: "Dorures champagne",
    themeRose: "Romance rose",
    themeMinimal: "Minimal noir & blanc",
    themeEditorial: "Editorial moderne",
    themeGroupElegant: "Élégant",
    themeGroupGlam: "Glam",
    themeGroupRomance: "Romance",
    themeGroupMinimal: "Minimal",
    themeGroupCorporate: "Corporate",
    step4Title: "4. Votre reception, votre energie.",
    step4Desc:
      "Cela nous aide a dimensionner le flux et garantir une experience fluide et premium.",
    guestsLabel: "Nombre d'invites",
    guestsPlaceholder: "Ex: 120",
    priorityLabel: "Ce qui compte le plus",
    priorityA: "Une ambiance elegante qui rassemble",
    priorityB: "Des photos premium a garder",
    priorityC: "Un souvenir qui fait parler",
    step5Title: "5. Choisissez votre pack.",
    step5Desc: "Prix promo valables pour une réservation directe aujourd'hui.",
    depositLine: "Acompte de 180€ aujourd'hui. Solde le jour J.",
    frameTitle: "Idees de cadres photo",
    frameDesc: "Voici des idees, ne vous inquietez pas on personnalise tout pour vous !",
    step4More: "Besoin de plus d'impressions ?",
    step4MoreDesc:
      "Laissez votre email et votre numero pour une proposition sur-mesure.",
    step4MoreCta: "Cliquez ici pour demander",
    step6Title: "6. Finalisez votre reservation.",
    step6Desc: "Acompte de 180€ aujourd'hui. Solde le jour J.",
    nameLabel: "Prenom et nom",
    emailLabel: "Email",
    phoneLabel: "Telephone",
    recapTitle: "Recapitulatif",
    recapPack: "Pack",
    recapOptions: "Options",
    recapTransport: "Transport",
    transportNote: "Frais de transport fixes: 90€",
    recapTotal: "Total",
    recapDeposit: "Acompte aujourd'hui: 180€",
    checkoutError: "Une erreur est survenue. Merci de reessayer.",
    back: "Retour",
    next: "Continuer",
    payDeposit: "Payer l'acompte de 180€",
    proofQuote: "\"Le miroir a immediatement reuni nos invites.\"",
    proofAuthor: "Cools Florence — Mariage 21/09/2024",
    proofTitle: "Pourquoi ca marche",
    proofItems: [
      "Miroir premium + animation qui attire tout le monde.",
      "Equipe dediee, rassurante, reactive depuis 2017.",
      "Cadre personnalise, tirages immediats, galerie elegante."
    ],
    optionRed: "Tapis rouge",
    optionStanchions: "Potelets + cordes",
    optionAlbum: "Album digital",
    optionRedDesc: "Effet entree de gala.",
    optionStanchionsDesc: "Mise en scene premium.",
    optionAlbumDesc: "Galerie apres l'event.",
    vibeChic: "Chic & elegant",
    vibeGold: "Glamour dore",
    vibeRomance: "Romance classique",
    vibeParty: "Soiree festive",
    packDiscoveryDesc: "Parfait pour une reception intime.",
    packEssentialDesc: "Le favori des mariages.",
    packPremiumDesc: "Pour une scenographie genereuse.",
    packDiscoveryName: "Découverte",
    packEssentialName: "Essentiel",
    packPremiumName: "Premium",
    frameClassic: "Classique elegant",
    frameGold: "Dorures & glamour",
    frameRomance: "Romance florale",
    frameMinimal: "Minimal chic",
    availabilityEmailSubject: "Liste d'attente — MirrorEffect",
    availabilityEmailBody:
      "Bonjour,\n\nLa date {{date}} n'est pas disponible. Nous souhaitons rejoindre la liste d'attente.\n\nNom: {{name}}\nEmail: {{email}}\nTelephone: {{phone}}\nLieu: {{location}}\n\nMerci !",
    impressionsEmailSubject: "Demande impressions supplémentaires — MirrorEffect",
    impressionsEmailBody:
      "Bonjour,\n\nNous souhaitons un pack avec plus d'impressions.\n\nNom: {{name}}\nEmail: {{email}}\nTelephone: {{phone}}\nDate: {{date}}\nLieu: {{location}}\nNombre d'invites: {{guests}}\n\nMerci !",
    imageAlt: "Souvenir photobooth miroir MirrorEffect"
  },
  nl: {
    badge: "Direct online reserveren",
    title: "Uw spiegel photobooth, in enkele minuten gereserveerd.",
    subtitle: "Emotioneel en duidelijk parcours, met voorschot van €180 en saldo op de dag zelf.",
    stories: [
      {
        title: "De spiegel die uw huwelijk doet schitteren.",
        text:
          "Elk koppel wil dat ene moment dat iedereen samenbrengt en doet glimlachen. Onze spiegel maakt dat moment."
      },
      {
        title: "Een signature moment voor uw gasten.",
        text:
          "Een elegante animatie die iedereen aantrekt en spontane, prachtige foto's oplevert."
      },
      {
        title: "Het fotokader vertelt uw verhaal.",
        text:
          "Kleuren, namen, datum en stijl: we personaliseren alles tot in de details."
      },
      {
        title: "Vlot, geruststellend en professioneel.",
        text:
          "Ons team regelt alles discreet zodat u zorgeloos geniet."
      },
      {
        title: "Premium beleving verhoogt de waarde.",
        text:
          "Hoe mooier de beleving, hoe waardevoller de herinnering. Dat blijft hangen."
      },
      {
        title: "Uw datum wordt nu vastgelegd.",
        text:
          "We bevestigen het voorschot, reserveren uw datum en starten de voorbereiding."
      }
    ],
    testimonials: [
      {
        quote:
          "Een concept getest in Luik: veel vreugde en sfeer voor al onze gasten.",
        author: "Christian Bléser — CEO HD4You"
      },
      {
        quote:
          "Topkwaliteit, personaliseerbare foto's en een beschikbaar team. Aanrader.",
        author: "Cools Florence — Huwelijk 21/09/2024"
      },
      {
        quote:
          "Origineel kader met rode loper en paaltjes: je voelt je een ster.",
        author: "Amélie Schwanen"
      },
      {
        quote:
          "Unieke ervaring met instant foto's. Bedankt voor dit moment.",
        author: "Sabrina Leclergé"
      }
    ],
    stepLabel: "Stap",
    step1Title: "1. Uw datum, uw locatie, uw verhaal.",
    step1Desc: "We starten met het essentiële om beschikbaarheid te checken.",
    eventTypeLabel: "Type evenement",
    eventDateLabel: "Datum van het evenement",
    locationLabel: "Locatie (stad + zaal)",
    locationPlaceholder: "Brussel, kasteel...",
    zoneLabel: "Zone",
    zoneBe: "Belgie",
    zoneFr: "Noord-Frankrijk",
    checkAvailability: "Beschikbaarheid checken",
    checking: "Bezig met checken...",
    redirecting: "Doorverwijzen...",
    available: "Beschikbaar op uw datum.",
    remaining: "Er zijn nog",
    mirrors: "spiegel(s).",
    unavailableTitle:
      "Deze datum is al geboekt. Laat uw gegevens achter voor de wachtlijst of alternatieven.",
    waitlistEmail: "Uw e-mail",
    waitlistPhone: "Uw telefoon",
    waitlistCta: "Op de wachtlijst",
    partnersCta: "Partners bekijken",
    availabilityError: "Beschikbaarheid kan nu niet gecontroleerd worden. Probeer opnieuw.",
    step2Title: "2. De sfeer die u wil geven.",
    step2Desc: "Kies de stijl die bij uw huwelijk past. Wij passen ons aan.",
    step3Title: "3. Uw kleurthema.",
    step3Desc: "Kies de visuele stijl van het fotokader. Wij personaliseren alles.",
    themeClassic: "Ivoor & chic",
    themeGold: "Champagne goud",
    themeRose: "Romantisch roze",
    themeMinimal: "Minimal zwart-wit",
    themeEditorial: "Modern editorial",
    themeGroupElegant: "Elegant",
    themeGroupGlam: "Glamour",
    themeGroupRomance: "Romantisch",
    themeGroupMinimal: "Minimal",
    themeGroupCorporate: "Corporate",
    step4Title: "4. Uw receptie, uw energie.",
    step4Desc: "Zo houden we het tempo vlot en de ervaring premium.",
    guestsLabel: "Aantal gasten",
    guestsPlaceholder: "Bijv. 120",
    priorityLabel: "Wat telt het meest",
    priorityA: "Een elegante sfeer die verbindt",
    priorityB: "Premium foto's om te bewaren",
    priorityC: "Een herinnering die blijft",
    step5Title: "5. Kies uw pakket.",
    step5Desc: "Promo-prijzen voor directe reservatie vandaag.",
    depositLine: "Voorschot van €180 vandaag. Saldo op de dag zelf.",
    frameTitle: "Voorbeelden van fotokaders",
    frameDesc: "Enkele ideeen, geen zorgen: wij personaliseren alles voor u.",
    step4More: "Meer afdrukken nodig?",
    step4MoreDesc: "Laat uw e-mail en telefoon achter voor een voorstel op maat.",
    step4MoreCta: "Klik hier om aan te vragen",
    step6Title: "6. Rond uw reservatie af.",
    step6Desc: "Voorschot van €180 vandaag. Saldo op de dag zelf.",
    nameLabel: "Voornaam en naam",
    emailLabel: "E-mail",
    phoneLabel: "Telefoon",
    recapTitle: "Overzicht",
    recapPack: "Pakket",
    recapOptions: "Opties",
    recapTransport: "Transport",
    transportNote: "Transportkosten vast: €90",
    recapTotal: "Totaal",
    recapDeposit: "Voorschot vandaag: €180",
    checkoutError: "Er ging iets mis. Probeer opnieuw.",
    back: "Terug",
    next: "Verder",
    payDeposit: "Voorschot €180 betalen",
    proofQuote: "\"De spiegel bracht onze gasten meteen samen.\"",
    proofAuthor: "Cools Florence — Huwelijk 21/09/2024",
    proofTitle: "Waarom dit werkt",
    proofItems: [
      "Premium spiegel + animatie die iedereen aantrekt.",
      "Toegewijd team, geruststellend en reactief sinds 2017.",
      "Gepersonaliseerd kader, instant prints, elegante galerij."
    ],
    optionRed: "Rode loper",
    optionStanchions: "Paaltjes + koord",
    optionAlbum: "Digitaal album",
    optionRedDesc: "Gala-gevoel bij de entree.",
    optionStanchionsDesc: "Premium mise-en-scène.",
    optionAlbumDesc: "Galerij na het event.",
    vibeChic: "Chic & elegant",
    vibeGold: "Gouden glamour",
    vibeRomance: "Klassieke romance",
    vibeParty: "Feestelijke avond",
    packDiscoveryDesc: "Perfect voor intieme recepties.",
    packEssentialDesc: "Favoriet bij huwelijken.",
    packPremiumDesc: "Voor een rijke scenografie.",
    packDiscoveryName: "Découverte",
    packEssentialName: "Essentiel",
    packPremiumName: "Premium",
    frameClassic: "Klassiek elegant",
    frameGold: "Goud & glamour",
    frameRomance: "Romantisch floral",
    frameMinimal: "Minimal chic",
    availabilityEmailSubject: "Wachtlijst — MirrorEffect",
    availabilityEmailBody:
      "Hallo,\n\nDe datum {{date}} is niet beschikbaar. We willen op de wachtlijst.\n\nNaam: {{name}}\nE-mail: {{email}}\nTelefoon: {{phone}}\nLocatie: {{location}}\n\nDank u!",
    impressionsEmailSubject: "Aanvraag extra prints — MirrorEffect",
    impressionsEmailBody:
      "Hallo,\n\nWe willen een pakket met meer prints.\n\nNaam: {{name}}\nE-mail: {{email}}\nTelefoon: {{phone}}\nDatum: {{date}}\nLocatie: {{location}}\nAantal gasten: {{guests}}\n\nDank u!",
    imageAlt: "MirrorEffect photobooth moment"
  }
};

export function ReservationFlow() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "nl" ? "nl" : "fr";
  const strings = copy[lang];
  const t = (key: Exclude<keyof typeof copy.fr, "proofItems" | "stories" | "testimonials">) => strings[key];
  const proofItems = strings.proofItems;

  const packs = useMemo(
    () => [
      {
        code: "DISCOVERY" as PackCode,
        name: t("packDiscoveryName"),
        promo: 390,
        original: 450,
        description: t("packDiscoveryDesc")
      },
      {
        code: "ESSENTIAL" as PackCode,
        name: t("packEssentialName"),
        promo: 440,
        original: 500,
        description: t("packEssentialDesc")
      },
      {
        code: "PREMIUM" as PackCode,
        name: t("packPremiumName"),
        promo: 490,
        original: 550,
        description: t("packPremiumDesc")
      }
    ],
    [lang]
  );

  const vibeOptions = useMemo(
    () => [
      {
        id: "chic",
        label: t("vibeChic"),
        image: "/images/IMG_0487.jpg"
      },
      {
        id: "gold",
        label: t("vibeGold"),
        image: "/images/IMG_0496.jpg"
      },
      {
        id: "romance",
        label: t("vibeRomance"),
        image: "/images/IMG_0494.jpg"
      },
      {
        id: "party",
        label: t("vibeParty"),
        image: "/images/IMG_0488.jpg"
      }
    ],
    [lang]
  );

  const themeOptions = useMemo(
    () => [
      { id: "classic", label: t("themeClassic"), image: "/images/(2).png" },
      { id: "gold", label: t("themeGold"), image: "/images/43.png" },
      { id: "rose", label: t("themeRose"), image: "/images/10.png" },
      { id: "minimal", label: t("themeMinimal"), image: "/images/111.png" },
      { id: "editorial", label: t("themeEditorial"), image: "/images/Hilton - 29.11.2025.png" }
    ].map((item) => ({ ...item, image: encodeURI(item.image) })),
    [lang]
  );

  const optionChoices = useMemo(
    () => [
      { code: "RED_CARPET", title: t("optionRed"), desc: t("optionRedDesc") },
      { code: "STANCHIONS", title: t("optionStanchions"), desc: t("optionStanchionsDesc") },
      { code: "DIGITAL_ALBUM", title: t("optionAlbum"), desc: t("optionAlbumDesc") }
    ],
    [lang]
  );

  const optionLabels: Record<string, string> = {
    RED_CARPET: strings.optionRed,
    STANCHIONS: strings.optionStanchions,
    DIGITAL_ALBUM: strings.optionAlbum
  };
  const eventTypeOptions = lang === "nl"
    ? [
        { value: "Huwelijk", label: "Huwelijk" },
        { value: "Verjaardag", label: "Verjaardag" },
        { value: "Doop", label: "Doop" }
      ]
    : [
        { value: "Mariage", label: "Mariage" },
        { value: "Anniversaire", label: "Anniversaire" },
        { value: "Bapteme", label: "Bapteme" }
      ];

  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [zone, setZone] = useState<"BE" | "FR_NORD">("BE");
  const [availability, setAvailability] = useState<AvailabilityState>("idle");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [vibe, setVibe] = useState("");
  const [theme, setTheme] = useState("");
  const [guests, setGuests] = useState("");
  const [priority, setPriority] = useState("");
  const [packCode, setPackCode] = useState<PackCode | "">("");
  const [options, setOptions] = useState<string[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [zoomImage, setZoomImage] = useState("");
  const [zoomLabel, setZoomLabel] = useState("");
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const story = strings.stories[Math.max(0, Math.min(step - 1, strings.stories.length - 1))];
  const testimonials = strings.testimonials;
  const currentTestimonial = testimonials[testimonialIndex % testimonials.length];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [testimonials.length]);

  const transportFee = 90;
  const selectedPack = packs.find((pack) => pack.code === packCode) ?? null;
  const totalPrice = selectedPack ? selectedPack.promo + transportFee : null;

  const canContinueStep1 = Boolean(eventType && eventDate && location && availability === "available");
  const canContinueStep2 = Boolean(vibe);
  const canContinueStep3 = Boolean(theme);
  const canContinueStep4 = Boolean(guests && priority);
  const canContinueStep5 = Boolean(packCode);
  const canContinueStep6 = Boolean(contactName && contactEmail && contactPhone);

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
          language: lang,
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
        setCheckoutError(t("checkoutError"));
        setIsSubmitting(false);
        return;
      }

      window.location.href = data.checkout_url;
    } catch {
      setCheckoutError(t("checkoutError"));
      setIsSubmitting(false);
    }
  };

  const waitlistLink = mailto(
    t("availabilityEmailSubject"),
    t("availabilityEmailBody")
      .replace("{{date}}", eventDate || "[date]")
      .replace("{{name}}", contactName || "[nom]")
      .replace("{{email}}", waitlistEmail || contactEmail || "[email]")
      .replace("{{phone}}", waitlistPhone || contactPhone || "[telephone]")
      .replace("{{location}}", location || "[lieu]")
  );

  const impressionsLink = mailto(
    t("impressionsEmailSubject"),
    t("impressionsEmailBody")
      .replace("{{name}}", contactName || "[nom]")
      .replace("{{email}}", contactEmail || "[email]")
      .replace("{{phone}}", contactPhone || "[telephone]")
      .replace("{{date}}", eventDate || "[date]")
      .replace("{{location}}", location || "[lieu]")
      .replace("{{guests}}", guests || "[invites]")
  );

  const openZoom = (image: string, label: string) => {
    setZoomImage(image);
    setZoomLabel(label);
  };

  const closeZoom = () => {
    setZoomImage("");
    setZoomLabel("");
  };

  return (
    <section className="mx-auto max-w-[1100px] px-4 py-16">
      <header className="text-center">
        <span className="inline-flex rounded-full bg-gradient-to-r from-[#C1950E] to-[#e3c04a] px-3 py-1 text-xs font-black text-[#14140f] shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
          {t("badge")}
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-3 text-sm text-[#666]">{t("subtitle")}</p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="flow-card rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-black text-[#12130F]">
              {t("stepLabel")} {step} / 6
            </div>
            <div className="flex h-2 w-40 overflow-hidden rounded-full bg-[#f2ead2]">
              <div className="flow-progress h-full" style={{ width: `${(step / 6) * 100}%` }} />
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-[#f0e6c7] bg-white px-5 py-4 text-left shadow-[0_14px_34px_rgba(0,0,0,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C1950E]">
              Story
            </p>
            <h2 className="mt-2 text-lg font-black">{story.title}</h2>
            <p className="mt-2 text-sm text-[#5a5a5a]">{story.text}</p>
          </div>

          {step === 1 && (
            <div className="flow-step mt-6 space-y-4">
              <h2 className="text-2xl font-black">{t("step1Title")}</h2>
              <p className="text-sm text-[#666]">{t("step1Desc")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold" htmlFor="eventType">
                    {t("eventTypeLabel")}
                  </label>
                  <select
                    id="eventType"
                    className={`${baseClass} mt-2`}
                    value={eventType}
                    onChange={(event) => setEventType(event.target.value)}
                  >
                    <option value="">{lang === "nl" ? "Selecteer..." : "Selectionnez..."}</option>
                    {eventTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold" htmlFor="eventDate">
                    {t("eventDateLabel")}
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
                    {t("locationLabel")}
                  </label>
                  <input
                    id="location"
                    className={`${baseClass} mt-2`}
                    placeholder={t("locationPlaceholder")}
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold" htmlFor="zone">
                    {t("zoneLabel")}
                  </label>
                  <select
                    id="zone"
                    className={`${baseClass} mt-2`}
                    value={zone}
                    onChange={(event) => setZone(event.target.value as "BE" | "FR_NORD")}
                  >
                    <option value="BE">{t("zoneBe")}</option>
                    <option value="FR_NORD">{t("zoneFr")}</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="btn btn-gold flow-cta w-full"
                    onClick={handleAvailability}
                    disabled={!eventDate || availability === "checking"}
                  >
                    {availability === "checking" ? t("checking") : t("checkAvailability")}
                  </button>
                </div>
              </div>

              {availability === "available" && (
                <div className="rounded-2xl border border-[#e8d082] bg-white px-4 py-3 text-sm text-[#3a3a3a]">
                  {t("available")}{" "}
                  {remaining !== null && `${t("remaining")} ${remaining} ${t("mirrors")}`}
                </div>
              )}

              {availability === "unavailable" && (
                <div className="rounded-2xl border border-[#f2dede] bg-white px-4 py-3 text-sm text-[#5a3a3a]">
                  {t("unavailableTitle")}
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input
                      className={baseClass}
                      placeholder={t("waitlistEmail")}
                      value={waitlistEmail}
                      onChange={(event) => setWaitlistEmail(event.target.value)}
                    />
                    <input
                      className={baseClass}
                      placeholder={t("waitlistPhone")}
                      value={waitlistPhone}
                      onChange={(event) => setWaitlistPhone(event.target.value)}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <a className="btn btn-dark" href={waitlistLink}>
                      {t("waitlistCta")}
                    </a>
                    <a className="btn btn-gold" href="mailto:mirror@mirroreffect.co">
                      {t("partnersCta")}
                    </a>
                  </div>
                </div>
              )}

              {availability === "error" && (
                <div className="rounded-2xl border border-[#f2dede] bg-white px-4 py-3 text-sm text-[#5a3a3a]">
                  {t("availabilityError")}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flow-step mt-6 space-y-4">
              <h2 className="text-2xl font-black">{t("step2Title")}</h2>
              <p className="text-sm text-[#666]">{t("step2Desc")}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {vibeOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`rounded-2xl border p-3 text-left transition ${
                      vibe === item.id
                        ? "border-[#C1950E] shadow-[0_10px_28px_rgba(193,149,14,0.18)]"
                        : "border-[#eee]"
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
            <div className="flow-step mt-6 space-y-4">
              <h2 className="text-2xl font-black">{t("step3Title")}</h2>
              <p className="text-sm text-[#666]">{t("step3Desc")}</p>
              <div className="rounded-3xl border border-[#f0e6c7] bg-white px-5 py-5">
                <div>
                  <h3 className="text-lg font-black">{t("frameTitle")}</h3>
                  <p className="mt-1 text-xs text-[#6b6b6b]">{t("frameDesc")}</p>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {themeOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`rounded-2xl border p-3 text-left transition ${
                        theme === item.id
                          ? "border-[#C1950E] shadow-[0_10px_28px_rgba(193,149,14,0.18)]"
                          : "border-[#eee]"
                      }`}
                      onClick={() => setTheme(item.id)}
                    >
                      <div className="relative h-[150px] overflow-hidden rounded-xl bg-white">
                        <Image src={item.image} alt={item.label} fill className="object-contain p-2" />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-sm font-black">&nbsp;</span>
                        <span
                          className="text-xs font-semibold text-[#C1950E]"
                          onClick={(event) => {
                            event.stopPropagation();
                            openZoom(item.image, item.label);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openZoom(item.image, item.label);
                            }
                          }}
                        >
                          Zoom
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flow-step mt-6 space-y-4">
              <h2 className="text-2xl font-black">{t("step4Title")}</h2>
              <p className="text-sm text-[#666]">{t("step4Desc")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold" htmlFor="guests">
                    {t("guestsLabel")}
                  </label>
                  <input
                    id="guests"
                    className={`${baseClass} mt-2`}
                    placeholder={t("guestsPlaceholder")}
                    value={guests}
                    onChange={(event) => setGuests(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold" htmlFor="priority">
                    {t("priorityLabel")}
                  </label>
                  <select
                    id="priority"
                    className={`${baseClass} mt-2`}
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                  >
                    <option value="">{lang === "nl" ? "Selecteer..." : "Selectionnez..."}</option>
                    <option value="ambiance">{t("priorityA")}</option>
                    <option value="photos">{t("priorityB")}</option>
                    <option value="souvenir">{t("priorityC")}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flow-step mt-6 space-y-4">
              <h2 className="text-2xl font-black">{t("step5Title")}</h2>
              <p className="text-sm text-[#666]">{t("step5Desc")}</p>
              <p className="text-xs font-semibold text-[#C1950E]">{t("depositLine")}</p>
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
                    <p className="mt-1 text-[11px] text-[#9a9a9a]">+ 90€ frais de transport</p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#12130F]">{pack.promo}€</span>
                      <span className="text-xs text-[#9a9a9a] line-through">{pack.original}€</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {optionChoices.map((item) => (
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
                <div className="font-black">{t("step4More")}</div>
                <p className="mt-2 text-xs text-[#6b6b6b]">{t("step4MoreDesc")}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    className={baseClass}
                    placeholder={t("emailLabel")}
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                  />
                  <input
                    className={baseClass}
                    placeholder={t("phoneLabel")}
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                  />
                </div>
                <div className="mt-3">
                  <a className="btn btn-dark" href={impressionsLink}>
                    {t("step4MoreCta")}
                  </a>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="flow-step mt-6 space-y-4">
              <h2 className="text-2xl font-black">{t("step6Title")}</h2>
              <p className="text-sm text-[#666]">{t("step6Desc")}</p>
              <p className="text-xs font-semibold text-[#C1950E]">{t("depositLine")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold" htmlFor="name">
                    {t("nameLabel")}
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
                    {t("emailLabel")}
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
                    {t("phoneLabel")}
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
                <div className="font-black">{t("recapTitle")}</div>
                <p className="mt-2">
                  {t("recapPack")}: {selectedPack ? selectedPack.name : "—"}
                </p>
                {options.length > 0 && (
                  <p>
                    {t("recapOptions")}: {options.map((item) => optionLabels[item] ?? item).join(", ")}
                  </p>
                )}
                <p>
                  {t("recapTransport")}: {transportFee}€
                </p>
                <p className="text-xs text-[#6b6b6b]">{t("transportNote")}</p>
                <p className="mt-2 font-black">
                  {t("recapTotal")}: {totalPrice ? `${totalPrice}€` : "—"}
                </p>
                <p className="text-xs text-[#6b6b6b]">{t("recapDeposit")}</p>
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
              {t("back")}
            </button>
            {step < 6 && (
              <button
                type="button"
                className="btn btn-gold flow-cta"
                disabled={
                  (step === 1 && !canContinueStep1) ||
                  (step === 2 && !canContinueStep2) ||
                  (step === 3 && !canContinueStep3) ||
                  (step === 4 && !canContinueStep4) ||
                  (step === 5 && !canContinueStep5)
                }
                onClick={() => setStep((prev) => Math.min(6, prev + 1))}
              >
                {t("next")}
              </button>
            )}
            {step === 6 && (
              <button
                type="button"
                className="btn btn-gold flow-cta"
                disabled={!canContinueStep6 || !selectedPack || isSubmitting}
                onClick={handleCheckout}
              >
                {isSubmitting ? t("redirecting") : t("payDeposit")}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flow-media rounded-3xl p-4">
            <Image
              src="/images/IMG_0492.jpg"
              alt={t("imageAlt")}
              width={520}
              height={640}
              className="h-[320px] w-full object-cover"
            />
            <p className="mt-3 text-sm font-black">"{currentTestimonial.quote}"</p>
            <p className="text-xs text-[#6b6b6b]">{currentTestimonial.author}</p>
            <p className="mt-2 text-[11px] text-[#b08c1a]">Avis qui défilent automatiquement • 5s</p>
          </div>
          <div className="flow-card flow-glow rounded-3xl p-5 text-sm text-[#3d3d3d]">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#C1950E]">
              {t("proofTitle")}
            </div>
            <ul className="mt-3 list-disc pl-5 text-sm">
              {proofItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {zoomImage && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4"
          onClick={closeZoom}
        >
          <div
            className="w-full max-w-3xl rounded-3xl bg-white p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-black">{zoomLabel}</p>
              <button
                type="button"
                className="text-2xl font-semibold text-[#12130F]"
                onClick={closeZoom}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            <div className="relative mt-4 h-[520px] overflow-hidden rounded-2xl bg-[#fffaf0]">
              <Image src={zoomImage} alt={zoomLabel} fill className="object-contain p-6" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

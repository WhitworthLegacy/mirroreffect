import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";
import { MotionReveal } from "@/components/home/MotionReveal";
import { ModeSwitch } from "@/components/home/ModeSwitch";
import { LeadModal } from "@/components/home/LeadModal";

const canonicalUrl = "https://mirroreffect.co/";

export const metadata: Metadata = {
  title: "MirrorEffect • Miroir Photobooth Premium pour Mariages & Événements",
  description:
    "MirrorEffect élève vos événements avec un miroir photobooth interactif, élégant et personnalisable. Mariages, soirées d’entreprise, galas et lancements de marque en Belgique. Expérience photo haut de gamme et inoubliable.",
  alternates: {
    canonical: canonicalUrl
  },
  robots: {
    index: true,
    follow: true
  },
  themeColor: "#12130F",
  openGraph: {
    title: "MirrorEffect — Miroir Photobooth Premium pour Mariages & Événements",
    description:
      "Miroir photobooth interactif et haut de gamme pour vos mariages, soirées et événements d’entreprise. Élégance, animation et souvenirs instantanés.",
    url: canonicalUrl,
    type: "website",
    images: ["https://mirroreffect.co/og-image.jpg"]
  },
  twitter: {
    card: "summary_large_image"
  }
};

type PageProps = {
  searchParams?: {
    mode?: string;
  };
};

const buttonBase =
  "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-black transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C1950E]/70";
const primaryButton = `${buttonBase} bg-gradient-to-r from-[#C1950E] to-[#d8b73b] text-[#14140f] shadow-[0_6px_18px_rgba(193,149,14,0.28)] hover:shadow-[0_10px_26px_rgba(193,149,14,0.35)]`;
const ghostButton = `${buttonBase} border border-white/70 bg-white/10 text-white hover:border-white/90 hover:bg-white/15`;
const darkButton = `${buttonBase} bg-gradient-to-r from-[#1a1b16] to-[#2a2b24] text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_14px_36px_rgba(0,0,0,0.18)]`;
const b2bPrimaryButton = `${buttonBase} bg-[#CCCCCC] text-[#12130F] shadow-[0_6px_18px_rgba(0,0,0,0.18)] hover:shadow-[0_10px_26px_rgba(0,0,0,0.22)]`;

export default function Page({ searchParams }: PageProps) {
  const mode = searchParams?.mode === "b2b" ? "b2b" : "b2c";

  return (
    <main className="relative min-h-screen romance-bg text-[#12130F]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 sparkle-field opacity-50"
      />
      <Script id="fb-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1995347034641420');
fbq('track', 'PageView');`}
      </Script>
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-M3D62KQH');`}
      </Script>
      <Script id="ld-json" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "LocalBusiness",
              "@id": "https://mirroreffect.co/#business",
              name: "MirrorEffect",
              url: "https://mirroreffect.co/",
              image: "https://mirroreffect.co/logo.png",
              telephone: "+32460242430",
              priceRange: "€€",
              description:
                "Location de miroir photobooth haut de gamme pour mariages, événements et entreprises en Belgique.",
              address: {
                "@type": "PostalAddress",
                addressCountry: "BE",
                addressLocality: "Bruxelles",
                addressRegion: "Brussels-Capital"
              },
              sameAs: ["https://www.instagram.com/mirroreffect.co", "https://www.facebook.com/mirroreffect.co"],
              areaServed: "Belgium"
            },
            {
              "@type": "Service",
              name: "Location photobooth miroir premium",
              serviceType: "Photobooth rental",
              provider: {
                "@id": "https://mirroreffect.co/#business"
              },
              areaServed: "Belgium"
            }
          ]
        })}
      </Script>

      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=1995347034641420&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
      <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-M3D62KQH"
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="gtm"
        />
      </noscript>

      <header className="mx-auto max-w-[1100px] px-4 pt-10 text-center">
        <div className="flex justify-center">
          <span
            className={`rounded-full px-3 py-1 text-xs font-black shadow-[0_2px_8px_rgba(193,149,14,0.25)] ${
              mode === "b2b"
                ? "bg-[#CCCCCC] text-[#12130F] shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                : "bg-[#C1950E] text-[#14140f]"
            }`}
          >
            ⭐️ Depuis 2018 • 950+ moments d’exception en Belgique & Nord de la France
          </span>
        </div>
        <nav className="mt-6 flex justify-center" aria-label="Navigation principale">
          <ModeSwitch showLanguage />
        </nav>
        <p className="mt-4 text-sm text-[#5c5c5c]">
          Le photobooth miroir qui fait briller les mariages — élégant, fluide, inoubliable.
        </p>
      </header>

      {mode === "b2c" ? (
        <div id="page-b2c" data-mode="b2c">
          <section className="mx-auto mt-8 max-w-[1200px] px-4 pb-20">
            <div className="relative overflow-hidden rounded-[30px] gold-frame">
              <div className="absolute inset-0">
                <Image
                  src="https://mirroreffect.co/wp-content/uploads/2022/08/DSC06760-2.jpg"
                  alt="Photobooth miroir MirrorEffect en mariage élégant"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 1100px"
                  className="object-cover object-[50%_55%] brightness-[0.62] contrast-[1.05]"
                />
                <div className="absolute inset-0 hero-stage" />
                <div className="absolute inset-x-0 top-14 h-[2px] sparkle-line opacity-50" />
              </div>

              <div className="absolute -left-20 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,_rgba(227,192,74,0.45)_0%,_transparent_60%)] opacity-70 hero-orb" />
              <div className="absolute -bottom-24 right-6 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(193,149,14,0.5)_0%,_transparent_62%)] opacity-60 hero-orb-delayed" />

              <div className="relative z-10 grid gap-8 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-14">
                <div>
                  <MotionReveal>
                    <span className="inline-flex rounded-full bg-gradient-to-r from-[#C1950E] to-[#e3c04a] px-3 py-1 text-xs font-black text-[#14140f] shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
                      ✨ L’animation signature des mariages élégants
                    </span>
                  </MotionReveal>
                  <MotionReveal delay={0.05}>
                    <h1 className="mt-4 text-[clamp(28px,6vw,52px)] font-black leading-tight text-white">
                      Quand vos proches arrivent, ils{" "}
                      <span className="text-shimmer">s’arrêtent</span>, sourient,
                      et{" "}
                      <span className="text-shimmer">vivent l’instant</span>.
                    </h1>
                  </MotionReveal>
                  <MotionReveal delay={0.1}>
                    <p className="mt-4 max-w-xl text-sm text-[#efefef] sm:text-base">
                      MirrorEffect transforme votre mariage en une scène lumineuse et joyeuse.
                      Miroir premium, tirages 10×15 sublimes, galerie élégante — tout est fluide,
                      tout est beau.
                    </p>
                  </MotionReveal>
                  <MotionReveal delay={0.15}>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <a className={`${primaryButton} openLead`} href="#">
                        💌 Recevoir mon offre personnalisée
                      </a>
                      <a className={ghostButton} href="#packs-b2c">
                        Voir nos packs
                      </a>
                    </div>
                  </MotionReveal>
                  <div className="mt-5 flex flex-wrap gap-3 text-xs text-[#e8e8e8]">
                    {[
                      "⏱️ Offre instantanée par e-mail",
                      "🖼️ Tirages premium 10×15",
                      "📍 Belgique entière"
                    ].map((item) => (
                      <span key={item} className="rounded-full border border-white/20 px-3 py-1">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="grid gap-4">
                    <div className="glass-card rounded-[18px] p-4 text-white">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e3c04a]">
                        Effet wow garanti
                      </p>
                      <p className="mt-2 text-sm text-[#f4f4f4]">
                        “Le miroir a réuni toutes les générations. On garde des photos pleines d’émotion.”
                      </p>
                      <p className="mt-2 text-xs text-[#d7d7d7]">Sarah & Mehdi — Bruxelles</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        "💫 Cadre photo sur-mesure",
                        "💌 Galerie privée élégante",
                        "🕯️ Mise en scène chic",
                        "📸 Éclairage flatteur"
                      ].map((item) => (
                        <div key={item} className="glass-card rounded-2xl px-4 py-3 text-xs text-white">
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-[18px] border border-white/25 bg-white/10 px-4 py-3 text-xs text-white">
                      ⭐️ 4,9/5 sur 120+ avis — 950+ mariages & événements
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-[1100px] px-4 py-24">
            <MotionReveal>
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">
                Pourquoi les couples choisissent MirrorEffect ? 💫
              </h2>
            </MotionReveal>
            <MotionReveal delay={0.05}>
              <p className="mt-2 text-center text-sm text-[#666]">
                On ne capture pas seulement des photos. On capture des regards, des fous rires, des
                retrouvailles.
              </p>
            </MotionReveal>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: "💞",
                  title: "Des émotions vraies",
                  text: "Le miroir attire, rassure et libère les sourires. Des clichés complices à garder."
                },
                {
                  icon: "🎉",
                  title: "L’ambiance qui rassemble",
                  text: "Un point de rencontre naturel pour toutes les générations."
                },
                {
                  icon: "🖼️",
                  title: "Souvenirs durables",
                  text: "Tirages 10×15 premium + galerie privée élégante."
                },
                {
                  icon: "🎨",
                  title: "Personnalisation du cadre",
                  text: "Un visuel élégant à vos couleurs (noms, date, thème)."
                },
                {
                  icon: "⚡",
                  title: "Installation rapide & discrète",
                  text: "Mise en place en ~30 min, faible empreinte au sol."
                },
                {
                  icon: "📲",
                  title: "Galerie privée",
                  text: "Lien sécurisé à partager avec vos proches (téléchargements HD)."
                }
              ].map((item) => (
                <article
                  key={item.title}
                  className="glow-card rounded-[18px] p-7 text-center"
                >
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-r from-[#C1950E] to-[#d8b73b] text-xl text-[#14140f]">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-black">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#444]">{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-[1100px] px-4 py-24">
            <MotionReveal>
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">Moments réels ✨</h2>
            </MotionReveal>
            <MotionReveal delay={0.05}>
              <p className="mt-2 text-center text-sm text-[#666]">Mariages, anniversaires, baptêmes…</p>
            </MotionReveal>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  src: "https://mirroreffect.co/wp-content/uploads/2020/04/51d258c0-d87f-4276-b684-b5e5b16c33c8.jpg",
                  alt: "Invités posant devant le photobooth miroir pendant un mariage"
                },
                {
                  src: "https://mirroreffect.co/wp-content/uploads/2020/04/9cc68cb0-584f-4f49-a2b0-6b5cc73ee953.jpg",
                  alt: "Instant complice capturé par le miroir photobooth MirrorEffect"
                },
                {
                  src: "https://mirroreffect.co/wp-content/uploads/2020/04/5b912868-ba45-48f9-8f96-e5728fca60c6.jpg",
                  alt: "Souvenir photo élégant avec impressions instantanées MirrorEffect"
                },
                {
                  src: "https://mirroreffect.co/wp-content/uploads/2020/04/WhatsApp-Image-2025-10-12-at-15.21.06.jpeg",
                  alt: "Moments de fête devant le miroir photobooth en Belgique"
                },
                {
                  src: "https://mirroreffect.co/wp-content/uploads/2020/04/WhatsApp-Image-2025-10-11-at-12.11.50.jpeg",
                  alt: "Sourires partagés autour du photobooth miroir"
                },
                {
                  src: "https://mirroreffect.co/wp-content/uploads/2020/04/WhatsApp-Image-2025-10-12-at-15.21.06-1.jpeg",
                  alt: "Expérience MirrorEffect lors d’un anniversaire"
                }
              ].map((item) => (
                <Image
                  key={item.src}
                  src={item.src}
                  alt={item.alt}
                  width={520}
                  height={360}
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="h-[260px] w-full rounded-2xl object-cover shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition duration-200 hover:scale-[1.02] hover:-rotate-[0.4deg]"
                />
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-[1100px] px-4 pb-10">
            <div className="relative overflow-hidden rounded-[24px] bg-[#12130F] px-6 py-10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_10%_0%,_rgba(227,192,74,0.28),_transparent_70%)]" />
              <div className="relative grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e3c04a]">
                    Signature MirrorEffect
                  </p>
                  <h3 className="mt-3 text-2xl sm:text-3xl font-black">
                    Une scénographie lumineuse, une animation chic, un rendu éditorial.
                  </h3>
                  <p className="mt-3 text-sm text-[#e9e9e9]">
                    Votre mariage mérite plus qu’un simple photobooth. Nous créons un point d’attraction
                    élégant qui sublime chaque tenue et chaque sourire.
                  </p>
                </div>
                <div className="grid gap-3 text-sm">
                  {[
                    "🌟 Cadres photo designés à vos couleurs",
                    "🕯️ Mise en scène soignée, discrète et raffinée",
                    "📸 Qualité d’image premium, éclairage flatteur",
                    "💌 Souvenirs instantanés + galerie élégante"
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-[#f3f3f3]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="mx-auto flex max-w-[1100px] justify-center px-4">
            <ModeSwitch label="Choisir le public (packs)" />
          </div>

          <section id="packs-b2c" className="mx-auto max-w-[1100px] px-4 py-24">
            <MotionReveal>
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">
                Des packs élégants, selon votre fête 🎁
              </h2>
            </MotionReveal>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {[
                {
                  title: "Découverte",
                  subtitle: "Pour les fêtes intimes.",
                  bullets: ["200 impressions 10×15", "Cadre personnalisé", "Galerie en ligne"],
                  ctaClass: darkButton
                },
                {
                  title: "Essentiel",
                  subtitle: "Le favori des mariages.",
                  bullets: ["400 impressions 10×15", "Cadre personnalisé", "Galerie en ligne"],
                  ctaClass: primaryButton,
                  highlighted: true
                },
                {
                  title: "Élégance",
                  subtitle: "Pour une scénographie généreuse.",
                  bullets: ["800 impressions 10×15", "Décor & potelets", "Galerie en ligne"],
                  ctaClass: darkButton
                }
              ].map((pack) => (
                <article
                  key={pack.title}
                  className={`rounded-[18px] p-6 text-center ${
                    pack.highlighted ? "glow-card border-2 border-[#e8d082]" : "glow-card"
                  }`}
                >
                  <h3 className="text-xl font-black">{pack.title}</h3>
                  <p className="mt-2 text-sm text-[#6b6b6b]">{pack.subtitle}</p>
                  <div className="mt-4 space-y-2 text-sm text-[#444]">
                    {pack.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-center justify-center gap-2">
                        <span className="font-black">•</span>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <a className={`${pack.ctaClass} openLead`} href="#">
                      Découvrir les offres
                    </a>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                "✅ Petit acompte pour réserver",
                "✅ Changement de date flexible",
                "✅ 250+ événements réalisés"
              ].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-[#f0e6c7] bg-gradient-to-b from-white to-[#fffdf6] px-4 py-2 text-sm font-extrabold"
                >
                  {badge}
                </span>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-[1100px] px-4 py-24" aria-label="Avis clients">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <MotionReveal>
                <h2 className="text-left text-3xl sm:text-4xl font-black tracking-tight">
                  Ils nous recommandent ❤️
                </h2>
              </MotionReveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#eee] bg-white px-4 py-2 text-sm font-bold">
                <span className="bg-gradient-to-r from-[#C1950E] to-[#d8b73b] bg-clip-text text-transparent">
                  ★★★★★
                </span>
                <strong>4,9/5</strong> sur 120+ avis
              </span>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  name: "Sarah & Mehdi — Bruxelles",
                  quote:
                    "Le miroir a réuni toutes les générations. On garde des photos pleines d’émotion."
                },
                {
                  name: "Anaïs — Namur",
                  quote:
                    "Décor soigné, équipe douce et pro. Les grands-parents ont participé avec plaisir."
                },
                {
                  name: "Lucas — Liège",
                  quote:
                    "Ambiance incroyable, tirages de qualité, et des souvenirs que tout le monde a adoré."
                }
              ].map((review) => (
                <article
                  key={review.name}
                  className="glow-card rounded-[18px] p-6"
                >
                  <div className="text-4xl font-black text-[#C1950E]">“</div>
                  <div className="mt-2">
                    <strong>{review.name}</strong>
                    <p className="mt-2 text-sm italic text-[#555]">{review.quote}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-[1100px] px-4 py-24" aria-label="Processus B2C">
            <MotionReveal>
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">
                Comment ça se passe côté particuliers ? 🪞
              </h2>
            </MotionReveal>
            <div className="mt-8 space-y-4">
              {[
                "Devis instantané : vous recevez nos offres par e-mail.",
                "Réservation : on bloque la date (avec un petit acompte).",
                "Personnalisation : création du cadre photo à vos couleurs.",
                "Jour J : installation discrète, tirages instantanés.",
                "Après : galerie en ligne à partager (téléchargements HD)."
              ].map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-4 rounded-2xl border border-[#eee] bg-white px-5 py-4 shadow-[0_8px_22px_rgba(0,0,0,0.06)]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#C1950E] to-[#d8b73b] text-sm font-black text-[#14140f] shadow-[0_4px_12px_rgba(193,149,14,0.22)]">
                    {index + 1}
                  </span>
                  <div className="text-sm">
                    <strong>{step.split(":")[0]}</strong>
                    <span>:{step.split(":")[1]}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-[900px] px-4 py-24" aria-label="FAQ B2C">
            <MotionReveal>
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">FAQ — Particuliers</h2>
            </MotionReveal>
            <div className="mt-6 space-y-3">
              {[
                {
                  q: "Combien de temps d’installation faut-il ?",
                  a: "Maximum 1 heure. Nous arrivons en avance pour être prêts avant l’arrivée des invités."
                },
                {
                  q: "Le cadre photo est-il personnalisé ?",
                  a: "Oui, nous créons un visuel (noms, date, thème/couleurs). Un exemple vous est envoyé pour validation."
                },
                {
                  q: "Y a-t-il une limite d’impressions ?",
                  a: "Chaque pack inclut un volume (200/400/800). On peut ajouter des impressions si besoin."
                },
                {
                  q: "Proposez-vous une galerie en ligne ?",
                  a: "Oui, la galerie privée est incluse (lien sécurisé, téléchargements HD)."
                },
                {
                  q: "Faut-il prévoir de la place spécifique ?",
                  a: "Un coin de 2,5 m × 2,5 m suffit, avec une prise électrique standard à proximité. Nous avons une ralonge."
                },
                {
                  q: "Quid du tapis rouge et potelets ?",
                  a: "On les propose selon l’espace et le thème. Si ça “jure”, on ne met pas — on s’adapte."
                }
              ].map((item) => (
                <details
                  key={item.q}
                  className="rounded-2xl border border-[#eee] bg-white px-4 py-3 shadow-[0_8px_18px_rgba(0,0,0,0.05)]"
                >
                  <summary className="cursor-pointer list-none font-black">{item.q}</summary>
                  <p className="mt-3 text-sm text-[#444]">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section id="cta" className="mx-auto max-w-[1100px] px-4 py-24 text-center">
            <div className="relative overflow-hidden rounded-[24px] bg-[#12130F] px-6 py-12 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_50%_at_10%_0%,_rgba(227,192,74,0.25),_transparent_70%)]" />
              <MotionReveal>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                  Prêt à faire briller votre date ?
                </h2>
              </MotionReveal>
              <p className="mt-3 text-sm text-[#f0f0f0]">
                Dites-nous votre lieu, votre date, votre ambiance — on vous envoie une proposition claire.
              </p>
              <div className="mt-5 flex justify-center">
                    <a className={`${primaryButton} openLead`} href="#">
                      Découvrir les offres
                    </a>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div id="page-b2b" data-mode="b2b">
          <section className="mx-auto mt-6 max-w-[1100px] px-4">
            <div className="relative overflow-hidden rounded-[22px] border border-white/20 bg-gradient-to-b from-[#141510] to-[#0f100d] shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
              <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_10%_20%,_rgba(255,255,255,0.06),_transparent_60%)]" />
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="px-7 py-10 text-white">
                  <span className="inline-flex rounded-full bg-[#CCCCCC] px-3 py-1 text-xs font-black text-[#12130F] shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                    B2B • RGPD • Facturation
                  </span>
                  <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight leading-tight sm:text-4xl">
                    Photobooth Miroir pour <em className="border-b-2 border-[#CCCCCC] not-italic">événements d’entreprise</em>
                  </h1>
                  <p className="mt-3 text-sm text-[#e8e8e8]">
                    Soirées corporate, team building, salons, activations retail. Nous livrons une expérience
                    premium, sans friction.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a className={`${b2bPrimaryButton} openLead`} href="#">
                      Demander un devis
                    </a>
                    <a className={ghostButton} href="#refs-b2b">
                      Références & cas
                    </a>
                  </div>
                  <div className="mt-3 text-xs text-[#cfcfcf]">Réponse instantanée • FR/NL • Belgique & Nord de la France</div>
                </div>
                <div className="relative min-h-[420px] bg-black">
                  <Image
                    src="https://mirroreffect.co/wp-content/uploads/2020/04/DSC06553.jpg"
                    alt="Photobooth miroir MirrorEffect pour événement d’entreprise"
                    fill
                    sizes="(max-width: 1024px) 100vw, 500px"
                    className="object-cover brightness-90 contrast-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#12130F]/60" />
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-[1100px] px-4 py-24 text-center">
            <MotionReveal>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Pensé pour vos événements d’entreprise
              </h2>
            </MotionReveal>
            <MotionReveal delay={0.05}>
              <p className="mt-2 text-sm text-[#666]">
              On s’intègre à votre dispositif, avec un rendu premium et une personnalisation propre à votre image.
              </p>
            </MotionReveal>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                { icon: "📣", title: "Lancement de marque", text: "Créez du trafic & des contenus partageables." },
                {
                  icon: "✂️",
                  title: "Ouverture d’un nouveau local",
                  text: "Inauguration clé en main : animation & tirages brandés."
                },
                { icon: "🏬", title: "Salons & stands", text: "Attirez le flux, captez des prospects (RGPD)." },
                { icon: "✨", title: "Expérience premium", text: "Miroir grand format, tirages soignés, galerie digitale." },
                { icon: "🎨", title: "Branding 360°", text: "Cadres photos aux couleurs de votre événement." },
                { icon: "🔐", title: "Collecte de données + RGPD", text: "Consentement, mentions, DPA possible." }
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-[18px] border border-[#eee] bg-white p-7 text-center shadow-[0_10px_28px_rgba(0,0,0,0.07)]"
                >
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#CCCCCC] text-xl text-[#12130F]">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-black">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#444]">{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-[1100px] px-4 py-24">
            <MotionReveal>
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">Galerie pro (extraits)</h2>
            </MotionReveal>
            <MotionReveal delay={0.05}>
              <p className="mt-2 text-center text-sm text-[#666]">Set-ups corporate, salons & activations.</p>
            </MotionReveal>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  src: "https://mirroreffect.co/wp-content/uploads/2020/04/DSC04961.jpg",
                  alt: "Activation corporate avec photobooth miroir MirrorEffect"
                },
                {
                  src: "https://mirroreffect.co/wp-content/uploads/2020/04/10-1-1.png",
                  alt: "Stand événementiel équipé du miroir photobooth"
                },
                {
                  src: "https://mirroreffect.co/wp-content/uploads/2020/04/9cc68cb0-584f-4f49-a2b0-6b5cc73ee953.jpg",
                  alt: "Souvenir corporate avec galerie digitale MirrorEffect"
                },
                {
                  src: "https://mirroreffect.co/wp-content/uploads/2022/08/DSC06760-2.jpg",
                  alt: "Miroir photobooth premium pour soirée d’entreprise"
                },
                {
                  src: "https://mirroreffect.co/wp-content/uploads/2022/08/DSC06548.jpg",
                  alt: "Expérience photobooth en salon professionnel"
                },
                {
                  src: "https://mirroreffect.co/wp-content/uploads/2020/04/DSC06421.jpg",
                  alt: "Dispositif MirrorEffect lors d’un événement corporate"
                }
              ].map((item) => (
                <Image
                  key={item.src}
                  src={item.src}
                  alt={item.alt}
                  width={520}
                  height={360}
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="h-[260px] w-full rounded-2xl object-cover shadow-[0_8px_22px_rgba(0,0,0,0.08)] transition duration-200 hover:scale-[1.02]"
                />
              ))}
            </div>
          </section>

          <div className="mx-auto flex max-w-[1100px] justify-center px-4">
            <ModeSwitch label="Choisir le public (packs)" />
          </div>

          <section id="packs-b2b" className="mx-auto max-w-[1100px] px-4 py-24">
            <MotionReveal>
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">
                Solutions & packs entreprise 💼
              </h2>
            </MotionReveal>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {[
                {
                  title: "🟡 Pack Gold",
                  subtitle: "Idéal pour une soirée ou une demi-journée.",
                  bullets: ["📸 800 impressions", "🎨 Personnalisation du cadre", "💻 Galerie digitale", "👤 Hôtesse professionnelle"],
                  ctaClass: darkButton
                },
                {
                  title: "💎 Pack Diamond",
                  subtitle: "Pour forte affluence et personnalisation avancée.",
                  bullets: ["📸 1 600 impressions", "🎨 Personnalisation  du cadre", "💻 Galerie digitale", "👤 Hôtesse professionnelle"],
                  ctaClass: b2bPrimaryButton,
                  highlighted: true
                },
                {
                  title: "🏆 Pack Platinum",
                  subtitle: "Capacité maximale pour grandes affluences.",
                  bullets: ["📸 2 400 impressions", "🎨 Personnalisation du cadre", "💻 Galerie digitale", "👤 Hôtesse professionnelle"],
                  ctaClass: darkButton
                }
              ].map((pack) => (
                <article
                  key={pack.title}
                  className={`rounded-[18px] border bg-white p-6 text-center shadow-[0_10px_28px_rgba(0,0,0,0.07)] ${
                    pack.highlighted ? "border-2 border-[#e8d082]" : "border-[#eee]"
                  }`}
                >
                  <h3 className="text-xl font-black">{pack.title}</h3>
                  <p className="mt-2 text-sm text-[#6b6b6b]">{pack.subtitle}</p>
                  <div className="mt-4 space-y-2 text-sm text-[#444]">
                    {pack.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-center justify-center gap-2">
                        <span className="font-black">•</span>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <a className={`${pack.ctaClass} openLead`} href="#">
                      Recevoir une proposition
                    </a>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {["✅ Validation du devis par e-mail", "✅ Bilingue FR/NL", "✅ De 50 à 5 000 invités"].map(
                (badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-[#dcdcdc] bg-white px-4 py-2 text-sm font-extrabold"
                  >
                    {badge}
                  </span>
                )
              )}
            </div>
          </section>

          <section id="refs-b2b" className="mx-auto max-w-[1100px] px-4 py-24">
            <MotionReveal>
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">Références & études de cas</h2>
            </MotionReveal>
            <MotionReveal delay={0.05}>
              <p className="mt-2 text-center text-sm text-[#666]">Hôtellerie, institutions, salons, retail…</p>
            </MotionReveal>

            <div className="mt-6 grid gap-4 md:grid-cols-6">
              {[
                "Hilton Brussels Grand Place",
                "Bourse de Bruxelles",
                "Birmingham Events",
                "Kiabi",
                "Zara",
                "Communes"
              ].map((logo) => (
                <div
                  key={logo}
                  className="flex h-24 items-center justify-center rounded-2xl border border-[#eee] bg-white px-4 text-center text-sm font-bold shadow-[0_6px_16px_rgba(0,0,0,0.05)]"
                >
                  {logo}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-5">
              {[
                {
                  title: "Hilton Brussels Grand Place — soirées clients",
                  kpis: ["Plusieurs éditions", "Flux continu", "Personnalisation"],
                  text:
                    "Mise en place discrète, habillage élégant et tirages premium. Animation « point d’attraction » récurrente."
                },
                {
                  title: "Bourse de Bruxelles — événement institutionnel (oct. 2025)",
                  kpis: ["Affluence élevée", "Cadre co-brandé", "Galerie digitale"],
                  text:
                    "Habillage aux couleurs de l’événement et impression rapide 10×15 pour éviter les files."
                },
                {
                  title: "Birmingham Events — activation",
                  kpis: ["Public varié", "Personnalisation", "800–1600 tirages"],
                  text:
                    "Set-up modulable selon la jauge, avec remise de photos personnalisées et galerie post-event."
                }
              ].map((item) => (
                <article
                  key={item.title}
                  className="w-full max-w-[360px] flex-1 rounded-[18px] border border-[#eee] bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <h3 className="text-lg font-black">{item.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.kpis.map((kpi) => (
                      <span
                        key={kpi}
                        className="rounded-full border border-[#ecdca6] bg-white px-3 py-1 text-xs font-extrabold"
                      >
                        {kpi}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-[#444]">{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-[1100px] px-4 py-24">
            <MotionReveal>
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">Processus d’intervention 💡</h2>
            </MotionReveal>
            <div className="mt-8 space-y-4">
              {[
                "Formulaire : offres automatiques par e-mail.",
                "Appel : ajustements (impressions, branding, logistique).",
                "Devis confirmé : validation par e-mail.",
                "Avant : personnalisation cadre/écran.",
                "Après : galerie en ligne."
              ].map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-4 rounded-2xl border border-[#eee] bg-white px-5 py-4 shadow-[0_8px_22px_rgba(0,0,0,0.06)]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#CCCCCC] text-sm font-black text-[#12130F] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                    {index + 1}
                  </span>
                  <div className="text-sm">
                    <strong>{step.split(":")[0]}</strong>
                    <span>:{step.split(":")[1]}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-[#666]">
              📱 <strong>Application mobile MirrorEffect</strong> — bientôt disponible.
            </p>
          </section>

          <section id="cta" className="mx-auto max-w-[1100px] px-4 py-24 text-center">
            <div className="rounded-[24px] bg-[#12130F] px-6 py-12 text-white shadow-[0_14px_34px_rgba(0,0,0,0.12)]">
              <MotionReveal>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Un lancement, un salon, une tournée ?</h2>
              </MotionReveal>
              <p className="mt-3 text-sm text-[#f0f0f0]">
                Expliquez-nous vos objectifs, on vous envoie une proposition claire.
              </p>
              <div className="mt-5 flex justify-center">
                <a className={`${b2bPrimaryButton} openLead`} href="#">
                  Demander un devis
                </a>
              </div>
            </div>
          </section>
        </div>
      )}

      <footer className="mt-24 border-t-4 border-transparent bg-gradient-to-b from-white to-[#f9f9f9] px-4 py-16 shadow-[0_-2px_20px_rgba(0,0,0,0.05)]">
        <div className="mx-auto grid max-w-[1100px] gap-7 text-center text-sm text-[#12130F] md:grid-cols-[2fr_1fr_1fr_1fr] md:text-left">
          <div>
            <p className="font-semibold text-[#C1950E]">
              Zones desservies :
            </p>
            <p>
              Anvers, Gand, Charleroi, Liège, Bruxelles, Schaerbeek, Anderlecht, Bruges, Namur, Mons,
              Louvain, La Louvière, Tournai, Seraing, Mouscron, Verviers, Mechelen, Kortrijk,
              Saint-Nicolas.
            </p>
            <p className="mt-3">MirrorEffect — Photobooth Miroir premium pour particuliers & entreprises.</p>
          </div>
          <div>
            <strong className="text-[#C1950E]">Contact</strong>
            <p className="mt-2">
              <a href="mailto:mirror@mirroreffect.co">mirror@mirroreffect.co</a>
              <br />
              <a href="tel:+32460242430">+32 460 24 24 30</a>
            </p>
          </div>
          <div>
            <strong className="text-[#C1950E]">Liens</strong>
            <p className="mt-2 space-y-1">
              <a href="/">Home</a>
              <br />
              <a href="/blog">Blog</a>
              <br />
              <a href="/photobooth-mariage">Photobooth mariage</a>
              <br />
              <a href="/photobooth-entreprise">Photobooth entreprise</a>
              <br />
              <a href="#packs-b2c">Packs Particuliers</a>
              <br />
              <a href="#packs-b2b">Packs Entreprise</a>
              <br />
              <a href="/photobooth-miroir-bruxelles">Photobooth Miroir — Bruxelles</a>
              <br />
              <a href="/photobooth-miroir-brabant-wallon">Photobooth Miroir — Brabant Wallon</a>
              <br />
              <a href="/photobooth-miroir-wallonie">Photobooth Miroir — Wallonie</a>
              <br />
              <a href="/spiegel-photobooth-vlaams-brabant">Spiegel Photobooth — Vlaams-Brabant</a>
              <br />
              <a href="/spiegel-photobooth-vlaanderen">Spiegel Photobooth — Vlaanderen</a>
            </p>
          </div>
          <div>
            <strong className="text-[#C1950E]">Légal</strong>
            <p className="mt-2 space-y-1">
              <a href="/mentions-legales">Mentions légales</a>
              <br />
              <a href="/politique-de-confidentialite">Politique de confidentialité</a>
              <br />
              <a href="/conditions-generales">Conditions générales</a>
              <br />
              <a href="/cookies">Gestion des cookies</a>
            </p>
          </div>
        </div>
        <p className="mt-12 text-center text-xs text-[#777]">
          © {new Date().getFullYear()} MirrorEffect —{" "}
          <span className="text-[#C1950E]">Photobooth Miroir</span>. Tous droits réservés.
        </p>
      </footer>

      <LeadModal mode={mode} />
    </main>
  );
}

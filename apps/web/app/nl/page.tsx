import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";
import { MotionReveal } from "@/components/home/MotionReveal";
import { ModeSwitch } from "@/components/home/ModeSwitch";
import { LeadModal } from "@/components/home/LeadModal";

const canonicalUrl = "https://mirroreffect.co/nl/";

export const metadata: Metadata = {
  title: "MirrorEffect • Premium Spiegel Photobooth voor Huwelijken & Events",
  description:
    "MirrorEffect tilt uw evenementen naar een hoger niveau met een interactieve, elegante en personaliseerbare spiegel photobooth. Huwelijken, bedrijfsfeesten, gala's en merkactivaties in België. Premium foto-ervaring.",
  alternates: {
    canonical: canonicalUrl
  },
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: "MirrorEffect — Premium Spiegel Photobooth voor Huwelijken & Events",
    description:
      "Interactieve en hoogwaardige spiegel photobooth voor huwelijken en bedrijfsevenementen. Elegantie, beleving en directe herinneringen.",
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

const heroShots = ["/images/IMG_0478.jpg", "/images/IMG_0486.jpg", "/images/IMG_0489.jpg"];
const storyShots = [
  "/images/IMG_0479.jpg",
  "/images/IMG_0480.jpg",
  "/images/IMG_0481.jpg",
  "/images/IMG_0482.jpg"
];
const b2bHeroShots = ["/images/IMG_0487.jpg", "/images/IMG_0490.jpg", "/images/IMG_0492.jpg"];
const galleryShots = [
  "/images/IMG_0487.jpg",
  "/images/IMG_0488.jpg",
  "/images/IMG_0490.jpg",
  "/images/IMG_0491.jpg",
  "/images/IMG_0492.jpg",
  "/images/IMG_0493.jpg",
  "/images/IMG_0494.jpg",
  "/images/IMG_0495.jpg",
  "/images/IMG_0496.jpg"
];

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
                "Premium spiegel photobooth verhuur voor huwelijken, events en bedrijven in België.",
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
              name: "Premium spiegel photobooth verhuur",
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
            ⭐️ Sinds 2018 • 950+ premium momenten in België & Noord-Frankrijk
          </span>
        </div>
        <nav className="mt-6 flex justify-center" aria-label="Hoofdnavigatie">
          <ModeSwitch showLanguage />
        </nav>
        <p className="mt-4 text-sm text-[#5c5c5c]">
          De spiegel photobooth die huwelijken doet schitteren — elegant, vloeiend, onvergetelijk.
        </p>
      </header>

      {mode === "b2c" ? (
        <div id="page-b2c" data-mode="b2c">
          <section className="mx-auto mt-8 max-w-[1200px] px-4 pb-20">
            <div className="relative overflow-hidden rounded-[30px] gold-frame">
              <div className="absolute inset-0">
                <Image
                  src="https://mirroreffect.co/wp-content/uploads/2022/08/DSC06760-2.jpg"
                  alt="MirrorEffect spiegel photobooth op een elegant huwelijk"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 1100px"
                  className="object-cover object-[50%_55%] brightness-[0.52] contrast-[1.05]"
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
                      ✨ De signature animatie voor stijlvolle huwelijken
                    </span>
                  </MotionReveal>
                  <MotionReveal delay={0.05}>
                    <h1 className="mt-4 text-[clamp(28px,6vw,52px)] font-black leading-tight text-white">
                      Wanneer uw gasten aankomen,{" "}
                      <span className="text-shimmer">stoppen</span> ze, lachen,
                      en{" "}
                      <span className="text-shimmer">beleven het moment</span>.
                    </h1>
                  </MotionReveal>
                  <MotionReveal delay={0.1}>
                    <p className="mt-4 max-w-xl text-sm text-[#efefef] sm:text-base">
                      MirrorEffect maakt van uw huwelijk een lichtende en joyful scène.
                      Premium spiegel, 10×15 prints, elegante galerij — alles voelt moeiteloos en chic.
                    </p>
                  </MotionReveal>
                  <MotionReveal delay={0.15}>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <a className={primaryButton} href="/reservation?lang=nl">
                        💌 Nu reserveren
                      </a>
                      <a className={ghostButton} href="#packs-b2c">
                        Bekijk pakketten
                      </a>
                    </div>
                  </MotionReveal>
                  <div className="mt-5 flex flex-wrap gap-3 text-xs text-[#e8e8e8]">
                    {["⏱️ Offerte per e-mail", "🖼️ Premium 10×15 prints", "📍 Heel België"].map(
                      (item) => (
                        <span key={item} className="rounded-full border border-white/20 px-3 py-1">
                          {item}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {heroShots.map((src, index) => (
                        <div
                          key={src}
                          className={`polaroid-card rounded-2xl p-3 ${index % 2 === 0 ? "tilt-left" : "tilt-right"}`}
                        >
                          <Image
                            src={src}
                            alt="MirrorEffect spiegel photobooth moment"
                            width={420}
                            height={520}
                            sizes="(max-width: 768px) 50vw, 260px"
                            className="h-[200px] w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="glass-card rounded-[18px] p-4 text-white">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e3c04a]">
                        Wow-effect gegarandeerd
                      </p>
                      <p className="mt-2 text-sm text-[#f4f4f4]">
                        “Een unieke ervaring. Onmiddellijke foto’s met een speciale touch.”
                      </p>
                      <p className="mt-2 text-xs text-[#d7d7d7]">Sabrina Leclergé</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        "💫 Fotokader op maat",
                        "💌 Elegante privégalerij",
                        "🕯️ Verfijnde scenografie",
                        "📸 Flatteuze belichting"
                      ].map((item) => (
                        <div key={item} className="glass-card rounded-2xl px-4 py-3 text-xs text-white">
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-[18px] border border-white/25 bg-white/10 px-4 py-3 text-xs text-white">
                      ⭐️ 4,9/5 op 120+ reviews — 950+ huwelijken & events
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-[1100px] px-4 py-24">
            <MotionReveal>
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">
                Waarom kiezen koppels voor MirrorEffect? 💫
              </h2>
            </MotionReveal>
            <MotionReveal delay={0.05}>
              <p className="mt-2 text-center text-sm text-[#666]">
                We vangen niet alleen foto’s. We vangen blikken, lachbuien en echte emoties.
              </p>
            </MotionReveal>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: "💞",
                  title: "Echte emoties",
                  text: "De spiegel trekt aan, stelt gerust en bevrijdt glimlachen."
                },
                {
                  icon: "🎉",
                  title: "Sfeer die verbindt",
                  text: "Een natuurlijk ontmoetingspunt voor alle generaties."
                },
                {
                  icon: "🖼️",
                  title: "Blijvende herinneringen",
                  text: "Premium 10×15 prints + elegante privégalerij."
                },
                {
                  icon: "🎨",
                  title: "Personalisatie",
                  text: "Een visueel kader in uw kleuren (namen, datum, thema)."
                },
                {
                  icon: "⚡",
                  title: "Snelle installatie",
                  text: "Opstelling in ~30 min, kleine voetafdruk."
                },
                {
                  icon: "📲",
                  title: "Privégalerij",
                  text: "Beveiligde link om te delen met uw gasten (HD-downloads)."
                }
              ].map((item) => (
                <article key={item.title} className="glow-card rounded-[18px] p-7 text-center">
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-r from-[#C1950E] to-[#d8b73b] text-xl text-[#14140f]">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-black">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#444]">{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-[1100px] px-4 pb-24">
            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <MotionReveal>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                    Het moment dat het hele huwelijk laat stralen.
                  </h2>
                </MotionReveal>
                <MotionReveal delay={0.05}>
                  <p className="mt-3 text-sm text-[#666]">
                    Discrete installatie, toegewijd team, 24u beschikbaarheid en een premium resultaat
                    dat gasten doet praten.
                  </p>
                </MotionReveal>
                <div className="mt-6 grid gap-4">
                  {[
                    "Sinds 2017: expertise in premium spiegel photobooth in België.",
                    "Fotokader op maat, afgestemd op uw decor.",
                    "Reactief en geruststellend team, voor en na de dag."
                  ].map((item) => (
                    <div key={item} className="glow-card rounded-2xl px-5 py-4 text-sm text-[#3d3d3d]">
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a className={primaryButton} href="/reservation?lang=nl">
                    Check mijn datum
                  </a>
                  <a className={ghostButton} href="#packs-b2c">
                    Bekijk pakketten
                  </a>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {storyShots.map((src, index) => (
                  <div
                    key={src}
                    className={`polaroid-card rounded-2xl p-3 ${index % 2 === 0 ? "tilt-left" : "tilt-right"}`}
                  >
                    <Image
                      src={src}
                      alt="MirrorEffect herinnering"
                      width={480}
                      height={560}
                      sizes="(max-width: 768px) 50vw, 320px"
                      className="h-[220px] w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-[1100px] px-4 py-24">
            <MotionReveal>
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">Echte momenten ✨</h2>
            </MotionReveal>
            <MotionReveal delay={0.05}>
              <p className="mt-2 text-center text-sm text-[#666]">Huwelijken, verjaardagen, doopfeesten…</p>
            </MotionReveal>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {galleryShots.map((src) => (
                <Image
                  key={src}
                  src={src}
                  alt="MirrorEffect herinnering"
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
                    Een lichtscenografie, een chique animatie, een editorial resultaat.
                  </h3>
                  <p className="mt-3 text-sm text-[#e9e9e9]">
                    Uw huwelijk verdient meer dan een standaard photobooth. Wij creëren een stijlvolle
                    attractie die elke outfit en glimlach versterkt.
                  </p>
                </div>
                <div className="grid gap-3 text-sm">
                  {[
                    "🌟 Fotokaders in uw kleuren",
                    "🕯️ Verfijnde, discrete opstelling",
                    "📸 Premium beeldkwaliteit, flatterende belichting",
                    "💌 Directe herinneringen + elegante galerij"
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
            <ModeSwitch label="Publiek kiezen (packs)" />
          </div>

          <section id="packs-b2c" className="mx-auto max-w-[1100px] px-4 py-24">
            <MotionReveal>
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">
                Elegante pakketten voor uw feest 🎁
              </h2>
            </MotionReveal>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {[
                {
                  title: "Ontdekking",
                  subtitle: "Voor intieme feesten.",
                  bullets: ["200 prints 10×15", "Gepersonaliseerd kader", "Online galerij"],
                  ctaClass: darkButton
                },
                {
                  title: "Essentieel",
                  subtitle: "Favoriet voor huwelijken.",
                  bullets: ["400 prints 10×15", "Gepersonaliseerd kader", "Online galerij"],
                  ctaClass: primaryButton,
                  highlighted: true
                },
                {
                  title: "Elegantie",
                  subtitle: "Voor royale scenografie.",
                  bullets: ["800 prints 10×15", "Decor & paaltjes", "Online galerij"],
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
                    <a className={pack.ctaClass} href="/reservation?lang=nl">
                      Reserveer dit pack
                    </a>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                "✅ Kleine aanbetaling om te reserveren",
                "✅ Flexibele datumwijziging",
                "✅ 250+ events gerealiseerd"
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

          <section className="mx-auto max-w-[1100px] px-4 py-24" aria-label="Reviews">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <MotionReveal>
                <h2 className="text-left text-3xl sm:text-4xl font-black tracking-tight">
                  Ze bevelen ons aan ❤️
                </h2>
              </MotionReveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#eee] bg-white px-4 py-2 text-sm font-bold">
                <span className="bg-gradient-to-r from-[#C1950E] to-[#d8b73b] bg-clip-text text-transparent">
                  ★★★★★
                </span>
                <strong>4,9/5</strong> op 120+ reviews
              </span>
            </div>
            <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="polaroid-card rounded-3xl p-4">
                <Image
                  src="/images/IMG_0482.jpg"
                  alt="MirrorEffect review"
                  width={640}
                  height={760}
                  sizes="(max-width: 1024px) 100vw, 520px"
                  className="h-[360px] w-full object-cover"
                />
              </div>
              <div className="glow-card rounded-3xl p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C1950E]">
                  Geverifieerde review
                </p>
                <h3 className="mt-3 text-xl font-black">
                  "Topkwaliteit, personaliseerbare foto’s, beschikbaar team."
                </h3>
                <p className="mt-3 text-sm text-[#444]">
                  Cools Florence — "We huurden de spiegel photobooth voor ons huwelijk op 21/09/2024.
                  Topkwaliteit, we konden het fotokader personaliseren. Ze waren beschikbaar en
                  beantwoordden onze verwachtingen."
                </p>
                <div className="mt-4 text-sm text-[#C1950E]">★★★★★ 5/5</div>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  name: "Christian Bléser — CEO HD4You",
                  quote:
                    "Mirror Effect getest op ons event in Luik: veel vreugde en goede sfeer voor 214 gasten."
                },
                {
                  name: "Amélie Schwanen",
                  quote:
                    "Originele kader met rode loper en paaltjes: we voelden ons als sterren. Top team."
                },
                {
                  name: "Virginie Perona",
                  quote: "Top service."
                }
              ].map((review) => (
                <article key={review.name} className="glow-card rounded-[18px] p-6">
                  <div className="text-4xl font-black text-[#C1950E]">“</div>
                  <div className="mt-2">
                    <strong>{review.name}</strong>
                    <p className="mt-2 text-sm italic text-[#555]">{review.quote}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-[1100px] px-4 py-24" aria-label="Proces B2C">
            <MotionReveal>
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">
                Hoe werkt het voor particulieren? 🪞
              </h2>
            </MotionReveal>
            <div className="mt-8 space-y-4">
              {[
                "Snelle beschikbaarheid: u reserveert direct online.",
                "Reservatie: we blokkeren de datum (met een kleine aanbetaling).",
                "Personalisatie: fotokader in uw kleuren.",
                "Dag D: discrete installatie, onmiddellijke prints.",
                "Na afloop: online galerij (HD-downloads)."
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
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">FAQ — Particulieren</h2>
            </MotionReveal>
            <div className="mt-6 space-y-3">
              {[
                {
                  q: "Hoe lang duurt de installatie?",
                  a: "Maximaal 1 uur. We komen op tijd aan zodat alles klaar is voor uw gasten."
                },
                {
                  q: "Is het fotokader gepersonaliseerd?",
                  a: "Ja, we maken een ontwerp (namen, datum, thema/kleuren). U ontvangt een preview."
                },
                {
                  q: "Is er een limiet op het aantal prints?",
                  a: "Elk pack bevat een volume (200/400/800). Extra prints zijn mogelijk."
                },
                {
                  q: "Is er een online galerij?",
                  a: "Ja, de privégalerij is inbegrepen (beveiligde link, HD-downloads)."
                },
                {
                  q: "Hoeveel plaats is nodig?",
                  a: "Een hoek van 2,5 m × 2,5 m volstaat, met een standaard stopcontact."
                },
                {
                  q: "Rode loper en paaltjes?",
                  a: "We stellen dit voor volgens de ruimte en het thema. Als het niet past, laten we het weg."
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
                  Klaar om uw datum te laten schitteren?
                </h2>
              </MotionReveal>
              <p className="mt-3 text-sm text-[#f0f0f0]">
                Deel uw datum, locatie en sfeer — we sturen een duidelijke voorstel.
              </p>
              <div className="mt-5 flex justify-center">
                <a className={primaryButton} href="/reservation?lang=nl">
                  Start mijn reservatie
                </a>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div id="page-b2b" data-mode="b2b">
          <section className="mx-auto mt-8 max-w-[1200px] px-4 pb-20">
            <div className="relative overflow-hidden rounded-[30px] gold-frame">
              <div className="absolute inset-0">
                <Image
                  src="/images/IMG_0494.jpg"
                  alt="MirrorEffect spiegel photobooth op bedrijfsfeest"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 1100px"
                  className="object-cover object-[50%_55%] brightness-[0.55] contrast-[1.05]"
                />
                <div className="absolute inset-0 hero-stage" />
                <div className="absolute inset-x-0 top-14 h-[2px] sparkle-line opacity-40" />
              </div>

              <div className="absolute -left-20 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,_rgba(227,192,74,0.4)_0%,_transparent_60%)] opacity-60 hero-orb" />
              <div className="absolute -bottom-24 right-6 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(193,149,14,0.45)_0%,_transparent_62%)] opacity-50 hero-orb-delayed" />

              <div className="relative z-10 grid gap-8 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-14">
                <div>
                  <MotionReveal>
                    <span className="inline-flex rounded-full bg-[#CCCCCC] px-3 py-1 text-xs font-black text-[#12130F] shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
                      B2B • AVG • Facturatie
                    </span>
                  </MotionReveal>
                  <MotionReveal delay={0.05}>
                    <h1 className="mt-4 text-[clamp(28px,6vw,50px)] font-black leading-tight text-white">
                      De spiegel photobooth die uw{" "}
                      <span className="text-shimmer">bedrijfsevenementen</span>
                      verandert in premium content.
                    </h1>
                  </MotionReveal>
                  <MotionReveal delay={0.1}>
                    <p className="mt-4 max-w-xl text-sm text-[#efefef] sm:text-base">
                      Beurzen, retail activaties, corporate events. MirrorEffect trekt het publiek aan,
                      capteert leads en laat een stijlvolle indruk na.
                    </p>
                  </MotionReveal>
                  <MotionReveal delay={0.15}>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <a className={`${b2bPrimaryButton} openLead`} href="#">
                        Vraag offerte aan
                      </a>
                      <a className={ghostButton} href="#refs-b2b">
                        Referenties & cases
                      </a>
                    </div>
                  </MotionReveal>
                  <div className="mt-5 flex flex-wrap gap-3 text-xs text-[#e8e8e8]">
                    {["🧾 Pro contracten", "🧠 AVG-proof lead capture", "🇧🇪 FR/NL • België"].map(
                      (item) => (
                        <span key={item} className="rounded-full border border-white/20 px-3 py-1">
                          {item}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {b2bHeroShots.map((src, index) => (
                        <div
                          key={src}
                          className={`polaroid-card rounded-2xl p-3 ${index % 2 === 0 ? "tilt-left" : "tilt-right"}`}
                        >
                          <Image
                            src={src}
                            alt="MirrorEffect corporate photobooth"
                            width={420}
                            height={520}
                            sizes="(max-width: 768px) 50vw, 260px"
                            className="h-[200px] w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="glass-card rounded-[18px] p-4 text-white">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e3c04a]">
                        Directe impact
                      </p>
                      <p className="mt-2 text-sm text-[#f4f4f4]">
                        “Een natuurlijk aantrekkingspunt, deelbare content en gasten die blijven.”
                      </p>
                      <p className="mt-2 text-xs text-[#d7d7d7]">Event team • Brussel</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {["📣 Branding 360°", "📥 Lead capture", "🖼️ Branded prints", "🚀 Snelle setup"].map(
                        (item) => (
                          <div key={item} className="glass-card rounded-2xl px-4 py-3 text-xs text-white">
                            {item}
                          </div>
                        )
                      )}
                    </div>
                    <div className="rounded-[18px] border border-white/25 bg-white/10 px-4 py-3 text-xs text-white">
                      ⭐️ 150+ corporate events — direct ROI
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-[1100px] px-4 py-24 text-center">
            <MotionReveal>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Ontworpen voor uw bedrijfsevenementen
              </h2>
            </MotionReveal>
            <MotionReveal delay={0.05}>
              <p className="mt-2 text-sm text-[#666]">
                We integreren naadloos met uw opstelling en branding.
              </p>
            </MotionReveal>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                { icon: "📣", title: "Merkactivatie", text: "Creëer traffic en deelbare content." },
                {
                  icon: "✂️",
                  title: "Opening nieuwe locatie",
                  text: "Kant-en-klare inhuldiging met branded prints."
                },
                { icon: "🏬", title: "Beurzen & stands", text: "Trek publiek en verzamel leads (AVG)." },
                { icon: "✨", title: "Premium ervaring", text: "Grote spiegel, mooie prints, digitale galerij." },
                { icon: "🎨", title: "Branding 360°", text: "Fotokaders in uw eventkleuren." },
                { icon: "🔐", title: "Data capture + AVG", text: "Toestemming, vermeldingen, DPA mogelijk." }
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
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">Pro-galerij (fragmenten)</h2>
            </MotionReveal>
            <MotionReveal delay={0.05}>
              <p className="mt-2 text-center text-sm text-[#666]">Corporate set-ups, beurzen & activaties.</p>
            </MotionReveal>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {galleryShots.map((src) => (
                <Image
                  key={src}
                  src={src}
                  alt="MirrorEffect pro-galerij"
                  width={520}
                  height={360}
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="h-[260px] w-full rounded-2xl object-cover shadow-[0_8px_22px_rgba(0,0,0,0.08)] transition duration-200 hover:scale-[1.02]"
                />
              ))}
            </div>
          </section>

          <div className="mx-auto flex max-w-[1100px] justify-center px-4">
            <ModeSwitch label="Publiek kiezen (packs)" />
          </div>

          <section id="packs-b2b" className="mx-auto max-w-[1100px] px-4 py-24">
            <MotionReveal>
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">
                Oplossingen & bedrijfspakketten 💼
              </h2>
            </MotionReveal>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {[
                {
                  title: "🟡 Pack Gold",
                  subtitle: "Ideaal voor een avond of halve dag.",
                  bullets: ["📸 800 prints", "🎨 Kader personalisatie", "💻 Digitale galerij", "👤 Professionele host"],
                  ctaClass: darkButton
                },
                {
                  title: "💎 Pack Diamond",
                  subtitle: "Voor hoge opkomst en branding.",
                  bullets: ["📸 1 600 prints", "🎨 Kader personalisatie", "💻 Digitale galerij", "👤 Professionele host"],
                  ctaClass: b2bPrimaryButton,
                  highlighted: true
                },
                {
                  title: "🏆 Pack Platinum",
                  subtitle: "Maximale capaciteit voor grote events.",
                  bullets: ["📸 2 400 prints", "🎨 Kader personalisatie", "💻 Digitale galerij", "👤 Professionele host"],
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
                      Offerte aanvragen
                    </a>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {["✅ Offerte per e-mail", "✅ Tweetalig FR/NL", "✅ 50 tot 5 000 gasten"].map(
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
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">Referenties & case studies</h2>
            </MotionReveal>
            <MotionReveal delay={0.05}>
              <p className="mt-2 text-center text-sm text-[#666]">Horeca, instellingen, beurzen, retail…</p>
            </MotionReveal>

            <div className="mt-6 grid gap-4 md:grid-cols-6">
              {[
                "Hilton Brussels Grand Place",
                "Beurs van Brussel",
                "Birmingham Events",
                "Kiabi",
                "Zara",
                "Gemeentes"
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
                  title: "Hilton Brussels Grand Place — klantenavonden",
                  kpis: ["Meerdere edities", "Vlotte flow", "Personalisatie"],
                  text:
                    "Discrete opstelling, elegante aankleding en premium prints. Terugkerend aantrekkingspunt."
                },
                {
                  title: "Beurs van Brussel — institutioneel event (okt. 2025)",
                  kpis: ["Hoge opkomst", "Co-branded kader", "Digitale galerij"],
                  text:
                    "Aankleding in eventkleuren en snelle 10×15 prints om wachtrijen te vermijden."
                },
                {
                  title: "Birmingham Events — activatie",
                  kpis: ["Breed publiek", "Personalisatie", "800–1600 prints"],
                  text:
                    "Modulaire set-up volgens capaciteit, met gepersonaliseerde prints en post-event galerij."
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
              <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tight">Proces 💡</h2>
            </MotionReveal>
            <div className="mt-8 space-y-4">
              {[
                "Formulier: offertes automatisch per e-mail.",
                "Call: afstemming (prints, branding, logistiek).",
                "Bevestigde offerte: validatie per e-mail.",
                "Vooraf: personalisatie kader/scherm.",
                "Na afloop: online galerij."
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
              📱 <strong>MirrorEffect mobiele app</strong> — binnenkort beschikbaar.
            </p>
          </section>

          <section id="cta" className="mx-auto max-w-[1100px] px-4 py-24 text-center">
            <div className="rounded-[24px] bg-[#12130F] px-6 py-12 text-white shadow-[0_14px_34px_rgba(0,0,0,0.12)]">
              <MotionReveal>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Lancering, beurs of roadshow?</h2>
              </MotionReveal>
              <p className="mt-3 text-sm text-[#f0f0f0]">
                Vertel ons uw doelstellingen en we sturen een helder voorstel.
              </p>
              <div className="mt-5 flex justify-center">
                <a className={`${b2bPrimaryButton} openLead`} href="#">
                  Vraag offerte aan
                </a>
              </div>
            </div>
          </section>
        </div>
      )}

      <footer className="mt-24 border-t-4 border-transparent bg-gradient-to-b from-white to-[#f9f9f9] px-4 py-16 shadow-[0_-2px_20px_rgba(0,0,0,0.05)]">
        <div className="mx-auto grid max-w-[1100px] gap-7 text-center text-sm text-[#12130F] md:grid-cols-[2fr_1fr_1fr_1fr] md:text-left">
          <div>
            <p className="font-semibold text-[#C1950E]">Bediende zones:</p>
            <p>
              Antwerpen, Gent, Charleroi, Luik, Brussel, Schaarbeek, Anderlecht, Brugge, Namen, Bergen,
              Leuven, La Louvière, Doornik, Seraing, Moeskroen, Verviers, Mechelen, Kortrijk,
              Sint-Niklaas.
            </p>
            <p className="mt-3">MirrorEffect — Premium spiegel photobooth voor particulieren & bedrijven.</p>
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
            <strong className="text-[#C1950E]">Links</strong>
            <p className="mt-2 space-y-1">
              <a href="/nl/">Home</a>
              <br />
              <a href="/nl/blog">Blog</a>
              <br />
              <a href="/photobooth-mariage">Photobooth huwelijk</a>
              <br />
              <a href="/photobooth-entreprise">Bedrijf photobooth</a>
              <br />
              <a href="#packs-b2c">Pakketten particulieren</a>
              <br />
              <a href="#packs-b2b">Pakketten bedrijven</a>
              <br />
              <a href="/photobooth-miroir-bruxelles">Spiegel photobooth — Brussel</a>
              <br />
              <a href="/photobooth-miroir-brabant-wallon">Spiegel photobooth — Waals-Brabant</a>
              <br />
              <a href="/photobooth-miroir-wallonie">Spiegel photobooth — Wallonië</a>
              <br />
              <a href="/spiegel-photobooth-vlaams-brabant">Spiegel photobooth — Vlaams-Brabant</a>
              <br />
              <a href="/spiegel-photobooth-vlaanderen">Spiegel photobooth — Vlaanderen</a>
            </p>
          </div>
          <div>
            <strong className="text-[#C1950E]">Wettelijk</strong>
            <p className="mt-2 space-y-1">
              <a href="/nl/mentions-legales">Wettelijke vermeldingen</a>
              <br />
              <a href="/nl/politique-de-confidentialite">Privacybeleid</a>
              <br />
              <a href="/nl/conditions-generales">Algemene voorwaarden</a>
              <br />
              <a href="/nl/cookies">Cookiebeheer</a>
            </p>
          </div>
        </div>
        <p className="mt-12 text-center text-xs text-[#777]">
          © {new Date().getFullYear()} MirrorEffect —{" "}
          <span className="text-[#C1950E]">Spiegel Photobooth</span>. Alle rechten voorbehouden.
        </p>
      </footer>

      {mode === "b2b" && <LeadModal mode="b2b" />}
    </main>
  );
}

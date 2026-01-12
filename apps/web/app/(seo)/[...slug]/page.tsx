import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSeoPage, normalizeSlug, seoPages } from "@/content/seo";

type PageProps = {
  params: {
    slug: string[];
  };
};

export const generateStaticParams = () =>
  seoPages.map((page) => ({
    slug: normalizeSlug(page.slug).split("/")
  }));

export const generateMetadata = ({ params }: PageProps): Metadata => {
  const slug = params.slug.join("/");
  const page = getSeoPage(slug);
  if (!page) return {};
  return {
    title: page.seo.title,
    description: page.seo.description,
    alternates: {
      canonical: `https://mirroreffect.co/${normalizeSlug(page.slug)}`
    }
  };
};

export default function SeoPage({ params }: PageProps) {
  const slug = params.slug.join("/");
  const page = getSeoPage(slug);

  if (!page) {
    notFound();
  }

  const normalized = normalizeSlug(page.slug);
  const isNl = normalized.startsWith("nl") || normalized.startsWith("spiegel-");
  const ctaPrimary = isNl ? "Controleer beschikbaarheid" : "Vérifier la disponibilité";
  const ctaSecondary = isNl ? "Bekijk pakketten" : "Voir les packs";
  const ctaFinal = isNl ? "Start de reservatie" : "Démarrer la réservation";
  const reservationHref = `/reservation?lang=${isNl ? "nl" : "fr"}`;

  return (
    <main className="relative min-h-screen romance-bg text-[#12130F]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 sparkle-field opacity-40"
      />
      <header className="section pb-10 pt-16 text-center">
        <span className="inline-flex rounded-full bg-gradient-to-r from-[#C1950E] to-[#e3c04a] px-3 py-1 text-xs font-black text-[#14140f] shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
          MirrorEffect • Premium photobooth
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight">
          {page.h1}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-[#6b6b6b]">
          {page.seo.description}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a className="btn btn-gold" href={reservationHref}>
            {ctaPrimary}
          </a>
          <a className="btn btn-dark" href="/#packs-b2c">
            {ctaSecondary}
          </a>
        </div>
      </header>

      <div className="section pt-4">
        <div className="space-y-10">
          {page.sections.map((section) => (
            <section key={section.heading} className="glow-card rounded-3xl p-7">
              <h2 className="text-2xl font-black">{section.heading}</h2>
              <div
                className="seo-content mt-3 max-w-none text-sm text-[#4a4a4a]"
                dangerouslySetInnerHTML={{ __html: section.html }}
              />
            </section>
          ))}
        </div>
      </div>

      {page.faqs.length > 0 && (
        <section className="section pt-0">
          <h2 className="text-center text-2xl font-black">FAQ</h2>
          <div className="mt-6 space-y-3">
            {page.faqs.map((item) => (
              <details
                key={item.question}
                className="rounded-2xl border border-[#eee] bg-white px-5 py-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]"
              >
                <summary className="cursor-pointer list-none font-black">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm text-[#444]">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="section pt-0 text-center">
        <div className="rounded-[24px] bg-[#12130F] px-6 py-10 text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
          <h2 className="text-3xl font-black">
            {isNl ? "Klaar om uw datum te reserveren?" : "Prêt à réserver votre date ?"}
          </h2>
          <p className="mt-3 text-sm text-[#f0f0f0]">
            {isNl
              ? "Snelle reactie, beschikbaarheid in enkele klikken."
              : "Réponse instantanée, disponibilité en quelques clics."}
          </p>
          <div className="mt-5 flex justify-center">
            <a className="btn btn-gold" href={reservationHref}>
              {ctaFinal}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

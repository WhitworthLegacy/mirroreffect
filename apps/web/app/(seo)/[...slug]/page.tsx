import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LeadModal } from "@/components/home/LeadModal";
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
    },
    robots: page.robots
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
  const isArticleSlug = (value: string) => {
    const candidate = normalizeSlug(value);
    if (candidate === "blog" || candidate === "nl/blog") return false;
    return (
      candidate.startsWith("blog/") ||
      candidate.startsWith("nl/blog/") ||
      candidate.startsWith("etude-de-cas")
    );
  };
  const articlePages = seoPages.filter((item) => isArticleSlug(item.slug));
  const localeArticles = articlePages.filter((item) => {
    const candidate = normalizeSlug(item.slug);
    return isNl ? candidate.startsWith("nl/") : !candidate.startsWith("nl/");
  });
  const articleIndex = localeArticles.findIndex(
    (item) => normalizeSlug(item.slug) === normalized
  );
  const hasArticleNav = articleIndex >= 0 && localeArticles.length > 1;
  const prevArticle =
    hasArticleNav && articleIndex > 0
      ? localeArticles[articleIndex - 1]
      : hasArticleNav
        ? localeArticles[localeArticles.length - 1]
        : null;
  const nextArticle =
    hasArticleNav && articleIndex < localeArticles.length - 1
      ? localeArticles[articleIndex + 1]
      : hasArticleNav
        ? localeArticles[0]
        : null;
  const relatedArticles =
    articleIndex >= 0 && localeArticles.length > 1
      ? Array.from({ length: Math.min(3, localeArticles.length - 1) })
          .map((_, offset) => localeArticles[(articleIndex + offset + 1) % localeArticles.length])
          .filter((item) => normalizeSlug(item.slug) !== normalized)
      : [];
  const relatedTitle = isNl ? "Verder lezen" : "À lire ensuite";
  const navLabelPrev = isNl ? "Vorige" : "Précédent";
  const navLabelNext = isNl ? "Suivant" : "Suivant";
  const navTitle = isNl ? "Navigatie" : "Navigation";
  const relatedDescription = isNl
    ? "Nog meer inspiratie, tips en cases rond de MirrorEffect."
    : "Encore plus d’inspirations, conseils et études de cas MirrorEffect.";

  if (page.layout === "raw" && page.rawHtml) {
    return (
      <main className="relative min-h-screen romance-bg text-[#12130F]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 sparkle-field opacity-30"
        />
        <div className="seo-raw" dangerouslySetInnerHTML={{ __html: page.rawHtml }} />
        {isArticleSlug(page.slug) && (
          <section className="section pt-8">
            {hasArticleNav && (
              <div className="glow-card rounded-3xl p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b08912]">
                  {navTitle}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  {prevArticle && (
                    <a className="btn btn-dark" href={`/${normalizeSlug(prevArticle.slug)}`}>
                      {navLabelPrev}
                    </a>
                  )}
                  {nextArticle && (
                    <a className="btn btn-dark" href={`/${normalizeSlug(nextArticle.slug)}`}>
                      {navLabelNext}
                    </a>
                  )}
                </div>
              </div>
            )}
            {relatedArticles.length > 0 && (
              <div className="mt-8">
                <h2 className="text-center text-2xl font-black">{relatedTitle}</h2>
                <p className="mt-2 text-center text-sm text-[#6b6b6b]">{relatedDescription}</p>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {relatedArticles.map((item) => (
                    <a
                      key={item.slug}
                      href={`/${normalizeSlug(item.slug)}`}
                      className="glow-card flex h-full flex-col justify-between rounded-3xl p-6 text-left transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)]"
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b08912]">
                        MirrorEffect
                      </span>
                      <h3 className="mt-3 text-lg font-black text-[#14140f]">
                        {item.h1}
                      </h3>
                      <p className="mt-3 text-sm text-[#5a5a5a]">{item.seo.description}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
        <footer className="mt-20 border-t-4 border-transparent bg-gradient-to-b from-white to-[#f9f9f9] px-4 py-16 shadow-[0_-2px_20px_rgba(0,0,0,0.05)]">
          <div className="mx-auto grid max-w-[1100px] gap-7 text-center text-sm text-[#12130F] md:grid-cols-[2fr_1fr_1fr_1fr] md:text-left">
            <div>
              <p className="font-semibold text-[#C1950E]">Zones desservies :</p>
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
        {page.leadMode === "b2b" && (
          <Suspense fallback={null}>
            <LeadModal mode={page.leadMode} />
          </Suspense>
        )}
      </main>
    );
  }

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
          {(page.sections ?? []).map((section) => (
            <section key={section.heading || section.html} className="glow-card rounded-3xl p-7">
              {section.heading && section.heading !== "Hero" && (
                <h2 className="text-2xl font-black">{section.heading}</h2>
              )}
              <div
                className="seo-content mt-3 max-w-none text-sm text-[#4a4a4a]"
                dangerouslySetInnerHTML={{ __html: section.html }}
              />
            </section>
          ))}
        </div>
      </div>

      {(page.faqs ?? []).length > 0 && (
        <section className="section pt-0">
          <h2 className="text-center text-2xl font-black">FAQ</h2>
          <div className="mt-6 space-y-3">
            {(page.faqs ?? []).map((item) => (
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

      {isArticleSlug(page.slug) && (
        <section className="section pt-0">
          {hasArticleNav && (
            <div className="glow-card rounded-3xl p-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b08912]">
                {navTitle}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {prevArticle && (
                  <a className="btn btn-ghost" href={`/${normalizeSlug(prevArticle.slug)}`}>
                    {navLabelPrev}
                  </a>
                )}
                {nextArticle && (
                  <a className="btn btn-dark" href={`/${normalizeSlug(nextArticle.slug)}`}>
                    {navLabelNext}
                  </a>
                )}
              </div>
            </div>
          )}
          {relatedArticles.length > 0 && (
            <div className="mt-8">
              <h2 className="text-center text-2xl font-black">{relatedTitle}</h2>
              <p className="mt-2 text-center text-sm text-[#6b6b6b]">{relatedDescription}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {relatedArticles.map((item) => (
                  <a
                    key={item.slug}
                    href={`/${normalizeSlug(item.slug)}`}
                    className="glow-card flex h-full flex-col justify-between rounded-3xl p-6 text-left transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)]"
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b08912]">
                      MirrorEffect
                    </span>
                    <h3 className="mt-3 text-lg font-black text-[#14140f]">
                      {item.h1}
                    </h3>
                    <p className="mt-3 text-sm text-[#5a5a5a]">{item.seo.description}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <footer className="mt-20 border-t-4 border-transparent bg-gradient-to-b from-white to-[#f9f9f9] px-4 py-16 shadow-[0_-2px_20px_rgba(0,0,0,0.05)]">
        <div className="mx-auto grid max-w-[1100px] gap-7 text-center text-sm text-[#12130F] md:grid-cols-[2fr_1fr_1fr_1fr] md:text-left">
          <div>
            <p className="font-semibold text-[#C1950E]">Zones desservies :</p>
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
    </main>
  );
}

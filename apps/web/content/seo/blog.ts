export default {
  slug: "/blog",
  seo: {
    title: "MirrorEffect • Blog — Conseils & Inspirations Photobooth",
    description:
      "Le blog MirrorEffect : inspirations mariages & événements d’entreprise, conseils photobooth, guides déco, et études de cas.",
  },
  h1: "Conseils, inspirations & études de cas",
  layout: "raw",
  rawHtml: `
    <div class="wrap">
      <section class="hero">
        <div class="heroCard">
          <img src="/images/IMG_0489.jpg" alt="Blog MirrorEffect" />
          <div class="heroContent">
            <span class="ribbon">📝 Le blog MirrorEffect</span>
            <h1>Conseils, inspirations & études de cas</h1>
            <p>Tout pour réussir votre animation photo — mariages, événements d’entreprise, salons et activations.</p>
          </div>
        </div>
      </section>
    </div>
    <section class="wrap">
      <div class="grid">
        <article class="card">
          <div class="thumb">
            <img src="/images/IMG_0478.jpg" alt="Coin photobooth chic pour mariage" />
          </div>
          <div class="body">
            <h3>10 idées pour un coin photobooth chic au mariage</h3>
            <p class="note">Décor fleuri, potelets dorés, fond texturé… nos astuces pour un rendu premium.</p>
            <div class="cta"><a class="btn btn-dark" href="/blog/10-idees-pour-un-coin-photobooth-chic-au-mariage">Lire</a></div>
          </div>
        </article>
        <article class="card">
          <div class="thumb">
            <img src="/images/IMG_0480.jpg" alt="Photobooth miroir pour mariage élégant" />
          </div>
          <div class="body">
            <h3>5 idées pour un photobooth miroir inoubliable au mariage</h3>
            <p class="note">Livre d’or photo, cadre élégant et mise en scène lumineuse.</p>
            <div class="cta"><a class="btn btn-dark" href="/blog/5-idees-photobooth-miroir-inoubliable-mariage">Lire</a></div>
          </div>
        </article>
        <article class="card">
          <div class="thumb">
            <img src="/images/IMG_0486.jpg" alt="Étude de cas Hilton" />
          </div>
          <div class="body">
            <h3>Hilton Brussels Grand Place — étude de cas</h3>
            <p class="note">Animation premium, flux fluide et cadre co-brandé.</p>
            <div class="cta"><a class="btn btn-dark" href="/etude-de-cas-hilton">Lire</a></div>
          </div>
        </article>
        <article class="card">
          <div class="thumb">
            <img src="/images/IMG_0493.jpg" alt="Impressions photobooth 10x15" />
          </div>
          <div class="body">
            <h3>Combien d’impressions prévoir ? 10×15 vs bandelettes</h3>
            <p class="note">Nos repères simples selon la jauge d’invités.</p>
            <div class="cta"><a class="btn btn-dark" href="/blog/combien-impressions-prevoir-10x15-vs-bandelettes">Lire</a></div>
          </div>
        </article>
        <article class="card">
          <div class="thumb">
            <img src="/images/IMG_0492.jpg" alt="RGPD et collecte d'emails" />
          </div>
          <div class="body">
            <h3>RGPD & collecte d’emails : bonnes pratiques</h3>
            <p class="note">Consentement, DPA, mentions légales et process clean.</p>
            <div class="cta"><a class="btn btn-dark" href="/blog/rgpd-collecte-emails-bonnes-pratiques-evenement">Lire</a></div>
          </div>
        </article>
        <article class="card">
          <div class="thumb">
            <img src="/images/IMG_0491.jpg" alt="Personnaliser le cadre photo" />
          </div>
          <div class="body">
            <h3>Avant/Après : personnaliser le cadre photo</h3>
            <p class="note">Gabarits, couleurs et validation avant le jour J.</p>
            <div class="cta"><a class="btn btn-dark" href="/blog/avant-apres-personnaliser-cadre-photo-couleurs">Lire</a></div>
          </div>
        </article>
      </div>
    </section>
  `,
  sections: [],
  faqs: [],
} as const;

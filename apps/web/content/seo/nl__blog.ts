export default {
  slug: "/nl/blog",
  seo: {
    title: "MirrorEffect • Blog — Tips & Inspiratie Photobooth",
    description:
      "De MirrorEffect blog: inspiratie voor huwelijken & bedrijfsevenementen, photobooth tips, decoratiegidsen en case studies."
  },
  h1: "Tips, inspiratie & case studies",
  layout: "raw",
  rawHtml: `
    <div class="wrap" style="margin-top:10px">
      <div class="hero-ribbon" style="display:flex;align-items:center;justify-content:center;gap:8px;font-weight:900;font-size:13px;color:#12130f">
        <span style="background:#c1950e;color:#14140f;padding:6px 12px;border-radius:999px;box-shadow:0 2px 8px rgba(193,149,14,.25)">⭐️ Sinds 2018 • 950+ succesvolle evenementen</span>
      </div>
    </div>

    <section class="hero">
      <div class="heroCard">
        <img src="https://mirroreffect.co/wp-content/uploads/2023/11/2-2.jpg" alt="MirrorEffect Blog" />
        <div class="heroContent">
          <span class="ribbon">📝 De MirrorEffect Blog</span>
          <h1>Tips, inspiratie & case studies</h1>
          <p>Alles voor een geslaagde foto-animatie — huwelijken, bedrijfsevenementen, beurzen en activaties.</p>
        </div>
      </div>
    </section>

    <div class="controls">
      <div class="controlBar">
        <div class="search" role="search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 21l-4.3-4.3" stroke="#777" stroke-width="2" stroke-linecap="round"/><circle cx="11" cy="11" r="7" stroke="#777" stroke-width="2"/></svg>
          <input id="q" type="search" placeholder="Zoek een artikel..." aria-label="Zoeken" />
        </div>
        <div style="margin-left:auto; display:flex; gap:10px; align-items:center;">
          <select id="lang-switcher" class="me-input" style="height:40px;padding:0 36px 0 12px;cursor:pointer;font-weight:700; border-radius:99px;">
            <option value="fr" data-url="/blog">🇫🇷 FR</option>
            <option value="nl" data-url="/nl/blog" selected>🇧🇪 NL</option>
          </select>
        </div>
      </div>

      <div class="pills" role="tablist" aria-label="Filters" style="margin-top:10px; justify-content:center; display:flex; gap:8px;">
        <button class="pill" data-filter="all" aria-pressed="true">Alle</button>
        <button class="pill" data-filter="mariage">Huwelijk</button>
        <button class="pill" data-filter="entreprise">Bedrijf</button>
        <button class="pill" data-filter="conseils">Tips</button>
      </div>
    </div>

    <section class="wrap" aria-label="Artikellijst">
      <div id="blogGrid" class="grid">
        <article class="card" data-tags="mariage conseils" data-title="10 ideeën voor een chique photobooth op uw huwelijk">
          <div class="thumb">
            <img src="https://mirroreffect.co/wp-content/uploads/2020/04/51d258c0-d87f-4276-b684-b5e5b16c33c8.jpg" loading="lazy" />
            <span class="tag">Huwelijk</span>
          </div>
          <div class="body">
            <h3>10 ideeën voor een chique photobooth op uw huwelijk</h3>
            <div class="meta"><span>8 min</span>·<time datetime="2025-11-10">10 nov. 2025</time></div>
            <p class="excerpt">Bloemendecoratie, gouden paaltjes, getextureerde achtergrond... onze tips voor een premium resultaat.</p>
            <div class="more"><a href="/nl/blog/10-idees-pour-un-coin-photobooth-chic-au-mariage/" class="btn btn-dark">Lezen</a></div>
          </div>
        </article>

        <article class="card" data-tags="mariage conseils" data-title="Waarom een spiegel photobooth huren voor uw huwelijk?">
          <div class="thumb">
            <img src="https://mirroreffect.co/wp-content/uploads/2022/08/cropped-DSC04478-scaled.jpg" alt="Spiegel photobooth voor huwelijk" loading="lazy" />
            <span class="tag">Huwelijk</span>
          </div>
          <div class="body">
            <h3>Waarom een spiegel photobooth huren voor uw huwelijk?</h3>
            <div class="meta"><span>7 min</span>·<time datetime="2025-11-10">10 nov. 2025</time></div>
            <p class="excerpt">Sfeer, emoties en elegantie: de 5 redenen waarom de spiegel onmisbaar is.</p>
            <div class="more"><a href="/nl/blog/pourquoi-louer-un-photobooth-miroir-pour-son-mariage-avantages-conseils/" class="btn btn-gold">Lezen</a></div>
          </div>
        </article>

        <article class="card" data-tags="entreprise etude-de-cas" data-title="Case study: Bedrijfsfeest in de Beurs van Brussel">
          <div class="thumb">
            <img src="https://mirroreffect.co/wp-content/uploads/2020/04/5b912868-ba45-48f9-8f96-e5728fca60c6.jpg" alt="Bedrijfsfeest Beurs van Brussel" loading="lazy" />
            <span class="tag">Bedrijf</span>
          </div>
          <div class="body">
            <h3>Case study: Bedrijfsfeest in de Beurs van Brussel</h3>
            <div class="meta"><span>6 min</span>·<time datetime="2025-10-28">28 okt. 2025</time></div>
            <p class="excerpt">Briefing, set-up, gastenstroom, branding: hoe de spiegel een trekpleister werd.</p>
            <div class="more"><a href="/nl/blog/etude-de-cas-bourse" class="btn btn-gold">Lezen</a></div>
          </div>
        </article>

        <article class="card" data-tags="conseils mariage" data-title="Hoeveel afdrukken voorzien? 10×15 vs fotostrips">
          <div class="thumb">
            <img src="https://mirroreffect.co/wp-content/uploads/2020/04/9cc68cb0-584f-4f49-a2b0-6b5cc73ee953.jpg" alt="10x15 afdrukken vs fotostrips" loading="lazy" />
            <span class="tag">Tips</span>
          </div>
          <div class="body">
            <h3>Hoeveel afdrukken voorzien? 10×15 vs fotostrips</h3>
            <div class="meta"><span>5 min</span>·<time datetime="2025-09-15">15 sept. 2025</time></div>
            <p class="excerpt">Onze eenvoudige richtlijnen en waarom wij de voorkeur geven aan premium 10×15.</p>
            <div class="more"><a href="/nl/blog/combien-dimpressions-prevoir-10x15-vs-bandelettes" class="btn btn-dark">Lezen</a></div>
          </div>
        </article>

        <article class="card" data-tags="entreprise conseils" data-title="AVG & e-mailverzameling: best practices tijdens evenementen">
          <div class="thumb">
            <img src="https://mirroreffect.co/wp-content/uploads/2020/04/WhatsApp-Image-2025-10-11-at-12.11.50.jpeg" alt="AVG tijdens evenementen" loading="lazy" />
            <span class="tag">Bedrijf</span>
          </div>
          <div class="body">
            <h3>AVG & e-mailverzameling: best practices</h3>
            <div class="meta"><span>7 min</span>·<time datetime="2025-08-02">2 aug. 2025</time></div>
            <p class="excerpt">Toestemming, vermeldingen, DPA: wat u moet voorzien voor een cleane verzameling.</p>
            <div class="more"><a href="/nl/blog/rgpd-collecte-demails-bonnes-pratiques-en-evenement" class="btn btn-gold">Lezen</a></div>
          </div>
        </article>

        <article class="card" data-tags="mariage" data-title="Voor/Na: de fotokader personaliseren in uw kleuren">
          <div class="thumb">
            <img src="https://mirroreffect.co/wp-content/uploads/2020/04/WhatsApp-Image-2025-10-12-at-15.21.06.jpeg" alt="Personalisatie fotokader" loading="lazy" />
            <span class="tag">Huwelijk</span>
          </div>
          <div class="body">
            <h3>Voor/Na: de fotokader personaliseren in uw kleuren</h3>
            <div class="meta"><span>4 min</span>·<time datetime="2025-07-22">22 juli 2025</time></div>
            <p class="excerpt">Concrete voorbeelden en sjabloonbestanden voor een onberispelijk resultaat.</p>
            <div class="more"><a href="/nl/blog/avant-apres-personnaliser-le-cadre-photo-a-vos-couleurs" class="btn btn-dark">Lezen</a></div>
          </div>
        </article>
      </div>

      <nav class="pager" aria-label="Pagination">
        <button class="pageBtn" aria-current="true">1</button>
        <button class="pageBtn">2</button>
        <button class="pageBtn">3</button>
      </nav>
    </section>
  `,
  sections: [],
  faqs: []
} as const;

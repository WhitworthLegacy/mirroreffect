export default {
  slug: "/blog/rgpd-collecte-emails-bonnes-pratiques-evenement",
  seo: {
    title: "RGPD & Collecte d'emails : Bonnes pratiques pour un événement | MirrorEffect",
    description:
      "Collecte d'emails en événement B2B : bonnes pratiques RGPD, consentement, mentions et DPA."
  },
  h1: "RGPD & collecte d'emails : bonnes pratiques en événement",
  layout: "raw",
  leadMode: "b2b",
  rawHtml: `
    <div class="wrap">
      <header class="hero-article">
        <img src="https://mirroreffect.co/wp-content/uploads/2020/04/WhatsApp-Image-2025-10-11-at-12.11.50.jpeg" alt="Collecte d'emails avec consentement RGPD" />
        <div class="overlay"></div>
        <div class="content">
          <span class="ribbon">💼 Entreprise & Légal</span>
          <h1>RGPD & collecte d'emails : bonnes pratiques en événement</h1>
          <p class="meta">Publié le 19 novembre 2025 • 7 min de lecture</p>
        </div>
      </header>

      <article class="prose">
        <p>Le photobooth miroir est un outil de <strong>lead generation</strong> redoutable en événement B2B. Il convertit l'animation en donnée. Cependant, la collecte d'emails, de numéros de téléphone ou d'images doit impérativement respecter le <strong>Règlement Général sur la Protection des Données (RGPD)</strong>. Voici les points essentiels pour une collecte <strong>clean et efficace</strong>.</p>

        <h2>1. Le Consentement : La règle d'or</h2>
        <p>Le consentement doit être <strong>libre, spécifique, éclairé et univoque</strong>.</p>
        <ul>
          <li><strong>Libre :</strong> La participation à la photo ne doit pas être conditionnée à la collecte des données.</li>
          <li><strong>Spécifique :</strong> La case à cocher pour le consentement marketing doit être séparée du simple consentement pour l'envoi de la photo.</li>
          <li><strong>Éclairé :</strong> Les participants doivent savoir à quelle fin leurs données sont collectées.</li>
        </ul>

        <div class="note">
          ✅ Le MirrorEffect intègre un formulaire de collecte où la case marketing est <strong>décochée par défaut</strong> (opt-in actif).
        </div>

        <h2>2. Les Mentions Légales : Être transparent</h2>
        <p>Les participants doivent pouvoir accéder à :</p>
        <ul>
          <li><strong>L'identité du Responsable du Traitement</strong> (Votre entreprise).</li>
          <li><strong>La Finalité du Traitement</strong> (Envoi de photo, marketing, etc.).</li>
          <li><strong>La Base Légale</strong> (Consentement).</li>
          <li><strong>L'existence d'un droit de retrait et de rectification.</strong></li>
        </ul>
        <p>Une phrase claire suffit souvent, renvoyant vers la politique de confidentialité complète.</p>

        <h2>3. Le Rôle du DPA (Data Processing Agreement)</h2>
        <p>MirrorEffect agit en tant que <strong>Sous-Traitant</strong> car nous traitons les données pour votre compte. Votre entreprise est le <strong>Responsable du Traitement</strong>.</p>
        <p>Le <strong>DPA</strong> formalise :</p>
        <ul>
          <li>Les instructions sur le traitement des données.</li>
          <li>Nos engagements de sécurité et confidentialité.</li>
          <li>La procédure en cas de violation.</li>
        </ul>
        <p><strong>Chez MirrorEffect, le DPA est systématiquement inclus dans nos contrats B2B</strong>.</p>

        <h2>4. Gestion et Sécurité des Données</h2>
        <ul>
          <li><strong>Transfert sécurisé</strong> des emails et photos.</li>
          <li><strong>Durée de conservation</strong> définie et respectée.</li>
          <li><strong>Portabilité</strong> des données sur demande.</li>
        </ul>

        <hr>

        <h2>Checklist express (Collecte & RGPD)</h2>
        <div class="callout">
          <ul>
            <li>Valider les mentions et consentements.</li>
            <li>Case opt-in décochée par défaut.</li>
            <li>Signer le DPA.</li>
            <li>Informer les participants de l’usage des emails.</li>
          </ul>
        </div>

        <h2>Logistique simple & fluide</h2>
        <p>L'activation du formulaire de collecte sur le MirrorEffect est rapide. Nous configurons l'écran d'accueil avec vos logos, vos questions et vos mentions légales.</p>

        <h2>FAQ — Entreprise & Légal</h2>
        <h3>Pouvons-nous collecter autre chose que l'email ?</h3>
        <p>Oui : Nom, prénom, fonction, ou une question personnalisée. Le principe de consentement RGPD reste le même.</p>
        <h3>Que se passe-t-il si un invité ne veut pas laisser d'email ?</h3>
        <p>La photo peut être imprimée sans collecte d’email (option SMS possible).</p>
        <h3>Comment récupérer les fichiers ?</h3>
        <p>Nous fournissons la liste des emails et les photos associées via un lien sécurisé.</p>

        <div class="cta" id="demande">
          <a href="/reservation?lang=fr" class="btn btn-gold">Réserver maintenant</a>
        </div>

        <section class="related">
          <h2>À lire ensuite</h2>
          <div class="related-list">
            <div class="callout">
              <a href="/blog/etude-de-cas-bourse/" style="text-decoration:none;color:inherit">
                <strong>[Étude de Cas] Activation Bourse</strong>
                <p class="note">Découvrez comment MirrorEffect a généré du lead de qualité lors d'une activation en Bourse.</p>
              </a>
            </div>
            <div class="callout">
              <a href="/mode=b2b#packs-b2b" style="text-decoration:none;color:inherit">
                <strong>Packs & Options B2B</strong>
                <p class="note">Découvrez nos solutions d'activation événementielle pour entreprise.</p>
              </a>
            </div>
          </div>
        </section>
      </article>
    </div>
  `,
  sections: [],
  faqs: []
} as const;

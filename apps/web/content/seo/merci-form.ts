const page = {
  slug: "/merci-form",
  seo: {
    title: "Merci pour votre demande • MirrorEffect",
    description:
      "Merci pour votre demande MirrorEffect. Votre récapitulatif arrive par e-mail et nous vous rappelons sous 3 à 5 jours."
  },
  h1: "Votre demande est confirmée",
  layout: "raw",
  robots: {
    index: false,
    follow: false
  },
  rawHtml: `
<div class="wrap">
  <div class="hero-ribbon">✨ Merci pour votre demande • MirrorEffect vous répond très vite</div>

  <section class="hero">
    <div class="heroCard">
      <div class="overlay"></div>
      <div class="heroContent">
        <span class="ribbon">Merci, nous avons bien reçu vos coordonnées</span>
        <h1>Votre demande est confirmée</h1>
        <p class="meta">
          Dans les prochaines minutes, vous recevrez un e-mail récapitulatif avec les informations transmises.
        </p>
        <p class="note">
          Nous vous appellerons dans un délai de 3 à 5 jours pour discuter de la logistique, du timing et du pack le plus adapté.
        </p>
        <div class="cta">
          <a href="/" class="btn btn-gold">⬅️ Retour à l’accueil MirrorEffect</a>
          <a href="https://wa.me/32460242430" class="btn btn-dark">📲 Une question urgente ? WhatsApp</a>
        </div>
        <p class="note">Pensez à vérifier vos dossiers Spam / Promotions si vous ne voyez rien arriver.</p>
      </div>
    </div>
  </section>

  <section class="prose">
    <h2>Ce qui se passe maintenant</h2>
    <div class="grid3">
      <div class="step">
        <div class="dot">1</div>
        <div>
          <strong>Envoi de l’e-mail récapitulatif</strong><br />
          Vous recevez un e-mail automatique avec le récapitulatif de votre demande.
        </div>
      </div>
      <div class="step">
        <div class="dot">2</div>
        <div>
          <strong>Analyse de votre événement</strong><br />
          Nous analysons votre projet pour proposer les packs adaptés et vérifier la disponibilité.
        </div>
      </div>
      <div class="step">
        <div class="dot">3</div>
        <div>
          <strong>Appel dans les 3–5 jours</strong><br />
          Un membre de l’équipe vous contacte pour affiner la logistique et bloquer la date si vous le souhaitez.
        </div>
      </div>
    </div>

    <h2>En attendant notre appel</h2>
    <div class="grid3">
      <div class="card">
        <h3>1. Préparez les infos clés</h3>
        <p>Heure d’arrivée, planning, emplacement idéal, thème ou couleurs de votre événement.</p>
      </div>
      <div class="card">
        <h3>2. Ajoutez notre e-mail</h3>
        <p>Ajoutez admin@mirroreffect.co à vos contacts pour éviter le spam.</p>
      </div>
      <div class="card">
        <h3>3. Suivez-nous</h3>
        <p>
          📸 <a href="https://www.instagram.com/mirrroreffect.co" target="_blank" rel="noopener">Instagram</a><br />
          👍 <a href="https://www.facebook.com/mirrroreffect.co" target="_blank" rel="noopener">Facebook</a>
        </p>
      </div>
    </div>
  </section>
</div>
`
} as const;

export default page;

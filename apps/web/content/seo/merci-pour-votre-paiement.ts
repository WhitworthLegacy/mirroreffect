const page = {
  slug: "/merci-pour-votre-paiement",
  seo: {
    title: "Retour de paiement • MirrorEffect",
    description:
      "Retour de paiement MirrorEffect. Votre transaction est en cours de validation. Vous recevrez un e-mail si le paiement est confirmé."
  },
  h1: "Votre transaction est en cours de validation",
  layout: "raw",
  robots: {
    index: false,
    follow: false
  },
  rawHtml: `
<div class="wrap">
  <div class="hero-ribbon">🔒 Paiement sécurisé via Mollie • Retour vers MirrorEffect</div>

  <section class="hero">
    <div class="heroCard">
      <div class="overlay"></div>
      <div class="heroContent">
        <span class="ribbon">Merci, nous avons bien reçu votre retour de paiement</span>
        <h1>Votre transaction est en cours de validation</h1>
        <p class="meta">
          Si le paiement est confirmé par votre banque, vous recevrez un e-mail de confirmation avec le récapitulatif de votre événement.
        </p>
        <div class="cta">
          <a href="/" class="btn btn-gold">⬅️ Retour à l’accueil MirrorEffect</a>
          <a href="https://wa.me/32470350412" class="btn btn-dark">📲 Une question ? WhatsApp</a>
        </div>
        <p class="note">
          Si vous ne recevez aucun e-mail de confirmation dans les 10–15 minutes, la transaction a peut-être été annulée.
        </p>
      </div>
    </div>
  </section>

  <section class="prose">
    <h2>Ce qui se passe maintenant</h2>
    <div class="grid3">
      <div class="step">
        <div class="dot">1</div>
        <div>
          <strong>Validation par la banque & Mollie</strong><br />
          Votre banque confirme (ou refuse) le paiement auprès de notre prestataire. Cette étape peut prendre quelques instants.
        </div>
      </div>
      <div class="step">
        <div class="dot">2</div>
        <div>
          <strong>Si le paiement est accepté</strong><br />
          Vous recevez un e-mail de confirmation MirrorEffect avec : montant payé, date et lieu de l’événement, et prochaines étapes.
        </div>
      </div>
      <div class="step">
        <div class="dot">3</div>
        <div>
          <strong>Si le paiement est refusé ou annulé</strong><br />
          Aucune confirmation n’est envoyée. Dans ce cas, votre date n’est pas bloquée et nous pourrons vous renvoyer un lien.
        </div>
      </div>
    </div>

    <h2>Vous avez un doute ?</h2>
    <div class="grid3">
      <div class="card">
        <h3>1. Vérifier vos e-mails</h3>
        <p>Regardez dans votre boîte de réception, spam ou promotions. L’expéditeur sera mirror@mirroreffect.co.</p>
      </div>
      <div class="card">
        <h3>2. Attendre quelques minutes</h3>
        <p>Il peut y avoir un léger délai de traitement entre votre banque, Mollie et notre système.</p>
      </div>
      <div class="card">
        <h3>3. Nous contacter simplement</h3>
        <p>
          📧 <a href="mailto:mirror@mirroreffect.co">mirror@mirroreffect.co</a><br />
          📲 <a href="https://wa.me/32470350412">WhatsApp direct</a><br />
          ☎️ <a href="tel:+32460242430">+32 460 24 24 30</a>
        </p>
      </div>
    </div>
  </section>
</div>
`
} as const;

export default page;

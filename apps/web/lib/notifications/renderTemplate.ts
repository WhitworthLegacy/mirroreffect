type RenderInput = {
  key: string;
  locale?: string;
  payload?: Record<string, string | number | boolean | null | undefined>;
};

type RenderedTemplate = {
  subject: string;
  html: string;
};

// Clean email wrapper — designed for Gmail Primary tab
const emailWrapper = (content: string, locale: string, unsubscribeUrl?: string) => `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Mirror Effect</title>
</head>
<body style="margin: 0; padding: 0; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #333;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #ffffff;">
    <tr>
      <td align="center" style="padding: 0;">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px;">

          <!-- Header: fond noir, titre doré -->
          <tr>
            <td align="center" style="padding: 40px 40px 32px; background-color: #12130F; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 0.15em; color: #C1950E;">
                MIRROR EFFECT
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase;">
                Photobooth Miroir Premium
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px 32px; background: #ffffff;">
              ${content}
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding: 0 32px 32px; background: #ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-top: 24px; border-top: 1px solid #eee;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-right: 14px; vertical-align: top;">
                          <img src="https://mirroreffect.co/images/logo-icon-gold.png" alt="M" width="44" height="44" style="display: block; border-radius: 8px;" />
                        </td>
                        <td style="vertical-align: top;">
                          <p style="margin: 0; font-weight: 600; font-size: 14px; color: #12130F;">Jonathan Whitworth</p>
                          <p style="margin: 2px 0 0; font-size: 13px; color: #666;">Mirror Effect</p>
                          <p style="margin: 2px 0 0; font-size: 13px; color: #666;">+32 460 24 24 30</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background: #fafafa;">
              <p style="margin: 0; color: #999; font-size: 11px; text-align: center;">
                Mirror Effect · Bruxelles & toute la Belgique
              </p>
              ${unsubscribeUrl ? `
              <p style="margin: 8px 0 0; text-align: center;">
                <a href="${unsubscribeUrl}" style="color: #999; font-size: 11px; text-decoration: underline;">
                  ${locale === 'nl' ? 'Uitschrijven' : 'Se désabonner'}
                </a>
              </p>
              ` : ''}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Simple CTA Button — clean, no gradients
const ctaButton = (text: string, url: string) => `
<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
  <tr>
    <td style="border-radius: 8px; background-color: #C1950E;">
      <a href="${url}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px;">
        ${text}
      </a>
    </td>
  </tr>
</table>
`;

// Info Box Component — simple
const infoBox = (content: string, variant: 'gold' | 'light' = 'light') => {
  const styles = {
    gold: 'background: #fdf8ec; border: 1px solid #e8d5a0;',
    light: 'background: #f8f9fa; border: 1px solid #e9ecef;',
  };
  return `
<div style="${styles[variant]} border-radius: 8px; padding: 20px; margin: 20px 0;">
  ${content}
</div>
`;
};

// Templates
const TEMPLATES: Record<string, Record<string, { subject: string; body: string }>> = {
  // =============================================================================
  // BOOKING CONFIRMATION (sent after payment)
  // =============================================================================
  B2C_BOOKING_CONFIRMED: {
    fr: {
      subject: "C'est confirmé, {{client_name}} !",
      body: `
        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour {{client_name}},
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          C'est Jonathan de Mirror Effect. Votre réservation est bien confirmée, merci pour votre confiance !
        </p>

        <p style="margin: 0 0 8px; color: #333; font-size: 15px; line-height: 1.7;">
          Voici le récap :
        </p>

        <p style="margin: 0 0 4px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Date :</strong> {{event_date}}
        </p>
        <p style="margin: 0 0 4px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Lieu :</strong> {{address}}
        </p>
        <p style="margin: 0 0 4px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Pack :</strong> {{pack_code}}
        </p>
        <p style="margin: 0 0 4px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Acompte versé :</strong> {{deposit}} €
        </p>
        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Solde restant :</strong> {{balance}} €
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Je vous recontacte 5 à 10 jours avant votre événement pour finaliser la logistique, les horaires et vous partager votre galerie personnalisée.
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          À très bientôt !
        </p>
      `
    },
    nl: {
      subject: "Het is bevestigd, {{client_name}} !",
      body: `
        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo {{client_name}},
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Dit is Jonathan van Mirror Effect. Uw reservering is bevestigd, bedankt voor uw vertrouwen!
        </p>

        <p style="margin: 0 0 8px; color: #333; font-size: 15px; line-height: 1.7;">
          Hier is de samenvatting:
        </p>

        <p style="margin: 0 0 4px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Datum:</strong> {{event_date}}
        </p>
        <p style="margin: 0 0 4px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Locatie:</strong> {{address}}
        </p>
        <p style="margin: 0 0 4px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Pakket:</strong> {{pack_code}}
        </p>
        <p style="margin: 0 0 4px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Aanbetaling:</strong> {{deposit}} €
        </p>
        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Resterend saldo:</strong> {{balance}} €
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Ik neem 5 tot 10 dagen voor uw evenement contact met u op om de logistiek, tijden af te ronden en uw gepersonaliseerde galerij te delen.
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          Tot binnenkort!
        </p>
      `
    }
  },

  // =============================================================================
  // J+1 GOOGLE REVIEW REQUEST
  // =============================================================================
  B2C_AVIS_GOOGLE: {
    fr: {
      subject: "{{client_name}}, comment s'est passé votre événement ?",
      body: `
        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour {{client_name}},
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          C'est Jonathan. J'espère que votre événement s'est super bien passé !
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          J'ai une petite demande : si vous avez 30 secondes, un avis Google nous aide vraiment beaucoup. C'est grâce à ça que d'autres personnes nous découvrent.
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Voici le lien direct : <a href="{{review_link}}" style="color: #C1950E; text-decoration: none; font-weight: 600;">laisser un avis</a>
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Et pour vous remercier, vous bénéficiez de <strong>{{vip_reduction}}</strong> en tant que client fidèle.
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          Merci d'avance et à bientôt !
        </p>
      `
    },
    nl: {
      subject: "{{client_name}}, hoe was uw evenement?",
      body: `
        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo {{client_name}},
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Dit is Jonathan. Ik hoop dat uw evenement super goed is verlopen!
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Ik heb een klein verzoek: als u 30 seconden heeft, helpt een Google review ons echt enorm. Dankzij reviews ontdekken andere mensen ons.
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hier is de directe link: <a href="{{review_link}}" style="color: #C1950E; text-decoration: none; font-weight: 600;">review achterlaten</a>
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          En als dank profiteert u van <strong>{{vip_reduction}}</strong> als trouwe klant.
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          Alvast bedankt en tot binnenkort!
        </p>
      `
    }
  },

  // =============================================================================
  // J+3 REVIEW REMINDER
  // =============================================================================
  B2C_RELANCE_AVIS: {
    fr: {
      subject: "Un petit mot pour nous ?",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">💬</span>
          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Votre avis fait la différence
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Juste un petit rappel amical. Votre opinion est très importante pour nous.
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Si vous n'avez pas eu le temps, voici le lien direct pour nous laisser un avis Google :
        </p>

        <div style="text-align: center;">
          ${ctaButton("⭐ Laisser un avis", "{{review_link}}")}
        </div>

        <p style="margin: 24px 0 0; color: #333; font-size: 15px; line-height: 1.7;">
          Un tout grand merci pour votre aide !
        </p>
      `
    },
    nl: {
      subject: "Een woordje voor ons?",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">💬</span>
          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Uw review maakt het verschil
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Gewoon een vriendelijke herinnering. Uw mening is erg belangrijk voor ons.
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Als u geen tijd heeft gehad, hier is de directe link om een Google review achter te laten:
        </p>

        <div style="text-align: center;">
          ${ctaButton("⭐ Review achterlaten", "{{review_link}}")}
        </div>

        <p style="margin: 24px 0 0; color: #333; font-size: 15px; line-height: 1.7;">
          Hartelijk dank voor uw hulp!
        </p>
      `
    }
  },

  // =============================================================================
  // M+3 EVENT ANNIVERSARY (VIP OFFER)
  // =============================================================================
  B2C_EVENT_ANNIVERSARY: {
    fr: {
      subject: "{{client_name}}, des nouvelles de Jonathan",
      body: `
        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour {{client_name}},
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          C'est Jonathan de Mirror Effect. Ça fait déjà 3 mois depuis votre événement, le temps passe vite !
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Je voulais simplement prendre de vos nouvelles et vous dire que si vous avez un autre événement en vue (anniversaire, fête, soirée d'entreprise...), vous bénéficiez de <strong>{{vip_reduction}}</strong> sur votre prochaine réservation en tant que client fidèle.
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Pas de pression, l'offre reste valable. Répondez à cet email si vous souhaitez en discuter.
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          À bientôt !
        </p>
      `
    },
    nl: {
      subject: "{{client_name}}, nieuws van Jonathan",
      body: `
        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo {{client_name}},
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Dit is Jonathan van Mirror Effect. Het is al 3 maanden geleden sinds uw evenement, de tijd vliegt!
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Ik wilde gewoon even horen hoe het gaat en u laten weten dat als u een ander evenement plant (verjaardag, feest, bedrijfsevenement...), u profiteert van <strong>{{vip_reduction}}</strong> op uw volgende reservering als trouwe klant.
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Geen druk, het aanbod blijft geldig. Beantwoord deze email als u het wilt bespreken.
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          Tot binnenkort!
        </p>
      `
    }
  },

  // =============================================================================
  // M+9 ANNIVERSARY OFFER
  // =============================================================================
  B2C_OFFRE_ANNIVERSAIRE: {
    fr: {
      subject: "{{client_name}}, ça fait déjà un an !",
      body: `
        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour {{client_name}},
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          C'est Jonathan. Ça fait déjà un an que vous avez fait appel à Mirror Effect ! Le temps file.
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Si un autre événement se profile (ou celui d'un proche), sachez que vous bénéficiez de <strong>-10%</strong> sur votre prochaine réservation. Mentionnez simplement le code <strong>ANNIV10</strong> ou répondez à cet email.
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Quoi qu'il en soit, merci encore pour votre confiance cette année-là. C'était un plaisir.
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          À bientôt,<br>
          Jonathan
        </p>
      `
    },
    nl: {
      subject: "{{client_name}}, al een jaar geleden!",
      body: `
        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo {{client_name}},
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Dit is Jonathan. Het is al een jaar geleden dat u Mirror Effect heeft ingeschakeld! De tijd vliegt.
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Als er een ander evenement op komst is (of dat van iemand in uw omgeving), profiteert u van <strong>-10%</strong> op uw volgende reservering. Vermeld gewoon de code <strong>ANNIV10</strong> of beantwoord deze email.
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hoe dan ook, nogmaals bedankt voor uw vertrouwen destijds. Het was een plezier.
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          Tot binnenkort,<br>
          Jonathan
        </p>
      `
    }
  },

  // =============================================================================
  // NURTURING J+1: VALUE — Why Mirror Effect?
  // =============================================================================
  NURTURE_J1_VALUE: {
    fr: {
      subject: "Ce qui rend Mirror Effect unique",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">

          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Pourquoi Mirror Effect ?
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Merci d'avoir pris le temps de découvrir Mirror Effect. On sait que choisir une animation pour son événement, c'est une décision importante, alors voici ce qui nous différencie :
        </p>

        ${infoBox(`
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid rgba(193,149,14,0.2);">
                <p style="margin: 0; color: #12130F; font-size: 15px; font-weight: 600;">Installation clé en main</p>
                <p style="margin: 4px 0 0; color: #717182; font-size: 14px; line-height: 1.5;">Notre équipe arrive sur place à l'heure convenue et s'occupe de tout. 30 à 60 minutes d'installation, zéro stress pour vous.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid rgba(193,149,14,0.2);">
                <p style="margin: 0; color: #12130F; font-size: 15px; font-weight: 600;">Photos illimitées</p>
                <p style="margin: 4px 0 0; color: #717182; font-size: 14px; line-height: 1.5;">Illimité tant que le pack le permet. Vos invités se lâchent, sans compter.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <p style="margin: 0; color: #12130F; font-size: 15px; font-weight: 600;">Galerie en ligne personnalisée</p>
                <p style="margin: 4px 0 0; color: #717182; font-size: 14px; line-height: 1.5;">Toutes les photos accessibles en ligne après l'événement, avec un design aux couleurs de votre fête.</p>
              </td>
            </tr>
          </table>
        `, 'gold')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          Envie d'en savoir plus ou de finaliser votre réservation ? Répondez simplement à cet email ou visitez notre site.
        </p>

        <div style="text-align: center;">
          ${ctaButton("Découvrir nos packs", "https://mirroreffect.co")}
        </div>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          À bientôt        </p>
      `
    },
    nl: {
      subject: "Wat Mirror Effect uniek maakt",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">

          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Waarom Mirror Effect?
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bedankt dat u de tijd heeft genomen om Mirror Effect te ontdekken. We weten dat het kiezen van entertainment voor uw evenement een belangrijke beslissing is, dus dit is wat ons onderscheidt:
        </p>

        ${infoBox(`
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid rgba(193,149,14,0.2);">
                <p style="margin: 0; color: #12130F; font-size: 15px; font-weight: 600;">Turnkey installatie</p>
                <p style="margin: 4px 0 0; color: #717182; font-size: 14px; line-height: 1.5;">Ons team komt op het afgesproken tijdstip en regelt alles. 30 tot 60 minuten installatie, geen stress voor u.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid rgba(193,149,14,0.2);">
                <p style="margin: 0; color: #12130F; font-size: 15px; font-weight: 600;">Onbeperkte foto's</p>
                <p style="margin: 4px 0 0; color: #717182; font-size: 14px; line-height: 1.5;">Onbeperkt zolang het pakket het toelaat. Uw gasten gaan los, zonder te tellen.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <p style="margin: 0; color: #12130F; font-size: 15px; font-weight: 600;">Gepersonaliseerde online galerij</p>
                <p style="margin: 4px 0 0; color: #717182; font-size: 14px; line-height: 1.5;">Alle foto's online beschikbaar na het evenement, met een design in de kleuren van uw feest.</p>
              </td>
            </tr>
          </table>
        `, 'gold')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          Meer weten of uw reservering afronden? Beantwoord gewoon deze email of bezoek onze website.
        </p>

        <div style="text-align: center;">
          ${ctaButton("Onze pakketten ontdekken", "https://mirroreffect.co")}
        </div>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          Tot binnenkort        </p>
      `
    }
  },

  // =============================================================================
  // NURTURING J+3: FAQ — Common questions answered
  // =============================================================================
  NURTURE_J3_FAQ: {
    fr: {
      subject: "Une question, {{client_name}} ?",
      body: `
        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour {{client_name}},
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          C'est Jonathan de Mirror Effect. Je me permets de vous écrire car on reçoit souvent les mêmes questions, et je me suis dit que ça pourrait vous être utile.
        </p>

        <p style="margin: 0 0 8px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Combien de place faut-il ?</strong><br>
          Un espace d'environ 2m x 2m suffit. On s'adapte à votre lieu.
        </p>

        <p style="margin: 0 0 8px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Et si mon lieu est difficile d'accès ?</strong><br>
          On gère la logistique de A à Z. Châteaux, salles, jardins — on a l'habitude.
        </p>

        <p style="margin: 0 0 8px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>C'est quoi exactement un photobooth miroir ?</strong><br>
          C'est un miroir interactif grandeur nature qui prend des photos de qualité pro. Vos invités se voient dans le miroir et suivent des animations ludiques à l'écran.
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Comment se passe le paiement ?</strong><br>
          Un acompte à la réservation, le solde le jour de l'événement. Simple et sécurisé.
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          Si vous avez une autre question, répondez directement à cet email. Je vous réponds personnellement.
        </p>
      `
    },
    nl: {
      subject: "Een vraag, {{client_name}} ?",
      body: `
        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo {{client_name}},
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Dit is Jonathan van Mirror Effect. Ik schrijf u omdat we vaak dezelfde vragen krijgen, en ik dacht dat dit handig kon zijn.
        </p>

        <p style="margin: 0 0 8px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Hoeveel ruimte is er nodig?</strong><br>
          Een ruimte van ongeveer 2m x 2m is voldoende. We passen ons aan uw locatie aan.
        </p>

        <p style="margin: 0 0 8px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Wat als mijn locatie moeilijk bereikbaar is?</strong><br>
          Wij regelen de logistiek van A tot Z. Kastelen, zalen, tuinen — we zijn het gewend.
        </p>

        <p style="margin: 0 0 8px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Wat is precies een spiegel photobooth?</strong><br>
          Het is een interactieve spiegel op ware grootte die professionele foto's maakt. Uw gasten zien zichzelf in de spiegel en volgen leuke animaties op het scherm.
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Hoe werkt de betaling?</strong><br>
          Een aanbetaling bij reservering, het saldo op de dag van het evenement. Eenvoudig en veilig.
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          Heeft u nog een vraag? Beantwoord gewoon deze email. Ik reageer persoonlijk.
        </p>
      `
    }
  },

  // =============================================================================
  // NURTURING J+7: SOCIAL PROOF — Testimonials
  // =============================================================================
  NURTURE_J7_PROOF: {
    fr: {
      subject: "Ce que nos clients disent de nous",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">

          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Ils ont choisi Mirror Effect
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Rien de mieux que l'avis de ceux qui ont vécu l'expérience. Voici ce que nos clients disent :
        </p>

        ${infoBox(`
          <div style="padding: 4px 0;">
            <p style="margin: 0 0 8px; color: #333; font-size: 14px; font-style: italic; line-height: 1.6;">
              "Nous avons loué le photobooth miroir pour notre mariage. Qualité au top, nous avons pu choisir et même personnaliser le fond d'écran des photos. Disponibles et ont répondu à nos attentes. A recommander."
            </p>
            <p style="margin: 0; color: #666; font-size: 13px; font-weight: 600;">— Florence C., Google</p>
          </div>
        `, 'light')}

        ${infoBox(`
          <div style="padding: 4px 0;">
            <p style="margin: 0 0 8px; color: #333; font-size: 14px; font-style: italic; line-height: 1.6;">
              "Mirror Effect nous a apporté beaucoup de joie et de bonne humeur, ainsi qu'à nos 214 invités ! L'équipe est extrêmement PRO et sympathique, et la qualité des photos, imprimées instantanément, est surprenante !"
            </p>
            <p style="margin: 0; color: #666; font-size: 13px; font-weight: 600;">— Christian B., CEO HD4You, Google</p>
          </div>
        `, 'light')}

        ${infoBox(`
          <div style="padding: 4px 0;">
            <p style="margin: 0 0 8px; color: #333; font-size: 14px; font-style: italic; line-height: 1.6;">
              "Quelle idée innovatrice ! Un très beau cadre très original avec le tapis rouge, le miroir et les barrières, on se sent comme des stars ! Et surtout, un personnel au top et super professionnel."
            </p>
            <p style="margin: 0; color: #666; font-size: 13px; font-weight: 600;">— Amélie S., Google</p>
          </div>
        `, 'light')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          Envie de vivre la même expérience ? On est là pour vous.
        </p>

        <div style="text-align: center;">
          ${ctaButton("Réserver maintenant", "https://mirroreffect.co")}
        </div>

        <p style="margin: 24px 0 0; color: #717182; font-size: 13px; line-height: 1.6; text-align: center;">
          Vous recevrez encore 2 emails de notre part sur les prochaines semaines. Après cela, plus de messages si vous ne souhaitez pas donner suite. Vous pouvez aussi vous désinscrire à tout moment via le lien en bas de cet email.
        </p>
      `
    },
    nl: {
      subject: "Wat onze klanten over ons zeggen",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">

          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Zij kozen Mirror Effect
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Niets beter dan de mening van wie de ervaring heeft beleefd. Dit zeggen onze klanten:
        </p>

        ${infoBox(`
          <div style="padding: 4px 0;">
            <p style="margin: 0 0 8px; color: #333; font-size: 14px; font-style: italic; line-height: 1.6;">
              "We huurden de spiegel photobooth voor ons huwelijk. Kwaliteit top, we konden de achtergrond van de foto's kiezen en zelfs personaliseren. Beschikbaar en voldeden aan onze verwachtingen. Aan te raden."
            </p>
            <p style="margin: 0; color: #666; font-size: 13px; font-weight: 600;">— Florence C., Google</p>
          </div>
        `, 'light')}

        ${infoBox(`
          <div style="padding: 4px 0;">
            <p style="margin: 0 0 8px; color: #333; font-size: 14px; font-style: italic; line-height: 1.6;">
              "Mirror Effect bracht ons en onze 214 gasten veel plezier en goed humeur! Het team is uiterst PRO en sympathiek, en de kwaliteit van de direct geprinte foto's is verrassend!"
            </p>
            <p style="margin: 0; color: #666; font-size: 13px; font-weight: 600;">— Christian B., CEO HD4You, Google</p>
          </div>
        `, 'light')}

        ${infoBox(`
          <div style="padding: 4px 0;">
            <p style="margin: 0 0 8px; color: #333; font-size: 14px; font-style: italic; line-height: 1.6;">
              "Wat een innovatief idee! Een prachtig en origineel kader met de rode loper, de spiegel en de afzettingen, je voelt je een ster! En vooral, top personeel en super professioneel."
            </p>
            <p style="margin: 0; color: #666; font-size: 13px; font-weight: 600;">— Amélie S., Google</p>
          </div>
        `, 'light')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          Wilt u dezelfde ervaring beleven? We zijn er voor u.
        </p>

        <div style="text-align: center;">
          ${ctaButton("Nu reserveren", "https://mirroreffect.co")}
        </div>

        <p style="margin: 24px 0 0; color: #717182; font-size: 13px; line-height: 1.6; text-align: center;">
          U ontvangt nog 2 emails van ons de komende weken. Daarna geen berichten meer als u niet geïnteresseerd bent. U kunt zich ook op elk moment uitschrijven via de link onderaan deze email.
        </p>
      `
    }
  },

  // =============================================================================
  // NURTURING J+14: PROMO — -50€ discount offer
  // =============================================================================
  NURTURE_J14_PROMO: {
    fr: {
      subject: "{{client_name}}, un petit mot de Jonathan",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">

          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Un cadeau pour vous
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          On sait que planifier un événement, ça demande du temps. Alors pour vous faciliter la décision, on vous offre un coup de pouce :
        </p>

        ${infoBox(`
          <div style="text-align: center;">
            <p style="margin: 0 0 8px; color: #C1950E; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
              Rien que pour vous
            </p>
            <p style="margin: 0 0 8px; font-size: 36px; font-weight: 700; color: #12130F;">
              -50 €
            </p>
            <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">
              sur votre <strong>solde restant</strong> si vous réservez<br>dans les <strong>7 prochains jours</strong>
            </p>
            <p style="margin: 12px 0 0; color: #717182; font-size: 12px;">
              Aucun code promo nécessaire — répondez à cet email et on s'en occupe !
            </p>
          </div>
        `, 'gold')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          Pour en profiter, répondez à cet email ou réservez directement :
        </p>

        <div style="text-align: center;">
          ${ctaButton("Réserver avec -50€", "https://mirroreffect.co")}
        </div>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          À bientôt        </p>
      `
    },
    nl: {
      subject: "{{client_name}}, een berichtje van Jonathan",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">

          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Een cadeautje voor u
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          We weten dat het plannen van een evenement tijd kost. Daarom geven we u een duwtje in de rug:
        </p>

        ${infoBox(`
          <div style="text-align: center;">
            <p style="margin: 0 0 8px; color: #C1950E; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
              Speciaal voor u
            </p>
            <p style="margin: 0 0 8px; font-size: 36px; font-weight: 700; color: #12130F;">
              -50 €
            </p>
            <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">
              op uw <strong>resterend saldo</strong> als u reserveert<br>binnen de <strong>komende 7 dagen</strong>
            </p>
            <p style="margin: 12px 0 0; color: #717182; font-size: 12px;">
              Geen promotiecode nodig — beantwoord deze email en wij regelen het!
            </p>
          </div>
        `, 'gold')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          Om hiervan te profiteren, beantwoord deze email of reserveer direct:
        </p>

        <div style="text-align: center;">
          ${ctaButton("Reserveren met -50€", "https://mirroreffect.co")}
        </div>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          Tot binnenkort        </p>
      `
    }
  },

  // =============================================================================
  // NURTURING J+21: GOODBYE — Last email, no pressure
  // =============================================================================
  NURTURE_J21_GOODBYE: {
    fr: {
      subject: "On reste disponible pour vous",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">

          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Dernier petit mot
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          C'est le dernier email de notre part. On ne veut surtout pas vous embêter.
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Si le timing n'est pas le bon, aucun souci. Sachez simplement que Mirror Effect reste disponible pour vous, aujourd'hui comme dans 6 mois.
        </p>

        ${infoBox(`
          <div style="text-align: center;">
            <p style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #12130F;">
              Quand vous serez prêt...
            </p>
            <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">
              Répondez à cet email ou visitez <a href="https://mirroreffect.co" style="color: #C1950E; text-decoration: none; font-weight: 600;">mirroreffect.co</a>
            </p>
          </div>
        `, 'light')}

        <p style="margin: 24px 0 0; color: #333; font-size: 15px; line-height: 1.7;">
          On vous souhaite un magnifique événement, avec ou sans nous        </p>
      `
    },
    nl: {
      subject: "We blijven beschikbaar voor u",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">

          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Laatste berichtje
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Dit is onze laatste email. We willen u zeker niet storen.
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Als de timing niet goed is, geen probleem. Weet gewoon dat Mirror Effect beschikbaar blijft voor u, vandaag en over 6 maanden.
        </p>

        ${infoBox(`
          <div style="text-align: center;">
            <p style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #12130F;">
              Wanneer u klaar bent...
            </p>
            <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">
              Beantwoord deze email of bezoek <a href="https://mirroreffect.co" style="color: #C1950E; text-decoration: none; font-weight: 600;">mirroreffect.co</a>
            </p>
          </div>
        `, 'light')}

        <p style="margin: 24px 0 0; color: #333; font-size: 15px; line-height: 1.7;">
          We wensen u een prachtig evenement, met of zonder ons        </p>
      `
    }
  }
};

function interpolate(template: string, payload: Record<string, string | number | boolean | null | undefined>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = payload[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

export async function renderTemplate({ key, locale, payload = {} }: RenderInput): Promise<RenderedTemplate | null> {
  const preferredLocale = (locale || "fr").toLowerCase();

  const templateByLocale = TEMPLATES[key];
  if (!templateByLocale) {
    console.warn(`[renderTemplate] Template not found: ${key}`);
    return null;
  }

  let resolved = templateByLocale[preferredLocale];

  // Fallback to French if locale not found
  if (!resolved && preferredLocale !== "fr") {
    resolved = templateByLocale["fr"];
  }

  if (!resolved) {
    return null;
  }

  const interpolatedBody = interpolate(resolved.body, payload);
  const unsubscribeUrl = payload.unsubscribe_url ? String(payload.unsubscribe_url) : undefined;

  return {
    subject: interpolate(resolved.subject, payload),
    html: emailWrapper(interpolatedBody, preferredLocale, unsubscribeUrl)
  };
}

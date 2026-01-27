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
      subject: "Votre réservation est confirmée - Mirror Effect",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">

          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Réservation confirmée
          </h2>
          <p style="margin: 8px 0 0; color: #717182; font-size: 15px;">
            Merci pour votre confiance
          </p>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Votre réservation <strong>Mirror Effect</strong> est bien confirmée ! Nous avons hâte de rendre votre événement inoubliable.
        </p>

        ${infoBox(`
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #717182; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">📅 Date</span>
                <p style="margin: 4px 0 0; color: #12130F; font-size: 16px; font-weight: 600;">{{event_date}}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #717182; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">📍 Lieu</span>
                <p style="margin: 4px 0 0; color: #12130F; font-size: 16px; font-weight: 600;">{{address}}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #717182; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">📦 Pack</span>
                <p style="margin: 4px 0 0; color: #12130F; font-size: 16px; font-weight: 600;">{{pack_code}}</p>
              </td>
            </tr>
          </table>
        `, 'gold')}

        ${infoBox(`
          <p style="margin: 0 0 12px; color: #717182; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">💳 Récapitulatif financier</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #717182; font-size: 14px; border-bottom: 1px solid #e9ecef;">Acompte versé</td>
              <td style="padding: 10px 0; color: #059669; font-size: 14px; text-align: right; font-weight: 600; border-bottom: 1px solid #e9ecef;">{{deposit}} €</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #12130F; font-size: 15px; font-weight: 600;">Solde restant</td>
              <td style="padding: 12px 0; color: #C1950E; font-size: 18px; text-align: right; font-weight: 700;">{{balance}} €</td>
            </tr>
          </table>
        `, 'light')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Prochaines étapes :</strong> Nous vous recontacterons <strong>5 à 10 jours avant</strong> votre événement pour finaliser la logistique, les horaires et vous partager votre galerie personnalisée.
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          À très bientôt        </p>
      `
    },
    nl: {
      subject: "Uw reservering is bevestigd - Mirror Effect",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">

          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Reservering bevestigd
          </h2>
          <p style="margin: 8px 0 0; color: #717182; font-size: 15px;">
            Bedankt voor uw vertrouwen
          </p>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Uw <strong>Mirror Effect</strong> reservering is bevestigd! We kijken ernaar uit om uw evenement onvergetelijk te maken.
        </p>

        ${infoBox(`
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #717182; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">📅 Datum</span>
                <p style="margin: 4px 0 0; color: #12130F; font-size: 16px; font-weight: 600;">{{event_date}}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #717182; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">📍 Locatie</span>
                <p style="margin: 4px 0 0; color: #12130F; font-size: 16px; font-weight: 600;">{{address}}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="color: #717182; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">📦 Pakket</span>
                <p style="margin: 4px 0 0; color: #12130F; font-size: 16px; font-weight: 600;">{{pack_code}}</p>
              </td>
            </tr>
          </table>
        `, 'gold')}

        ${infoBox(`
          <p style="margin: 0 0 12px; color: #717182; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">💳 Financieel overzicht</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #717182; font-size: 14px; border-bottom: 1px solid #e9ecef;">Aanbetaling</td>
              <td style="padding: 10px 0; color: #059669; font-size: 14px; text-align: right; font-weight: 600; border-bottom: 1px solid #e9ecef;">{{deposit}} €</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #12130F; font-size: 15px; font-weight: 600;">Resterend saldo</td>
              <td style="padding: 12px 0; color: #C1950E; font-size: 18px; text-align: right; font-weight: 700;">{{balance}} €</td>
            </tr>
          </table>
        `, 'light')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          <strong>Volgende stappen:</strong> We nemen <strong>5 tot 10 dagen voor</strong> uw evenement contact met u op om de logistiek, tijden af te ronden en uw gepersonaliseerde galerij te delen.
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          Tot binnenkort        </p>
      `
    }
  },

  // =============================================================================
  // J+1 GOOGLE REVIEW REQUEST
  // =============================================================================
  B2C_AVIS_GOOGLE: {
    fr: {
      subject: "Merci ! Votre avis compte pour nous",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">

          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Votre avis compte
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Merci encore pour votre confiance ✨ Nous espérons que votre événement s'est parfaitement déroulé.
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Si vous avez <strong>30 secondes</strong>, votre avis nous aide énormément (et nous permet de continuer à offrir un service premium).
        </p>

        <div style="text-align: center;">
          ${ctaButton("⭐ Laisser un avis Google", "{{review_link}}")}
        </div>

        ${infoBox(`
          <div style="text-align: center;">
            <p style="margin: 0; font-size: 12px; font-weight: 600; color: #C1950E; text-transform: uppercase; letter-spacing: 0.05em;">Bonus VIP</p>
            <p style="margin: 12px 0 0; color: #12130F; font-size: 15px; font-weight: 500;">
              {{vip_reduction}}
            </p>
          </div>
        `, 'gold')}

        <p style="margin: 24px 0 0; color: #333; font-size: 15px; line-height: 1.7;">
          Merci ✨<br>
          À très vite !
        </p>
      `
    },
    nl: {
      subject: "Bedankt! Uw mening telt voor ons",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">

          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Uw mening telt
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Nogmaals bedankt voor uw vertrouwen ✨ We hopen dat uw evenement perfect is verlopen.
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Als u <strong>30 seconden</strong> heeft, helpt uw review ons enorm (en stelt ons in staat om premium service te blijven bieden).
        </p>

        <div style="text-align: center;">
          ${ctaButton("⭐ Google review achterlaten", "{{review_link}}")}
        </div>

        ${infoBox(`
          <div style="text-align: center;">
            <p style="margin: 0; font-size: 12px; font-weight: 600; color: #C1950E; text-transform: uppercase; letter-spacing: 0.05em;">VIP Bonus</p>
            <p style="margin: 12px 0 0; color: #12130F; font-size: 15px; font-weight: 500;">
              {{vip_reduction}}
            </p>
          </div>
        `, 'gold')}

        <p style="margin: 24px 0 0; color: #333; font-size: 15px; line-height: 1.7;">
          Bedankt ✨<br>
          Tot snel!
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
      subject: "🎂 3 mois déjà ! Une offre VIP pour vous",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">🎂</span>
          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Joyeux anniversaire !
          </h2>
          <p style="margin: 8px 0 0; color: #717182; font-size: 15px;">
            3 mois depuis votre événement
          </p>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Le temps passe vite ! Dans 3 mois, ce sera l'anniversaire de votre magnifique événement Mirror Effect !
        </p>

        ${infoBox(`
          <div style="text-align: center;">
            <p style="margin: 0; font-size: 12px; font-weight: 600; color: #C1950E; text-transform: uppercase; letter-spacing: 0.05em;">Client VIP</p>
            <p style="margin: 16px 0 8px; font-size: 24px; font-weight: 600; color: #12130F;">
              Avez-vous prévu une autre célébration ?
            </p>
            <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.6;">
              En tant que client VIP, vous avez droit à une<br>
              <strong style="color: #C1950E; font-size: 18px;">réduction spéciale de {{vip_reduction}}</strong><br>
              sur votre prochaine location.
            </p>
          </div>
        `, 'gold')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          Répondez simplement à cet email si vous souhaitez en discuter. Nous serions ravis de faire partie de vos nouvelles festivités !
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          Amicalement        </p>
      `
    },
    nl: {
      subject: "🎂 Al 3 maanden! Een VIP-aanbieding voor u",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">🎂</span>
          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Gelukkige verjaardag!
          </h2>
          <p style="margin: 8px 0 0; color: #717182; font-size: 15px;">
            3 maanden sinds uw evenement
          </p>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          De tijd vliegt! Over 3 maanden is het de verjaardag van uw prachtige Mirror Effect evenement!
        </p>

        ${infoBox(`
          <div style="text-align: center;">
            <p style="margin: 0; font-size: 12px; font-weight: 600; color: #C1950E; text-transform: uppercase; letter-spacing: 0.05em;">VIP Klant</p>
            <p style="margin: 16px 0 8px; font-size: 24px; font-weight: 600; color: #12130F;">
              Plant u nog een feest?
            </p>
            <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.6;">
              Als VIP-klant heeft u recht op een<br>
              <strong style="color: #C1950E; font-size: 18px;">speciale korting van {{vip_reduction}}</strong><br>
              op uw volgende huur.
            </p>
          </div>
        `, 'gold')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          Beantwoord gewoon deze email als u het wilt bespreken. We zouden graag deel uitmaken van uw nieuwe festiviteiten!
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          Met vriendelijke groet        </p>
      `
    }
  },

  // =============================================================================
  // M+9 ANNIVERSARY OFFER
  // =============================================================================
  B2C_OFFRE_ANNIVERSAIRE: {
    fr: {
      subject: "Un an déjà ! -10% pour fêter ça",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">🎊</span>
          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Joyeux anniversaire d'événement !
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Il y a bientôt un an, vous avez fait appel à Mirror Effect pour votre événement. Le temps passe vite !
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Pour célébrer cet anniversaire, nous vous offrons <strong style="color: #C1950E;">-10% sur votre prochaine réservation</strong>.
        </p>

        ${infoBox(`
          <div style="text-align: center;">
            <p style="margin: 0 0 8px; color: rgba(255,255,255,0.85); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Code promo</p>
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: #12130F;">
              ANNIV10
            </p>
          </div>
        `, 'gold')}

        <div style="text-align: center;">
          ${ctaButton("Réserver maintenant", "https://mirroreffect.co/reserver")}
        </div>

        <p style="margin: 0; color: #717182; font-size: 13px; text-align: center;">
          Offre valable 30 jours.
        </p>
      `
    },
    nl: {
      subject: "Al een jaar! -10% om dit te vieren",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">🎊</span>
          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Gelukkige evenement-verjaardag!
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Bijna een jaar geleden heeft u Mirror Effect ingeschakeld voor uw evenement. De tijd vliegt!
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Om dit jubileum te vieren, bieden wij u <strong style="color: #C1950E;">-10% op uw volgende reservering</strong>.
        </p>

        ${infoBox(`
          <div style="text-align: center;">
            <p style="margin: 0 0 8px; color: rgba(255,255,255,0.85); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Promotiecode</p>
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: #12130F;">
              ANNIV10
            </p>
          </div>
        `, 'gold')}

        <div style="text-align: center;">
          ${ctaButton("Nu reserveren", "https://mirroreffect.co/reserveren")}
        </div>

        <p style="margin: 0; color: #717182; font-size: 13px; text-align: center;">
          Aanbieding geldig gedurende 30 dagen.
        </p>
      `
    }
  },

  // =============================================================================
  // EVENT RECAP (full details - legacy support)
  // =============================================================================
  B2C_EVENT_RECAP: {
    fr: {
      subject: "📋 Récapitulatif de votre événement - Mirror Effect",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">📋</span>
          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Récapitulatif
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Voici le récapitulatif complet de votre réservation :
        </p>

        ${infoBox(`
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; color: #717182; font-size: 14px; border-bottom: 1px solid rgba(193,149,14,0.2);">📅 Date</td>
              <td style="padding: 12px 0; color: #12130F; font-size: 14px; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(193,149,14,0.2);">{{event_date}}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #717182; font-size: 14px; border-bottom: 1px solid rgba(193,149,14,0.2);">📍 Lieu</td>
              <td style="padding: 12px 0; color: #12130F; font-size: 14px; text-align: right; border-bottom: 1px solid rgba(193,149,14,0.2);">{{address}}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #717182; font-size: 14px; border-bottom: 1px solid rgba(193,149,14,0.2);">📦 Pack</td>
              <td style="padding: 12px 0; color: #12130F; font-size: 14px; text-align: right; border-bottom: 1px solid rgba(193,149,14,0.2);">{{pack_code}}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #717182; font-size: 14px; border-bottom: 1px solid rgba(193,149,14,0.2);">💰 Total</td>
              <td style="padding: 12px 0; color: #12130F; font-size: 14px; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(193,149,14,0.2);">{{total}} €</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #717182; font-size: 14px; border-bottom: 1px solid rgba(193,149,14,0.2);">✅ Acompte versé</td>
              <td style="padding: 12px 0; color: #059669; font-size: 14px; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(193,149,14,0.2);">- {{deposit}} €</td>
            </tr>
            <tr>
              <td style="padding: 16px 0 0; color: #12130F; font-size: 15px; font-weight: 600;">Solde restant</td>
              <td style="padding: 16px 0 0; color: #C1950E; font-size: 20px; text-align: right; font-weight: 700;">{{balance}} €</td>
            </tr>
          </table>
        `, 'gold')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          Le solde sera à régler le jour de l'événement.
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          Des questions ? Répondez à cet email.
        </p>
      `
    },
    nl: {
      subject: "📋 Samenvatting van uw evenement - Mirror Effect",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">📋</span>
          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            Samenvatting
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Hier is de volledige samenvatting van uw reservering:
        </p>

        ${infoBox(`
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; color: #717182; font-size: 14px; border-bottom: 1px solid rgba(193,149,14,0.2);">📅 Datum</td>
              <td style="padding: 12px 0; color: #12130F; font-size: 14px; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(193,149,14,0.2);">{{event_date}}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #717182; font-size: 14px; border-bottom: 1px solid rgba(193,149,14,0.2);">📍 Locatie</td>
              <td style="padding: 12px 0; color: #12130F; font-size: 14px; text-align: right; border-bottom: 1px solid rgba(193,149,14,0.2);">{{address}}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #717182; font-size: 14px; border-bottom: 1px solid rgba(193,149,14,0.2);">📦 Pakket</td>
              <td style="padding: 12px 0; color: #12130F; font-size: 14px; text-align: right; border-bottom: 1px solid rgba(193,149,14,0.2);">{{pack_code}}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #717182; font-size: 14px; border-bottom: 1px solid rgba(193,149,14,0.2);">💰 Totaal</td>
              <td style="padding: 12px 0; color: #12130F; font-size: 14px; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(193,149,14,0.2);">{{total}} €</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #717182; font-size: 14px; border-bottom: 1px solid rgba(193,149,14,0.2);">✅ Aanbetaling</td>
              <td style="padding: 12px 0; color: #059669; font-size: 14px; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(193,149,14,0.2);">- {{deposit}} €</td>
            </tr>
            <tr>
              <td style="padding: 16px 0 0; color: #12130F; font-size: 15px; font-weight: 600;">Resterend saldo</td>
              <td style="padding: 16px 0 0; color: #C1950E; font-size: 20px; text-align: right; font-weight: 700;">{{balance}} €</td>
            </tr>
          </table>
        `, 'gold')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          Het saldo dient op de dag van het evenement te worden voldaan.
        </p>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          Vragen? Beantwoord deze email.
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
      subject: "{{client_name}}, on répond à vos questions",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">

          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            On répond à vos questions
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Vous hésitez encore ? Voici les réponses aux questions qu'on nous pose le plus souvent :
        </p>

        ${infoBox(`
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 14px 0; border-bottom: 1px solid #e9ecef;">
                <p style="margin: 0; color: #C1950E; font-size: 14px; font-weight: 600;">Combien de place faut-il ?</p>
                <p style="margin: 6px 0 0; color: #333; font-size: 14px; line-height: 1.6;">Un espace d'environ 2m x 2m suffit. On s'adapte à votre lieu.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 14px 0; border-bottom: 1px solid #e9ecef;">
                <p style="margin: 0; color: #C1950E; font-size: 14px; font-weight: 600;">Et si mon lieu est difficile d'accès ?</p>
                <p style="margin: 6px 0 0; color: #333; font-size: 14px; line-height: 1.6;">On gère la logistique de A à Z. On a l'habitude de tous types de lieux (châteaux, salles, jardins, etc.).</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 14px 0; border-bottom: 1px solid #e9ecef;">
                <p style="margin: 0; color: #C1950E; font-size: 14px; font-weight: 600;">C'est quoi exactement un photobooth miroir ?</p>
                <p style="margin: 6px 0 0; color: #333; font-size: 14px; line-height: 1.6;">C'est un miroir interactif grandeur nature qui prend des photos de qualité pro. Vos invités se voient dans le miroir et suivent des animations ludiques à l'écran.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 14px 0;">
                <p style="margin: 0; color: #C1950E; font-size: 14px; font-weight: 600;">Comment se passe le paiement ?</p>
                <p style="margin: 6px 0 0; color: #333; font-size: 14px; line-height: 1.6;">Un acompte à la réservation, le solde le jour de l'événement. Simple et sécurisé via Mollie.</p>
              </td>
            </tr>
          </table>
        `, 'light')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          Une autre question ? Répondez directement à cet email, on vous répond rapidement.
        </p>

        <div style="text-align: center;">
          ${ctaButton("Voir nos packs", "https://mirroreffect.co")}
        </div>
      `
    },
    nl: {
      subject: "{{client_name}}, we beantwoorden uw vragen",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">

          <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: #12130F;">
            We beantwoorden uw vragen
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Twijfelt u nog? Hier zijn de antwoorden op de vragen die we het vaakst krijgen:
        </p>

        ${infoBox(`
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 14px 0; border-bottom: 1px solid #e9ecef;">
                <p style="margin: 0; color: #C1950E; font-size: 14px; font-weight: 600;">Hoeveel ruimte is er nodig?</p>
                <p style="margin: 6px 0 0; color: #333; font-size: 14px; line-height: 1.6;">Een ruimte van ongeveer 2m x 2m is voldoende. We passen ons aan uw locatie aan.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 14px 0; border-bottom: 1px solid #e9ecef;">
                <p style="margin: 0; color: #C1950E; font-size: 14px; font-weight: 600;">Wat als mijn locatie moeilijk bereikbaar is?</p>
                <p style="margin: 6px 0 0; color: #333; font-size: 14px; line-height: 1.6;">Wij regelen de logistiek van A tot Z. We zijn gewend aan alle soorten locaties (kastelen, zalen, tuinen, enz.).</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 14px 0; border-bottom: 1px solid #e9ecef;">
                <p style="margin: 0; color: #C1950E; font-size: 14px; font-weight: 600;">Wat is precies een spiegel photobooth?</p>
                <p style="margin: 6px 0 0; color: #333; font-size: 14px; line-height: 1.6;">Het is een interactieve spiegel op ware grootte die professionele foto's maakt. Uw gasten zien zichzelf in de spiegel en volgen leuke animaties op het scherm.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 14px 0;">
                <p style="margin: 0; color: #C1950E; font-size: 14px; font-weight: 600;">Hoe werkt de betaling?</p>
                <p style="margin: 6px 0 0; color: #333; font-size: 14px; line-height: 1.6;">Een aanbetaling bij reservering, het saldo op de dag van het evenement. Eenvoudig en veilig via Mollie.</p>
              </td>
            </tr>
          </table>
        `, 'light')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          Nog een vraag? Beantwoord direct deze email, we reageren snel.
        </p>

        <div style="text-align: center;">
          ${ctaButton("Onze pakketten bekijken", "https://mirroreffect.co")}
        </div>
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

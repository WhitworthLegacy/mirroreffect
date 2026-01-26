type RenderInput = {
  key: string;
  locale?: string;
  payload?: Record<string, string | number | boolean | null | undefined>;
};

type RenderedTemplate = {
  subject: string;
  html: string;
};

// Email wrapper with MirrorEffect branding
const emailWrapper = (content: string, locale: string, unsubscribeUrl?: string) => `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mirror Effect</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f8f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f8f8;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #12130F; padding: 32px 40px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #C1950E; font-size: 28px; font-weight: 700; letter-spacing: 0.05em;">MIRROR EFFECT</h1>
              <p style="margin: 8px 0 0; color: #cccccc; font-size: 14px;">Photobooth Miroir Premium</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 24px 40px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #ececf0;">
              <p style="margin: 0 0 8px; color: #717182; font-size: 13px;">
                Mirror Effect - Photobooth Miroir Premium<br>
                Bruxelles & toute la Belgique
              </p>
              <p style="margin: 0; color: #717182; font-size: 12px;">
                <a href="https://mirroreffect.co" style="color: #C1950E; text-decoration: none;">mirroreffect.co</a>
                ${unsubscribeUrl ? ` | <a href="${unsubscribeUrl}" style="color: #717182; text-decoration: underline;">${locale === 'nl' ? 'Uitschrijven' : 'Se désabonner'}</a>` : ''}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// CTA Button component
const ctaButton = (text: string, url: string) => `
<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
  <tr>
    <td style="background-color: #C1950E; border-radius: 8px;">
      <a href="${url}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">${text}</a>
    </td>
  </tr>
</table>
`;

// Templates
const TEMPLATES: Record<string, Record<string, { subject: string; body: string }>> = {
  // =============================================================================
  // BOOKING CONFIRMATION (sent after payment)
  // =============================================================================
  B2C_BOOKING_CONFIRMED: {
    fr: {
      subject: "Votre réservation est confirmée - Mirror Effect",
      body: `
        <h2 style="margin: 0 0 16px; color: #12130F; font-size: 24px;">Merci pour votre réservation !</h2>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Bonjour {{client_name}},
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Votre réservation pour le <strong>{{event_date}}</strong> est confirmée !
        </p>
        <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: #717182; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Récapitulatif</p>
          <p style="margin: 0 0 4px; color: #333; font-size: 15px;"><strong>Date:</strong> {{event_date}}</p>
          <p style="margin: 0 0 4px; color: #333; font-size: 15px;"><strong>Lieu:</strong> {{address}}</p>
          <p style="margin: 0; color: #333; font-size: 15px;"><strong>Acompte payé:</strong> {{deposit}} €</p>
        </div>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Nous vous contacterons prochainement pour finaliser les détails de votre événement.
        </p>
        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.6;">
          À très bientôt,<br>
          <strong style="color: #C1950E;">L'équipe Mirror Effect</strong>
        </p>
      `
    },
    nl: {
      subject: "Uw reservering is bevestigd - Mirror Effect",
      body: `
        <h2 style="margin: 0 0 16px; color: #12130F; font-size: 24px;">Bedankt voor uw reservering!</h2>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Hallo {{client_name}},
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Uw reservering voor <strong>{{event_date}}</strong> is bevestigd!
        </p>
        <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; color: #717182; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Samenvatting</p>
          <p style="margin: 0 0 4px; color: #333; font-size: 15px;"><strong>Datum:</strong> {{event_date}}</p>
          <p style="margin: 0 0 4px; color: #333; font-size: 15px;"><strong>Locatie:</strong> {{address}}</p>
          <p style="margin: 0; color: #333; font-size: 15px;"><strong>Aanbetaling:</strong> {{deposit}} €</p>
        </div>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          We nemen binnenkort contact met u op om de details van uw evenement te finaliseren.
        </p>
        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.6;">
          Tot binnenkort,<br>
          <strong style="color: #C1950E;">Het Mirror Effect team</strong>
        </p>
      `
    }
  },

  // =============================================================================
  // EVENT RECAP (full details)
  // =============================================================================
  B2C_EVENT_RECAP: {
    fr: {
      subject: "Récapitulatif de votre événement - Mirror Effect",
      body: `
        <h2 style="margin: 0 0 16px; color: #12130F; font-size: 24px;">Récapitulatif de votre événement</h2>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Bonjour {{client_name}},
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Voici le récapitulatif complet de votre réservation :
        </p>
        <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #717182; font-size: 14px;">Date</td><td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;"><strong>{{event_date}}</strong></td></tr>
            <tr><td style="padding: 8px 0; color: #717182; font-size: 14px;">Lieu</td><td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">{{address}}</td></tr>
            <tr><td style="padding: 8px 0; color: #717182; font-size: 14px;">Pack</td><td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">{{pack_code}}</td></tr>
            <tr style="border-top: 1px solid #ddd;"><td style="padding: 8px 0; color: #717182; font-size: 14px;">Total</td><td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;"><strong>{{total}} €</strong></td></tr>
            <tr><td style="padding: 8px 0; color: #717182; font-size: 14px;">Acompte versé</td><td style="padding: 8px 0; color: #059669; font-size: 14px; text-align: right;">- {{deposit}} €</td></tr>
            <tr style="border-top: 1px solid #ddd;"><td style="padding: 8px 0; color: #717182; font-size: 14px;">Solde restant</td><td style="padding: 8px 0; color: #C1950E; font-size: 16px; text-align: right;"><strong>{{balance}} €</strong></td></tr>
          </table>
        </div>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Le solde sera à régler le jour de l'événement.
        </p>
        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.6;">
          Des questions ? Répondez à cet email.<br>
          <strong style="color: #C1950E;">L'équipe Mirror Effect</strong>
        </p>
      `
    },
    nl: {
      subject: "Samenvatting van uw evenement - Mirror Effect",
      body: `
        <h2 style="margin: 0 0 16px; color: #12130F; font-size: 24px;">Samenvatting van uw evenement</h2>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Hallo {{client_name}},
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Hier is de volledige samenvatting van uw reservering:
        </p>
        <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #717182; font-size: 14px;">Datum</td><td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;"><strong>{{event_date}}</strong></td></tr>
            <tr><td style="padding: 8px 0; color: #717182; font-size: 14px;">Locatie</td><td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">{{address}}</td></tr>
            <tr><td style="padding: 8px 0; color: #717182; font-size: 14px;">Pakket</td><td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">{{pack_code}}</td></tr>
            <tr style="border-top: 1px solid #ddd;"><td style="padding: 8px 0; color: #717182; font-size: 14px;">Totaal</td><td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;"><strong>{{total}} €</strong></td></tr>
            <tr><td style="padding: 8px 0; color: #717182; font-size: 14px;">Aanbetaling</td><td style="padding: 8px 0; color: #059669; font-size: 14px; text-align: right;">- {{deposit}} €</td></tr>
            <tr style="border-top: 1px solid #ddd;"><td style="padding: 8px 0; color: #717182; font-size: 14px;">Resterend saldo</td><td style="padding: 8px 0; color: #C1950E; font-size: 16px; text-align: right;"><strong>{{balance}} €</strong></td></tr>
          </table>
        </div>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Het saldo dient op de dag van het evenement te worden voldaan.
        </p>
        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.6;">
          Vragen? Beantwoord deze email.<br>
          <strong style="color: #C1950E;">Het Mirror Effect team</strong>
        </p>
      `
    }
  },

  // =============================================================================
  // NURTURING: 48H REMINDER (abandoned cart)
  // =============================================================================
  B2C_PROMO_48H: {
    fr: {
      subject: "Votre photobooth vous attend encore...",
      body: `
        <h2 style="margin: 0 0 16px; color: #12130F; font-size: 24px;">Votre réservation n'est pas terminée</h2>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Bonjour,
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Vous avez commencé à réserver votre photobooth miroir pour le <strong>{{event_date}}</strong>, mais vous n'avez pas finalisé votre paiement.
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Cette date est encore disponible ! Ne la laissez pas s'envoler.
        </p>
        ${ctaButton("Finaliser ma réservation", "https://mirroreffect.co/reserver")}
        <p style="margin: 0; color: #717182; font-size: 13px; line-height: 1.6;">
          Des questions ? Répondez simplement à cet email.
        </p>
      `
    },
    nl: {
      subject: "Uw photobooth wacht nog steeds op u...",
      body: `
        <h2 style="margin: 0 0 16px; color: #12130F; font-size: 24px;">Uw reservering is niet voltooid</h2>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Hallo,
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          U bent begonnen met het reserveren van uw spiegel photobooth voor <strong>{{event_date}}</strong>, maar u heeft uw betaling niet afgerond.
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Deze datum is nog beschikbaar! Laat hem niet ontsnappen.
        </p>
        ${ctaButton("Reservering afronden", "https://mirroreffect.co/reserveren")}
        <p style="margin: 0; color: #717182; font-size: 13px; line-height: 1.6;">
          Vragen? Beantwoord gewoon deze email.
        </p>
      `
    }
  },

  // =============================================================================
  // J+1 GOOGLE REVIEW REQUEST
  // =============================================================================
  B2C_AVIS_GOOGLE: {
    fr: {
      subject: "Comment s'est passée votre soirée ? Laissez-nous un avis",
      body: `
        <h2 style="margin: 0 0 16px; color: #12130F; font-size: 24px;">Votre avis compte pour nous</h2>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Bonjour {{client_name}},
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Nous espérons que votre événement du <strong>{{event_date}}</strong> s'est magnifiquement passé et que le photobooth miroir a fait son effet !
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Si vous avez apprécié notre service, un petit avis Google nous aiderait énormément à nous faire connaître.
        </p>
        ${ctaButton("Laisser un avis Google", "https://g.page/r/mirroreffect/review")}
        <p style="margin: 0; color: #717182; font-size: 13px; line-height: 1.6;">
          Merci infiniment pour votre confiance !
        </p>
      `
    },
    nl: {
      subject: "Hoe was uw avond? Laat ons een review achter",
      body: `
        <h2 style="margin: 0 0 16px; color: #12130F; font-size: 24px;">Uw mening telt voor ons</h2>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Hallo {{client_name}},
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          We hopen dat uw evenement op <strong>{{event_date}}</strong> prachtig is verlopen en dat de spiegel photobooth zijn effect heeft gehad!
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Als u tevreden was met onze service, zou een kleine Google review ons enorm helpen om bekend te worden.
        </p>
        ${ctaButton("Google review achterlaten", "https://g.page/r/mirroreffect/review")}
        <p style="margin: 0; color: #717182; font-size: 13px; line-height: 1.6;">
          Hartelijk dank voor uw vertrouwen!
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
        <h2 style="margin: 0 0 16px; color: #12130F; font-size: 24px;">Votre avis fait la différence</h2>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Bonjour {{client_name}},
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Vous avez fait appel à Mirror Effect le <strong>{{event_date}}</strong>. Nous espérons que tout s'est bien passé !
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Un petit avis sur Google nous aide énormément. Cela ne prend que 30 secondes.
        </p>
        ${ctaButton("Je laisse un avis", "https://g.page/r/mirroreffect/review")}
        <p style="margin: 0; color: #717182; font-size: 13px; line-height: 1.6;">
          Merci d'avance !
        </p>
      `
    },
    nl: {
      subject: "Een woordje voor ons?",
      body: `
        <h2 style="margin: 0 0 16px; color: #12130F; font-size: 24px;">Uw review maakt het verschil</h2>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Hallo {{client_name}},
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          U heeft Mirror Effect ingeschakeld op <strong>{{event_date}}</strong>. We hopen dat alles goed is verlopen!
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Een kleine review op Google helpt ons enorm. Het duurt slechts 30 seconden.
        </p>
        ${ctaButton("Review achterlaten", "https://g.page/r/mirroreffect/review")}
        <p style="margin: 0; color: #717182; font-size: 13px; line-height: 1.6;">
          Alvast bedankt!
        </p>
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
        <h2 style="margin: 0 0 16px; color: #12130F; font-size: 24px;">Joyeux anniversaire d'événement !</h2>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Bonjour {{client_name}},
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Il y a bientôt un an, vous avez fait appel à Mirror Effect pour votre événement. Le temps passe vite !
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Pour célébrer cet anniversaire, nous vous offrons <strong style="color: #C1950E;">-10% sur votre prochaine réservation</strong>.
        </p>
        <div style="background-color: #12130F; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px; color: #cccccc; font-size: 13px;">Code promo</p>
          <p style="margin: 0; color: #C1950E; font-size: 28px; font-weight: 700; letter-spacing: 0.1em;">ANNIV10</p>
        </div>
        ${ctaButton("Réserver maintenant", "https://mirroreffect.co/reserver")}
        <p style="margin: 0; color: #717182; font-size: 13px; line-height: 1.6;">
          Offre valable 30 jours.
        </p>
      `
    },
    nl: {
      subject: "Al een jaar! -10% om dit te vieren",
      body: `
        <h2 style="margin: 0 0 16px; color: #12130F; font-size: 24px;">Gelukkige evenement-verjaardag!</h2>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Hallo {{client_name}},
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Bijna een jaar geleden heeft u Mirror Effect ingeschakeld voor uw evenement. De tijd vliegt!
        </p>
        <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.6;">
          Om dit jubileum te vieren, bieden wij u <strong style="color: #C1950E;">-10% op uw volgende reservering</strong>.
        </p>
        <div style="background-color: #12130F; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px; color: #cccccc; font-size: 13px;">Promotiecode</p>
          <p style="margin: 0; color: #C1950E; font-size: 28px; font-weight: 700; letter-spacing: 0.1em;">ANNIV10</p>
        </div>
        ${ctaButton("Nu reserveren", "https://mirroreffect.co/reserveren")}
        <p style="margin: 0; color: #717182; font-size: 13px; line-height: 1.6;">
          Aanbieding geldig gedurende 30 dagen.
        </p>
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

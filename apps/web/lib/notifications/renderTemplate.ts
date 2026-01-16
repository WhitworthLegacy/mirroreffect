type RenderInput = {
  key: string;
  locale?: string;
  payload?: Record<string, string | number | boolean | null>;
};

type RenderedTemplate = {
  subject: string;
  html: string;
};

// Templates hardcodés pour MVP
const TEMPLATES: Record<string, Record<string, { subject: string; html: string }>> = {
  B2C_BOOKING_CONFIRMED: {
    fr: {
      subject: "Votre réservation est confirmée - Mirror Effect",
      html: `<h1>Merci pour votre réservation !</h1>
<p>Bonjour {{client_name}},</p>
<p>Votre réservation pour le {{event_date}} est confirmée.</p>
<p>Lieu : {{address}}</p>
<p>Nous vous contacterons prochainement pour les détails.</p>
<p>L'équipe Mirror Effect</p>`
    },
    nl: {
      subject: "Uw reservering is bevestigd - Mirror Effect",
      html: `<h1>Bedankt voor uw reservering!</h1>
<p>Hallo {{client_name}},</p>
<p>Uw reservering voor {{event_date}} is bevestigd.</p>
<p>Locatie: {{address}}</p>
<p>We nemen binnenkort contact met u op voor de details.</p>
<p>Het Mirror Effect team</p>`
    }
  },
  B2C_EVENT_RECAP: {
    fr: {
      subject: "Récapitulatif de votre événement - Mirror Effect",
      html: `<h1>Récapitulatif de votre événement</h1>
<p>Bonjour {{client_name}},</p>
<p>Voici le récapitulatif de votre réservation :</p>
<ul>
<li>Date : {{event_date}}</li>
<li>Lieu : {{address}}</li>
<li>Pack : {{pack_code}}</li>
<li>Total : {{total}} €</li>
<li>Acompte versé : {{deposit}} €</li>
<li>Solde restant : {{balance}} €</li>
</ul>
<p>L'équipe Mirror Effect</p>`
    },
    nl: {
      subject: "Samenvatting van uw evenement - Mirror Effect",
      html: `<h1>Samenvatting van uw evenement</h1>
<p>Hallo {{client_name}},</p>
<p>Hier is de samenvatting van uw reservering:</p>
<ul>
<li>Datum: {{event_date}}</li>
<li>Locatie: {{address}}</li>
<li>Pakket: {{pack_code}}</li>
<li>Totaal: {{total}} €</li>
<li>Aanbetaling: {{deposit}} €</li>
<li>Resterend saldo: {{balance}} €</li>
</ul>
<p>Het Mirror Effect team</p>`
    }
  },
  B2C_PROMO_48H: {
    fr: {
      subject: "Votre devis Mirror Effect expire bientôt !",
      html: `<h1>N'oubliez pas votre réservation !</h1>
<p>Bonjour,</p>
<p>Vous avez commencé une réservation sur Mirror Effect.</p>
<p>N'attendez plus pour réserver votre photobooth miroir !</p>
<p>L'équipe Mirror Effect</p>`
    },
    nl: {
      subject: "Uw Mirror Effect offerte verloopt binnenkort!",
      html: `<h1>Vergeet uw reservering niet!</h1>
<p>Hallo,</p>
<p>U bent begonnen met een reservering op Mirror Effect.</p>
<p>Wacht niet langer om uw spiegel photobooth te reserveren!</p>
<p>Het Mirror Effect team</p>`
    }
  }
};

function interpolate(template: string, payload: Record<string, string | number | boolean | null>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = payload[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

export async function renderTemplate({ key, locale, payload = {} }: RenderInput): Promise<RenderedTemplate | null> {
  const preferredLocale = locale || "fr";

  const templateByLocale = TEMPLATES[key];
  if (!templateByLocale) {
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

  return {
    subject: interpolate(resolved.subject, payload),
    html: interpolate(resolved.html, payload)
  };
}

type RenderInput = {
  key: string;
  locale?: string;
  payload?: Record<string, string | number | boolean | null | undefined>;
};

type RenderedTemplate = {
  subject: string;
  html: string;
};

// Premium email wrapper with MirrorEffect branding
const emailWrapper = (content: string, locale: string, unsubscribeUrl?: string) => `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Mirror Effect</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%); font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%); min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px;">

          <!-- Luxe Header with Glow Effect -->
          <tr>
            <td style="padding: 0 0 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 48px 40px; background: linear-gradient(135deg, #12130F 0%, #1a1b17 50%, #12130F 100%); border-radius: 24px 24px 0 0; border: 1px solid rgba(193, 149, 14, 0.3); border-bottom: none; position: relative;">
                    <!-- Golden Glow Effect -->
                    <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 200px; height: 2px; background: linear-gradient(90deg, transparent, #C1950E, transparent);"></div>

                    <!-- Logo Text -->
                    <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 36px; font-weight: 600; letter-spacing: 0.15em; background: linear-gradient(135deg, #C1950E 0%, #E8C547 50%, #C1950E 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                      MIRROR EFFECT
                    </h1>
                    <p style="margin: 12px 0 0; color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 400; letter-spacing: 0.25em; text-transform: uppercase;">
                      Photobooth Miroir Premium
                    </p>

                    <!-- Decorative Line -->
                    <div style="margin-top: 24px; width: 60px; height: 1px; background: linear-gradient(90deg, transparent, rgba(193, 149, 14, 0.6), transparent);"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #ffffff; border-radius: 0 0 24px 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(193, 149, 14, 0.1);">
                <tr>
                  <td style="padding: 48px 40px 40px;">
                    ${content}
                  </td>
                </tr>

                <!-- Signature -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-top: 32px; border-top: 1px solid #f0f0f0;">
                          <table role="presentation" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="padding-right: 16px;">
                                <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #12130F 0%, #2a2b27 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                  <span style="font-family: 'Playfair Display', serif; font-size: 24px; color: #C1950E; font-weight: 600;">M</span>
                                </div>
                              </td>
                              <td>
                                <p style="margin: 0; font-weight: 600; font-size: 15px; color: #12130F;">Jonathan Whitworth</p>
                                <p style="margin: 4px 0 0; font-size: 13px; color: #717182;">Mirror Effect</p>
                                <p style="margin: 4px 0 0;">
                                  <a href="tel:+32460242430" style="font-size: 13px; color: #C1950E; text-decoration: none;">+32 460 24 24 30</a>
                                </p>
                              </td>
                            </tr>
                          </table>
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
            <td style="padding: 32px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <!-- Social Links -->
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="https://mirroreffect.co" style="display: inline-block; width: 40px; height: 40px; background: rgba(255,255,255,0.08); border-radius: 10px; text-align: center; line-height: 40px; text-decoration: none; color: rgba(255,255,255,0.6); font-size: 14px;">
                            🌐
                          </a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="https://instagram.com/mirroreffect.co" style="display: inline-block; width: 40px; height: 40px; background: rgba(255,255,255,0.08); border-radius: 10px; text-align: center; line-height: 40px; text-decoration: none; color: rgba(255,255,255,0.6); font-size: 14px;">
                            📸
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 8px; color: rgba(255,255,255,0.4); font-size: 12px;">
                      Mirror Effect · Photobooth Miroir Premium
                    </p>
                    <p style="margin: 0; color: rgba(255,255,255,0.3); font-size: 11px;">
                      Bruxelles & toute la Belgique
                    </p>
                    ${unsubscribeUrl ? `
                    <p style="margin: 16px 0 0;">
                      <a href="${unsubscribeUrl}" style="color: rgba(255,255,255,0.3); font-size: 11px; text-decoration: underline;">
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
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Premium CTA Button
const ctaButton = (text: string, url: string, variant: 'primary' | 'secondary' = 'primary') => {
  const isPrimary = variant === 'primary';
  return `
<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
  <tr>
    <td style="border-radius: 12px; background: ${isPrimary ? 'linear-gradient(135deg, #C1950E 0%, #D4A828 50%, #C1950E 100%)' : 'transparent'}; ${isPrimary ? 'box-shadow: 0 4px 14px rgba(193, 149, 14, 0.4);' : 'border: 2px solid #C1950E;'}">
      <a href="${url}" style="display: inline-block; padding: 16px 36px; color: ${isPrimary ? '#ffffff' : '#C1950E'}; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.02em;">
        ${text}
      </a>
    </td>
  </tr>
</table>
`;
};

// Info Box Component
const infoBox = (content: string, variant: 'gold' | 'light' | 'dark' = 'light') => {
  const styles = {
    gold: 'background: linear-gradient(135deg, #fdfbf4 0%, #fef9e7 100%); border: 1px solid rgba(193, 149, 14, 0.3);',
    light: 'background: #f8f9fa; border: 1px solid #e9ecef;',
    dark: 'background: linear-gradient(135deg, #12130F 0%, #1a1b17 100%); border: 1px solid rgba(193, 149, 14, 0.2);'
  };
  return `
<div style="${styles[variant]} border-radius: 16px; padding: 24px; margin: 24px 0;">
  ${content}
</div>
`;
};

// VIP Badge
const vipBadge = (text: string) => `
<span style="display: inline-block; background: linear-gradient(135deg, #C1950E 0%, #E8C547 100%); color: #12130F; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; padding: 6px 12px; border-radius: 20px; text-transform: uppercase;">
  ${text}
</span>
`;

// Templates
const TEMPLATES: Record<string, Record<string, { subject: string; body: string }>> = {
  // =============================================================================
  // BOOKING CONFIRMATION (sent after payment)
  // =============================================================================
  B2C_BOOKING_CONFIRMED: {
    fr: {
      subject: "✨ Votre réservation est confirmée - Mirror Effect",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">🎉</span>
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
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
          À très bientôt ✨
        </p>
      `
    },
    nl: {
      subject: "✨ Uw reservering is bevestigd - Mirror Effect",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">🎉</span>
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
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
          Tot binnenkort ✨
        </p>
      `
    }
  },

  // =============================================================================
  // PROMO 72H - Abandoned cart with discount
  // =============================================================================
  B2C_PROMO_72H: {
    fr: {
      subject: "🎁 -50€ pour finaliser votre réservation",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">💝</span>
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
            Un petit cadeau pour vous
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Merci pour votre intérêt pour <strong>Mirror Effect</strong> ✨ Il semble que la réservation n'ait pas été finalisée.
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Par curiosité (et pour nous aider à améliorer l'expérience), pouvez-vous nous dire ce qui vous a freiné ?
          <br><span style="color: #717182; font-size: 14px;">(date/infos à confirmer, budget, question logistique, autre…)</span>
        </p>

        ${infoBox(`
          <div style="text-align: center;">
            <p style="margin: 0 0 8px; color: #C1950E; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
              🎁 Cadeau exclusif
            </p>
            <p style="margin: 0 0 8px; font-family: 'Playfair Display', Georgia, serif; font-size: 36px; font-weight: 700; color: #12130F;">
              -50 €
            </p>
            <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">
              sur votre <strong>solde restant</strong> si vous finalisez<br>dans les <strong>72 heures</strong>
            </p>
            <p style="margin: 12px 0 0; color: #717182; font-size: 12px;">
              Aucun code promo — on s'en occupe !
            </p>
          </div>
        `, 'gold')}

        ${infoBox(`
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 6px 0;">
                <span style="color: #717182; font-size: 13px;">📅 Date</span>
                <span style="float: right; color: #12130F; font-size: 14px; font-weight: 600;">{{event_date}}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0;">
                <span style="color: #717182; font-size: 13px;">📍 Lieu</span>
                <span style="float: right; color: #12130F; font-size: 14px; font-weight: 600;">{{event_place}}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0;">
                <span style="color: #717182; font-size: 13px;">📦 Pack</span>
                <span style="float: right; color: #12130F; font-size: 14px; font-weight: 600;">{{pack_name}}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; border-top: 1px solid #e9ecef; margin-top: 8px;">
                <span style="color: #717182; font-size: 13px;">💰 Total</span>
                <span style="float: right; color: #C1950E; font-size: 15px; font-weight: 700;">{{total_amount}}</span>
              </td>
            </tr>
          </table>
        `, 'light')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          Pour finaliser, vous pouvez :
        </p>
        <ul style="margin: 0 0 24px 20px; padding: 0; color: #333; font-size: 15px; line-height: 1.8;">
          <li>Répondre directement à cet email (on s'occupe du reste)</li>
          <li>Ou retourner sur <a href="https://mirroreffect.co" style="color: #C1950E; text-decoration: none; font-weight: 600;">mirroreffect.co</a></li>
        </ul>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          À très vite ✨
        </p>
      `
    },
    nl: {
      subject: "🎁 -50€ om uw reservering af te ronden",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">💝</span>
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
            Een cadeautje voor u
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo <strong>{{client_name}}</strong>,
        </p>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bedankt voor uw interesse in <strong>Mirror Effect</strong> ✨ Het lijkt erop dat de reservering niet is afgerond.
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Uit nieuwsgierigheid (en om ons te helpen de ervaring te verbeteren), kunt u ons vertellen wat u tegenhield?
          <br><span style="color: #717182; font-size: 14px;">(datum/info te bevestigen, budget, logistieke vraag, anders…)</span>
        </p>

        ${infoBox(`
          <div style="text-align: center;">
            <p style="margin: 0 0 8px; color: #C1950E; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">
              🎁 Exclusief cadeau
            </p>
            <p style="margin: 0 0 8px; font-family: 'Playfair Display', Georgia, serif; font-size: 36px; font-weight: 700; color: #12130F;">
              -50 €
            </p>
            <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">
              op uw <strong>resterend saldo</strong> als u afrondt<br>binnen <strong>72 uur</strong>
            </p>
            <p style="margin: 12px 0 0; color: #717182; font-size: 12px;">
              Geen promotiecode nodig — wij regelen het!
            </p>
          </div>
        `, 'gold')}

        ${infoBox(`
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 6px 0;">
                <span style="color: #717182; font-size: 13px;">📅 Datum</span>
                <span style="float: right; color: #12130F; font-size: 14px; font-weight: 600;">{{event_date}}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0;">
                <span style="color: #717182; font-size: 13px;">📍 Locatie</span>
                <span style="float: right; color: #12130F; font-size: 14px; font-weight: 600;">{{event_place}}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0;">
                <span style="color: #717182; font-size: 13px;">📦 Pakket</span>
                <span style="float: right; color: #12130F; font-size: 14px; font-weight: 600;">{{pack_name}}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; border-top: 1px solid #e9ecef; margin-top: 8px;">
                <span style="color: #717182; font-size: 13px;">💰 Totaal</span>
                <span style="float: right; color: #C1950E; font-size: 15px; font-weight: 700;">{{total_amount}}</span>
              </td>
            </tr>
          </table>
        `, 'light')}

        <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.7;">
          Om af te ronden kunt u:
        </p>
        <ul style="margin: 0 0 24px 20px; padding: 0; color: #333; font-size: 15px; line-height: 1.8;">
          <li>Direct op deze email antwoorden (wij regelen de rest)</li>
          <li>Of terugkeren naar <a href="https://mirroreffect.co" style="color: #C1950E; text-decoration: none; font-weight: 600;">mirroreffect.co</a></li>
        </ul>

        <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.7;">
          Tot snel ✨
        </p>
      `
    }
  },

  // =============================================================================
  // J+1 GOOGLE REVIEW REQUEST
  // =============================================================================
  B2C_AVIS_GOOGLE: {
    fr: {
      subject: "✨ Merci ! Votre avis compte pour nous",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">⭐</span>
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
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
            ${vipBadge('Bonus VIP')}
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
      subject: "✨ Bedankt! Uw mening telt voor ons",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">⭐</span>
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
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
            ${vipBadge('VIP Bonus')}
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
      subject: "⭐ Un petit mot pour nous ?",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">💬</span>
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
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
      subject: "⭐ Een woordje voor ons?",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">💬</span>
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
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
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
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
            ${vipBadge('Client VIP')}
            <p style="margin: 16px 0 8px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 600; color: #12130F;">
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
          Amicalement ✨
        </p>
      `
    },
    nl: {
      subject: "🎂 Al 3 maanden! Een VIP-aanbieding voor u",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">🎂</span>
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
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
            ${vipBadge('VIP Klant')}
            <p style="margin: 16px 0 8px; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 600; color: #12130F;">
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
          Met vriendelijke groet ✨
        </p>
      `
    }
  },

  // =============================================================================
  // M+9 ANNIVERSARY OFFER
  // =============================================================================
  B2C_OFFRE_ANNIVERSAIRE: {
    fr: {
      subject: "🎉 Un an déjà ! -10% pour fêter ça",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">🎊</span>
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
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
            <p style="margin: 0 0 8px; color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Code promo</p>
            <p style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 700; color: #C1950E; letter-spacing: 0.1em;">
              ANNIV10
            </p>
          </div>
        `, 'dark')}

        <div style="text-align: center;">
          ${ctaButton("Réserver maintenant", "https://mirroreffect.co/reserver")}
        </div>

        <p style="margin: 0; color: #717182; font-size: 13px; text-align: center;">
          Offre valable 30 jours.
        </p>
      `
    },
    nl: {
      subject: "🎉 Al een jaar! -10% om dit te vieren",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">🎊</span>
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
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
            <p style="margin: 0 0 8px; color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Promotiecode</p>
            <p style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 700; color: #C1950E; letter-spacing: 0.1em;">
              ANNIV10
            </p>
          </div>
        `, 'dark')}

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
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
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
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
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
  // NURTURING: 48H REMINDER (abandoned cart - legacy)
  // =============================================================================
  B2C_PROMO_48H: {
    fr: {
      subject: "⏰ Votre photobooth vous attend encore...",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">⏰</span>
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
            Votre réservation n'est pas terminée
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Bonjour,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          Vous avez commencé à réserver votre photobooth miroir pour le <strong>{{event_date}}</strong>, mais vous n'avez pas finalisé votre paiement.
        </p>

        ${infoBox(`
          <div style="text-align: center;">
            <p style="margin: 0; font-size: 18px; color: #12130F; font-weight: 600;">
              Cette date est encore disponible !
            </p>
            <p style="margin: 8px 0 0; color: #717182; font-size: 14px;">
              Ne la laissez pas s'envoler ✨
            </p>
          </div>
        `, 'gold')}

        <div style="text-align: center;">
          ${ctaButton("Finaliser ma réservation", "https://mirroreffect.co/reserver")}
        </div>

        <p style="margin: 0; color: #717182; font-size: 13px; text-align: center;">
          Des questions ? Répondez simplement à cet email.
        </p>
      `
    },
    nl: {
      subject: "⏰ Uw photobooth wacht nog steeds op u...",
      body: `
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="display: inline-block; font-size: 48px; margin-bottom: 16px;">⏰</span>
          <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #12130F;">
            Uw reservering is niet voltooid
          </h2>
        </div>

        <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
          Hallo,
        </p>

        <p style="margin: 0 0 24px; color: #333; font-size: 15px; line-height: 1.7;">
          U bent begonnen met het reserveren van uw spiegel photobooth voor <strong>{{event_date}}</strong>, maar u heeft uw betaling niet afgerond.
        </p>

        ${infoBox(`
          <div style="text-align: center;">
            <p style="margin: 0; font-size: 18px; color: #12130F; font-weight: 600;">
              Deze datum is nog beschikbaar!
            </p>
            <p style="margin: 8px 0 0; color: #717182; font-size: 14px;">
              Laat hem niet ontsnappen ✨
            </p>
          </div>
        `, 'gold')}

        <div style="text-align: center;">
          ${ctaButton("Reservering afronden", "https://mirroreffect.co/reserveren")}
        </div>

        <p style="margin: 0; color: #717182; font-size: 13px; text-align: center;">
          Vragen? Beantwoord gewoon deze email.
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

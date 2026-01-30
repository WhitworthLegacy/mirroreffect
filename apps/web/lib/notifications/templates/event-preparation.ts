/**
 * Email template: Event preparation (J-7)
 * Sent every Friday for events happening the following weekend
 */

interface EventPreparationData {
  client_name: string;
  event_date: string;
  current_address: string;
  guest_count: number;
  pack_name: string;
  pack_code: "DISCOVERY" | "ESSENTIAL" | "PREMIUM";
  included_prints: string;
  balance_due: number;
  recommended_prints: number;
  deadline_date: string;
  upgrade_price?: number;
}

// Clean email wrapper — designed for Gmail Primary tab
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="fr">
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
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

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

function generateUpsellSection(data: EventPreparationData): string {
  const { pack_code, guest_count, upgrade_price } = data;

  if (pack_code === "DISCOVERY") {
    return infoBox(`
      <p style="margin: 0 0 12px; color: #666; font-size: 14px; line-height: 1.6;">
        <strong style="color: #12130F;">Notre conseil :</strong>
      </p>
      <p style="margin: 0 0 12px; color: #333; font-size: 14px; line-height: 1.6;">
        Avec ${guest_count} invités, nous recommandons la formule Essentiel (impressions illimitées 3h) pour ${upgrade_price}€ supplémentaires. Cela garantit que tous vos invités repartent avec leurs photos.
      </p>
      <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">
        Si cela vous intéresse, répondez simplement "OUI ESSENTIEL" à cet email.
      </p>
    `, 'gold');
  }

  if (pack_code === "ESSENTIAL") {
    return infoBox(`
      <p style="margin: 0 0 12px; color: #666; font-size: 14px; line-height: 1.6;">
        <strong style="color: #12130F;">Suggestion :</strong>
      </p>
      <p style="margin: 0 0 12px; color: #333; font-size: 14px; line-height: 1.6;">
        Pour un événement avec ${guest_count} invités, la formule Premium (impressions illimitées 5h + livre d'or) peut être intéressante pour ${upgrade_price}€ supplémentaires.
      </p>
      <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">
        Si cela vous intéresse, répondez simplement "OUI PREMIUM" à cet email.
      </p>
    `, 'gold');
  }

  if (pack_code === "PREMIUM") {
    return infoBox(`
      <p style="margin: 0 0 12px; color: #666; font-size: 14px; line-height: 1.6;">
        <strong style="color: #12130F;">Option disponible :</strong>
      </p>
      <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">
        Si vous souhaitez un volume d'impressions très important, nous proposons un pack supplémentaire de 400 impressions pour 50€. Répondez "OUI +400" si cela vous intéresse.
      </p>
    `, 'gold');
  }

  return "";
}

export function renderEventPreparation(data: EventPreparationData): { subject: string; html: string } {
  const upsellSection = generateUpsellSection(data);

  const subject = `Préparation de votre événement - ${data.event_date}`;

  const content = `
    <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
      Bonjour ${data.client_name},
    </p>

    <p style="margin: 0 0 20px; color: #333; font-size: 15px; line-height: 1.7;">
      Votre événement du <strong>${data.event_date}</strong> approche. Pour garantir le bon déroulement, nous avons besoin de confirmer quelques informations.
    </p>

    <h2 style="margin: 32px 0 16px; color: #12130F; font-size: 18px; font-weight: 600;">
      Récapitulatif de votre réservation
    </h2>

    ${infoBox(`
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
            <span style="color: #666; font-size: 13px;">Formule</span><br>
            <strong style="color: #12130F; font-size: 15px;">${data.pack_name}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
            <span style="color: #666; font-size: 13px;">Nombre d'invités</span><br>
            <strong style="color: #12130F; font-size: 15px;">${data.guest_count} personnes</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">
            <span style="color: #666; font-size: 13px;">Impressions incluses</span><br>
            <strong style="color: #12130F; font-size: 15px;">${data.included_prints}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #666; font-size: 13px;">Solde restant</span><br>
            <strong style="color: #C1950E; font-size: 16px;">${data.balance_due}€</strong>
            <span style="color: #999; font-size: 13px;">(à régler le jour J)</span>
          </td>
        </tr>
      </table>
    `)}

    <h2 style="margin: 32px 0 16px; color: #12130F; font-size: 18px; font-weight: 600;">
      Recommandation impressions
    </h2>

    <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.7;">
      Nous recommandons 3 à 4 impressions par invité. Pour ${data.guest_count} invités, cela représente environ <strong>${data.recommended_prints} impressions</strong>.
    </p>

    ${upsellSection}

    <h2 style="margin: 32px 0 16px; color: #12130F; font-size: 18px; font-weight: 600;">
      Confirmation d'adresse
    </h2>

    ${infoBox(`
      <p style="margin: 0 0 8px; color: #666; font-size: 13px;">Adresse actuelle :</p>
      <p style="margin: 0; color: #12130F; font-size: 15px; font-weight: 500;">${data.current_address}</p>
    `)}

    <p style="margin: 16px 0 12px; color: #333; font-size: 15px; line-height: 1.7;">
      Merci de nous confirmer ou compléter :
    </p>

    <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #333; font-size: 14px; line-height: 1.8;">
      <li>Adresse complète avec numéro</li>
      <li>Code d'accès / interphone si nécessaire</li>
      <li>Instructions de parking</li>
      <li>Nom du contact sur place le jour J</li>
      <li>Numéro de téléphone du contact</li>
    </ul>

    <h2 style="margin: 32px 0 16px; color: #12130F; font-size: 18px; font-weight: 600;">
      Personnalisation du cadre photo
    </h2>

    <p style="margin: 0 0 16px; color: #333; font-size: 15px; line-height: 1.7;">
      Pour créer un cadre photo adapté à votre décoration, merci de nous indiquer :
    </p>

    ${infoBox(`
      <p style="margin: 0 0 12px; color: #12130F; font-size: 14px; font-weight: 600;">Thème / ambiance :</p>
      <p style="margin: 0 0 16px; color: #666; font-size: 14px; line-height: 1.6;">
        Champêtre & romantique / Chic & élégant / Moderne & minimaliste / Glamour & paillettes / Bohème & naturel / Autre
      </p>

      <p style="margin: 0 0 12px; color: #12130F; font-size: 14px; font-weight: 600;">Couleurs principales :</p>
      <p style="margin: 0 0 16px; color: #999; font-size: 13px; font-style: italic;">
        (Ex: blanc cassé, rose poudré, eucalyptus, or...)
      </p>

      <p style="margin: 0 0 12px; color: #12130F; font-size: 14px; font-weight: 600;">Style recherché :</p>
      <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
        Romantique & doux / Épuré & minimaliste / Festif & coloré / Classique & intemporel
      </p>
    `)}

    <p style="margin: 16px 0; color: #666; font-size: 14px; line-height: 1.6;">
      Si vous avez des photos de référence (Pinterest, Instagram, décorateur), n'hésitez pas à nous les envoyer.
    </p>

    <h2 style="margin: 32px 0 16px; color: #12130F; font-size: 18px; font-weight: 600;">
      Informations pratiques
    </h2>

    <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #333; font-size: 14px; line-height: 1.8;">
      <li>Horaires : Arrivée souhaitée du photobooth à __h__</li>
      <li>Demandes spéciales : Y a-t-il quelque chose de particulier à prévoir ?</li>
    </ul>

    <p style="margin: 24px 0 0; color: #666; font-size: 14px; line-height: 1.6;">
      Merci de nous répondre dès que possible, idéalement avant le <strong>${data.deadline_date}</strong>.
    </p>
  `;

  const html = emailWrapper(content);

  return { subject, html };
}

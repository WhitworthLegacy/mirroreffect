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

function generateUpsellSection(data: EventPreparationData): string {
  const { pack_code, guest_count, upgrade_price } = data;

  if (pack_code === "DISCOVERY") {
    return `
      <div style="background: #12130F; padding: 24px; border-radius: 8px; margin: 24px 0; border: 2px solid #C1950E;">
        <h3 style="margin-top: 0; color: #C1950E; font-size: 18px;">💡 Notre conseil</h3>
        <p style="margin: 16px 0; color: #fff;">Avec ${guest_count} invités, vous risquez de manquer d'impressions avec la formule Découverte.</p>

        <div style="background: rgba(193, 149, 14, 0.1); padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #C1950E;">
          <p style="font-size: 18px; font-weight: 600; margin: 0 0 12px 0; color: #C1950E;">✨ Passez à la formule Essentiel pour seulement ${upgrade_price}€ de plus :</p>
          <ul style="margin: 12px 0; padding-left: 20px; color: #fff;">
            <li style="margin: 8px 0;">✅ Impressions <strong>illimitées</strong> pendant 3 heures</li>
            <li style="margin: 8px 0;">✅ Plus de stress sur la quantité</li>
            <li style="margin: 8px 0;">✅ Tous vos invités repartent avec leurs photos</li>
          </ul>
        </div>

        <p style="margin: 16px 0 0 0; color: #fff;">👉 <strong style="color: #C1950E;">Répondez "OUI ESSENTIEL"</strong> pour upgrader votre réservation.</p>
      </div>
    `;
  }

  if (pack_code === "ESSENTIAL") {
    return `
      <div style="background: #12130F; padding: 24px; border-radius: 8px; margin: 24px 0; border: 2px solid #C1950E;">
        <h3 style="margin-top: 0; color: #C1950E; font-size: 18px;">💡 Pour encore plus de magie</h3>
        <p style="margin: 16px 0; color: #fff;">La formule Essentiel est parfaite, mais avec ${guest_count} invités, certains pourraient vouloir plusieurs photos !</p>

        <div style="background: rgba(193, 149, 14, 0.1); padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #C1950E;">
          <p style="font-size: 18px; font-weight: 600; margin: 0 0 12px 0; color: #C1950E;">✨ Passez à la formule Premium pour seulement ${upgrade_price}€ de plus :</p>
          <ul style="margin: 12px 0; padding-left: 20px; color: #fff;">
            <li style="margin: 8px 0;">✅ Impressions <strong>illimitées</strong> toute la soirée (5h)</li>
            <li style="margin: 8px 0;">✅ Livre d'or photo premium</li>
            <li style="margin: 8px 0;">✅ Galerie privée étendue</li>
          </ul>
        </div>

        <p style="margin: 16px 0 0 0; color: #fff;">👉 <strong style="color: #C1950E;">Répondez "OUI PREMIUM"</strong> pour upgrader votre réservation.</p>
      </div>
    `;
  }

  if (pack_code === "PREMIUM") {
    return `
      <div style="background: #12130F; padding: 24px; border-radius: 8px; margin: 24px 0; border: 2px solid #C1950E;">
        <h3 style="margin-top: 0; color: #C1950E; font-size: 18px;">✨ Option impression XL</h3>
        <p style="margin: 16px 0; color: #fff;">Vous avez déjà la formule Premium avec impressions illimitées 5h !</p>

        <div style="background: rgba(193, 149, 14, 0.1); padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #C1950E;">
          <p style="margin: 0 0 12px 0; color: #fff;">Si vous souhaitez prolonger au-delà ou prévoir un volume très important, nous proposons un <strong style="color: #C1950E;">pack supplémentaire de 400 impressions pour 50€</strong>.</p>
        </div>

        <p style="margin: 16px 0 0 0; color: #fff;">👉 <strong style="color: #C1950E;">Répondez "OUI +400"</strong> pour l'ajouter à votre réservation.</p>
      </div>
    `;
  }

  return "";
}

export function renderEventPreparation(data: EventPreparationData): { subject: string; html: string } {
  const upsellSection = generateUpsellSection(data);

  const subject = `🎉 Votre événement approche - Derniers détails pour votre photobooth miroir`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Préparation de votre événement</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f7fafc; color: #2d3748; line-height: 1.6;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 32px; background-color: #12130F; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 0.15em; color: #C1950E;">MIRROR EFFECT</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 400; letter-spacing: 0.2em; text-transform: uppercase;">Photobooth Miroir Premium</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">

              <p style="font-size: 16px; margin: 0 0 24px 0; color: #2d3748;">Bonjour <strong>${data.client_name}</strong>,</p>

              <p style="margin: 0 0 16px 0; color: #2d3748;">Votre événement du <strong>${data.event_date}</strong> approche à grands pas ! 🎊</p>

              <p style="margin: 0 0 32px 0; color: #2d3748;">Nous sommes ravis de faire partie de cette journée spéciale. Pour que tout soit parfait le jour J, nous avons besoin de quelques informations complémentaires.</p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

              <!-- Recap Section -->
              <h2 style="color: #C1950E; font-size: 22px; margin: 32px 0 16px 0;">📋 Récapitulatif de votre réservation</h2>

              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #C1950E;">
                <p style="margin: 0 0 12px 0; color: #2d3748;"><strong>Formule choisie :</strong> ${data.pack_name}</p>
                <p style="margin: 0 0 12px 0; color: #2d3748;"><strong>Nombre d'invités :</strong> ${data.guest_count} personnes</p>
                <p style="margin: 0 0 12px 0; color: #2d3748;"><strong>Impressions incluses :</strong> ${data.included_prints}</p>
                <p style="margin: 12px 0 0 0; font-size: 18px; color: #C1950E;"><strong>💰 Solde restant :</strong> ${data.balance_due}€ <span style="color: #718096; font-size: 14px;">(à régler le jour de l'événement)</span></p>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

              <!-- Prints Recommendation -->
              <h2 style="color: #C1950E; font-size: 22px; margin: 32px 0 16px 0;">📸 Avez-vous prévu assez d'impressions ?</h2>

              <p style="margin: 0 0 16px 0; color: #2d3748;">Nous recommandons généralement <strong>3 à 4 impressions par invité</strong> pour que chacun reparte avec ses souvenirs.</p>

              <p style="margin: 0 0 24px 0; color: #2d3748;">Pour <strong>${data.guest_count} invités</strong>, cela représente environ <strong>${data.recommended_prints} impressions</strong>.</p>

              ${upsellSection}

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

              <!-- Address Confirmation -->
              <h2 style="color: #C1950E; font-size: 22px; margin: 32px 0 16px 0;">📍 Confirmation d'adresse</h2>

              <p style="margin: 0 0 16px 0; color: #2d3748;">Pourriez-vous nous confirmer l'adresse exacte de votre événement ?</p>

              <div style="background: #fef5e7; border-left: 4px solid #C1950E; padding: 16px; margin: 16px 0;">
                <p style="margin: 0; font-weight: 600; color: #2d3748;">Adresse actuelle :</p>
                <p style="margin: 8px 0 0 0; color: #2d3748;">${data.current_address}</p>
              </div>

              <p style="margin: 16px 0; color: #2d3748;">Si cette adresse n'est pas complète, merci de nous préciser :</p>
              <ul style="margin: 8px 0 16px 0; padding-left: 24px; color: #2d3748;">
                <li style="margin: 6px 0;">Adresse complète avec numéro</li>
                <li style="margin: 6px 0;">Code d'accès / interphone si nécessaire</li>
                <li style="margin: 6px 0;">Instructions de parking</li>
                <li style="margin: 6px 0;">Nom du contact sur place le jour J</li>
                <li style="margin: 6px 0;">Numéro de téléphone du contact</li>
              </ul>

              <p style="margin: 16px 0; color: #2d3748;">👉 <strong style="color: #C1950E;">Répondez simplement à cet email</strong> avec ces informations.</p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

              <!-- Decoration Details -->
              <h2 style="color: #C1950E; font-size: 22px; margin: 32px 0 16px 0;">🎨 Personnalisation de votre cadre photo</h2>

              <p style="margin: 0 0 16px 0; color: #2d3748;">Pour créer un cadre photo qui s'harmonise parfaitement avec votre décoration, nous aimerions connaître :</p>

              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #C1950E;">
                <p style="margin: 0 0 12px 0; font-weight: 600; color: #2d3748;">Votre thème / ambiance :</p>
                <p style="margin: 8px 0; color: #2d3748;">☐ Champêtre & romantique<br>
                ☐ Chic & élégant<br>
                ☐ Moderne & minimaliste<br>
                ☐ Glamour & paillettes<br>
                ☐ Bohème & naturel<br>
                ☐ Autre : __________</p>

                <p style="margin: 16px 0 12px 0; font-weight: 600; color: #2d3748;">Vos couleurs principales :</p>
                <p style="margin: 8px 0; color: #718096; font-size: 14px;">(Ex: blanc cassé, rose poudré, eucalyptus, or...)</p>

                <p style="margin: 16px 0 12px 0; font-weight: 600; color: #2d3748;">Style recherché :</p>
                <p style="margin: 8px 0; color: #2d3748;">☐ Romantique & doux<br>
                ☐ Épuré & minimaliste<br>
                ☐ Festif & coloré<br>
                ☐ Classique & intemporel</p>

                <p style="margin: 16px 0 12px 0; font-weight: 600; color: #2d3748;">Photos de votre décoration <span style="font-weight: normal; color: #718096;">(optionnel)</span> :</p>
                <p style="margin: 8px 0; font-size: 14px; color: #2d3748;">Si vous avez des photos de référence (Pinterest, Instagram, ou photos de votre décorateur), n'hésitez pas à nous les envoyer ! Cela nous aidera à créer un cadre 100% personnalisé.</p>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

              <!-- Practical Info -->
              <h2 style="color: #C1950E; font-size: 22px; margin: 32px 0 16px 0;">ℹ️ Informations pratiques</h2>

              <ul style="margin: 0 0 16px 0; padding-left: 24px; color: #2d3748;">
                <li style="margin: 8px 0;"><strong>Horaires :</strong> Arrivée souhaitée du photobooth à __h__</li>
                <li style="margin: 8px 0;"><strong>Demandes spéciales :</strong> Y a-t-il quelque chose de particulier à prévoir ?</li>
              </ul>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

              <!-- Contact -->
              <div style="background: #f7fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 32px 0; border: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 16px 0; color: #C1950E;">📞 Besoin d'aide ?</h3>
                <p style="margin: 8px 0; color: #2d3748;">Notre équipe est disponible pour répondre à toutes vos questions :</p>
                <p style="margin: 16px 0 0 0; color: #2d3748;">
                  <strong>📧 Email :</strong> <a href="mailto:admin@mirroreffect.co" style="color: #C1950E; text-decoration: none;">admin@mirroreffect.co</a>
                </p>
              </div>

              <p style="text-align: center; margin: 32px 0 16px 0; font-size: 18px; color: #2d3748;">Nous avons hâte de créer des souvenirs mémorables avec vous ! 📸✨</p>

              <p style="text-align: center; margin: 32px 0 0 0; font-size: 14px; color: #718096;"><em>P.S. : Répondez-nous dès que possible, idéalement avant le ${data.deadline_date}.</em></p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

              <!-- Signature -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <img src="https://mirroreffect.co/images/logo-icon-gold.png" alt="M" width="44" height="44" style="display: block; margin: 0 auto 16px;" />
                    <p style="margin: 0; font-weight: 600; font-size: 14px; color: #12130F;">Jonathan Whitworth</p>
                    <p style="margin: 2px 0 0; font-size: 13px; color: #666;">Mirror Effect</p>
                    <p style="margin: 2px 0 0; font-size: 13px; color: #666;">+32 460 24 24 30</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #12130F; padding: 24px; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.7); font-size: 14px;">Mirror Effect - Photobooth Miroir Premium</p>
              <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 13px;">Bruxelles, Wallonie, Flandre</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

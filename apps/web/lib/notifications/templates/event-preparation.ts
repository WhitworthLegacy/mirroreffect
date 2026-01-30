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
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px; margin: 24px 0; color: white;">
        <h3 style="margin-top: 0; color: white;">💡 Notre conseil</h3>
        <p style="margin: 16px 0;">Avec ${guest_count} invités, vous risquez de manquer d'impressions avec la formule Découverte.</p>

        <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px; margin: 16px 0;">
          <p style="font-size: 18px; font-weight: 600; margin: 0 0 12px 0; color: white;">✨ Passez à la formule Essentiel pour seulement ${upgrade_price}€ de plus :</p>
          <ul style="margin: 12px 0; padding-left: 20px;">
            <li style="margin: 8px 0;">✅ Impressions <strong>illimitées</strong> pendant 3 heures</li>
            <li style="margin: 8px 0;">✅ Plus de stress sur la quantité</li>
            <li style="margin: 8px 0;">✅ Tous vos invités repartent avec leurs photos</li>
          </ul>
        </div>

        <p style="margin: 16px 0 0 0;">👉 <strong>Répondez "OUI ESSENTIEL"</strong> pour upgrader votre réservation.</p>
      </div>
    `;
  }

  if (pack_code === "ESSENTIAL") {
    return `
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 24px; border-radius: 12px; margin: 24px 0; color: white;">
        <h3 style="margin-top: 0; color: white;">💡 Pour encore plus de magie</h3>
        <p style="margin: 16px 0;">La formule Essentiel est parfaite, mais avec ${guest_count} invités, certains pourraient vouloir plusieurs photos !</p>

        <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 8px; margin: 16px 0;">
          <p style="font-size: 18px; font-weight: 600; margin: 0 0 12px 0; color: white;">✨ Passez à la formule Premium pour seulement ${upgrade_price}€ de plus :</p>
          <ul style="margin: 12px 0; padding-left: 20px;">
            <li style="margin: 8px 0;">✅ Impressions <strong>illimitées</strong> toute la soirée (5h)</li>
            <li style="margin: 8px 0;">✅ Livre d'or photo premium</li>
            <li style="margin: 8px 0;">✅ Galerie privée étendue</li>
          </ul>
        </div>

        <p style="margin: 16px 0 0 0;">👉 <strong>Répondez "OUI PREMIUM"</strong> pour upgrader votre réservation.</p>
      </div>
    `;
  }

  if (pack_code === "PREMIUM") {
    return `
      <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 24px; border-radius: 12px; margin: 24px 0; color: #2d3748;">
        <h3 style="margin-top: 0; color: #2d3748;">✨ Option impression XL</h3>
        <p style="margin: 16px 0;">Vous avez déjà la formule Premium avec impressions illimitées 5h !</p>

        <div style="background: rgba(255,255,255,0.5); padding: 20px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 12px 0;">Si vous souhaitez prolonger au-delà ou prévoir un volume très important, nous proposons un <strong>pack supplémentaire de 400 impressions pour 50€</strong>.</p>
        </div>

        <p style="margin: 16px 0 0 0;">👉 <strong>Répondez "OUI +400"</strong> pour l'ajouter à votre réservation.</p>
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
  <div style="max-width: 600px; margin: 0 auto; background-color: white;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">Mirror Effect</h1>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Photobooth Miroir Premium</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">

      <p style="font-size: 16px; margin: 0 0 24px 0;">Bonjour <strong>${data.client_name}</strong>,</p>

      <p style="margin: 0 0 16px 0;">Votre événement du <strong>${data.event_date}</strong> approche à grands pas ! 🎊</p>

      <p style="margin: 0 0 32px 0;">Nous sommes ravis de faire partie de cette journée spéciale. Pour que tout soit parfait le jour J, nous avons besoin de quelques informations complémentaires.</p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

      <!-- Recap Section -->
      <h2 style="color: #2d3748; font-size: 22px; margin: 32px 0 16px 0;">📋 Récapitulatif de votre réservation</h2>

      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 12px 0;"><strong>Formule choisie :</strong> ${data.pack_name}</p>
        <p style="margin: 0 0 12px 0;"><strong>Nombre d'invités :</strong> ${data.guest_count} personnes</p>
        <p style="margin: 0 0 12px 0;"><strong>Impressions incluses :</strong> ${data.included_prints}</p>
        <p style="margin: 12px 0 0 0; font-size: 18px; color: #667eea;"><strong>💰 Solde restant :</strong> ${data.balance_due}€ <span style="color: #718096; font-size: 14px;">(à régler le jour de l'événement)</span></p>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

      <!-- Prints Recommendation -->
      <h2 style="color: #2d3748; font-size: 22px; margin: 32px 0 16px 0;">📸 Avez-vous prévu assez d'impressions ?</h2>

      <p style="margin: 0 0 16px 0;">Nous recommandons généralement <strong>3 à 4 impressions par invité</strong> pour que chacun reparte avec ses souvenirs.</p>

      <p style="margin: 0 0 24px 0;">Pour <strong>${data.guest_count} invités</strong>, cela représente environ <strong>${data.recommended_prints} impressions</strong>.</p>

      ${upsellSection}

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

      <!-- Address Confirmation -->
      <h2 style="color: #2d3748; font-size: 22px; margin: 32px 0 16px 0;">📍 Confirmation d'adresse</h2>

      <p style="margin: 0 0 16px 0;">Pourriez-vous nous confirmer l'adresse exacte de votre événement ?</p>

      <div style="background: #fef5e7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; font-weight: 600;">Adresse actuelle :</p>
        <p style="margin: 8px 0 0 0;">${data.current_address}</p>
      </div>

      <p style="margin: 16px 0;">Si cette adresse n'est pas complète, merci de nous préciser :</p>
      <ul style="margin: 8px 0 16px 0; padding-left: 24px;">
        <li style="margin: 6px 0;">Adresse complète avec numéro</li>
        <li style="margin: 6px 0;">Code d'accès / interphone si nécessaire</li>
        <li style="margin: 6px 0;">Instructions de parking</li>
        <li style="margin: 6px 0;">Nom du contact sur place le jour J</li>
        <li style="margin: 6px 0;">Numéro de téléphone du contact</li>
      </ul>

      <p style="margin: 16px 0;">👉 <strong>Répondez simplement à cet email</strong> avec ces informations.</p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

      <!-- Decoration Details -->
      <h2 style="color: #2d3748; font-size: 22px; margin: 32px 0 16px 0;">🎨 Personnalisation de votre cadre photo</h2>

      <p style="margin: 0 0 16px 0;">Pour créer un cadre photo qui s'harmonise parfaitement avec votre décoration, nous aimerions connaître :</p>

      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 12px 0; font-weight: 600;">Votre thème / ambiance :</p>
        <p style="margin: 8px 0;">☐ Champêtre & romantique<br>
        ☐ Chic & élégant<br>
        ☐ Moderne & minimaliste<br>
        ☐ Glamour & paillettes<br>
        ☐ Bohème & naturel<br>
        ☐ Autre : __________</p>

        <p style="margin: 16px 0 12px 0; font-weight: 600;">Vos couleurs principales :</p>
        <p style="margin: 8px 0; color: #718096; font-size: 14px;">(Ex: blanc cassé, rose poudré, eucalyptus, or...)</p>

        <p style="margin: 16px 0 12px 0; font-weight: 600;">Style recherché :</p>
        <p style="margin: 8px 0;">☐ Romantique & doux<br>
        ☐ Épuré & minimaliste<br>
        ☐ Festif & coloré<br>
        ☐ Classique & intemporel</p>

        <p style="margin: 16px 0 12px 0; font-weight: 600;">Photos de votre décoration <span style="font-weight: normal; color: #718096;">(optionnel)</span> :</p>
        <p style="margin: 8px 0; font-size: 14px;">Si vous avez des photos de référence (Pinterest, Instagram, ou photos de votre décorateur), n'hésitez pas à nous les envoyer ! Cela nous aidera à créer un cadre 100% personnalisé.</p>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

      <!-- Practical Info -->
      <h2 style="color: #2d3748; font-size: 22px; margin: 32px 0 16px 0;">ℹ️ Informations pratiques</h2>

      <ul style="margin: 0 0 16px 0; padding-left: 24px;">
        <li style="margin: 8px 0;"><strong>Horaires :</strong> Arrivée souhaitée du photobooth à __h__</li>
        <li style="margin: 8px 0;"><strong>Demandes spéciales :</strong> Y a-t-il quelque chose de particulier à prévoir ?</li>
      </ul>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

      <!-- Contact -->
      <div style="background: #edf2f7; padding: 20px; border-radius: 8px; text-align: center; margin: 32px 0;">
        <h3 style="margin: 0 0 16px 0; color: #2d3748;">📞 Besoin d'aide ?</h3>
        <p style="margin: 8px 0;">Notre équipe est disponible pour répondre à toutes vos questions :</p>
        <p style="margin: 16px 0 0 0;">
          <strong>📧 Email :</strong> <a href="mailto:admin@mirroreffect.co" style="color: #667eea; text-decoration: none;">admin@mirroreffect.co</a>
        </p>
      </div>

      <p style="text-align: center; margin: 32px 0 16px 0; font-size: 18px;">Nous avons hâte de créer des souvenirs mémorables avec vous ! 📸✨</p>

      <p style="text-align: center; margin: 16px 0;">À très bientôt,<br><strong>L'équipe Mirror Effect</strong></p>

      <p style="text-align: center; margin: 32px 0 0 0; font-size: 14px; color: #718096;"><em>P.S. : Répondez-nous dès que possible, idéalement avant le ${data.deadline_date}.</em></p>

    </div>

    <!-- Footer -->
    <div style="background: #2d3748; padding: 24px; text-align: center; color: rgba(255,255,255,0.8); font-size: 14px;">
      <p style="margin: 0 0 8px 0;">Mirror Effect - Photobooth Miroir Premium</p>
      <p style="margin: 0;">Bruxelles, Wallonie, Flandre</p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

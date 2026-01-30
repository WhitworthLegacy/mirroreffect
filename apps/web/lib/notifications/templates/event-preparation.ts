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
      <p><strong>Notre conseil :</strong></p>
      <p>Avec ${guest_count} invités, nous recommandons la formule Essentiel (impressions illimitées 3h) pour ${upgrade_price}€ supplémentaires. Cela garantit que tous vos invités repartent avec leurs photos.</p>
      <p>Si cela vous intéresse, répondez simplement "OUI ESSENTIEL" à cet email.</p>
    `;
  }

  if (pack_code === "ESSENTIAL") {
    return `
      <p><strong>Suggestion :</strong></p>
      <p>Pour un événement avec ${guest_count} invités, la formule Premium (impressions illimitées 5h + livre d'or) peut être intéressante pour ${upgrade_price}€ supplémentaires.</p>
      <p>Si cela vous intéresse, répondez simplement "OUI PREMIUM" à cet email.</p>
    `;
  }

  if (pack_code === "PREMIUM") {
    return `
      <p><strong>Option disponible :</strong></p>
      <p>Si vous souhaitez un volume d'impressions très important, nous proposons un pack supplémentaire de 400 impressions pour 50€.</p>
      <p>Si cela vous intéresse, répondez simplement "OUI +400" à cet email.</p>
    `;
  }

  return "";
}

export function renderEventPreparation(data: EventPreparationData): { subject: string; html: string } {
  const upsellSection = generateUpsellSection(data);

  const subject = `Préparation de votre événement - ${data.event_date}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">

    <p>Bonjour ${data.client_name},</p>

    <p>Votre événement du <strong>${data.event_date}</strong> approche. Pour garantir le bon déroulement de votre location de photobooth miroir, nous avons besoin de confirmer quelques informations.</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <p><strong>RECAPITULATIF DE VOTRE RESERVATION</strong></p>

    <p>
      Formule : ${data.pack_name}<br>
      Nombre d'invités : ${data.guest_count} personnes<br>
      Impressions incluses : ${data.included_prints}<br>
      Solde restant : ${data.balance_due}€ (à régler le jour de l'événement)
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <p><strong>RECOMMANDATION IMPRESSIONS</strong></p>

    <p>Nous recommandons 3 à 4 impressions par invité. Pour ${data.guest_count} invités, cela représente environ ${data.recommended_prints} impressions.</p>

    ${upsellSection}

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <p><strong>CONFIRMATION D'ADRESSE</strong></p>

    <p>Adresse actuelle : ${data.current_address}</p>

    <p>Merci de nous confirmer ou compléter les informations suivantes :</p>
    <ul>
      <li>Adresse complète avec numéro</li>
      <li>Code d'accès / interphone si nécessaire</li>
      <li>Instructions de parking</li>
      <li>Nom du contact sur place le jour J</li>
      <li>Numéro de téléphone du contact</li>
    </ul>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <p><strong>PERSONNALISATION DU CADRE PHOTO</strong></p>

    <p>Pour créer un cadre photo adapté à votre décoration, merci de nous indiquer :</p>

    <p><strong>Thème / ambiance :</strong><br>
    Champêtre & romantique / Chic & élégant / Moderne & minimaliste / Glamour & paillettes / Bohème & naturel / Autre</p>

    <p><strong>Couleurs principales :</strong><br>
    (Ex: blanc cassé, rose poudré, eucalyptus, or...)</p>

    <p><strong>Style recherché :</strong><br>
    Romantique & doux / Épuré & minimaliste / Festif & coloré / Classique & intemporel</p>

    <p>Si vous avez des photos de référence (Pinterest, Instagram, décorateur), n'hésitez pas à nous les envoyer.</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <p><strong>INFORMATIONS PRATIQUES</strong></p>

    <ul>
      <li>Horaires : Arrivée souhaitée du photobooth à __h__</li>
      <li>Demandes spéciales : Y a-t-il quelque chose de particulier à prévoir ?</li>
    </ul>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

    <p>Merci de nous répondre dès que possible, idéalement avant le ${data.deadline_date}.</p>

    <p>Pour toute question : admin@mirroreffect.co</p>

    <p>Cordialement,<br>
    Jonathan Whitworth<br>
    Mirror Effect<br>
    +32 460 24 24 30</p>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

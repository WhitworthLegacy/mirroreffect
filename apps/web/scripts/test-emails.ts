import { Resend } from "resend";
import { renderTemplate } from "../lib/notifications/renderTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);

const TEST_EMAIL = "ajsrl.amz@gmail.com";
const FROM_EMAIL = "Mirror Effect <hello@mirroreffect.co>";

const testPayloads: Record<string, Record<string, string | number>> = {
  B2C_BOOKING_CONFIRMED: {
    client_name: "Jean Dupont",
    event_date: "15 février 2026",
    address: "Château de Modave, 4577 Modave",
    pack_code: "PREMIUM 4H",
    deposit: 200,
    balance: 450,
  },
  B2C_PROMO_72H: {
    client_name: "Marie Martin",
    event_date: "22 mars 2026",
    event_place: "Bruxelles",
    pack_name: "ESSENTIEL 3H",
    total_amount: "549 €",
  },
  B2C_AVIS_GOOGLE: {
    client_name: "Sophie Laurent",
    review_link: "https://g.page/r/mirroreffect/review",
    vip_reduction: "-15% sur votre prochaine réservation",
  },
  B2C_RELANCE_AVIS: {
    client_name: "Pierre Dubois",
    review_link: "https://g.page/r/mirroreffect/review",
  },
  B2C_EVENT_ANNIVERSARY: {
    client_name: "Claire Bernard",
    vip_reduction: "-20%",
  },
  B2C_OFFRE_ANNIVERSAIRE: {
    client_name: "Thomas Petit",
  },
  B2C_EVENT_RECAP: {
    client_name: "Julie Moreau",
    event_date: "8 avril 2026",
    address: "Domaine de Bloemendal, 1780 Wemmel",
    pack_code: "LUXE 5H",
    total: 750,
    deposit: 250,
    balance: 500,
  },
  B2C_PROMO_48H: {
    event_date: "30 mai 2026",
  },
};

async function sendTestEmails() {
  console.log("🚀 Envoi des emails de test à", TEST_EMAIL);
  console.log("=".repeat(50));

  const templates = Object.keys(testPayloads);
  let sent = 0;
  let failed = 0;

  for (const templateKey of templates) {
    const payload = testPayloads[templateKey];

    try {
      const rendered = await renderTemplate({
        key: templateKey,
        locale: "fr",
        payload,
      });

      if (!rendered) {
        console.log(`❌ ${templateKey}: Template non trouvé`);
        failed++;
        continue;
      }

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: TEST_EMAIL,
        subject: `[TEST] ${rendered.subject}`,
        html: rendered.html,
      });

      if (error) {
        console.log(`❌ ${templateKey}: ${error.message}`);
        failed++;
      } else {
        console.log(`✅ ${templateKey}: Envoyé (${data?.id})`);
        sent++;
      }

      // Petite pause entre les envois
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.log(`❌ ${templateKey}: ${err}`);
      failed++;
    }
  }

  console.log("=".repeat(50));
  console.log(`📊 Résultat: ${sent} envoyés, ${failed} échoués`);
}

sendTestEmails();

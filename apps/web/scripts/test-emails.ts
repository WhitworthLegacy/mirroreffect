import { Resend } from "resend";
import { renderTemplate } from "../lib/notifications/renderTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);

const TEST_EMAIL = "ajsrl.amz@gmail.com";
const FROM_EMAIL = "Mirror Effect <hello@mirroreffect.co>";

const testPayloads: Record<string, Record<string, string | number>> = {
  B2C_EVENT_ANNIVERSARY: {
    client_name: "Claire Bernard",
  },
  B2C_OFFRE_ANNIVERSAIRE: {
    client_name: "Thomas Petit",
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

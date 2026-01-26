import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Mirror Effect <hello@mirroreffect.co>";
const REPLY_TO = process.env.RESEND_REPLY_TO || "hello@mirroreffect.co";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  tags?: { name: string; value: string }[];
};

type SendEmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

export async function sendEmailViaResend({
  to,
  subject,
  html,
  tags = [],
}: SendEmailInput): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: REPLY_TO,
      subject,
      html,
      tags,
    });

    if (error) {
      console.error("[Resend] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[Resend] Exception:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export function getUnsubscribeUrl(email: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mirroreffect.co";
  const token = Buffer.from(email).toString("base64url");
  return `${baseUrl}/api/unsubscribe?token=${token}`;
}

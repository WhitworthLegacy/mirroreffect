import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Mirror Effect <hello@mirroreffect.co>";
const REPLY_TO = process.env.RESEND_REPLY_TO || "admin@mirroreffect.co";

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
    const { data, error } = await getResend().emails.send({
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
  return `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    return decoded.toLowerCase() === email.toLowerCase();
  } catch {
    return false;
  }
}

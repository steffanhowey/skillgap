import { Resend } from "resend";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /** Defaults to EMAIL_FROM_PRODUCT. */
  from?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id: string | null;
  error: string | null;
}

/**
 * Send one product email through Resend.
 * Logs and returns a failure instead of throwing into the request path.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = input.from ?? process.env.EMAIL_FROM_PRODUCT;

  if (!apiKey || !from) {
    console.error("[email] missing RESEND_API_KEY or EMAIL_FROM_PRODUCT");
    return { ok: false, id: null, error: "Email is not configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (error) {
      console.error("[email] send failed:", error.message);
      return { ok: false, id: null, error: error.message };
    }

    return { ok: true, id: data?.id ?? null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email send failed";
    console.error("[email] send threw:", message);
    return { ok: false, id: null, error: "Email send failed" };
  }
}

import nodemailer, { type Transporter } from "nodemailer";

export type MailAttachment = {
  filename: string;
  content: Buffer;
  cid: string;
  contentType: string;
};
export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: MailAttachment[];
};

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function fromAddress(): string {
  return process.env.MAIL_FROM || "Kanaku <no-reply@localhost>";
}

let transporter: Transporter | undefined;

function getTransporter() {
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    // true = implicit TLS (port 465). false = STARTTLS upgrade (port 587).
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: (process.env.SMTP_PASS ?? "").replace(/\s+/g, "") },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transporter;
}

/**
 * Sends an email through SMTP. Returns true on success.
 * Without SMTP settings: production fails loudly; development prints the message to the server console
 * so the flow can still be tested (nothing is delivered).
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  if (!smtpConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error("[mailer] SMTP_HOST / SMTP_USER / SMTP_PASS are not set; email not sent.");
      return false;
    }
    console.warn(
      `[mailer] SMTP not configured, email NOT delivered. To: ${message.to}\n` +
        `Subject: ${message.subject}\n${message.text}`,
    );
    return true;
  }
  try {
    await getTransporter().sendMail({
      from: fromAddress(),
      replyTo: process.env.MAIL_REPLY_TO || undefined,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments,
    });
    return true;
  } catch (error) {
    console.error("[mailer] send failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

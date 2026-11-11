import { sendMail } from "@/lib/mailer";
import type { EmailContent } from "./layout";
import { LOGO_CID, LOGO_PNG_BASE64 } from "./logo";

/** Sends one of Kanaku's standard e-mails, attaching the inline logo every layout refers to. */
export function sendBrandedEmail(to: string, content: EmailContent): Promise<boolean> {
  return sendMail({
    to,
    ...content,
    attachments: [
      {
        filename: "kanaku-logo.png",
        content: Buffer.from(LOGO_PNG_BASE64, "base64"),
        cid: LOGO_CID,
        contentType: "image/png",
      },
    ],
  });
}

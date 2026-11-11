import { LOGO_CID } from "./logo";
import { COLORS, escapeHtml } from "./theme";

export type EmailContent = { subject: string; html: string; text: string };

/**
 * Everything an e-mail can contain. Every e-mail Kanaku sends (verification codes, password reset,
 * receipts, notifications) is built from these parts by `renderEmail`, so they all share one look:
 * navy header with the logo, white card, optional code / details / button, then the footer.
 */
export type EmailParts = {
  subject: string;
  /** The grey preview line mail apps show next to the subject. */
  preheader: string;
  heading: string;
  greeting: string;
  paragraphs: string[];
  /** A one-time code, shown large in a tinted box. */
  code?: { value: string; note: string };
  /** A summary table, e.g. a receipt. */
  details?: { label: string; value: string }[];
  /** Paragraphs after the code or details. */
  afterParagraphs?: string[];
  /** A call-to-action button. `url` must be absolute. */
  button?: { label: string; url: string };
  /** A highlighted note with an accent bar (safety advice and the like). */
  note?: string;
  supportEmail?: string;
  /** Why this person got the email (first line of the footer). */
  reason: string;
};

const FONT = "Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

/** The real logo, embedded inline (cid) because Gmail and Outlook block SVG. */
const LOGO_MARK = `<img src="cid:${LOGO_CID}" width="36" height="36" alt="Kanaku" style="display:block;border:0;outline:none;border-radius:10px;">`;

const paragraph = (text: string) =>
  `<p style="margin:0 0 16px;font-size:16px;line-height:26px;color:${COLORS.body};">${escapeHtml(text)}</p>`;

function codeBlock(code: { value: string; note: string }) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;"><tr>
        <td align="center" bgcolor="${COLORS.codeBg}" style="background:${COLORS.codeBg};border:1px solid ${COLORS.codeLine};border-radius:14px;padding:22px 16px;">
          <div style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:38px;line-height:44px;font-weight:700;letter-spacing:12px;color:${COLORS.navy};padding-left:12px;">${escapeHtml(code.value)}</div>
        </td>
      </tr></table>
      <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:${COLORS.muted};text-align:center;">${escapeHtml(code.note)}</p>`;
}

function detailsTable(rows: { label: string; value: string }[]) {
  const cells = rows
    .map(
      (r, i) => `<tr>
          <td style="padding:12px 16px;font-size:14px;line-height:22px;color:${COLORS.muted};${i > 0 ? `border-top:1px solid ${COLORS.line};` : ""}">${escapeHtml(r.label)}</td>
          <td align="right" style="padding:12px 16px;font-size:14px;line-height:22px;font-weight:600;color:${COLORS.ink};${i > 0 ? `border-top:1px solid ${COLORS.line};` : ""}">${escapeHtml(r.value)}</td>
        </tr>`,
    )
    .join("\n        ");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;border:1px solid ${COLORS.line};border-radius:14px;background:${COLORS.page};">
        ${cells}
      </table>`;
}

function button(b: { label: string; url: string }) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>
        <td bgcolor="${COLORS.brand}" style="background:${COLORS.brand};border-radius:12px;">
          <a href="${escapeHtml(b.url)}" style="display:inline-block;padding:14px 26px;font-size:16px;font-weight:700;line-height:20px;color:#FFFFFF;text-decoration:none;font-family:${FONT};">${escapeHtml(b.label)}</a>
        </td>
      </tr></table>`;
}

const noteBlock = (text: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr>
        <td bgcolor="${COLORS.page}" style="background:${COLORS.page};border-left:4px solid ${COLORS.accent};border-radius:6px;padding:14px 16px;font-size:14px;line-height:22px;color:${COLORS.body};">${escapeHtml(text)}</td>
      </tr></table>`;

/** Renders the shared HTML + plain-text layout for every Kanaku e-mail. */
export function renderEmail(p: EmailParts): EmailContent {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(p.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(p.preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.page}" style="background:${COLORS.page};">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;font-family:${FONT};">
    <tr><td bgcolor="${COLORS.navy}" style="background:${COLORS.navy};border-radius:20px 20px 0 0;padding:28px 40px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td valign="middle">${LOGO_MARK}</td>
        <td valign="middle" style="padding-left:12px;font-size:24px;font-weight:700;color:${COLORS.onNavy};font-family:${FONT};">Kanaku</td>
      </tr></table>
    </td></tr>
    <tr><td bgcolor="${COLORS.surface}" style="background:${COLORS.surface};border:1px solid ${COLORS.line};border-top:0;border-radius:0 0 20px 20px;padding:40px;">
      <h1 style="margin:0 0 20px;font-size:26px;line-height:34px;font-weight:700;color:${COLORS.ink};font-family:${FONT};">${escapeHtml(p.heading)}</h1>
      ${paragraph(p.greeting)}
      ${p.paragraphs.map(paragraph).join("\n      ")}
      ${p.code ? codeBlock(p.code) : ""}
      ${p.details ? detailsTable(p.details) : ""}
      ${(p.afterParagraphs ?? []).map(paragraph).join("\n      ")}
      ${p.button ? button(p.button) : ""}
      ${p.note ? noteBlock(p.note) : ""}
      <p style="margin:0;font-size:16px;line-height:26px;color:${COLORS.body};">Thanks,<br><strong style="color:${COLORS.ink};">The Kanaku team</strong></p>
    </td></tr>
    <tr><td align="center" style="padding:24px 16px 0;font-size:12px;line-height:20px;color:${COLORS.subtle};font-family:${FONT};">
      <strong style="color:${COLORS.muted};">Kanaku</strong> &middot; Spend smart. Grow faster.<br>
      ${escapeHtml(p.reason)} This is an automated message, so please don&rsquo;t reply to it.${
        p.supportEmail
          ? `<br>Need help? Contact <a href="mailto:${escapeHtml(p.supportEmail)}" style="color:${COLORS.accentDark};">${escapeHtml(p.supportEmail)}</a>.`
          : ""
      }
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    p.heading,
    "",
    p.greeting,
    "",
    ...p.paragraphs.flatMap((t) => [t, ""]),
    ...(p.code ? [`    ${p.code.value}`, `    ${p.code.note}`, ""] : []),
    ...(p.details ? [...p.details.map((r) => `${r.label}: ${r.value}`), ""] : []),
    ...(p.afterParagraphs ?? []).flatMap((t) => [t, ""]),
    ...(p.button ? [`${p.button.label}: ${p.button.url}`, ""] : []),
    ...(p.note ? [p.note, ""] : []),
    "Thanks,",
    "The Kanaku team",
    "",
    "--",
    "Kanaku - Spend smart. Grow faster.",
    `${p.reason} This is an automated message; please don't reply.`,
    ...(p.supportEmail ? [`Need help? Contact ${p.supportEmail}.`] : []),
  ].join("\n");

  return { subject: p.subject, html, text };
}

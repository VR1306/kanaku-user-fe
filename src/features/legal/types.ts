/** A paragraph (string) or a bulleted list (string[]). */
export type LegalBlock = string | string[];

export type LegalSection = { id: string; title: string; blocks: LegalBlock[] };

export type LegalDocumentContent = {
  title: string;
  /** One-line summary shown under the title. */
  summary: string;
  /** Human-readable date, e.g. "11 November 2026". */
  updated: string;
  sections: LegalSection[];
};

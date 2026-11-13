import { PRIVACY } from "@/features/legal/content/privacy";
import { TERMS } from "@/features/legal/content/terms";
import type { LegalDocumentContent } from "@/features/legal/types";
import { adminFetch, cachedFetch } from "@/lib/admin-api";

/**
 * The Privacy Policy and Terms are written and published in the Admin Portal; this app only displays them.
 * The published text is cached for a minute. If the Admin Portal has never been reachable since this
 * server started, the copy bundled at `features/legal/content` is shown instead, because the sign-up
 * page must always link to readable terms.
 */
type Slug = "privacy" | "terms";
type Published = Omit<LegalDocumentContent, "updated"> & { updated: string };

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));

const load = (slug: Slug, bundled: LegalDocumentContent) =>
  cachedFetch<LegalDocumentContent>(
    60_000,
    async () => {
      const d = await adminFetch<Published>(`/api/v1/public/legal/${slug}`);
      return {
        title: d.title,
        summary: d.summary,
        updated: formatDate(d.updated),
        sections: d.sections,
      };
    },
    () => bundled,
  );
const documents = { privacy: load("privacy", PRIVACY), terms: load("terms", TERMS) };

export const getLegal = (slug: Slug) => documents[slug]();

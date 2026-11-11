import type { Metadata } from "next";
import { ROUTES } from "@/constants/routes";
import { LegalDocument } from "@/features/legal/components/legal-document";
import { TERMS } from "@/features/legal/content/terms";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using Kanaku.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      content={TERMS}
      other={{ href: ROUTES.privacy, label: "Read the Privacy Policy" }}
      contactEmail={process.env.SUPPORT_EMAIL || undefined}
    />
  );
}

import type { Metadata } from "next";
import { ROUTES } from "@/constants/routes";
import { LegalDocument } from "@/features/legal/components/legal-document";
import { PRIVACY } from "@/features/legal/content/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Kanaku collects, uses and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      content={PRIVACY}
      other={{ href: ROUTES.terms, label: "Read the Terms of Service" }}
      contactEmail={process.env.SUPPORT_EMAIL || undefined}
    />
  );
}

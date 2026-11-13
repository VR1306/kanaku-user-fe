import type { Metadata } from "next";
import { Suspense } from "react";
import { ROUTES } from "@/constants/routes";
import { LegalDocument } from "@/features/legal/components/legal-document";
import { getLegal } from "@/services/legal-service";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Kanaku collects, uses and protects your information.",
};

/** The text is published from the Admin Portal (see services/legal-service.ts). */
async function PrivacyContent() {
  return (
    <LegalDocument
      content={await getLegal("privacy")}
      other={{ href: ROUTES.terms, label: "Read the Terms of Service" }}
      contactEmail={process.env.SUPPORT_EMAIL || undefined}
    />
  );
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page" aria-busy="true" />}>
      <PrivacyContent />
    </Suspense>
  );
}

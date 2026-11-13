import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ROUTES } from "@/constants/routes";
import { LegalDocument } from "@/features/legal/components/legal-document";
import { getLegal } from "@/services/legal-service";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using Kanaku.",
};

/** The text is published from the Admin Portal (see services/legal-service.ts). */
async function TermsContent() {
  await connection(); // the text is cached with a clock, so render per request
  return (
    <LegalDocument
      content={await getLegal("terms")}
      other={{ href: ROUTES.privacy, label: "Read the Privacy Policy" }}
      contactEmail={process.env.SUPPORT_EMAIL || undefined}
    />
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page" aria-busy="true" />}>
      <TermsContent />
    </Suspense>
  );
}

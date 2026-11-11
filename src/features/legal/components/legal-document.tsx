import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ROUTES } from "@/constants/routes";
import type { LegalBlock, LegalDocumentContent } from "../types";

type LegalDocumentProps = {
  content: LegalDocumentContent;
  /** The other legal page, linked at the bottom. */
  other: { href: string; label: string };
  /** Where people can reach us; shown in the Contact section. */
  contactEmail?: string;
};

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") return <p>{block}</p>;
  return (
    <ul className="list-disc space-y-2 pl-6 marker:text-accent-deep">
      {block.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** Shared page for the Terms of Service and the Privacy Policy. */
export function LegalDocument({ content, other, contactEmail }: LegalDocumentProps) {
  return (
    <div className="min-h-screen bg-page">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-8">
        <Link href={ROUTES.login} aria-label="Kanaku, back to log in">
          <Logo tone="light" size={34} />
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-8">
        <div className="rounded-[24px] border border-line bg-surface px-6 py-8 shadow-sm sm:px-12 sm:py-12">
          <p className="text-[13px] font-bold tracking-[0.14em] text-accent-deep uppercase">
            Last updated {content.updated}
          </p>
          <h1 className="mt-3 font-display text-[32px] leading-tight font-bold text-ink sm:text-[40px]">
            {content.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{content.summary}</p>

          <nav
            aria-label="Contents"
            className="mt-8 rounded-[18px] border border-line-soft bg-page p-5"
          >
            <p className="text-sm font-semibold text-ink">On this page</p>
            <ol className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
              {content.sections.map((section, i) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-link hover:underline">
                    {i + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 space-y-10">
            {content.sections.map((section, i) => (
              <section key={section.id} id={section.id} className="scroll-mt-6">
                <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
                  {i + 1}. {section.title}
                </h2>
                <div className="mt-3 space-y-4 text-[15px] leading-relaxed text-muted">
                  {section.blocks.map((block, j) => (
                    <Block key={j} block={block} />
                  ))}
                  {section.id === "contact" ? (
                    <p className="font-medium text-ink">
                      {contactEmail ? (
                        <>
                          E-mail:{" "}
                          <a href={`mailto:${contactEmail}`} className="text-link hover:underline">
                            {contactEmail}
                          </a>
                        </>
                      ) : (
                        "Our support e-mail address will be published here before launch."
                      )}
                    </p>
                  ) : null}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-sm">
            <Link href={other.href} className="font-semibold text-link hover:underline">
              {other.label} →
            </Link>
            <Link href={ROUTES.signup} className="text-muted hover:text-ink">
              Back to create account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

import { ROUTES } from "@/constants/routes";
import type { ReactNode } from "react";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/utils/cn";

type SplitProps = {
  /** Content of the dark navy brand panel (left). */
  panel: ReactNode;
  children: ReactNode;
};

/** Split-screen layout (log in / create account): navy brand panel + form column. */
export function SplitAuthLayout({ panel, children }: SplitProps) {
  return (
    <div className="relative flex min-h-screen bg-page">
      <ThemeToggle className="absolute top-4 right-4 z-10" />
      <section className="hidden w-1/2 bg-navy-950 lg:block">
        <Reveal x={-32} y={0} className="flex h-full flex-col px-14 py-12">
          {panel}
        </Reveal>
      </section>
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <Reveal delay={0.1} className="w-full max-w-[420px]">
          {/* The navy brand panel is hidden below lg, so show the logo above the form instead. */}
          <Link href={ROUTES.login} aria-label="Kanaku" className="mb-8 inline-flex lg:hidden">
            <Logo tone="light" size={36} />
          </Link>
          {children}
        </Reveal>
      </main>
    </div>
  );
}

type CenteredProps = { children: ReactNode; width?: "sm" | "md" };

/** Centered card layout (verify / forgot / reset). */
export function CenteredAuthLayout({ children, width = "md" }: CenteredProps) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-6">
      <ThemeToggle className="absolute top-4 right-4" />
      <Reveal
        delay={0.1}
        className={cn(
          "w-full rounded-card border border-line bg-surface p-8 sm:p-[41px]",
          width === "sm" ? "max-w-[460px]" : "max-w-[480px]",
        )}
      >
        <Link href={ROUTES.login} aria-label="Kanaku" className="mb-7 inline-flex">
          <Logo tone="light" size={36} />
        </Link>
        {children}
      </Reveal>
    </main>
  );
}

export function AuthHeading({ children, compact }: { children: ReactNode; compact?: boolean }) {
  return (
    <h1
      className={cn(
        "font-display leading-[1.25] font-bold text-ink",
        compact ? "text-2xl" : "text-[34px]",
      )}
    >
      {children}
    </h1>
  );
}

export function BackToLogin() {
  return (
    <Link
      href={ROUTES.login}
      className="block text-center text-[15px] font-semibold text-link underline"
    >
      ← Back to log in
    </Link>
  );
}

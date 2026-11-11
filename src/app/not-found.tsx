import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo tone="light" />
      <p className="font-display text-7xl font-bold text-link">404</p>
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Page not found</h1>
        <p className="mt-2 text-base text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
      </div>
      <Link href={ROUTES.dashboard} className={buttonClasses({ size: "lg" })}>
        Go to dashboard
      </Link>
    </main>
  );
}

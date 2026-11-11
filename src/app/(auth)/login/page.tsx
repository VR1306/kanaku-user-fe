import { ROUTES } from "@/constants/routes";
import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandPanel, QuoteCard } from "@/features/auth/components/brand-panel";
import { SplitAuthLayout } from "@/features/auth/components/auth-layouts";
import { LoginForm } from "@/features/auth/components/login-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Log in" };

async function LoginContent({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  if (await getSession()) redirect(ROUTES.dashboard);
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  return <LoginForm next={next} passwordWasReset={params.reset === "1"} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <SplitAuthLayout
      panel={
        <BrandPanel
          eyebrow="WELCOME BACK"
          lines={["Your finances,", "at a glance."]}
          footer={
            <QuoteCard
              quote="Beware of little expenses; a small leak will sink a great ship."
              author="Benjamin Franklin"
            />
          }
        />
      }
    >
      <Suspense>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </SplitAuthLayout>
  );
}

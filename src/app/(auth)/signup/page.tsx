import type { Metadata } from "next";
import { BrandPanel, CheckList } from "@/features/auth/components/brand-panel";
import { SplitAuthLayout } from "@/features/auth/components/auth-layouts";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <SplitAuthLayout
      panel={
        <BrandPanel
          lines={["Spend smart.", "Grow faster."]}
          description="Create your free account and set your first budget in under two minutes."
          footer={
            <CheckList
              items={[
                "Unlimited transactions, free forever",
                "Budgets and alerts that keep you on track",
                "Export your data anytime",
              ]}
            />
          }
        />
      }
    >
      <SignupForm />
    </SplitAuthLayout>
  );
}

import { Suspense } from "react";
import type { ModuleKey } from "@/constants/modules";
import { requireModule } from "@/lib/module-guard";

async function Check({ module }: { module: ModuleKey }) {
  await requireModule(module);
  return null;
}

/** Drop into a module's page: redirects to Plan & billing when the customer's plan doesn't include the module. */
export function ModuleGate({ module }: { module: ModuleKey }) {
  return (
    <Suspense fallback={null}>
      <Check module={module} />
    </Suspense>
  );
}

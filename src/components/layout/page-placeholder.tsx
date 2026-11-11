import { EmptyState } from "@/components/ui/empty-state";
import type { PageMeta } from "@/constants/pages";
import { PageHeader } from "./page-header";

/** Default page body until a feature screen is built. Says so plainly. */
export function PagePlaceholder({ page }: { page: PageMeta }) {
  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <EmptyState
        icon={page.icon}
        title={`${page.title} is on its way`}
        description="This screen hasn't been built yet. Everything else in the app keeps working."
      />
    </>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder with the same grid as the loaded dashboard. */
export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="flex flex-col gap-6">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[542fr_373fr]">
        <Skeleton className="h-[263px] rounded-card" />
        <Skeleton className="h-[263px] rounded-card" />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[532fr_383fr]">
        <Skeleton className="h-[436px] rounded-[24px]" />
        <Skeleton className="h-[436px] rounded-[24px]" />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[568fr_347fr]">
        <Skeleton className="h-[457px] rounded-[24px]" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-[229px] rounded-[24px]" />
          <Skeleton className="h-[180px] rounded-[24px]" />
        </div>
      </div>
    </div>
  );
}

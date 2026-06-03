import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl ring-1 ring-border bg-white p-3 md:p-5">
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailPageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32 mt-2" />
      </div>
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-3">
        {[...Array(cards)].map((_, i) => (
          <div key={i} className="rounded-xl ring-1 ring-border bg-white p-3 md:p-5">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>
      <div className="rounded-xl ring-1 ring-border bg-white p-4">
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl ring-1 ring-border bg-white">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-0">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

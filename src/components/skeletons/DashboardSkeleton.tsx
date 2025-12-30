import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Hero Section Skeleton */}
      <section className="text-center py-6 sm:py-8 lg:py-12">
        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
          <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded-full" />
          <Skeleton className="h-8 sm:h-10 w-40 sm:w-48" />
          <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded-full" />
        </div>
        <Skeleton className="h-4 sm:h-5 w-64 sm:w-96 mx-auto" />
      </section>

      {/* Tools Grid Skeleton */}
      <section className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <div className="flex items-start justify-between">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
              </div>
              <Skeleton className="h-5 sm:h-6 w-24 sm:w-32 mt-2" />
              <Skeleton className="h-3 sm:h-4 w-full mt-1" />
              <Skeleton className="h-3 sm:h-4 w-3/4 mt-1" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="hidden sm:block space-y-1 mb-3 sm:mb-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-3 w-20" />
                ))}
              </div>
              <Skeleton className="h-8 sm:h-9 w-full rounded-md" />
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

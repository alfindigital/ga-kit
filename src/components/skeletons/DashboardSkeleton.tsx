import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Section */}
      <section className="text-center py-6 sm:py-8 lg:py-12 animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
          <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded-full" />
          <Skeleton className="h-8 sm:h-10 w-40 sm:w-48" />
          <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded-full" />
        </div>
        <Skeleton className="h-4 sm:h-5 w-64 sm:w-96 mx-auto" />
      </section>

      {/* Tools Grid */}
      <section className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card
            key={i}
            className="overflow-hidden opacity-0 animate-fade-in"
            style={{ animationDelay: `${100 + i * 80}ms`, animationFillMode: 'forwards' }}
          >
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
              <Skeleton className="h-5 sm:h-6 w-24 sm:w-32 mt-2" />
              <Skeleton className="h-3 sm:h-4 w-full mt-1" />
              <Skeleton className="h-3 sm:h-4 w-3/4 mt-1" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="hidden sm:block space-y-1.5 mb-3">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-3 w-20" />
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

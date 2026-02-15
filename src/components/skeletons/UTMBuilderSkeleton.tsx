import { Skeleton, SkeletonHeader } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function UTMBuilderSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <SkeletonHeader>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </SkeletonHeader>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          {[0, 1, 2].map(i => (
            <Card key={i} className="opacity-0 animate-fade-in" style={{ animationDelay: `${150 + i * 100}ms`, animationFillMode: 'forwards' }}>
              <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
                {i === 1 ? (
                  [...Array(5)].map((_, j) => (
                    <div key={j} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <Skeleton className="h-4 w-16 sm:w-20" />
                      <Skeleton className="h-9 flex-1" />
                    </div>
                  ))
                ) : i === 2 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {[...Array(10)].map((_, j) => <Skeleton key={j} className="h-9 rounded-md" />)}
                  </div>
                ) : (
                  <Skeleton className="h-9 w-full" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2 opacity-0 animate-fade-in" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
          <Card className="border-2 border-muted">
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

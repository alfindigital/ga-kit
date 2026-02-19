import { Skeleton, SkeletonHeader } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function YTFinderSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <SkeletonHeader>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </SkeletonHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-4">
          <Card className="opacity-0 animate-fade-in" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-36" />
              </div>
              <Skeleton className="h-4 w-52 mt-1" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-5 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
              </div>
            </CardContent>
          </Card>

          {/* Stats mini */}
          <div className="grid grid-cols-3 gap-3 opacity-0 animate-fade-in" style={{ animationDelay: '280ms', animationFillMode: 'forwards' }}>
            {[0, 1, 2].map(i => (
              <Card key={i} className="p-3">
                <Skeleton className="h-3 w-12 mb-1" />
                <Skeleton className="h-6 w-8" />
              </Card>
            ))}
          </div>
        </div>

        {/* Results */}
        <Card className="border-2 border-muted opacity-0 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-7 w-16" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-md border border-border/40"
                style={{ opacity: 0, animation: `fade-in 0.4s ease forwards`, animationDelay: `${520 + i * 60}ms` }}>
                <Skeleton className="h-4 w-4" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-7 w-7" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

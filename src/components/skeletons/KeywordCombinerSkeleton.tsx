import { Skeleton, SkeletonHeader } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function KeywordCombinerSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <SkeletonHeader>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </SkeletonHeader>

      {/* Match Types */}
      <div className="flex flex-wrap gap-3 sm:gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="opacity-0 animate-fade-in" style={{ animationDelay: `${200 + i * 80}ms`, animationFillMode: 'forwards' }}>
              <CardHeader className="p-3 sm:py-3 flex-row items-center justify-between">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-7 w-7" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-2 border-muted opacity-0 animate-fade-in" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
          <CardHeader className="p-3 sm:py-3 flex-row items-center justify-between gap-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-7 w-16" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

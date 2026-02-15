import { Skeleton, SkeletonHeader } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ToolPageSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <SkeletonHeader>
        <Skeleton className="h-8 w-16" />
      </SkeletonHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {[0, 1].map(i => (
            <Card key={i} className="opacity-0 animate-fade-in" style={{ animationDelay: `${150 + i * 100}ms`, animationFillMode: 'forwards' }}>
              <CardHeader className="p-3 sm:py-3">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
                <Skeleton className="h-32 w-full" />
                {i === 0 && (
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-2 border-muted opacity-0 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <CardHeader className="p-3 sm:py-3 flex-row items-center justify-between gap-2">
            <Skeleton className="h-4 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-7 w-16" />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

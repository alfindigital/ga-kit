import { Skeleton, SkeletonHeader } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function AdCopyValidatorSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonHeader>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-16" />
      </SkeletonHeader>

      {/* Stats Bar */}
      <Card className="bg-muted/30 opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-36" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Skeleton className="h-10 w-72 opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }} />

      {/* Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {[0, 1].map(i => (
          <Card key={i} className="opacity-0 animate-fade-in" style={{ animationDelay: `${300 + i * 120}ms`, animationFillMode: 'forwards' }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div><Skeleton className="h-5 w-24" /><Skeleton className="h-4 w-40 mt-1" /></div>
                <Skeleton className="h-9 w-16" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(i === 0 ? 3 : 2)].map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className={`${i === 0 ? 'h-10' : 'h-20'} flex-1`} />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

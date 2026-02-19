import { Skeleton, SkeletonHeader } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ROASCalculatorSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <SkeletonHeader>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </SkeletonHeader>

      {/* Tabs */}
      <Skeleton className="h-10 w-80 opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input Card */}
        <div className="space-y-4">
          <Card className="opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48 mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[0, 1].map(i => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 flex-1" />
                  </div>
                </div>
              ))}
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>

          <Card className="opacity-0 animate-fade-in" style={{ animationDelay: '320ms', animationFillMode: 'forwards' }}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Results Card */}
        <Card className="border-2 border-muted opacity-0 animate-fade-in" style={{ animationDelay: '440ms', animationFillMode: 'forwards' }}>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="p-3 rounded-lg border border-border/50 space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              {[0, 1].map(i => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

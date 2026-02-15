import { Skeleton, SkeletonHeader } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function UrlValidatorSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />

      {/* Tabs */}
      <Skeleton className="h-10 w-64 opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }} />

      {/* Main Card */}
      <Card className="opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Card className="border-2 border-muted">
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-24" />
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between py-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/30 opacity-0 animate-fade-in" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-5 w-5" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

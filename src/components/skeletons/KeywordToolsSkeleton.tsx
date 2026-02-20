import { Skeleton, SkeletonHeader } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function KeywordToolsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <SkeletonHeader>
        <Skeleton className="h-8 w-20" />
      </SkeletonHeader>

      {/* Tabs bar */}
      <Skeleton
        className="h-10 w-full opacity-0 animate-fade-in"
        style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
      />

      {/* Active tab content: two-column input / output */}
      <div
        className="grid gap-4 lg:grid-cols-2 opacity-0 animate-fade-in"
        style={{ animationDelay: '220ms', animationFillMode: 'forwards' }}
      >
        {/* Input card */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <Skeleton className="h-4 w-16" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <Skeleton className="h-[180px] w-full" />
          </CardContent>
        </Card>

        {/* Output card */}
        <Card className="border-2 border-muted">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-7 w-16" />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="px-2 py-1"
                style={{ opacity: 0, animation: 'fade-in 0.3s ease forwards', animationDelay: `${340 + i * 45}ms` }}
              >
                <Skeleton className={`h-3.5 ${i % 4 === 0 ? 'w-full' : i % 4 === 1 ? 'w-4/5' : i % 4 === 2 ? 'w-3/5' : 'w-2/3'}`} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Case mode buttons strip */}
      <div
        className="flex flex-wrap gap-2 opacity-0 animate-fade-in"
        style={{ animationDelay: '460ms', animationFillMode: 'forwards' }}
      >
        {[60, 52, 44, 68, 52, 44].map((w, i) => (
          <Skeleton key={i} className={`h-8 w-${w === 60 ? '14' : w === 52 ? '12' : w === 44 ? '10' : '16'} rounded-md`} />
        ))}
      </div>
    </div>
  );
}

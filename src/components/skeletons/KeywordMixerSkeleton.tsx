import { Skeleton, SkeletonHeader } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function KeywordMixerSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <SkeletonHeader>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-16" />
      </SkeletonHeader>

      {/* Match type checkboxes */}
      <div
        className="flex flex-wrap items-center gap-4 opacity-0 animate-fade-in"
        style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
      >
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input columns: Prefix / Base / Suffix */}
        <div
          className="grid gap-3 grid-cols-1 sm:grid-cols-3 opacity-0 animate-fade-in"
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          {['Prefixes', 'Base Keywords *', 'Suffixes'].map((label, i) => (
            <Card key={i}>
              <CardHeader className="p-3 pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <Skeleton className="h-[110px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Results card */}
        <Card
          className="border-2 border-muted opacity-0 animate-fade-in"
          style={{ animationDelay: '340ms', animationFillMode: 'forwards' }}
        >
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-7 w-7" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1.5 rounded border border-border/40"
                style={{ opacity: 0, animation: 'fade-in 0.3s ease forwards', animationDelay: `${460 + i * 50}ms` }}
              >
                <Skeleton className="h-3.5 w-3.5 flex-shrink-0" />
                <Skeleton className={`h-3.5 ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-3/4' : 'w-1/2'}`} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

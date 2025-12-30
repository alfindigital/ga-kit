import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function KeywordCombinerSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Skeleton className="h-7 sm:h-8 w-40 sm:w-48" />
          <Skeleton className="h-4 w-56 mt-1" />
        </div>
        <Skeleton className="h-8 w-16 self-start sm:self-auto" />
      </div>

      {/* Match Types */}
      <div className="flex flex-wrap gap-3 sm:gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input Lists */}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-3 sm:py-3 flex-row items-center justify-between">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-7 w-7" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
          <Skeleton className="h-8 w-24" />
        </div>

        {/* Results */}
        <Card className="border-2 border-muted">
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

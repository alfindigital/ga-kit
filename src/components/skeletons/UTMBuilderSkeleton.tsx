import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function UTMBuilderSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Skeleton className="h-7 sm:h-8 w-32 sm:w-40" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        {/* Input Section */}
        <div className="lg:col-span-3 space-y-4">
          {/* Target URL */}
          <Card>
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>

          {/* UTM Parameters */}
          <Card>
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <Skeleton className="h-4 w-16 sm:w-20" />
                  <Skeleton className="h-9 flex-1" />
                </div>
              ))}
              <Skeleton className="h-8 w-40 mt-2" />
            </CardContent>
          </Card>

          {/* ValueTrack */}
          <Card>
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28 mt-1" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-9 rounded-md" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-2">
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

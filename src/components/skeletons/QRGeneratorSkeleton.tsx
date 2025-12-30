import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function QRGeneratorSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Skeleton className="h-7 sm:h-8 w-32 sm:w-40" />
          <Skeleton className="h-4 w-52 mt-1" />
        </div>
        <Skeleton className="h-8 w-16 self-start sm:self-auto" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-3">
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-4">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-3 w-24 mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Skeleton className="h-4 w-10 mb-2" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-14 mb-2" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-10" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-10" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </div>
              </div>

              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-9 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <Card className="border-2 border-muted">
          <CardHeader className="p-3">
            <Skeleton className="h-4 w-16" />
          </CardHeader>
          <CardContent className="p-3 pt-0 flex flex-col items-center gap-4">
            <Skeleton className="w-48 h-48 sm:w-64 sm:h-64 rounded-lg" />
            <div className="flex gap-2 w-full">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-9" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

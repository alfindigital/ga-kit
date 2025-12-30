import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ToolPageSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Skeleton className="h-7 sm:h-8 w-36 sm:w-44" />
          <Skeleton className="h-4 w-52 mt-1" />
        </div>
        <Skeleton className="h-8 w-16 self-start sm:self-auto" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-3 sm:py-3">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
              <Skeleton className="h-32 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:py-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <Card className="border-2 border-muted">
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

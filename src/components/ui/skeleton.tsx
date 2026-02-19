import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted relative overflow-hidden",
        // Light mode: subtle shimmer. Dark mode: brighter shimmer with more contrast
        "before:absolute before:inset-0 before:animate-shimmer before:bg-[length:200%_100%]",
        "before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.07] before:to-transparent",
        "dark:before:via-white/[0.12]",
        className
      )}
      {...props}
    />
  );
}

/** A skeleton header matching ToolPageHeader layout with icon bubble + gradient line */
function SkeletonHeader({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 sm:h-7 w-36 sm:w-44" />
            <Skeleton className="h-3.5 w-52 sm:w-64" />
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
      <Skeleton className="h-0.5 w-full rounded-full" />
    </div>
  );
}

export { Skeleton, SkeletonHeader };

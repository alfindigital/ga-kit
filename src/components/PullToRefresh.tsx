import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  className?: string;
}

export function PullToRefresh({ children, onRefresh, className }: PullToRefreshProps) {
  const { pullDistance, isRefreshing, progress, shouldTrigger } = usePullToRefresh({
    onRefresh,
    threshold: 80,
    maxPull: 120
  });

  return (
    <div className={cn("relative", className)}>
      {/* Pull indicator */}
      <div 
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-40 lg:hidden"
        style={{ 
          top: -50,
          transform: `translateY(${pullDistance}px)`,
          opacity: pullDistance > 10 ? 1 : 0,
          transition: pullDistance === 0 ? 'all 0.3s ease-out' : 'none'
        }}
      >
        <div 
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border shadow-lg",
            shouldTrigger && "border-primary",
            isRefreshing && "border-primary"
          )}
        >
          <RefreshCw 
            className={cn(
              "h-5 w-5 text-muted-foreground transition-colors",
              shouldTrigger && "text-primary",
              isRefreshing && "text-primary animate-spin"
            )}
            style={{
              transform: isRefreshing ? 'none' : `rotate(${progress * 360}deg)`,
              transition: isRefreshing ? 'none' : 'transform 0.1s linear'
            }}
          />
        </div>
      </div>
      
      {/* Content wrapper */}
      <div 
        style={{ 
          transform: `translateY(${pullDistance * 0.5}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
}

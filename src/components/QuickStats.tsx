import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link2, Combine, Shuffle, QrCode, Youtube, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUsageStats } from '@/hooks/useUsageStats';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

function AnimatedCounter({ value, duration = 1000 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const start = previousValue.current;
    const end = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(start + (end - start) * easeOutQuart);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

const statItems = [
  {
    key: 'utmsCreated' as const,
    label: 'UTMs Created',
    icon: Link2,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    key: 'keywordsCombined' as const,
    label: 'Keywords Combined',
    icon: Combine,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    key: 'keywordsMixed' as const,
    label: 'Keywords Mixed',
    icon: Shuffle,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    key: 'qrCodesGenerated' as const,
    label: 'QR Codes',
    icon: QrCode,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    key: 'videosAnalyzed' as const,
    label: 'Videos Analyzed',
    icon: Youtube,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
];

export function QuickStats() {
  const { stats } = useUsageStats();
  const totalActions = stats.utmsCreated + stats.keywordsCombined + stats.keywordsMixed + stats.qrCodesGenerated + stats.videosAnalyzed;

  if (totalActions === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        <span className="font-medium">Your Activity</span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {statItems.map((item, index) => {
          const value = stats[item.key];
          if (value === 0) return null;
          
          return (
            <Card 
              key={item.key}
              className={cn(
                "overflow-hidden opacity-0 animate-fade-in",
                "hover:shadow-md transition-shadow"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={cn("p-1.5 sm:p-2 rounded-lg", item.bgColor)}>
                    <item.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", item.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn("text-lg sm:text-xl font-bold tabular-nums", item.color)}>
                      <AnimatedCounter value={value} />
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {item.label}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

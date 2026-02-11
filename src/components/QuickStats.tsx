import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link2, Combine, Shuffle, QrCode, Youtube, TrendingUp, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUsageStats } from '@/hooks/useUsageStats';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

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
    gradient: 'from-primary to-primary/60',
    textColor: 'text-primary',
  },
  {
    key: 'keywordsCombined' as const,
    label: 'Keywords Combined',
    icon: Combine,
    gradient: 'from-accent to-accent/60',
    textColor: 'text-accent',
  },
  {
    key: 'keywordsMixed' as const,
    label: 'Keywords Mixed',
    icon: Shuffle,
    gradient: 'from-accent to-accent/60',
    textColor: 'text-accent',
  },
  {
    key: 'qrCodesGenerated' as const,
    label: 'QR Codes',
    icon: QrCode,
    gradient: 'from-tool-qr to-tool-qr/60',
    textColor: 'text-tool-qr',
  },
  {
    key: 'videosAnalyzed' as const,
    label: 'Videos Analyzed',
    icon: Youtube,
    gradient: 'from-destructive to-destructive/60',
    textColor: 'text-destructive',
  },
];

export function QuickStats() {
  const { stats, resetStats } = useUsageStats();
  const totalActions = stats.utmsCreated + stats.keywordsCombined + stats.keywordsMixed + stats.qrCodesGenerated + stats.videosAnalyzed;

  const handleReset = () => {
    resetStats();
    toast.success('Activity stats have been reset');
  };

  if (totalActions === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span className="font-medium">Your Activity</span>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Activity Stats?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all your activity counters. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>Reset Stats</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
                "hover:shadow-elevated transition-all duration-300"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={cn("p-1.5 sm:p-2 rounded-xl bg-gradient-to-br text-primary-foreground", item.gradient)}>
                    <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn("text-lg sm:text-xl font-bold tabular-nums", item.textColor)}>
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

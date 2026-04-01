import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link2, Combine, Shuffle, QrCode, Youtube, TrendingUp, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUsageStats } from '@/hooks/useUsageStats';
import { useTranslation } from '@/hooks/useTranslation';
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
import { TranslationKey } from '@/i18n/translations';

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

const statItems: { key: 'utmsCreated' | 'keywordsCombined' | 'keywordsMixed' | 'qrCodesGenerated' | 'videosAnalyzed'; labelKey: TranslationKey; icon: typeof Link2; gradient: string; textColor: string }[] = [
  { key: 'utmsCreated', labelKey: 'stats.utmsCreated', icon: Link2, gradient: 'from-primary to-primary/60', textColor: 'text-primary' },
  { key: 'keywordsCombined', labelKey: 'stats.keywordsCombined', icon: Combine, gradient: 'from-accent to-accent/60', textColor: 'text-accent' },
  { key: 'keywordsMixed', labelKey: 'stats.keywordsMixed', icon: Shuffle, gradient: 'from-accent to-accent/60', textColor: 'text-accent' },
  { key: 'qrCodesGenerated', labelKey: 'stats.qrCodes', icon: QrCode, gradient: 'from-tool-qr to-tool-qr/60', textColor: 'text-tool-qr' },
  { key: 'videosAnalyzed', labelKey: 'stats.videosAnalyzed', icon: Youtube, gradient: 'from-destructive to-destructive/60', textColor: 'text-destructive' },
];

export function QuickStats() {
  const { stats, resetStats } = useUsageStats();
  const { t } = useTranslation();
  const totalActions = stats.utmsCreated + stats.keywordsCombined + stats.keywordsMixed + stats.qrCodesGenerated + stats.videosAnalyzed;

  const handleReset = () => {
    resetStats();
    toast.success(t('stats.resetSuccess'));
  };

  if (totalActions === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span className="font-medium">{t('stats.yourActivity')}</span>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3 w-3 mr-1" />
              {t('stats.reset')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('stats.resetTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('stats.resetDesc')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>{t('stats.resetConfirm')}</AlertDialogAction>
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
              className={cn("stat-card overflow-hidden stagger-enter")}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={cn("stat-icon p-1.5 sm:p-2 rounded-xl bg-gradient-to-br text-primary-foreground", item.gradient)}>
                    <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn("stat-value text-lg sm:text-xl font-bold tabular-nums", item.textColor)}>
                      <AnimatedCounter value={value} />
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {t(item.labelKey)}
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

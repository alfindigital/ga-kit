import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { TranslationKey } from '@/i18n/translations';
import {
  LayoutDashboard,
  Link2,
  Combine,
  Wrench,
  MoreHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { Shuffle, Youtube, QrCode, ShieldCheck, Ban, FileText, Calculator, Lightbulb } from 'lucide-react';

type TabItem =
  | { kind: 'link'; path: string; labelKey: TranslationKey; icon: typeof LayoutDashboard }
  | { kind: 'more'; labelKey: TranslationKey; icon: typeof LayoutDashboard };

const tabItems: TabItem[] = [
  { kind: 'link', path: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { kind: 'link', path: '/utm-builder', labelKey: 'nav.utmBuilder', icon: Link2 },
  { kind: 'link', path: '/keyword-combiner', labelKey: 'nav.combiner', icon: Combine },
  { kind: 'link', path: '/keyword-tools', labelKey: 'nav.tools', icon: Wrench },
  { kind: 'more', labelKey: 'nav.more', icon: MoreHorizontal },
];

const moreItems: { path: string; labelKey: TranslationKey; icon: typeof LayoutDashboard }[] = [
  { path: '/keyword-mixer', labelKey: 'nav.mixer', icon: Shuffle },
  { path: '/negative-keywords', labelKey: 'nav.negatives', icon: Ban },
  { path: '/ad-copy-validator', labelKey: 'nav.adCopy', icon: FileText },
  { path: '/roas-calculator', labelKey: 'nav.roas', icon: Calculator },
  { path: '/headline-analyzer', labelKey: 'nav.headline', icon: Lightbulb },
  { path: '/yt-finder', labelKey: 'nav.ytFinder', icon: Youtube },
  { path: '/qr-generator', labelKey: 'nav.qrCode', icon: QrCode },
  { path: '/url-validator', labelKey: 'nav.validator', icon: ShieldCheck },
];

export function BottomTabNav() {
  const location = useLocation();
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = moreItems.some((m) => m.path === location.pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-border/50 bg-card/90 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabItems.map((item) => {
          if (item.kind === 'more') {
            const isActive = moreActive;
            return (
              <Sheet key="more" open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>
                  <button
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 active:scale-95',
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-label={t(item.labelKey)}
                  >
                    <div className={cn(
                      'flex items-center justify-center rounded-lg transition-colors h-9 w-9',
                      isActive && 'bg-primary text-primary-foreground'
                    )}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium leading-none">{t(item.labelKey)}</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl">
                  <SheetHeader className="mb-3">
                    <SheetTitle>{t('nav.more')}</SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-4 gap-2 pb-4">
                    {moreItems.map((m) => {
                      const active = location.pathname === m.path;
                      return (
                        <Link
                          key={m.path}
                          to={m.path}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            'flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-3 transition-colors',
                            active
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-muted bg-popover text-foreground hover:bg-muted/50'
                          )}
                        >
                          <m.icon className="h-5 w-5" />
                          <span className="text-[10px] font-medium text-center leading-tight">
                            {t(m.labelKey)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            );
          }

          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 active:scale-95',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'flex items-center justify-center rounded-lg transition-colors h-9 w-9',
                isActive && 'bg-primary text-primary-foreground shadow-glow-primary'
              )}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-none',
                isActive && 'font-semibold'
              )}>
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

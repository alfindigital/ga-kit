import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { TranslationKey } from '@/i18n/translations';
import { 
  LayoutDashboard,
  Link2,
  Combine,
  Wrench,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { SettingsDialog } from '@/components/SettingsDialog';

const tabItems: { path?: string; labelKey: TranslationKey; icon: typeof LayoutDashboard; action?: string }[] = [
  { path: '/', labelKey: 'nav.home', icon: LayoutDashboard },
  { path: '/utm-builder', labelKey: 'nav.utmBuilder', icon: Link2 },
  { path: '/keyword-combiner', labelKey: 'nav.combine', icon: Combine },
  { path: '/keyword-tools', labelKey: 'nav.tools', icon: Wrench },
  { labelKey: 'nav.settings', icon: Settings, action: 'settings' },
];

export function BottomTabNav() {
  const location = useLocation();
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-border/50 bg-card/90 backdrop-blur-xl safe-area-bottom animate-slide-up">
        <div className="flex items-center justify-around h-14 sm:h-16 max-w-lg mx-auto">
          {tabItems.map((item) => {
            const isActive = item.path ? location.pathname === item.path : false;
            
            if (item.action === 'settings') {
              return (
                <button
                  key="settings"
                  onClick={() => setSettingsOpen(true)}
                  className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 active:scale-95 text-muted-foreground hover:text-foreground"
                >
                  <div className="flex items-center justify-center rounded-full p-0">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-medium">
                    {t(item.labelKey)}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path!}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 active:scale-95",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-primary to-accent rounded-full animate-scale-in" />
                )}
                <div className={cn(
                  "flex items-center justify-center rounded-full transition-all duration-200",
                  isActive ? "bg-primary/10 p-1.5" : "p-0"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive && "font-semibold"
                )}>
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Link2,
  Shuffle,
  Combine,
  Wrench,
  Youtube,
  QrCode,
  LayoutDashboard,
  Keyboard,
  History,
  Settings,
  ShieldCheck,
  Ban,
  FileText,
  Calculator,
  Lightbulb,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';
import { SettingsDialog } from '@/components/SettingsDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UrlHistoryPanel } from '@/components/UrlHistoryPanel';
import { useUrlHistory } from '@/hooks/useUrlHistory';
import { TranslationKey } from '@/i18n/translations';

const navItems: { path: string; labelKey: TranslationKey; icon: typeof LayoutDashboard }[] = [
  { path: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { path: '/utm-builder', labelKey: 'nav.utmBuilder', icon: Link2 },
  { path: '/keyword-combiner', labelKey: 'nav.combiner', icon: Combine },
  { path: '/keyword-mixer', labelKey: 'nav.mixer', icon: Shuffle },
  { path: '/keyword-tools', labelKey: 'nav.tools', icon: Wrench },
  { path: '/negative-keywords', labelKey: 'nav.negatives', icon: Ban },
  { path: '/ad-copy-validator', labelKey: 'nav.adCopy', icon: FileText },
  { path: '/roas-calculator', labelKey: 'nav.roas', icon: Calculator },
  { path: '/headline-analyzer', labelKey: 'nav.headline', icon: Lightbulb },
  { path: '/yt-finder', labelKey: 'nav.ytFinder', icon: Youtube },
  { path: '/qr-generator', labelKey: 'nav.qrCode', icon: QrCode },
  { path: '/url-validator', labelKey: 'nav.validator', icon: ShieldCheck },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { stats } = useUrlHistory();

  return (
    <header className="sticky top-0 z-50 w-full glass gradient-border">
      <div className="container px-3 sm:px-4 lg:px-6 flex h-14 items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center active:scale-95 transition-transform"
          data-tour="command-palette"
          aria-label="GAKit Home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow-primary">
            <Rocket className="h-4 w-4 text-primary-foreground" />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav data-tour="navigation" className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-glow-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {t(item.labelKey)}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Utility actions — same set on mobile and desktop */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* URL History */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 relative"
                onClick={() => setHistoryOpen(true)}
                aria-label={t('header.urlHistory')}
              >
                <History className="h-4 w-4" />
                {stats.total > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-gradient-to-r from-primary to-accent text-[10px] text-primary-foreground flex items-center justify-center">
                    {stats.total > 99 ? '99+' : stats.total}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('header.urlHistory')}</TooltipContent>
          </Tooltip>

          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogContent className="sm:max-w-[600px] p-0 flex flex-col max-h-[85vh]">
              <DialogHeader className="p-4 border-b">
                <DialogTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  {t('header.urlHistory')}
                </DialogTitle>
              </DialogHeader>
              <UrlHistoryPanel
                compact
                maxHeight="calc(85vh - 80px)"
                onLoadUrl={(item) => {
                  setHistoryOpen(false);
                  const toolPaths: Record<string, string> = { 'utm': '/utm-builder', 'qr': '/qr-generator', 'yt-finder': '/yt-finder' };
                  const path = toolPaths[item.toolType] || '/';
                  navigate(path, { state: { historyItem: item } });
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Keyboard Shortcuts */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setShortcutsOpen(true)}
                data-tour="keyboard-shortcuts"
                aria-label={t('header.keyboardShortcuts')}
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('header.keyboardShortcuts')} <kbd className="ml-1 px-1 py-0.5 text-xs bg-muted rounded">?</kbd></p>
            </TooltipContent>
          </Tooltip>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setSettingsOpen(true)}
                data-tour="theme-toggle"
                aria-label={t('header.settings')}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('header.settings')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}

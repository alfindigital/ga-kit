import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  Sun, 
  Moon, 
  Menu,
  Link2,
  Shuffle,
  Combine,
  Wrench,
  Youtube,
  QrCode,
  LayoutDashboard,
  X,
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
  const { resolvedTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { stats } = useUrlHistory();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full glass gradient-border">
      <div className="container px-3 sm:px-4 lg:px-6 flex h-12 sm:h-14 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-base sm:text-lg active:scale-95 transition-transform" data-tour="command-palette">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow-primary">
            <Rocket className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-primary-foreground" />
          </div>
          <span className="text-primary font-extrabold tracking-tight text-base sm:text-lg">GAKit</span>
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

        {/* Settings & Mobile Menu */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* URL History */}
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 hidden sm:flex relative"
              >
                <History className="h-4 w-4" />
                {stats.total > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-gradient-to-r from-primary to-accent text-[10px] text-primary-foreground flex items-center justify-center">
                    {stats.total > 99 ? '99+' : stats.total}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  {t('header.urlHistory')}
                </SheetTitle>
              </SheetHeader>
              <UrlHistoryPanel 
                compact 
                maxHeight="calc(100vh - 140px)"
                onLoadUrl={() => setHistoryOpen(false)}
              />
            </SheetContent>
          </Sheet>

          {/* Keyboard Shortcuts */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden sm:flex">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={() => setShortcutsOpen(true)}
                  data-tour="keyboard-shortcuts"
                >
                  <Keyboard className="h-4 w-4" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('header.keyboardShortcuts')} <kbd className="ml-1 px-1 py-0.5 text-xs bg-muted rounded">?</kbd></p>
            </TooltipContent>
          </Tooltip>

          {/* Settings Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={() => setSettingsOpen(true)}
                  data-tour="theme-toggle"
                >
                  <Settings className="h-4 w-4 hidden sm:block" />
                  {resolvedTheme === 'dark' ? (
                    <Moon className="h-4 w-4 sm:hidden" />
                  ) : (
                    <Sun className="h-4 w-4 sm:hidden" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('header.settings')}</p>
            </TooltipContent>
          </Tooltip>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border/50 bg-card/98 backdrop-blur-xl animate-fade-in">
          <nav className="container px-3 sm:px-4 py-2 space-y-1">
            {navItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 animate-fade-in active:scale-[0.98]",
                  location.pathname === item.path
                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-glow-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <item.icon className="h-4 w-4" />
                <span>{t(item.labelKey)}</span>
              </Link>
            ))}
            {/* Settings button in mobile menu */}
            <button
              onClick={() => { setMobileMenuOpen(false); setSettingsOpen(true); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 animate-fade-in active:scale-[0.98] text-muted-foreground hover:text-foreground hover:bg-secondary"
              style={{ animationDelay: `${navItems.length * 30}ms` }}
            >
              <Settings className="h-4 w-4" />
              <span>{t('nav.settings')}</span>
            </button>
          </nav>
        </div>
      )}
      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}

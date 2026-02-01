import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useFontSize } from '@/contexts/FontSizeContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  Sun, 
  Moon, 
  Monitor, 
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
  RotateCcw,
  History,
  Settings,
  ShieldCheck,
  Ban,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UrlHistoryPanel } from '@/components/UrlHistoryPanel';
import { useUrlHistory } from '@/hooks/useUrlHistory';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/utm-builder', label: 'UTM Builder', icon: Link2 },
  { path: '/keyword-combiner', label: 'Combiner', icon: Combine },
  { path: '/keyword-mixer', label: 'Mixer', icon: Shuffle },
  { path: '/keyword-tools', label: 'Tools', icon: Wrench },
  { path: '/negative-keywords', label: 'Negatives', icon: Ban },
  { path: '/ad-copy-validator', label: 'Ad Copy', icon: FileText },
  { path: '/yt-finder', label: 'YT Finder', icon: Youtube },
  { path: '/qr-generator', label: 'QR Code', icon: QrCode },
  { path: '/url-validator', label: 'Validator', icon: ShieldCheck },
];

export function Header() {
  const location = useLocation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const [, setHasSeenTour] = useLocalStorage('ga-toolkit-tour-completed', false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { stats } = useUrlHistory();

  const handleRestartTour = () => {
    setHasSeenTour(false);
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
      <div className="container px-3 sm:px-4 lg:px-6 flex h-12 sm:h-14 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-base sm:text-lg active:scale-95 transition-transform" data-tour="command-palette">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary shadow-md">
            <span className="text-primary-foreground text-xs sm:text-sm font-bold">GA</span>
          </div>
          <span className="hidden xs:inline">
            GA <span className="text-primary italic">Toolkit</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav data-tour="navigation" className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
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
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                    {stats.total > 99 ? '99+' : stats.total}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  URL History
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
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 hidden sm:flex"
                onClick={() => setShortcutsOpen(true)}
                data-tour="keyboard-shortcuts"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Keyboard shortcuts <kbd className="ml-1 px-1 py-0.5 text-xs bg-muted rounded">?</kbd></p>
            </TooltipContent>
          </Tooltip>

          {/* Settings Link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/settings">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 hidden sm:flex"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" data-tour="theme-toggle">
                {resolvedTheme === 'dark' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="h-4 w-4 mr-2" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="h-4 w-4 mr-2" />
                System
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Font Size</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFontSize('sm')}>
                <span className="text-xs mr-2">A</span> Small
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFontSize('md')}>
                <span className="text-sm mr-2">A</span> Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFontSize('lg')}>
                <span className="text-base mr-2">A</span> Large
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleRestartTour}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart Tour
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
        <div className="lg:hidden border-t border-border bg-background/98 backdrop-blur-lg animate-fade-in">
          <nav className="container px-3 sm:px-4 py-2 space-y-1">
            {navItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 animate-fade-in active:scale-[0.98]",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            {/* Settings link in mobile menu */}
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 animate-fade-in active:scale-[0.98]",
                location.pathname === '/settings'
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              style={{ animationDelay: `${navItems.length * 30}ms` }}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>
      )}
      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </header>
  );
}

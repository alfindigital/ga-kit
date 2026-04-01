import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Link2,
  Combine,
  Shuffle,
  Wrench,
  Youtube,
  QrCode,
  Keyboard,
  Sun,
  Moon,
  RotateCcw,
  Beaker,
  Copy,
  Clock,
  Trash2,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getRecentPages, clearRecentPages } from '@/hooks/useRecentPages';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

const navigationItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, keywords: ['home', 'main'] },
  { path: '/utm-builder', label: 'UTM Builder', icon: Link2, keywords: ['url', 'tracking', 'campaign'] },
  { path: '/keyword-combiner', label: 'Keyword Combiner', icon: Combine, keywords: ['merge', 'join'] },
  { path: '/keyword-mixer', label: 'Keyword Mixer', icon: Shuffle, keywords: ['prefix', 'suffix'] },
  { path: '/keyword-tools', label: 'Keyword Tools', icon: Wrench, keywords: ['duplicate', 'case', 'replace'] },
  { path: '/yt-finder', label: 'YT Finder', icon: Youtube, keywords: ['video', 'youtube'] },
  { path: '/qr-generator', label: 'QR Generator', icon: QrCode, keywords: ['code', 'scan'] },
];

interface CommandPaletteProps {
  onOpenShortcuts?: () => void;
}

export function CommandPalette({ onOpenShortcuts }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [recentKey, setRecentKey] = useState(0);
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { t } = useTranslation();

  const recentPages = useMemo(() => {
    if (!open) return [];
    return getRecentPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recentKey]);

  const recentItems = useMemo(() => {
    return recentPages
      .map(path => navigationItems.find(item => item.path === path))
      .filter(Boolean) as typeof navigationItems;
  }, [recentPages]);

  const remainingNavItems = useMemo(() => {
    return navigationItems.filter(item => !recentPages.includes(item.path));
  }, [recentPages]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const handleClearRecent = useCallback(() => {
    clearRecentPages();
    setRecentKey(k => k + 1);
    toast({ title: t('cmd.cleared'), description: t('cmd.clearedDesc'), duration: 2000 });
  }, [t]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t('cmd.placeholder')} />
      <CommandList>
        <CommandEmpty>{t('cmd.noResults')}</CommandEmpty>
        
        {recentItems.length > 0 && (
          <>
            <CommandGroup heading={t('cmd.recent')}>
              {recentItems.map((item) => (
                <CommandItem key={`recent-${item.path}`} value={`recent ${item.label} ${item.keywords.join(' ')}`} onSelect={() => runCommand(() => navigate(item.path))}>
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
              <CommandItem value="clear recent history" onSelect={handleClearRecent}>
                <Trash2 className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('cmd.clearRecent')}</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        
        <CommandGroup heading={t('cmd.navigation')}>
          {remainingNavItems.map((item) => (
            <CommandItem key={item.path} value={`${item.label} ${item.keywords.join(' ')}`} onSelect={() => runCommand(() => navigate(item.path))}>
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t('cmd.theme')}>
          <CommandItem value="light mode theme" onSelect={() => runCommand(() => setTheme('light'))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>{t('cmd.lightMode')}</span>
          </CommandItem>
          <CommandItem value="dark mode theme" onSelect={() => runCommand(() => setTheme('dark'))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>{t('cmd.darkMode')}</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t('cmd.actions')}>
          <CommandItem value="load sample data demo" onSelect={() => { setOpen(false); window.dispatchEvent(new CustomEvent('command:sample')); }}>
            <Beaker className="mr-2 h-4 w-4" />
            <span>{t('cmd.loadSample')}</span>
          </CommandItem>
          <CommandItem value="copy results clipboard" onSelect={() => { setOpen(false); window.dispatchEvent(new CustomEvent('command:copy')); }}>
            <Copy className="mr-2 h-4 w-4" />
            <span>{t('cmd.copyResults')}</span>
          </CommandItem>
          <CommandItem value="reset clear form" onSelect={() => { setOpen(false); window.dispatchEvent(new CustomEvent('command:reset')); }}>
            <RotateCcw className="mr-2 h-4 w-4" />
            <span>{t('cmd.resetForm')}</span>
          </CommandItem>
          {onOpenShortcuts && (
            <CommandItem value="keyboard shortcuts help" onSelect={() => runCommand(onOpenShortcuts)}>
              <Keyboard className="mr-2 h-4 w-4" />
              <span>{t('cmd.keyboardShortcuts')}</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

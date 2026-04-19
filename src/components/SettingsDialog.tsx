import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useFontSize } from '@/contexts/FontSizeContext';
import { useLanguage, LANGUAGES } from '@/contexts/LanguageContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTranslation } from '@/hooks/useTranslation';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sun, Moon, Monitor, RotateCcw, Palette, Type,
  Globe, Download, Upload, Trash2, AlertTriangle, CheckCircle2,
  Settings as SettingsIcon, Smartphone, GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ALL_PREF_KEYS = [
  'ga-toolkit-theme', 'ga-toolkit-font-size', 'ga-toolkit-language',
  'ga-toolkit-tour-completed', 'ga-toolkit-favorites', 'ga-toolkit-recent-pages',
  'ga-toolkit-url-history', 'ga-toolkit-search-history', 'ga-toolkit-usage-stats',
  'ga-toolkit-roas-scenarios',
];

function collectSettings() {
  const data: Record<string, unknown> = {};
  for (const key of ALL_PREF_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try { data[key] = JSON.parse(raw); } catch { data[key] = raw; }
    }
  }
  return data;
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();
  const [, setHasSeenTour] = useLocalStorage('ga-toolkit-tour-completed', false);
  const [importDragOver, setImportDragOver] = useState(false);

  const handleRestartTour = () => {
    setHasSeenTour(false);
    onOpenChange(false);
    toast.success(t('toast.tourRestart'));
    setTimeout(() => { window.location.href = '/'; }, 500);
  };

  const handleExport = () => {
    const payload = { version: 1, exportedAt: new Date().toISOString(), settings: collectSettings() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ga-toolkit-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('toast.settingsExported'));
  };

  const processImportFile = (file: File) => {
    if (!file.name.endsWith('.json')) { toast.error(t('toast.invalidFile')); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const settings = parsed.settings ?? parsed;
        for (const [key, value] of Object.entries(settings)) {
          if (ALL_PREF_KEYS.includes(key)) localStorage.setItem(key, JSON.stringify(value));
        }
        toast.success(t('toast.settingsImported'));
        setTimeout(() => window.location.reload(), 1200);
      } catch { toast.error(t('toast.importFailed')); }
    };
    reader.readAsText(file);
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) processImportFile(file); };
    input.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setImportDragOver(false);
    const file = e.dataTransfer.files?.[0]; if (file) processImportFile(file);
  };

  const handleResetAll = () => {
    for (const key of ALL_PREF_KEYS) localStorage.removeItem(key);
    toast.success(t('toast.resetAll'));
    setTimeout(() => window.location.reload(), 1000);
  };

  const themeOptions = [
    { value: 'light', label: t('settings.light'), Icon: Sun },
    { value: 'dark', label: t('settings.dark'), Icon: Moon },
    { value: 'system', label: t('settings.system'), Icon: Monitor },
  ] as const;

  const fontOptions = [
    { value: 'sm', label: t('common.small'), sizeClass: 'text-sm' },
    { value: 'md', label: t('common.medium'), sizeClass: 'text-base' },
    { value: 'lg', label: t('common.large'), sizeClass: 'text-lg' },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 flex flex-col max-h-[85vh]">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            {t('settings.title')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(85vh-60px)]">
          <div className="p-4 space-y-5">
            {/* Appearance */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Palette className="h-4 w-4 text-primary" />
                {t('settings.appearance')}
              </div>
              <RadioGroup value={theme} onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')} className="grid grid-cols-3 gap-2">
                {themeOptions.map(({ value, label, Icon }) => (
                  <Label key={value} htmlFor={`sd-theme-${value}`} className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors [&:has([data-state=checked])]:border-primary">
                    <RadioGroupItem value={value} id={`sd-theme-${value}`} className="sr-only" />
                    <Icon className="h-5 w-5" /><span className="text-xs font-medium">{label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </section>

            <Separator />

            {/* Font Size */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Type className="h-4 w-4 text-primary" />
                {t('settings.fontSize')}
              </div>
              <RadioGroup value={fontSize} onValueChange={(v) => setFontSize(v as 'sm' | 'md' | 'lg')} className="grid grid-cols-3 gap-2">
                {fontOptions.map(({ value, label, sizeClass }) => (
                  <Label key={value} htmlFor={`sd-font-${value}`} className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors [&:has([data-state=checked])]:border-primary">
                    <RadioGroupItem value={value} id={`sd-font-${value}`} className="sr-only" />
                    <span className={`${sizeClass} font-bold`}>A</span><span className="text-xs font-medium">{label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </section>

            <Separator />

            {/* Language */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4 text-primary" />
                {t('settings.language')}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {LANGUAGES.map(({ value, label, flag }) => (
                  <button key={value} onClick={() => { setLanguage(value); toast.success(`Language set to ${label}`); }}
                    className={`flex items-center gap-2 rounded-lg border-2 px-2.5 py-2 text-xs font-medium transition-colors hover:bg-accent cursor-pointer ${language === value ? 'border-primary bg-primary/5 text-primary' : 'border-muted bg-popover text-foreground'}`}>
                    <span className="text-sm leading-none">{flag}</span>
                    <span className="truncate">{label}</span>
                    {language === value && <CheckCircle2 className="h-3 w-3 ml-auto shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-3.5">Beta</Badge>
                {t('settings.languageBeta')}
              </p>
            </section>

            <Separator />

            {/* Export / Import */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Download className="h-4 w-4 text-primary" />
                {t('settings.exportImport')}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleExport} variant="outline" size="sm" className="gap-1.5 flex-1 text-xs"><Download className="h-3.5 w-3.5" />{t('settings.exportJson')}</Button>
                <Button onClick={handleImportClick} variant="outline" size="sm" className="gap-1.5 flex-1 text-xs"><Upload className="h-3.5 w-3.5" />{t('settings.importJson')}</Button>
              </div>
              <div onDragOver={(e) => { e.preventDefault(); setImportDragOver(true); }} onDragLeave={() => setImportDragOver(false)} onDrop={handleDrop}
                className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${importDragOver ? 'border-primary bg-primary/5 text-primary' : 'border-muted text-muted-foreground'}`}>
                <Upload className="h-5 w-5 mx-auto mb-1.5 opacity-50" />
                <p className="text-xs font-medium">{t('settings.dragDrop')}</p>
              </div>
            </section>

            <Separator />

            {/* Install App */}
            {!isInstalled && (
              <>
                <section className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Smartphone className="h-4 w-4 text-primary" />
                    {t('install.settingsTitle')}
                  </div>
                  <div className="flex gap-2">
                    {canInstall && (
                      <Button onClick={promptInstall} size="sm" className="gap-1.5 text-xs">
                        <Download className="h-3.5 w-3.5" />{t('install.settingsButton')}
                      </Button>
                    )}
                    <Button onClick={() => { onOpenChange(false); navigate('/install'); }} variant="outline" size="sm" className="gap-1.5 text-xs">
                      <Smartphone className="h-3.5 w-3.5" />{t('install.settingsGoToInstall')}
                    </Button>
                  </div>
                </section>
                <Separator />
              </>
            )}

            {/* Onboarding Tour */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <GraduationCap className="h-4 w-4 text-primary" />
                {t('settings.onboardingTour')}
              </div>
              <Button onClick={handleRestartTour} variant="outline" size="sm" className="gap-1.5 text-xs"><RotateCcw className="h-3.5 w-3.5" />{t('settings.restartTour')}</Button>
            </section>

            <Separator />

            {/* Danger Zone */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {t('settings.dangerZone')}
              </div>
              <div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-1.5 text-xs"><Trash2 className="h-3.5 w-3.5" />{t('settings.resetEverything')}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />{t('settings.resetConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('settings.resetConfirmDesc')}<br /><br />{t('settings.resetConfirmHint')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('settings.yesReset')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

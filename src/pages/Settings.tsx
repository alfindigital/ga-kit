import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useFontSize } from '@/contexts/FontSizeContext';
import { useLanguage, LANGUAGES } from '@/contexts/LanguageContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sun, Moon, Monitor, RotateCcw, Palette, Type, GraduationCap,
  Globe, Download, Upload, Trash2, AlertTriangle, CheckCircle2,
  Settings as SettingsIcon,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { Separator } from '@/components/ui/separator';

// All localStorage keys managed by the app
const ALL_PREF_KEYS = [
  'ga-toolkit-theme',
  'ga-toolkit-font-size',
  'ga-toolkit-language',
  'ga-toolkit-tour-completed',
  'ga-toolkit-favorites',
  'ga-toolkit-recent-pages',
  'ga-toolkit-url-history',
  'ga-toolkit-search-history',
  'ga-toolkit-usage-stats',
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

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const { language, setLanguage } = useLanguage();
  const [, setHasSeenTour] = useLocalStorage('ga-toolkit-tour-completed', false);
  const [importDragOver, setImportDragOver] = useState(false);

  /* ── Tour ── */
  const handleRestartTour = () => {
    setHasSeenTour(false);
    toast.success('Tour will restart on next visit to Home');
    setTimeout(() => { window.location.href = '/'; }, 500);
  };

  /* ── Export ── */
  const handleExport = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: collectSettings(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ga-toolkit-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported!', { description: 'JSON file downloaded to your device.' });
  };

  /* ── Import ── */
  const processImportFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast.error('Invalid file', { description: 'Please choose a .json settings file.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const settings = parsed.settings ?? parsed;
        let count = 0;
        for (const [key, value] of Object.entries(settings)) {
          if (ALL_PREF_KEYS.includes(key)) {
            localStorage.setItem(key, JSON.stringify(value));
            count++;
          }
        }
        toast.success(`Settings imported!`, { description: `${count} preference(s) restored. Reloading…` });
        setTimeout(() => window.location.reload(), 1200);
      } catch {
        toast.error('Import failed', { description: 'File is not a valid settings export.' });
      }
    };
    reader.readAsText(file);
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) processImportFile(file);
    };
    input.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setImportDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImportFile(file);
  };

  /* ── Reset All ── */
  const handleResetAll = () => {
    for (const key of ALL_PREF_KEYS) {
      localStorage.removeItem(key);
    }
    toast.success('All preferences reset', { description: 'Reloading to apply defaults…' });
    setTimeout(() => window.location.reload(), 1000);
  };

  /* ── Section component ── */
  const SectionHeader = ({ icon: Icon, title, description }: {
    icon: React.ElementType; title: string; description: string;
  }) => (
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  );

  const themeOptions = [
    { value: 'light', label: 'Light', Icon: Sun },
    { value: 'dark',  label: 'Dark',  Icon: Moon },
    { value: 'system', label: 'System', Icon: Monitor },
  ] as const;

  const fontOptions = [
    { value: 'sm', label: 'Small',  sizeClass: 'text-xs' },
    { value: 'md', label: 'Medium', sizeClass: 'text-base' },
    { value: 'lg', label: 'Large',  sizeClass: 'text-xl' },
  ] as const;

  return (
    <div className="container max-w-2xl px-4 py-6 sm:py-8 space-y-6">

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Customize your GA Toolkit experience</p>
        </div>
      </div>

      {/* ── Appearance ── */}
      <Card>
        <SectionHeader icon={Palette} title="Appearance" description="Choose your preferred theme for the interface" />
        <CardContent>
          <RadioGroup
            value={theme}
            onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}
            className="grid grid-cols-3 gap-3"
          >
            {themeOptions.map(({ value, label, Icon }) => (
              <Label
                key={value}
                htmlFor={`theme-${value}`}
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors [&:has([data-state=checked])]:border-primary"
              >
                <RadioGroupItem value={value} id={`theme-${value}`} className="sr-only" />
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{label}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* ── Font Size ── */}
      <Card>
        <SectionHeader icon={Type} title="Font Size" description="Adjust the text size for better readability" />
        <CardContent className="space-y-4">
          <RadioGroup
            value={fontSize}
            onValueChange={(v) => setFontSize(v as 'sm' | 'md' | 'lg')}
            className="grid grid-cols-3 gap-3"
          >
            {fontOptions.map(({ value, label, sizeClass }) => (
              <Label
                key={value}
                htmlFor={`font-${value}`}
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors [&:has([data-state=checked])]:border-primary"
              >
                <RadioGroupItem value={value} id={`font-${value}`} className="sr-only" />
                <span className={`${sizeClass} font-bold`}>A</span>
                <span className="text-sm font-medium">{label}</span>
              </Label>
            ))}
          </RadioGroup>
          <div className="rounded-lg bg-muted/50 p-4 border">
            <p className="text-sm text-muted-foreground">
              Preview: This is how text appears with your current font size setting.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Language ── */}
      <Card>
        <SectionHeader
          icon={Globe}
          title="Language"
          description="Choose the display language for the interface"
        />
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LANGUAGES.map(({ value, label, flag }) => (
              <button
                key={value}
                onClick={() => {
                  setLanguage(value);
                  toast.success(`Language set to ${label}`, {
                    description: 'Full translations coming soon — UI will update progressively.',
                  });
                }}
                className={`flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent cursor-pointer ${
                  language === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-muted bg-popover text-foreground'
                }`}
              >
                <span className="text-lg leading-none">{flag}</span>
                <span className="truncate">{label}</span>
                {language === value && (
                  <CheckCircle2 className="h-3.5 w-3.5 ml-auto shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">Beta</Badge>
            Full localisation is in progress. Some text may remain in English.
          </p>
        </CardContent>
      </Card>

      {/* ── Export / Import ── */}
      <Card>
        <SectionHeader
          icon={Download}
          title="Export & Import Settings"
          description="Back up your preferences and history, or restore them on a new device"
        />
        <CardContent className="space-y-4">
          {/* Export */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleExport} variant="outline" className="gap-2 flex-1">
              <Download className="h-4 w-4" />
              Export to JSON
            </Button>
            <Button onClick={handleImportClick} variant="outline" className="gap-2 flex-1">
              <Upload className="h-4 w-4" />
              Import from JSON
            </Button>
          </div>

          {/* Drag-and-drop drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setImportDragOver(true); }}
            onDragLeave={() => setImportDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              importDragOver
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-muted text-muted-foreground'
            }`}
          >
            <Upload className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Drag & drop a settings JSON file here</p>
            <p className="text-xs mt-1 opacity-70">or click "Import from JSON" above</p>
          </div>

          <p className="text-xs text-muted-foreground">
            The export includes: theme, font size, language, tool history, ROAS scenarios, and usage stats.
          </p>
        </CardContent>
      </Card>

      {/* ── Onboarding Tour ── */}
      <Card>
        <SectionHeader
          icon={GraduationCap}
          title="Onboarding Tour"
          description="Replay the interactive guide to learn about all the features"
        />
        <CardContent>
          <Button onClick={handleRestartTour} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Restart Tour
          </Button>
        </CardContent>
      </Card>

      {/* ── Danger Zone ── */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently reset all preferences, history, and stored data to factory defaults
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator className="bg-destructive/20" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Reset all preferences</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Clears theme, font, language, history, favorites, and all tool data.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2 shrink-0">
                  <Trash2 className="h-4 w-4" />
                  Reset Everything
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Reset all preferences?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your saved data — theme, font size, language, URL history,
                    ROAS scenarios, favorites, and usage stats. This action cannot be undone.
                    <br /><br />
                    Consider exporting your settings first.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

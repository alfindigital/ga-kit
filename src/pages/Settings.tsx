import { useTheme } from '@/contexts/ThemeContext';
import { useFontSize } from '@/contexts/FontSizeContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor, RotateCcw, Palette, Type, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const [, setHasSeenTour] = useLocalStorage('ga-toolkit-tour-completed', false);

  const handleRestartTour = () => {
    setHasSeenTour(false);
    toast.success('Tour will restart on page reload');
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  };

  return (
    <div className="container max-w-2xl px-4 py-6 sm:py-8 space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Customize your GA Toolkit experience
        </p>
      </div>

      {/* Appearance Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>
            Choose your preferred theme for the interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={theme}
            onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
            className="grid grid-cols-3 gap-3"
          >
            <Label
              htmlFor="theme-light"
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="light" id="theme-light" className="sr-only" />
              <Sun className="h-6 w-6" />
              <span className="text-sm font-medium">Light</span>
            </Label>
            <Label
              htmlFor="theme-dark"
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
              <Moon className="h-6 w-6" />
              <span className="text-sm font-medium">Dark</span>
            </Label>
            <Label
              htmlFor="theme-system"
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="system" id="theme-system" className="sr-only" />
              <Monitor className="h-6 w-6" />
              <span className="text-sm font-medium">System</span>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Font Size Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Type className="h-5 w-5 text-primary" />
            Font Size
          </CardTitle>
          <CardDescription>
            Adjust the text size for better readability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={fontSize}
            onValueChange={(value) => setFontSize(value as 'sm' | 'md' | 'lg')}
            className="grid grid-cols-3 gap-3"
          >
            <Label
              htmlFor="font-sm"
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="sm" id="font-sm" className="sr-only" />
              <span className="text-xs font-bold">A</span>
              <span className="text-sm font-medium">Small</span>
            </Label>
            <Label
              htmlFor="font-md"
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="md" id="font-md" className="sr-only" />
              <span className="text-base font-bold">A</span>
              <span className="text-sm font-medium">Medium</span>
            </Label>
            <Label
              htmlFor="font-lg"
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="lg" id="font-lg" className="sr-only" />
              <span className="text-xl font-bold">A</span>
              <span className="text-sm font-medium">Large</span>
            </Label>
          </RadioGroup>
          <div className="rounded-lg bg-muted/50 p-4 border">
            <p className="text-sm text-muted-foreground">
              Preview: This is how text appears with your current font size setting.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Tour Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5 text-primary" />
            Onboarding Tour
          </CardTitle>
          <CardDescription>
            Replay the interactive guide to learn about all the features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRestartTour} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Restart Tour
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

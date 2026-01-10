import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Sparkles, RotateCcw } from 'lucide-react';

const tourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="text-center">
        <div className="mb-3 text-3xl">🎉</div>
        <h3 className="text-lg font-semibold mb-2">Welcome to GA Toolkit!</h3>
        <p className="text-sm text-muted-foreground">
          Let's take a quick tour to discover all the powerful features at your fingertips.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="tools-grid"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">🛠️ Your Toolkit</h3>
        <p className="text-sm text-muted-foreground">
          All your marketing tools in one place: UTM Builder, QR Generator, Keyword Tools, and more!
        </p>
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="command-palette"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">⌘ Command Palette</h3>
        <p className="text-sm text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">K</kbd> anytime to quickly navigate, search, and execute actions!
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="theme-toggle"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">🎨 Theme Switching</h3>
        <p className="text-sm text-muted-foreground">
          Switch between light, dark, or system theme to match your preference.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="keyboard-shortcuts"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">⌨️ Keyboard Shortcuts</h3>
        <p className="text-sm text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">?</kbd> anytime to see all available keyboard shortcuts for power users!
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="navigation"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">🧭 Quick Navigation</h3>
        <p className="text-sm text-muted-foreground">
          Use <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">1-7</kbd> to jump directly to any tool!
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div className="text-center">
        <div className="mb-3 text-3xl">🚀</div>
        <h3 className="text-lg font-semibold mb-2">You're All Set!</h3>
        <p className="text-sm text-muted-foreground">
          Start exploring the tools and boost your marketing workflow. You can always restart this tour from the settings.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
];

interface OnboardingTourProps {
  forceStart?: boolean;
  onComplete?: () => void;
}

export function OnboardingTour({ forceStart = false, onComplete }: OnboardingTourProps) {
  const { resolvedTheme } = useTheme();
  const [hasSeenTour, setHasSeenTour] = useLocalStorage('ga-toolkit-tour-completed', false);
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Start tour for first-time users after a short delay
    if (!hasSeenTour || forceStart) {
      const timer = setTimeout(() => {
        setRunTour(true);
        setStepIndex(0);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour, forceStart]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      setHasSeenTour(true);
      onComplete?.();
    }

    // Handle step navigation
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      if (action === ACTIONS.NEXT) {
        setStepIndex(index + 1);
      } else if (action === ACTIONS.PREV) {
        setStepIndex(index - 1);
      }
    }
  };

  const isDark = resolvedTheme === 'dark';

  return (
    <Joyride
      steps={tourSteps}
      run={runTour}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      spotlightClicks
      disableOverlayClose
      callback={handleJoyrideCallback}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
      styles={{
        options: {
          arrowColor: isDark ? 'hsl(240 10% 3.9%)' : 'hsl(0 0% 100%)',
          backgroundColor: isDark ? 'hsl(240 10% 3.9%)' : 'hsl(0 0% 100%)',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          primaryColor: 'hsl(var(--primary))',
          textColor: isDark ? 'hsl(0 0% 98%)' : 'hsl(240 10% 3.9%)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '16px',
          fontWeight: 600,
        },
        tooltipContent: {
          padding: '8px 0',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: '8px',
          fontSize: '14px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: isDark ? 'hsl(0 0% 98%)' : 'hsl(240 10% 3.9%)',
          marginRight: '8px',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: '13px',
        },
        spotlight: {
          borderRadius: '12px',
        },
        beacon: {
          display: 'none',
        },
      }}
      floaterProps={{
        styles: {
          floater: {
            filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1))',
          },
        },
      }}
    />
  );
}

// Button component to restart the tour
export function RestartTourButton() {
  const [, setHasSeenTour] = useLocalStorage('ga-toolkit-tour-completed', false);
  const [showTour, setShowTour] = useState(false);

  const handleRestartTour = () => {
    setHasSeenTour(false);
    setShowTour(true);
    // Reload after a brief moment to restart the tour
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRestartTour}
      className="gap-2"
    >
      <RotateCcw className="h-4 w-4" />
      Restart Tour
    </Button>
  );
}

// Welcome banner for users who completed the tour
export function WelcomeBanner() {
  const [hasSeenTour] = useLocalStorage('ga-toolkit-tour-completed', false);
  const [dismissed, setDismissed] = useLocalStorage('ga-toolkit-welcome-dismissed', false);

  if (!hasSeenTour || dismissed) return null;

  return (
    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">Welcome aboard! 🎉</p>
          <p className="text-xs text-muted-foreground mt-1">
            You've completed the tour. Press <kbd className="px-1 py-0.5 text-xs bg-muted rounded">?</kbd> for shortcuts or <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Ctrl+K</kbd> for quick actions.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="text-xs"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS, TooltipRenderProps } from 'react-joyride';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Sparkles, RotateCcw, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const tourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="text-center">
        <div className="mb-4 text-4xl">🎉</div>
        <h3 className="text-lg font-semibold mb-2 text-foreground">Welcome to GA Toolkit!</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
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
        <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
          <span className="text-lg">🛠️</span> Your Toolkit
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
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
        <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
          <span className="text-lg">⌘</span> Command Palette
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Press <kbd className="px-2 py-1 text-xs font-mono bg-secondary border border-border rounded-md shadow-sm">Ctrl</kbd> + <kbd className="px-2 py-1 text-xs font-mono bg-secondary border border-border rounded-md shadow-sm">K</kbd> anytime to quickly navigate, search, and execute actions!
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
        <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
          <span className="text-lg">🎨</span> Theme Switching
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
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
        <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
          <span className="text-lg">⌨️</span> Keyboard Shortcuts
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Press <kbd className="px-2 py-1 text-xs font-mono bg-secondary border border-border rounded-md shadow-sm">?</kbd> anytime to see all available keyboard shortcuts for power users!
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
        <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
          <span className="text-lg">🧭</span> Quick Navigation
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Use <kbd className="px-2 py-1 text-xs font-mono bg-secondary border border-border rounded-md shadow-sm">Ctrl</kbd> + <kbd className="px-2 py-1 text-xs font-mono bg-secondary border border-border rounded-md shadow-sm">1-7</kbd> to jump directly to any tool!
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
        <div className="mb-4 text-4xl">🚀</div>
        <h3 className="text-lg font-semibold mb-2 text-foreground">You're All Set!</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Start exploring the tools and boost your marketing workflow. You can always restart this tour from the settings.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
];

// Custom tooltip component with progress bar
function CustomTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  size,
  isLastStep,
}: TooltipRenderProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const progress = ((index + 1) / size) * 100;
  const stepsRemaining = size - index - 1;

  return (
    <div
      {...tooltipProps}
      className={`
        max-w-sm rounded-xl p-6 border shadow-2xl
        ${isDark 
          ? 'bg-card border-border/50' 
          : 'bg-card border-border'
        }
      `}
      style={{
        boxShadow: isDark 
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 12px 24px -8px rgba(0, 0, 0, 0.4)' 
          : '0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 12px 24px -8px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Header with step counter and skip button */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-muted-foreground">
          Step {index + 1} of {size}
        </span>
        <button
          {...skipProps}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip Tour
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <Progress value={progress} className="h-1.5" />
        <p className="text-xs text-muted-foreground mt-1.5">
          {stepsRemaining === 0 
            ? "Last step!" 
            : `${stepsRemaining} step${stepsRemaining > 1 ? 's' : ''} remaining`
          }
        </p>
      </div>

      {/* Content */}
      <div className="mb-6">
        {step.content}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <div>
          {index > 0 && (
            <Button
              {...backProps}
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>
        <Button
          {...primaryProps}
          size="sm"
          className="gap-1.5"
        >
          {isLastStep ? (
            <>
              Finish
              <Sparkles className="h-4 w-4" />
            </>
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
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
      scrollToFirstStep
      spotlightClicks
      disableOverlayClose
      callback={handleJoyrideCallback}
      tooltipComponent={CustomTooltip}
      styles={{
        options: {
          arrowColor: isDark ? 'hsl(220, 15%, 13%)' : 'hsl(0, 0%, 100%)',
          overlayColor: 'rgba(0, 0, 0, 0.55)',
          zIndex: 10000,
        },
        spotlight: {
          borderRadius: '12px',
          boxShadow: isDark 
            ? '0 0 0 4px rgba(96, 165, 250, 0.25)' 
            : '0 0 0 4px rgba(59, 130, 246, 0.2)',
        },
      }}
      floaterProps={{
        styles: {
          floater: {
            filter: isDark 
              ? 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.4))' 
              : 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1))',
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
    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-border">
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Welcome aboard! 🎉</p>
          <p className="text-xs text-muted-foreground mt-1">
            You've completed the tour. Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-secondary border border-border rounded-md">?</kbd> for shortcuts or <kbd className="px-1.5 py-0.5 text-xs font-mono bg-secondary border border-border rounded-md">Ctrl+K</kbd> for quick actions.
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

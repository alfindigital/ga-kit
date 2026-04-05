import React, { useState, useEffect, useMemo } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS, TooltipRenderProps } from 'react-joyride';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Sparkles, RotateCcw, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';

function useTourSteps(): Step[] {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return useMemo(() => {
    const steps: Step[] = [
      {
        target: 'body',
        content: (
          <div className="text-center">
            <div className="mb-3 text-3xl">🎉</div>
            <h3 className="text-base font-semibold mb-1.5 text-foreground">{t('tour.welcome')}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('tour.welcomeDesc')}</p>
          </div>
        ),
        placement: 'center' as const,
        disableBeacon: true,
      },
      {
        target: '[data-tour="tools-grid"]',
        content: (
          <div>
            <h3 className="font-semibold mb-1.5 text-foreground flex items-center gap-2 text-sm">
              🛠️ {t('tour.toolkit')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('tour.toolkitDesc')}</p>
            <p className="text-xs text-muted-foreground mt-1.5">
              ⭐ Tap bintang untuk pin ke Quick Access.
            </p>
          </div>
        ),
        placement: 'top' as const,
        disableBeacon: true,
      },
      {
        target: '[data-tour="command-palette"]',
        content: (
          <div>
            <h3 className="font-semibold mb-1.5 text-foreground flex items-center gap-2 text-sm">
              ⌘ {t('tour.commandPalette')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isMobile 
                ? 'Tap logo untuk kembali ke Dashboard.' 
                : <><kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-secondary border border-border rounded">Ctrl+K</kbd> {t('tour.commandPaletteDesc')}</>
              }
            </p>
          </div>
        ),
        placement: 'bottom' as const,
        disableBeacon: true,
      },
      {
        target: '[data-tour="theme-toggle"]',
        content: (
          <div>
            <h3 className="font-semibold mb-1.5 text-foreground flex items-center gap-2 text-sm">
              🎨 {t('tour.themeSwitching')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('tour.themeSwitchingDesc')}</p>
          </div>
        ),
        placement: 'bottom' as const,
        disableBeacon: true,
      },
    ];

    // Desktop-only steps
    if (!isMobile) {
      steps.push(
        {
          target: '[data-tour="keyboard-shortcuts"]',
          content: (
            <div>
              <h3 className="font-semibold mb-1.5 text-foreground flex items-center gap-2 text-sm">
                ⌨️ {t('tour.keyboardShortcuts')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-secondary border border-border rounded">?</kbd> {t('tour.keyboardShortcutsDesc')}
              </p>
            </div>
          ),
          placement: 'bottom' as const,
          disableBeacon: true,
        },
        {
          target: '[data-tour="navigation"]',
          content: (
            <div>
              <h3 className="font-semibold mb-1.5 text-foreground flex items-center gap-2 text-sm">
                🧭 {t('tour.quickNav')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-secondary border border-border rounded">Ctrl+1-7</kbd> {t('tour.quickNavDesc')}
              </p>
            </div>
          ),
          placement: 'bottom' as const,
          disableBeacon: true,
        }
      );
    }

    // Final step
    steps.push({
      target: 'body',
      content: (
        <div className="text-center">
          <div className="mb-3 text-3xl">🚀</div>
          <h3 className="text-base font-semibold mb-1.5 text-foreground">{t('tour.allSet')}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('tour.allSetDesc')}</p>
        </div>
      ),
      placement: 'center' as const,
      disableBeacon: true,
    });

    return steps;
  }, [t, isMobile]);
}

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
  const { t } = useTranslation();
  const isDark = resolvedTheme === 'dark';
  const progress = ((index + 1) / size) * 100;

  return (
    <div
      {...tooltipProps}
      className={`
        w-[calc(100vw-2rem)] max-w-xs rounded-xl p-4 sm:p-5 border shadow-2xl
        animate-scale-in transition-all duration-300 ease-out
        ${isDark ? 'bg-card border-border/50' : 'bg-card border-border'}
      `}
      style={{
        boxShadow: isDark
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
          : '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium text-muted-foreground">
          {index + 1}/{size}
        </span>
        <button
          {...skipProps}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Progress value={progress} className="h-1 mb-3" />

      <div className="mb-4">
        {step.content}
      </div>

      <div className="flex items-center justify-between">
        <div>
          {index > 0 && (
            <Button
              {...backProps}
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-muted-foreground hover:text-foreground h-8 px-2"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t('tour.back')}
            </Button>
          )}
        </div>
        <Button
          {...primaryProps}
          size="sm"
          className="gap-1 text-xs h-8 px-3"
        >
          {isLastStep ? (
            <>
              {t('tour.finish')}
              <Sparkles className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              {t('tour.next')}
              <ChevronRight className="h-3.5 w-3.5" />
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
  const tourSteps = useTourSteps();

  useEffect(() => {
    if (!hasSeenTour || forceStart) {
      const timer = setTimeout(() => {
        setRunTour(true);
        setStepIndex(0);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTour, forceStart]);

  // Close tour on ESC key
  useEffect(() => {
    if (!runTour) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRunTour(false);
        setHasSeenTour(true);
        onComplete?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runTour, setHasSeenTour, onComplete]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      setHasSeenTour(true);
      onComplete?.();
    }

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
      disableCloseOnEsc={false}
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

export function RestartTourButton() {
  const [, setHasSeenTour] = useLocalStorage('ga-toolkit-tour-completed', false);
  const { t } = useTranslation();

  const handleRestartTour = () => {
    setHasSeenTour(false);
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
      {t('tour.restartTour')}
    </Button>
  );
}

export const WelcomeBanner = React.forwardRef<HTMLDivElement>(function WelcomeBanner(_props, ref) {
  const [hasSeenTour] = useLocalStorage('ga-toolkit-tour-completed', false);
  const [dismissed, setDismissed] = useLocalStorage('ga-toolkit-welcome-dismissed', false);
  const { t } = useTranslation();

  if (!hasSeenTour || dismissed) return null;

  return (
    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-border">
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{t('tour.welcomeAboard')}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('tour.welcomeAboardDesc')} <kbd className="px-1.5 py-0.5 text-xs font-mono bg-secondary border border-border rounded-md">?</kbd> {t('tour.welcomeAboardDesc')} <kbd className="px-1.5 py-0.5 text-xs font-mono bg-secondary border border-border rounded-md">Ctrl+K</kbd> {t('tour.forQuickActions')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDismissed(true)}
          className="h-7 w-7 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

WelcomeBanner.displayName = "WelcomeBanner";

import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from './Header';

import { BottomTabNav } from './BottomTabNav';
import { PageTransition } from '../PageTransition';
import { PullToRefresh } from '../PullToRefresh';
import { KeyboardShortcutsDialog } from '../KeyboardShortcutsDialog';
import { CommandPalette } from '../CommandPalette';
import { OnboardingTour } from '../OnboardingTour';
import { useShortcutAction } from '@/contexts/ShortcutsContext';
import { useRecentPages } from '@/hooks/useRecentPages';
import { toast } from '@/hooks/use-toast';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Track recently visited pages
  useRecentPages();

  // Global navigation shortcuts (editable via Keyboard Shortcuts dialog)
  useShortcutAction('nav.dashboard', () => navigate('/'));
  useShortcutAction('nav.utmBuilder', () => navigate('/utm-builder'));
  useShortcutAction('nav.qrGenerator', () => navigate('/qr-generator'));
  useShortcutAction('nav.keywordCombiner', () => navigate('/keyword-combiner'));
  useShortcutAction('nav.keywordMixer', () => navigate('/keyword-mixer'));
  useShortcutAction('nav.keywordTools', () => navigate('/keyword-tools'));
  useShortcutAction('nav.ytFinder', () => navigate('/yt-finder'));
  useShortcutAction('global.showShortcuts', () => setShortcutsOpen((o) => !o));

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    navigate(location.pathname, { replace: true });
    toast({
      title: "Refreshed",
      description: "Page content updated",
      duration: 2000,
    });
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background overflow-x-hidden">
      <Header />
      <main className="flex-1 container px-3 sm:px-4 lg:px-6 py-4 sm:py-6 pb-20 lg:pb-6">
        <PullToRefresh onRefresh={handleRefresh}>
          <PageTransition>
            {children}
          </PageTransition>
        </PullToRefresh>
      </main>

      <BottomTabNav />
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <CommandPalette onOpenShortcuts={() => setShortcutsOpen(true)} />
      <OnboardingTour />
    </div>
  );
}

import React, { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from './Header';

import { BottomTabNav } from './BottomTabNav';
import { PageTransition } from '../PageTransition';
import { PullToRefresh } from '../PullToRefresh';
import { KeyboardShortcutsDialog } from '../KeyboardShortcutsDialog';
import { CommandPalette } from '../CommandPalette';
import { OnboardingTour } from '../OnboardingTour';
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRecentPages } from '@/hooks/useRecentPages';
import { toast } from '@/hooks/use-toast';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = React.forwardRef<HTMLDivElement, LayoutProps>(function Layout({ children }, ref) {
  const location = useLocation();
  const navigate = useNavigate();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  
  // Enable global keyboard shortcuts
  useGlobalShortcuts();
  
  // Track recently visited pages
  useRecentPages();

  const handleRefresh = useCallback(async () => {
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Re-navigate to trigger a re-render
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

import { useLocation } from 'react-router-dom';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [phase, setPhase] = useState<'enter' | 'exit' | 'idle'>('enter');
  const [displayedChildren, setDisplayedChildren] = useState(children);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname === prevPath.current) {
      setDisplayedChildren(children);
      return;
    }

    // Exit phase
    setPhase('exit');

    const exitTimer = setTimeout(() => {
      setDisplayedChildren(children);
      prevPath.current = location.pathname;
      setPhase('enter');

      const idleTimer = setTimeout(() => setPhase('idle'), 400);
      return () => clearTimeout(idleTimer);
    }, 180);

    return () => clearTimeout(exitTimer);
  }, [location.pathname, children]);

  // Initial mount
  useEffect(() => {
    const timer = setTimeout(() => setPhase('idle'), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "page-transition",
        phase === 'enter' && "page-enter",
        phase === 'exit' && "page-exit",
        phase === 'idle' && "page-idle"
      )}
    >
      {displayedChildren}
    </div>
  );
}
import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useLocalStorage } from './useLocalStorage';

const MAX_RECENT_PAGES = 5;

const TRACKABLE_PATHS = [
  '/utm-builder',
  '/keyword-combiner', 
  '/keyword-mixer',
  '/keyword-tools',
  '/yt-finder',
  '/qr-generator',
];

export function useRecentPages() {
  const location = useLocation();
  const [recentPages, setRecentPages] = useLocalStorage<string[]>('recent-pages', []);

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Only track tool pages, not dashboard
    if (!TRACKABLE_PATHS.includes(currentPath)) {
      return;
    }

    setRecentPages((prev) => {
      // Remove if already exists
      const filtered = prev.filter(p => p !== currentPath);
      // Add to front
      const updated = [currentPath, ...filtered];
      // Limit size
      return updated.slice(0, MAX_RECENT_PAGES);
    });
  }, [location.pathname, setRecentPages]);

  return recentPages;
}

export function getRecentPages(): string[] {
  try {
    const stored = localStorage.getItem('recent-pages');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

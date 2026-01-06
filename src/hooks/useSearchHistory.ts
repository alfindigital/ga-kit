import { useState, useCallback, useEffect } from 'react';

export interface SearchHistoryItem {
  id: string;
  name: string; // User-defined label
  urls: string;
  videoCount: number;
  timestamp: number;
  preview: string; // First video ID or truncated URL for display
  starred: boolean; // Pin to top of history
}

const STORAGE_KEY = 'yt-finder-search-history';
const MAX_HISTORY_ITEMS = 10;

function getStoredHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: SearchHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>(() => getStoredHistory());

  // Sync with localStorage on mount
  useEffect(() => {
    setHistory(getStoredHistory());
  }, []);

  const addToHistory = useCallback((urls: string, videoIds: string[], name?: string) => {
    if (videoIds.length === 0) return;

    const preview = videoIds.length > 0 
      ? `${videoIds[0]}${videoIds.length > 1 ? ` +${videoIds.length - 1} more` : ''}`
      : urls.slice(0, 30);

    const defaultName = `Search ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newItem: SearchHistoryItem = {
      id: crypto.randomUUID(),
      name: name || defaultName,
      urls,
      videoCount: videoIds.length,
      timestamp: Date.now(),
      preview,
      starred: false,
    };

    setHistory(prev => {
      // Remove duplicates (same URLs content)
      const filtered = prev.filter(item => item.urls.trim() !== urls.trim());
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const updateHistoryName = useCallback((id: string, newName: string) => {
    setHistory(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, name: newName.trim() || item.name } : item
      );
      saveHistory(updated);
      return updated;
    });
  }, []);

  const toggleStar = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, starred: !item.starred } : item
      );
      saveHistory(updated);
      return updated;
    });
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore errors
    }
  }, []);

  // Sort history: starred items first, then by timestamp
  const sortedHistory = [...history].sort((a, b) => {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
    return b.timestamp - a.timestamp;
  });

  return {
    history: sortedHistory,
    addToHistory,
    updateHistoryName,
    toggleStar,
    removeFromHistory,
    clearHistory,
  };
}

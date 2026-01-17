import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';

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

// Zod schema for validating imported search history items
const SearchHistoryItemSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(500),
  urls: z.string().max(10000),
  videoCount: z.number(),
  timestamp: z.number().optional(),
  preview: z.string().max(500).optional(),
  starred: z.boolean().optional(),
}).strict();

const ImportedSearchHistorySchema = z.array(SearchHistoryItemSchema).max(100);

// Helper to sanitize strings to prevent XSS
function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

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

  const exportHistory = useCallback(() => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yt-finder-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [history]);

  const importHistory = useCallback((file: File): Promise<{ added: number; duplicates: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const rawText = e.target?.result as string;
          
          // Check for prototype pollution patterns before parsing
          if (rawText.includes('__proto__') || rawText.includes('constructor') || rawText.includes('prototype')) {
            reject(new Error('Invalid file: contains forbidden properties'));
            return;
          }
          
          const parsed = JSON.parse(rawText);
          
          // Validate with Zod schema
          const validationResult = ImportedSearchHistorySchema.safeParse(parsed);
          if (!validationResult.success) {
            reject(new Error('Invalid file format: data validation failed'));
            return;
          }
          
          const imported = validationResult.data;
          
          setHistory(prev => {
            const existingUrls = new Set(prev.map(item => item.urls.trim()));
            const newItems = imported.filter(item => 
              item.urls && item.id && !existingUrls.has(item.urls.trim())
            ).map(item => ({
              id: crypto.randomUUID(), // Generate new IDs to avoid conflicts
              name: sanitizeString(item.name),
              urls: sanitizeString(item.urls),
              videoCount: item.videoCount,
              timestamp: item.timestamp || Date.now(),
              preview: item.preview ? sanitizeString(item.preview) : sanitizeString(item.urls.slice(0, 30)),
              starred: item.starred ?? false,
            }));
            
            const duplicates = imported.length - newItems.length;
            const updated = [...prev, ...newItems].slice(0, MAX_HISTORY_ITEMS * 2); // Allow more for imports
            saveHistory(updated);
            
            resolve({ added: newItems.length, duplicates });
            return updated;
          });
        } catch {
          reject(new Error('Failed to parse file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
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
    exportHistory,
    importHistory,
  };
}

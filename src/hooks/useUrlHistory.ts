import { useState, useCallback, useEffect, useMemo } from 'react';

export type ToolType = 'utm' | 'qr' | 'yt-finder';

export interface UrlHistoryItem {
  id: string;
  url: string;
  originalUrl: string;
  toolType: ToolType;
  name: string;
  timestamp: number;
  starred: boolean;
  tags: string[];
  metadata: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
    channelName?: string;
    videoTitle?: string;
    qrContent?: string;
    // YT Finder specific
    videoCount?: number;
    channelCount?: number;
    channels?: string;
    topChannel?: string;
  };
}

export type DateFilter = 'all' | 'today' | 'week' | 'month';
export type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

export interface HistoryFilters {
  search: string;
  toolType: ToolType | 'all';
  dateRange: DateFilter;
  starredOnly: boolean;
}

const STORAGE_KEY = 'ga-toolkit-url-history';
const MAX_HISTORY_ITEMS = 100;
const LEGACY_UTM_KEY = 'utm-history';
const LEGACY_YT_KEY = 'yt-finder-search-history';

function getStoredHistory(): UrlHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Migrate from legacy storage
    const migrated: UrlHistoryItem[] = [];
    
    // Migrate UTM history
    const legacyUtm = localStorage.getItem(LEGACY_UTM_KEY);
    if (legacyUtm) {
      try {
        const utmItems = JSON.parse(legacyUtm) as { id: string; url: string; timestamp: number }[];
        utmItems.forEach(item => {
          let source = '', medium = '', campaign = '', term = '', content = '';
          try {
            const url = new URL(item.url);
            source = url.searchParams.get('utm_source') || '';
            medium = url.searchParams.get('utm_medium') || '';
            campaign = url.searchParams.get('utm_campaign') || '';
            term = url.searchParams.get('utm_term') || '';
            content = url.searchParams.get('utm_content') || '';
          } catch {}
          
          migrated.push({
            id: item.id,
            url: item.url,
            originalUrl: item.url.split('?')[0],
            toolType: 'utm',
            name: campaign || `UTM ${new Date(item.timestamp).toLocaleDateString()}`,
            timestamp: item.timestamp,
            starred: false,
            tags: [source, medium, campaign].filter(Boolean),
            metadata: { source, medium, campaign, term, content },
          });
        });
      } catch {}
    }
    
    // Migrate YT Finder history
    const legacyYt = localStorage.getItem(LEGACY_YT_KEY);
    if (legacyYt) {
      try {
        const ytItems = JSON.parse(legacyYt) as { id: string; name: string; urls: string; videoCount: number; timestamp: number; starred: boolean }[];
        ytItems.forEach(item => {
          migrated.push({
            id: item.id,
            url: item.urls,
            originalUrl: item.urls,
            toolType: 'yt-finder',
            name: item.name,
            timestamp: item.timestamp,
            starred: item.starred,
            tags: [`${item.videoCount} videos`],
            metadata: {},
          });
        });
      } catch {}
    }
    
    if (migrated.length > 0) {
      // Sort by timestamp and save
      migrated.sort((a, b) => b.timestamp - a.timestamp);
      const trimmed = migrated.slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return trimmed;
    }
    
    return [];
  } catch {
    return [];
  }
}

function saveHistory(items: UrlHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
  } catch {
    // Ignore storage errors
  }
}

function matchesDateFilter(timestamp: number, filter: DateFilter): boolean {
  if (filter === 'all') return true;
  
  const now = Date.now();
  const itemDate = new Date(timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (filter) {
    case 'today':
      return itemDate >= today;
    case 'week': {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= weekAgo;
    }
    case 'month': {
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
      return itemDate >= monthAgo;
    }
    default:
      return true;
  }
}

function matchesSearch(item: UrlHistoryItem, search: string): boolean {
  if (!search.trim()) return true;
  
  const searchLower = search.toLowerCase();
  return (
    item.name.toLowerCase().includes(searchLower) ||
    item.url.toLowerCase().includes(searchLower) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
    (item.metadata.campaign?.toLowerCase().includes(searchLower) ?? false) ||
    (item.metadata.channelName?.toLowerCase().includes(searchLower) ?? false)
  );
}

export function useUrlHistory() {
  const [history, setHistory] = useState<UrlHistoryItem[]>(() => getStoredHistory());
  const [filters, setFilters] = useState<HistoryFilters>({
    search: '',
    toolType: 'all',
    dateRange: 'all',
    starredOnly: false,
  });
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Sync with localStorage on mount
  useEffect(() => {
    setHistory(getStoredHistory());
  }, []);

  const addToHistory = useCallback((item: Omit<UrlHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: UrlHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    setHistory(prev => {
      // Remove duplicates (same URL)
      const filtered = prev.filter(h => h.url.trim() !== item.url.trim());
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      saveHistory(updated);
      return updated;
    });

    return newItem.id;
  }, []);

  const updateHistoryItem = useCallback((id: string, updates: Partial<Pick<UrlHistoryItem, 'name' | 'starred' | 'tags'>>) => {
    setHistory(prev => {
      const updated = prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
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

  const removeMultiple = useCallback((ids: string[]) => {
    setHistory(prev => {
      const idSet = new Set(ids);
      const updated = prev.filter(item => !idSet.has(item.id));
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback((toolType?: ToolType) => {
    setHistory(prev => {
      const updated = toolType 
        ? prev.filter(item => item.toolType !== toolType)
        : [];
      saveHistory(updated);
      return updated;
    });
  }, []);

  const exportHistory = useCallback((toolType?: ToolType) => {
    const dataToExport = toolType 
      ? history.filter(item => item.toolType === toolType)
      : history;
    const data = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ga-toolkit-history${toolType ? `-${toolType}` : ''}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [history]);

  const exportHistoryCsv = useCallback((items?: UrlHistoryItem[]) => {
    const dataToExport = items || history;
    const headers = ['Date', 'Name', 'Tool', 'URL', 'Source', 'Medium', 'Campaign', 'Tags'];
    const rows = dataToExport.map(item => [
      new Date(item.timestamp).toLocaleString(),
      item.name,
      item.toolType,
      item.url,
      item.metadata.source || '',
      item.metadata.medium || '',
      item.metadata.campaign || '',
      item.tags.join('; '),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ga-toolkit-history-${new Date().toISOString().split('T')[0]}.csv`;
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
          const imported = JSON.parse(e.target?.result as string) as UrlHistoryItem[];
          if (!Array.isArray(imported)) {
            reject(new Error('Invalid file format'));
            return;
          }

          setHistory(prev => {
            const existingUrls = new Set(prev.map(item => item.url.trim()));
            const newItems = imported.filter(item =>
              item.url && item.id && !existingUrls.has(item.url.trim())
            ).map(item => ({
              ...item,
              id: crypto.randomUUID(),
              timestamp: item.timestamp || Date.now(),
            }));

            const duplicates = imported.length - newItems.length;
            const updated = [...prev, ...newItems]
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, MAX_HISTORY_ITEMS);
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

  // Filtered and sorted history
  const filteredHistory = useMemo(() => {
    let result = history.filter(item => {
      if (filters.toolType !== 'all' && item.toolType !== filters.toolType) return false;
      if (filters.starredOnly && !item.starred) return false;
      if (!matchesDateFilter(item.timestamp, filters.dateRange)) return false;
      if (!matchesSearch(item, filters.search)) return false;
      return true;
    });

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'oldest':
        result.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    // Always show starred first
    result.sort((a, b) => {
      if (a.starred && !b.starred) return -1;
      if (!a.starred && b.starred) return 1;
      return 0;
    });

    return result;
  }, [history, filters, sortBy]);

  // Stats
  const stats = useMemo(() => ({
    total: history.length,
    byTool: {
      utm: history.filter(h => h.toolType === 'utm').length,
      qr: history.filter(h => h.toolType === 'qr').length,
      'yt-finder': history.filter(h => h.toolType === 'yt-finder').length,
    },
    starred: history.filter(h => h.starred).length,
  }), [history]);

  return {
    history: filteredHistory,
    allHistory: history,
    stats,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    addToHistory,
    updateHistoryItem,
    toggleStar,
    removeFromHistory,
    removeMultiple,
    clearHistory,
    exportHistory,
    exportHistoryCsv,
    importHistory,
  };
}

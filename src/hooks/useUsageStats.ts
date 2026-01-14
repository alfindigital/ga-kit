import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';

export interface UsageStats {
  utmsCreated: number;
  keywordsCombined: number;
  keywordsMixed: number;
  qrCodesGenerated: number;
  videosAnalyzed: number;
  lastUpdated: string;
}

const defaultStats: UsageStats = {
  utmsCreated: 0,
  keywordsCombined: 0,
  keywordsMixed: 0,
  qrCodesGenerated: 0,
  videosAnalyzed: 0,
  lastUpdated: new Date().toISOString(),
};

export function useUsageStats() {
  const [stats, setStats] = useLocalStorage<UsageStats>('ga-toolkit-usage-stats', defaultStats);

  const incrementStat = useCallback((key: keyof Omit<UsageStats, 'lastUpdated'>, amount: number = 1) => {
    setStats(prev => ({
      ...prev,
      [key]: prev[key] + amount,
      lastUpdated: new Date().toISOString(),
    }));
  }, [setStats]);

  const resetStats = useCallback(() => {
    setStats(defaultStats);
  }, [setStats]);

  return {
    stats,
    incrementStat,
    resetStats,
  };
}

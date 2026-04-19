import { useState, useRef, useCallback, useMemo } from 'react';
import { useShortcutAction } from '@/contexts/ShortcutsContext';
import { useUrlHistory } from '@/hooks/useUrlHistory';
import { Copy, RotateCcw, Youtube, ExternalLink, AlertTriangle, Search, X, History, Trash2, Clock, Pencil, Check, Star, Filter, ArrowUpDown, ArrowUp, ArrowDown, Download, Upload, Keyboard, BarChart3, Users, TrendingUp, FileText } from 'lucide-react';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useClipboard } from '@/hooks/useClipboard';
import { useExport } from '@/hooks/useExport';
import { useToast } from '@/hooks/use-toast';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useUsageStats } from '@/hooks/useUsageStats';
import { YTFinderSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { InputError } from '@/components/ui/input-error';
import { BulkUrlImport } from '@/components/BulkUrlImport';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface VideoData {
  videoUrl: string;
  title: string;
  channelName: string;
  channelUrl: string;
  status: 'success' | 'error';
  errorMessage?: string;
}

const CONCURRENCY_LIMIT = 5;

const fetchSingleVideo = async (id: string, signal: AbortSignal): Promise<VideoData> => {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
      { signal }
    );
    if (res.ok) {
      const json = await res.json();
      return {
        videoUrl: `https://www.youtube.com/watch?v=${id}`,
        title: json.title,
        channelName: json.author_name,
        channelUrl: json.author_url,
        status: 'success'
      };
    }
    throw new Error('Not found');
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      throw e;
    }
    return {
      videoUrl: `https://www.youtube.com/watch?v=${id}`,
      title: 'Failed to fetch', // kept as data, not UI label
      channelName: '-',
      channelUrl: '',
      status: 'error',
      errorMessage: 'Video may be private or deleted'
    };
  }
};

export default function YTFinder() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchButtonRef = useRef<HTMLButtonElement>(null);
  const { copy } = useClipboard();
  const { exportCsv, exportTxt } = useExport();
  const { toast } = useToast();
  const isLoading = usePageLoading(400);
  const { incrementStat } = useUsageStats();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { 
    history: urlHistory, 
    addToHistory, 
    updateHistoryItem, 
    toggleStar, 
    removeFromHistory, 
    clearHistory, 
    exportHistory, 
    importHistory,
  } = useUrlHistory();
  
  // Filter history to only show YT Finder items
  const ytHistory = useMemo(() => 
    urlHistory.filter(item => item.toolType === 'yt-finder'),
    [urlHistory]
  );
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showUniqueOnly, setShowUniqueOnly] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: 'title' | 'channelName' | 'videoCount'; direction: 'asc' | 'desc' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Drag and drop handlers for importing history
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if leaving the container entirely
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(f => f.name.endsWith('.json'));

    if (!jsonFile) {
      toast({ title: t('yt.invalidFile'), description: t('yt.dropJsonFile'), variant: 'destructive' });
      return;
    }

    try {
      await importHistory(jsonFile);
      toast({ 
        title: t('yt.imported'), 
        description: t('yt.importedDesc')
      });
    } catch {
      toast({ title: t('yt.importFailed'), description: t('yt.invalidFileFormat'), variant: 'destructive' });
    }
  }, [importHistory, toast, t]);

  // Keyboard shortcuts: Shift+F to fetch, Shift+X to cancel
  const handleFetchShortcut = useCallback(() => {
    if (!loading) {
      fetchButtonRef.current?.click();
    }
  }, [loading]);

  const handleCancelShortcut = useCallback(() => {
    if (loading && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setProgress(null);
      toast({ title: t('yt.cancelled'), description: t('yt.fetchCancelled') });
    }
  }, [loading, toast, t]);

  useKeyboardShortcuts([
    { key: 'f', shift: true, action: handleFetchShortcut, description: 'Fetch video data' },
    { key: 'x', shift: true, action: handleCancelShortcut, description: 'Cancel ongoing request' },
  ]);

  // Moved above early return to comply with Rules of Hooks
  const successResults = results.filter(r => r.status === 'success');
  const videoCountByChannel = successResults.reduce((acc, r) => {
    acc[r.channelUrl] = (acc[r.channelUrl] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = useMemo(() => {
    if (successResults.length === 0) return [];
    const sortedChannels = Object.entries(videoCountByChannel)
      .map(([url, count]) => ({
        name: successResults.find(r => r.channelUrl === url)?.channelName || 'Unknown',
        value: count,
        url
      }))
      .sort((a, b) => b.value - a.value);
    if (sortedChannels.length <= 6) return sortedChannels;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const top5 = sortedChannels.slice(0, 5);
    const othersCount = sortedChannels.slice(5).reduce((sum, c) => sum + c.value, 0);
    return [...top5, { name: 'Others', value: othersCount, url: '' }];
  }, [successResults, videoCountByChannel]);

  if (isLoading) return <YTFinderSkeleton />;

  // Updated regex to support /shorts/ and /embed/
  const extractVideoIds = (text: string): string[] => {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;
    const ids: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      ids.push(match[1]);
    }
    return [...new Set(ids)];
  };

  const validateUrls = (text: string): string => {
    if (!text.trim()) {
      return t('yt.enterAtLeast');
    }
    const videoIds = extractVideoIds(text);
    if (videoIds.length === 0) {
      return t('yt.noValidUrls');
    }
    return '';
  };

  const handleUrlsChange = (value: string) => {
    setUrls(value);
    if (touched) {
      setError(validateUrls(value));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (urls.trim()) {
      setError(validateUrls(urls));
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setProgress(null);
      toast({ title: t('yt.cancelled'), description: t('yt.fetchCancelled') });
    }
  };

  const fetchChannelData = async () => {
    setTouched(true);
    const validationError = validateUrls(urls);
    
    if (validationError) {
      setError(validationError);
      toast({ title: t('yt.validationError'), description: validationError, variant: 'destructive' });
      return;
    }

    setError('');
    const videoIds = extractVideoIds(urls);
    
    setLoading(true);
    setResults([]);
    setProgress({ current: 0, total: videoIds.length });
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const allResults: VideoData[] = [];

    try {
      // Fetch with concurrency control (max 5 parallel)
      for (let i = 0; i < videoIds.length; i += CONCURRENCY_LIMIT) {
        if (controller.signal.aborted) break;
        
        const chunk = videoIds.slice(i, i + CONCURRENCY_LIMIT);
        const chunkResults = await Promise.all(
          chunk.map(id => fetchSingleVideo(id, controller.signal))
        );
        
        allResults.push(...chunkResults);
        setProgress({ current: Math.min(i + CONCURRENCY_LIMIT, videoIds.length), total: videoIds.length });
      }

      setResults(allResults);
      
      const successCount = allResults.filter(r => r.status === 'success').length;
      const failedCount = allResults.filter(r => r.status === 'error').length;

      if (successCount > 0) {
        incrementStat('videosAnalyzed', successCount);
        
        // Get unique channel names for tags
        const uniqueChannels = [...new Set(allResults.filter(r => r.status === 'success').map(r => r.channelName))];
        const channelTags = uniqueChannels.slice(0, 5); // Limit to 5 channel tags
        
        // Save to unified URL history with channel metadata
        addToHistory({
          url: urls.split('\n').filter(l => l.trim())[0] || urls.substring(0, 100),
          originalUrl: urls,
          toolType: 'yt-finder',
          name: `${videoIds.length} video${videoIds.length !== 1 ? 's' : ''} - ${uniqueChannels.length} channel${uniqueChannels.length !== 1 ? 's' : ''}`,
          starred: false,
          tags: channelTags,
          metadata: {
            videoCount: videoIds.length,
            channelCount: uniqueChannels.length,
            channels: uniqueChannels.join(', '),
            topChannel: uniqueChannels[0] || ''
          }
        });
      }

      if (failedCount > 0 && successCount > 0) {
        toast({ 
          title: t('yt.partiallyComplete', { success: successCount, failed: failedCount }), 
          description: t('yt.foundChannels', { count: successCount })
        });
      } else if (successCount > 0) {
        toast({ title: t('yt.done'), description: t('yt.foundChannels', { count: successCount }) });
      } else {
        toast({ title: t('yt.noResultsToast'), description: t('yt.noResultsDesc'), variant: 'destructive' });
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        toast({ title: t('yt.error'), description: t('yt.errorFetching'), variant: 'destructive' });
      }
    } finally {
      setLoading(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  };

  const loadFromHistory = (historyItem: typeof ytHistory[0]) => {
    // Use originalUrl if available, otherwise fall back to url
    const urlsToLoad = historyItem.originalUrl || historyItem.url;
    setUrls(urlsToLoad);
    setTouched(false);
    setError('');
    setHistoryOpen(false);
    toast({ title: t('yt.loaded'), description: t('yt.urlsLoaded') });
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleReset = () => {
    handleCancel();
    setUrls('');
    setResults([]);
    setError('');
    setTouched(false);
  };

  const urlCount = urls.trim() ? urls.split('\n').filter(l => l.trim()).length : 0;
  const validVideoIds = extractVideoIds(urls);
  const hasValidUrls = validVideoIds.length > 0;
  const hasError = touched && !!error;

  // Filter to unique channels if enabled
  const uniqueResults = successResults.filter((r, index, self) => 
    index === self.findIndex(t => t.channelUrl === r.channelUrl)
  );
  
  // Sort results
  const sortResults = (results: VideoData[]) => {
    if (!sortConfig) return results;
    
    return [...results].sort((a, b) => {
      let comparison = 0;
      
      if (sortConfig.key === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortConfig.key === 'channelName') {
        comparison = a.channelName.localeCompare(b.channelName);
      } else if (sortConfig.key === 'videoCount') {
        comparison = (videoCountByChannel[a.channelUrl] || 0) - (videoCountByChannel[b.channelUrl] || 0);
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  };

  const displayResults = sortResults(showUniqueOnly ? uniqueResults : successResults);
  const uniqueChannelCount = uniqueResults.length;
  
  // Analytics: find most frequent channel
  const mostFrequentChannel = successResults.length > 0 
    ? Object.entries(videoCountByChannel).reduce((a, b) => a[1] > b[1] ? a : b)
    : null;
  const topChannelData = mostFrequentChannel 
    ? successResults.find(r => r.channelUrl === mostFrequentChannel[0])
    : null;

  const CHART_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--muted-foreground))'
  ];
  
  const handleSort = (key: 'title' | 'channelName' | 'videoCount') => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        if (current.direction === 'desc') return null;
      }
      return { key, direction: 'asc' };
    });
  };
  
  const getSortIcon = (key: 'title' | 'channelName' | 'videoCount') => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    if (sortConfig.direction === 'asc') return <ArrowUp className="h-3 w-3 ml-1" />;
    return <ArrowDown className="h-3 w-3 ml-1" />;
  };

  return (
    <div 
      className="space-y-4 sm:space-y-6 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg">
          <div className="text-center">
            <Upload className="h-12 w-12 mx-auto mb-3 text-primary animate-bounce" />
            <p className="text-lg font-medium">{t('yt.dropToImport')}</p>
            <p className="text-sm text-muted-foreground">{t('yt.dropRelease')}</p>
          </div>
        </div>
      )}
      <ToolPageHeader
        icon={Youtube}
        title={t('tool.ytFinder')}
        description={t('tool.ytFinder.desc')}
        iconColor="bg-destructive/10 text-destructive"
        accentGradient="from-destructive to-destructive/40"
      >
        <div className="flex gap-2 self-start sm:self-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Keyboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1.5 text-xs">
                  <p className="font-medium mb-2">{t('yt.keyboardShortcuts')}</p>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{t('yt.fetchVideoData')}</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Shift+F</kbd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{t('yt.cancelRequest')}</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Shift+X</kbd>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs">
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> {t('yt.reset')}
          </Button>
        </div>
      </ToolPageHeader>

      {/* Channel Analytics Summary */}
      {successResults.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">{t('yt.channelAnalytics')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 place-items-center">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-background rounded-lg border">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                    <Youtube className="h-3.5 w-3.5" />
                    <span className="text-xs">{t('yt.totalVideos')}</span>
                  </div>
                  <p className="text-2xl font-bold">{successResults.length}</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg border">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-xs">{t('yt.uniqueChannels')}</span>
                  </div>
                  <p className="text-2xl font-bold">{uniqueChannelCount}</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg border">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="text-xs">{t('yt.topChannel')}</span>
                  </div>
                  {topChannelData ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a 
                            href={topChannelData.channelUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-primary hover:underline truncate block"
                          >
                            {topChannelData.channelName}
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{mostFrequentChannel![1]} video{mostFrequentChannel![1] > 1 ? 's' : ''}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
                </div>
              </div>
              
              {/* Pie Chart */}
              {pieChartData.length > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <div className="w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={50}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => [`${value} video${value > 1 ? 's' : ''}`, name]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1.5 max-h-32 overflow-y-auto">
                    {pieChartData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2 text-xs">
                        <div 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="truncate flex-1">{entry.name}</span>
                        <span className="text-muted-foreground">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-xs sm:text-sm flex items-center justify-between">
              <span>
                {t('yt.youtubeUrls')}
                <span className="text-destructive ml-1">*</span>
              </span>
              {urlCount > 0 && (
                <span className={cn(
                  "text-xs font-normal px-1.5 py-0.5 rounded",
                  hasValidUrls 
                    ? "text-muted-foreground bg-muted" 
                    : "text-destructive bg-destructive/10"
                )}>
                  {validVideoIds.length} {t('yt.valid')} / {urlCount} {t('yt.lines')}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            {/* Bulk Import Option */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <BulkUrlImport 
                onImport={(importedUrls) => {
                  setUrls(importedUrls.join('\n'));
                  setTouched(false);
                  setError('');
                }}
                compact
              />
              <span className="text-xs text-muted-foreground">{t('yt.orPasteBelow')}</span>
            </div>
            
            <Textarea 
              placeholder="Paste YouTube URLs here, one per line...&#10;&#10;Example:&#10;https://www.youtube.com/watch?v=dQw4w9WgXcQ&#10;https://youtu.be/dQw4w9WgXcQ&#10;https://youtube.com/shorts/dQw4w9WgXcQ" 
              value={urls} 
              onChange={(e) => handleUrlsChange(e.target.value)}
              onBlur={handleBlur}
              rows={6} 
              className={cn(
                "text-sm",
                hasError && "border-destructive focus-visible:ring-destructive"
              )}
            />
            <InputError message={hasError ? error : ''} />
            
            {/* Progress Indicator */}
            {progress && (
              <div className="space-y-2 p-3 bg-muted rounded-md">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('yt.fetchingProgress', { current: progress.current, total: progress.total })}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={handleCancel}
                          className="h-7 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" /> {t('yt.cancel')}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('yt.cancelFetch')} <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">Shift+X</kbd></p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Progress value={(progress.current / progress.total) * 100} className="h-2" />
              </div>
            )}
            
            {/* URL Format Help */}
            {!hasValidUrls && urls.trim() && touched && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
                <p className="font-medium mb-1">{t('yt.supportedFormats')}</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>youtube.com/watch?v=VIDEO_ID</li>
                  <li>youtu.be/VIDEO_ID</li>
                  <li>youtube.com/embed/VIDEO_ID</li>
                  <li>youtube.com/shorts/VIDEO_ID</li>
                </ul>
              </div>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    ref={fetchButtonRef}
                    onClick={fetchChannelData} 
                    disabled={loading || (touched && !hasValidUrls)} 
                    className="w-full bg-destructive hover:bg-destructive/90 text-sm"
                  >
                    <Youtube className="h-4 w-4 mr-2" />
                    {loading ? t('yt.fetchingBtn') : t('yt.getChannelData')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('yt.fetchVideoData')} <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">Shift+F</kbd></p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardHeader className="p-3 flex-row items-center justify-between gap-2">
            <CardTitle className="text-xs sm:text-sm">
              {t('yt.results')} ({showUniqueOnly ? displayResults.length : successResults.length})
              {showUniqueOnly && successResults.length !== displayResults.length && (
                <span className="ml-2 text-muted-foreground text-xs font-normal">
                  ({successResults.length} {t('yt.total')})
                </span>
              )}
              {results.some(r => r.status === 'error') && (
                <span className="ml-2 text-destructive text-xs font-normal">
                  ({results.filter(r => r.status === 'error').length} {t('yt.failed')})
                </span>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={showUniqueOnly ? "default" : "outline"}
                      size="sm" 
                      onClick={() => setShowUniqueOnly(!showUniqueOnly)}
                      className="h-7 text-xs"
                      disabled={successResults.length === 0}
                    >
                      <Filter className="h-3 w-3 mr-1" /> {t('yt.unique')}
                      {uniqueChannelCount !== successResults.length && successResults.length > 0 && (
                        <span className="ml-1">({uniqueChannelCount})</span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showUniqueOnly ? t('yt.showAllResults') : t('yt.showUniqueOnly')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        const urls = [...new Set(successResults.map(r => r.channelUrl))].join('\n');
                        copy(urls);
                        toast({ title: t('yt.copied'), description: t('yt.channelUrlsCopied', { count: uniqueChannelCount }) });
                      }} 
                      className="h-7 text-xs"
                      disabled={successResults.length === 0}
                    >
                      <Copy className="h-3 w-3 mr-1" /> {t('yt.copyAllUrls')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('yt.copyAllChannelUrls')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={successResults.length === 0}>
                    {t('yt.export')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportCsv([['Title', 'Channel', 'Channel URL'], ...displayResults.map(r => [r.title, r.channelName, r.channelUrl])], 'youtube-channels')}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportTxt(displayResults.map(r => `${r.channelName}: ${r.channelUrl}`), 'youtube-channels')}>TXT</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {displayResults.length === 0 && results.filter(r => r.status === 'error').length === 0 ? (
              <EmptyState
                icon={Search}
                title={loading ? t('yt.fetchingData') : t('yt.noResultsYet')}
                description={loading ? t('yt.pleaseWait') : t('yt.noResultsDesc2')}
                className="py-6"
              />
            ) : (
              <div className="max-h-[300px] sm:max-h-[400px] overflow-auto -mx-3 px-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-8">#</TableHead>
                      <TableHead 
                        className="text-xs cursor-pointer hover:text-foreground select-none"
                        onClick={() => handleSort('title')}
                      >
                        <span className="flex items-center">
                          {t('yt.title')} {getSortIcon('title')}
                        </span>
                      </TableHead>
                      <TableHead 
                        className="text-xs hidden sm:table-cell cursor-pointer hover:text-foreground select-none"
                        onClick={() => handleSort('channelName')}
                      >
                        <span className="flex items-center">
                          {t('yt.channel')} {getSortIcon('channelName')}
                        </span>
                      </TableHead>
                      {showUniqueOnly && (
                        <TableHead 
                          className="text-xs text-center w-16 cursor-pointer hover:text-foreground select-none"
                          onClick={() => handleSort('videoCount')}
                        >
                          <span className="flex items-center justify-center">
                            {t('yt.videos')} {getSortIcon('videoCount')}
                          </span>
                        </TableHead>
                      )}
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(showUniqueOnly ? displayResults : [...displayResults, ...results.filter(r => r.status === 'error')]).map((r, i) => (
                      <TableRow 
                        key={i}
                        className={cn(r.status === 'error' && "bg-destructive/10")}
                      >
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            {r.status === 'error' && (
                              <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                            )}
                            <div>
                              <div className={cn(
                                "truncate max-w-[100px] sm:max-w-[180px]",
                                r.status === 'error' && "text-destructive"
                              )}>
                                {r.title}
                              </div>
                              <div className="text-xs text-muted-foreground sm:hidden truncate">
                                {r.channelName}
                              </div>
                              {r.errorMessage && (
                                <div className="text-xs text-destructive">{r.errorMessage}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{r.channelName}</TableCell>
                        {showUniqueOnly && (
                          <TableCell className="text-center">
                            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-medium bg-primary/10 text-primary rounded-full">
                              {videoCountByChannel[r.channelUrl] || 0}
                            </span>
                          </TableCell>
                        )}
                        <TableCell>
                          {r.status === 'success' && r.channelUrl && (
                            <a href={r.channelUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

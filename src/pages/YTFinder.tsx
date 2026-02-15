import { useState, useRef, useCallback, useMemo } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
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
import { ToolPageSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { InputError } from '@/components/ui/input-error';
import { BulkUrlImport } from '@/components/BulkUrlImport';
import { cn } from '@/lib/utils';
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
      title: 'Failed to fetch',
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
      toast({ title: 'Invalid file', description: 'Please drop a JSON history file', variant: 'destructive' });
      return;
    }

    try {
      await importHistory(jsonFile);
      toast({ 
        title: 'Imported!', 
        description: 'History imported successfully'
      });
    } catch {
      toast({ title: 'Import failed', description: 'Invalid file format', variant: 'destructive' });
    }
  }, [importHistory, toast]);

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
      toast({ title: 'Cancelled', description: 'Fetch operation was cancelled (Shift+X)' });
    }
  }, [loading, toast]);

  useKeyboardShortcuts([
    { key: 'f', shift: true, action: handleFetchShortcut, description: 'Fetch video data' },
    { key: 'x', shift: true, action: handleCancelShortcut, description: 'Cancel ongoing request' },
  ]);

  if (isLoading) return <ToolPageSkeleton />;

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
      return 'Please enter at least one YouTube URL';
    }
    const videoIds = extractVideoIds(text);
    if (videoIds.length === 0) {
      return 'No valid YouTube URLs found. Please check the format.';
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
      toast({ title: 'Cancelled', description: 'Fetch operation was cancelled' });
    }
  };

  const fetchChannelData = async () => {
    setTouched(true);
    const validationError = validateUrls(urls);
    
    if (validationError) {
      setError(validationError);
      toast({ title: 'Validation Error', description: validationError, variant: 'destructive' });
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
          title: 'Partially Complete', 
          description: `Found ${successCount} channels. ${failedCount} video(s) failed.` 
        });
      } else if (successCount > 0) {
        toast({ title: 'Done!', description: `Found ${successCount} channels` });
      } else {
        toast({ title: 'No Results', description: 'Could not fetch any channel data. The videos may be private or deleted.', variant: 'destructive' });
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        toast({ title: 'Error', description: 'An error occurred while fetching data', variant: 'destructive' });
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
    toast({ title: 'Loaded', description: 'URLs loaded from history' });
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
  const successResults = results.filter(r => r.status === 'success');
  
  // Calculate video count per channel
  const videoCountByChannel = successResults.reduce((acc, r) => {
    acc[r.channelUrl] = (acc[r.channelUrl] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

  // Pie chart data - top 5 channels + "Others"
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
    
    const top5 = sortedChannels.slice(0, 5);
    const othersCount = sortedChannels.slice(5).reduce((sum, c) => sum + c.value, 0);
    return [...top5, { name: 'Others', value: othersCount, url: '' }];
  }, [successResults, videoCountByChannel]);

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
            <p className="text-lg font-medium">Drop JSON file to import history</p>
            <p className="text-sm text-muted-foreground">Release to import your search history</p>
          </div>
        </div>
      )}
      <ToolPageHeader
        icon={Youtube}
        title="YT Channel Finder"
        description="Extract channel info from YouTube URLs"
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
                  <p className="font-medium mb-2">Keyboard Shortcuts</p>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Fetch video data</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Shift+F</kbd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Cancel request</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Shift+X</kbd>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
            <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs"
                  disabled={ytHistory.length === 0}
                >
                  <History className="h-3.5 w-3.5 mr-1" /> 
                  History
                  {ytHistory.length > 0 && (
                    <span className="ml-1 text-muted-foreground">({ytHistory.length})</span>
                  )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-3 border-b">
                <h4 className="text-sm font-medium">Search History</h4>
                <div className="flex items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          await importHistory(file);
                          toast({ 
                            title: 'Imported!', 
                            description: 'History imported successfully'
                          });
                        } catch {
                          toast({ title: 'Import failed', description: 'Invalid file format', variant: 'destructive' });
                        }
                        e.target.value = '';
                      }
                    }}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Import history</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            exportHistory('yt-finder');
                            toast({ title: 'Exported!', description: 'History saved to file' });
                          }}
                          disabled={ytHistory.length === 0}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Export history</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      clearHistory('yt-finder');
                      setHistoryOpen(false);
                      toast({ title: 'Cleared', description: 'YT Finder history cleared' });
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Clear
                  </Button>
                </div>
              </div>
              <ScrollArea className="max-h-[300px]">
                <div className="p-2 space-y-1">
                  {ytHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No search history yet</p>
                  ) : (
                    ytHistory.slice(0, 10).map((item) => (
                      <div 
                        key={item.id}
                        className="group flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                        onClick={() => {
                          if (editingId !== item.id) {
                            loadFromHistory(item);
                          }
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          {editingId === item.id ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="flex-1 text-sm px-2 py-1 rounded border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateHistoryItem(item.id, { name: editingName });
                                    setEditingId(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingId(null);
                                  }
                                }}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  updateHistoryItem(item.id, { name: editingName });
                                  setEditingId(null);
                                }}
                              >
                                <Check className="h-3 w-3 text-primary" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                {item.starred && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 flex-shrink-0" />}
                                <Youtube className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                                <span className="text-sm font-medium truncate">{item.name}</span>
                              </div>
                              <div className="flex items-center flex-wrap gap-1 mt-1">
                                {item.tags?.slice(0, 3).map((tag, idx) => (
                                  <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">
                                    {tag}
                                  </span>
                                ))}
                                {(item.tags?.length || 0) > 3 && (
                                  <span className="text-[10px] text-muted-foreground">+{item.tags!.length - 3}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimeAgo(item.timestamp)}</span>
                              </div>
                            </>
                          )}
                        </div>
                        {editingId !== item.id && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStar(item.id);
                              }}
                            >
                              <Star className={cn(
                                "h-3 w-3",
                                item.starred && "fill-yellow-500 text-yellow-500"
                              )} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(item.id);
                                setEditingName(item.name);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromHistory(item.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  {ytHistory.length > 10 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-xs mt-2"
                      onClick={() => navigate('/history')}
                    >
                      View all {ytHistory.length} items →
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs">
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        </div>
      </ToolPageHeader>

      {/* Channel Analytics Summary */}
      {successResults.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Channel Analytics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-background rounded-lg border">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                    <Youtube className="h-3.5 w-3.5" />
                    <span className="text-xs">Total Videos</span>
                  </div>
                  <p className="text-2xl font-bold">{successResults.length}</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg border">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-xs">Unique Channels</span>
                  </div>
                  <p className="text-2xl font-bold">{uniqueChannelCount}</p>
                </div>
                <div className="text-center p-3 bg-background rounded-lg border">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="text-xs">Top Channel</span>
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
                <div className="flex items-center gap-4">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-xs sm:text-sm flex items-center justify-between">
              <span>
                YouTube URLs
                <span className="text-destructive ml-1">*</span>
              </span>
              {urlCount > 0 && (
                <span className={cn(
                  "text-xs font-normal px-1.5 py-0.5 rounded",
                  hasValidUrls 
                    ? "text-muted-foreground bg-muted" 
                    : "text-destructive bg-destructive/10"
                )}>
                  {validVideoIds.length} valid / {urlCount} lines
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
              <span className="text-xs text-muted-foreground">or paste URLs below</span>
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
                    Fetching: {progress.current} / {progress.total}
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
                          <X className="h-3 w-3 mr-1" /> Cancel
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cancel fetch <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">Shift+X</kbd></p>
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
                <p className="font-medium mb-1">Supported formats:</p>
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
                    {loading ? 'Fetching...' : 'Get Channel Data'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fetch video data <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">Shift+F</kbd></p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardHeader className="p-3 flex-row items-center justify-between gap-2">
            <CardTitle className="text-xs sm:text-sm">
              Results ({showUniqueOnly ? displayResults.length : successResults.length})
              {showUniqueOnly && successResults.length !== displayResults.length && (
                <span className="ml-2 text-muted-foreground text-xs font-normal">
                  ({successResults.length} total)
                </span>
              )}
              {results.some(r => r.status === 'error') && (
                <span className="ml-2 text-destructive text-xs font-normal">
                  ({results.filter(r => r.status === 'error').length} failed)
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
                      <Filter className="h-3 w-3 mr-1" /> Unique
                      {uniqueChannelCount !== successResults.length && successResults.length > 0 && (
                        <span className="ml-1">({uniqueChannelCount})</span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showUniqueOnly ? 'Show all results' : 'Show unique channels only'}</p>
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
                        toast({ title: 'Copied!', description: `${uniqueChannelCount} unique channel URLs copied` });
                      }} 
                      className="h-7 text-xs"
                      disabled={successResults.length === 0}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy All URLs
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy all unique channel URLs to clipboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={successResults.length === 0}>
                    Export
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
                title={loading ? "Fetching channel data..." : "No results yet"}
                description={loading ? "Please wait while we retrieve channel information" : "Paste YouTube URLs and click 'Get Channel Data' to extract channel information"}
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
                          Title {getSortIcon('title')}
                        </span>
                      </TableHead>
                      <TableHead 
                        className="text-xs hidden sm:table-cell cursor-pointer hover:text-foreground select-none"
                        onClick={() => handleSort('channelName')}
                      >
                        <span className="flex items-center">
                          Channel {getSortIcon('channelName')}
                        </span>
                      </TableHead>
                      {showUniqueOnly && (
                        <TableHead 
                          className="text-xs text-center w-16 cursor-pointer hover:text-foreground select-none"
                          onClick={() => handleSort('videoCount')}
                        >
                          <span className="flex items-center justify-center">
                            Videos {getSortIcon('videoCount')}
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

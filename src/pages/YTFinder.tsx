import { useState, useRef, useCallback } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Copy, RotateCcw, Youtube, ExternalLink, AlertTriangle, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useClipboard } from '@/hooks/useClipboard';
import { useExport } from '@/hooks/useExport';
import { useToast } from '@/hooks/use-toast';
import { usePageLoading } from '@/hooks/usePageLoading';
import { ToolPageSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { InputError } from '@/components/ui/input-error';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">YT Channel Finder</h1>
          <p className="text-sm text-muted-foreground">Extract channel info from YouTube URLs</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs self-start sm:self-auto">
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
        </Button>
      </div>

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
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleCancel}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </Button>
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

            <Button 
              ref={fetchButtonRef}
              onClick={fetchChannelData} 
              disabled={loading || (touched && !hasValidUrls)} 
              className="w-full bg-destructive hover:bg-destructive/90 text-sm"
            >
              <Youtube className="h-4 w-4 mr-2" />
              {loading ? 'Fetching...' : 'Get Channel Data'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardHeader className="p-3 flex-row items-center justify-between gap-2">
            <CardTitle className="text-xs sm:text-sm">
              Results ({successResults.length})
              {results.some(r => r.status === 'error') && (
                <span className="ml-2 text-destructive text-xs font-normal">
                  ({results.filter(r => r.status === 'error').length} failed)
                </span>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copy(successResults.map(r => r.channelUrl).join('\n'))} 
                className="h-7 text-xs"
                disabled={successResults.length === 0}
              >
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={successResults.length === 0}>
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportCsv([['Title', 'Channel', 'Channel URL'], ...successResults.map(r => [r.title, r.channelName, r.channelUrl])], 'youtube-channels')}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportTxt(successResults.map(r => `${r.channelName}: ${r.channelUrl}`), 'youtube-channels')}>TXT</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {results.length === 0 ? (
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
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Channel</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r, i) => (
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

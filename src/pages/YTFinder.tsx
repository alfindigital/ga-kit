import { useState } from 'react';
import { Copy, RotateCcw, Youtube, ExternalLink, AlertTriangle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
}

export default function YTFinder() {
  const [urls, setUrls] = useState('');
  const [results, setResults] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const { copy } = useClipboard();
  const { exportCsv, exportTxt } = useExport();
  const { toast } = useToast();
  const isLoading = usePageLoading(400);

  if (isLoading) return <ToolPageSkeleton />;

  const extractVideoIds = (text: string): string[] => {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
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
    const data: VideoData[] = [];
    let failedCount = 0;

    for (const id of videoIds) {
      try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
        if (res.ok) {
          const json = await res.json();
          data.push({
            videoUrl: `https://www.youtube.com/watch?v=${id}`,
            title: json.title,
            channelName: json.author_name,
            channelUrl: json.author_url,
          });
        } else {
          failedCount++;
        }
      } catch (e) {
        console.error('Failed to fetch:', id);
        failedCount++;
      }
    }

    setResults(data);
    setLoading(false);
    
    if (failedCount > 0 && data.length > 0) {
      toast({ 
        title: 'Partially Complete', 
        description: `Found ${data.length} channels. ${failedCount} video(s) could not be fetched.` 
      });
    } else if (data.length > 0) {
      toast({ title: 'Done!', description: `Found ${data.length} channels` });
    } else {
      toast({ title: 'No Results', description: 'Could not fetch any channel data. The videos may be private or deleted.', variant: 'destructive' });
    }
  };

  const handleReset = () => {
    setUrls('');
    setResults([]);
    setError('');
    setTouched(false);
  };

  const urlCount = urls.trim() ? urls.split('\n').filter(l => l.trim()).length : 0;
  const validVideoIds = extractVideoIds(urls);
  const hasValidUrls = validVideoIds.length > 0;
  const hasError = touched && !!error;

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
              placeholder="Paste YouTube URLs here, one per line...&#10;&#10;Example:&#10;https://www.youtube.com/watch?v=dQw4w9WgXcQ&#10;https://youtu.be/dQw4w9WgXcQ" 
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
            
            {/* URL Format Help */}
            {!hasValidUrls && urls.trim() && touched && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
                <p className="font-medium mb-1">Supported formats:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>youtube.com/watch?v=VIDEO_ID</li>
                  <li>youtu.be/VIDEO_ID</li>
                  <li>youtube.com/embed/VIDEO_ID</li>
                </ul>
              </div>
            )}

            <Button 
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
            <CardTitle className="text-xs sm:text-sm">Results ({results.length})</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copy(results.map(r => r.channelUrl).join('\n'))} 
                className="h-7 text-xs"
                disabled={results.length === 0}
              >
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={results.length === 0}>
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportCsv([['Title', 'Channel', 'Channel URL'], ...results.map(r => [r.title, r.channelName, r.channelUrl])], 'youtube-channels')}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportTxt(results.map(r => `${r.channelName}: ${r.channelUrl}`), 'youtube-channels')}>TXT</DropdownMenuItem>
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
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Channel</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          <div className="truncate max-w-[120px] sm:max-w-[200px]">{r.title}</div>
                          <div className="text-xs text-muted-foreground sm:hidden truncate">{r.channelName}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{r.channelName}</TableCell>
                        <TableCell>
                          <a href={r.channelUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </a>
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

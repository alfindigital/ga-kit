import { useState } from 'react';
import { Copy, RotateCcw, Youtube, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useClipboard } from '@/hooks/useClipboard';
import { useExport } from '@/hooks/useExport';
import { useToast } from '@/hooks/use-toast';
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
  const { copy } = useClipboard();
  const { exportCsv, exportTxt } = useExport();
  const { toast } = useToast();

  const extractVideoIds = (text: string): string[] => {
    const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
    const ids: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      ids.push(match[1]);
    }
    return [...new Set(ids)];
  };

  const fetchChannelData = async () => {
    const videoIds = extractVideoIds(urls);
    if (videoIds.length === 0) {
      toast({ title: 'No URLs found', description: 'Please enter valid YouTube URLs', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const data: VideoData[] = [];

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
        }
      } catch (e) {
        console.error('Failed to fetch:', id);
      }
    }

    setResults(data);
    setLoading(false);
    toast({ title: 'Done!', description: `Found ${data.length} channels` });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">YT Channel Finder</h1>
          <p className="text-sm text-muted-foreground">Extract channel info from YouTube URLs</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setUrls(''); setResults([]); }} className="h-8 text-xs self-start sm:self-auto">
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-3"><CardTitle className="text-xs sm:text-sm">YouTube URLs</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <Textarea placeholder="Paste YouTube URLs here, one per line..." value={urls} onChange={(e) => setUrls(e.target.value)} rows={6} className="text-sm" />
            <Button onClick={fetchChannelData} disabled={loading} className="w-full bg-destructive hover:bg-destructive/90 text-sm">
              <Youtube className="h-4 w-4 mr-2" />
              {loading ? 'Fetching...' : 'Get Channel Data'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20">
          <CardHeader className="p-3 flex-row items-center justify-between gap-2">
            <CardTitle className="text-xs sm:text-sm">Results ({results.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copy(results.map(r => r.channelUrl).join('\n'))} className="h-7 text-xs">
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-7 text-xs">Export</Button></DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportCsv([['Title', 'Channel', 'Channel URL'], ...results.map(r => [r.title, r.channelName, r.channelUrl])], 'youtube-channels')}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportTxt(results.map(r => `${r.channelName}: ${r.channelUrl}`), 'youtube-channels')}>TXT</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {results.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 text-sm">Results will appear here</p>
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

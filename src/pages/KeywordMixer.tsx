import { useState } from 'react';
import { Copy, RotateCcw, Sparkles, AlertTriangle, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useClipboard } from '@/hooks/useClipboard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useToast } from '@/hooks/use-toast';
import { useExport } from '@/hooks/useExport';
import { usePageLoading } from '@/hooks/usePageLoading';
import { ToolPageSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type MatchType = 'broad' | 'phrase' | 'exact';

export default function KeywordMixer() {
  const [base, setBase] = useState('');
  const [prefixes, setPrefixes] = useState('');
  const [suffixes, setSuffixes] = useState('');
  const [matchTypes, setMatchTypes] = useState<MatchType[]>(['broad']);
  const { copy } = useClipboard();
  const { toast } = useToast();
  const { exportCsv, exportTxt } = useExport();
  const isLoading = usePageLoading(400);

  if (isLoading) return <ToolPageSkeleton />;

  const toggleMatchType = (type: MatchType) => {
    setMatchTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const getLineCount = (text: string) => text.split('\n').filter(l => l.trim()).length;
  const baseCount = getLineCount(base);
  const prefixCount = getLineCount(prefixes);
  const suffixCount = getLineCount(suffixes);
  const hasBaseKeywords = baseCount > 0;
  const hasModifiers = prefixCount > 0 || suffixCount > 0;

  const results = (() => {
    const bases = base.split('\n').map(k => k.trim()).filter(Boolean);
    const pres = prefixes.split('\n').map(k => k.trim()).filter(Boolean);
    const sufs = suffixes.split('\n').map(k => k.trim()).filter(Boolean);
    if (bases.length === 0) return [];

    const combined: string[] = [];
    bases.forEach(b => {
      if (pres.length === 0 && sufs.length === 0) {
        combined.push(b);
      } else if (pres.length === 0) {
        sufs.forEach(s => combined.push(`${b} ${s}`));
      } else if (sufs.length === 0) {
        pres.forEach(p => combined.push(`${p} ${b}`));
      } else {
        pres.forEach(p => sufs.forEach(s => combined.push(`${p} ${b} ${s}`)));
      }
    });

    const unique = [...new Set(combined)];
    const final: string[] = [];
    unique.forEach(kw => {
      if (matchTypes.includes('broad')) final.push(kw);
      if (matchTypes.includes('phrase')) final.push(`"${kw}"`);
      if (matchTypes.includes('exact')) final.push(`[${kw}]`);
    });
    return final;
  })();

  // Load sample data for demo
  const loadSampleData = () => {
    setBase('shoes\nbags\nwatches');
    setPrefixes('best\ncheap\nluxury');
    setSuffixes('online\nnear me\n2024');
    toast({ title: 'Sample loaded!', description: 'Demo keywords have been added' });
  };

  // Reset function
  const handleReset = () => { setBase(''); setPrefixes(''); setSuffixes(''); };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'c', shift: true, action: () => results.length > 0 && copy(results.join('\n')), description: 'Copy results' },
    { key: 'r', shift: true, action: handleReset, description: 'Reset form' },
    { key: 's', shift: true, action: loadSampleData, description: 'Load sample' },
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Keyword Mixer</h1>
          <p className="text-sm text-muted-foreground">Mix base keywords with prefixes and suffixes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={loadSampleData} className="h-8 text-xs">
            <Beaker className="h-3.5 w-3.5 mr-1" /> Sample
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs self-start sm:self-auto">
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Match Types with validation */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {(['broad', 'phrase', 'exact'] as MatchType[]).map(type => (
          <label key={type} className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox checked={matchTypes.includes(type)} onCheckedChange={() => toggleMatchType(type)} />
            <span className="capitalize">{type}</span>
          </label>
        ))}
        {matchTypes.length === 0 && (
          <span className="text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Select at least one match type
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          {/* Prefixes */}
          <Card className={cn(
            "transition-colors",
            !prefixCount && (hasBaseKeywords || suffixCount > 0) && "border-dashed border-muted-foreground/30"
          )}>
            <CardHeader className="p-3">
              <CardTitle className="text-xs sm:text-sm flex items-center justify-between">
                Prefixes
                {prefixCount > 0 && (
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {prefixCount}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <Textarea 
                placeholder="best&#10;cheap&#10;top" 
                value={prefixes} 
                onChange={(e) => setPrefixes(e.target.value)} 
                rows={5} 
                className={cn(
                  "text-sm",
                  !prefixCount && (hasBaseKeywords || suffixCount > 0) && "border-dashed"
                )}
              />
            </CardContent>
          </Card>

          {/* Base Keywords - Required */}
          <Card className={cn(
            "transition-colors",
            !hasBaseKeywords && (prefixCount > 0 || suffixCount > 0) && "border-destructive/50"
          )}>
            <CardHeader className="p-3">
              <CardTitle className="text-xs sm:text-sm flex items-center justify-between">
                <span>
                  Base Keywords
                  <span className="text-destructive ml-1">*</span>
                </span>
                {baseCount > 0 && (
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {baseCount}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <Textarea 
                placeholder="shoes&#10;bags&#10;watches" 
                value={base} 
                onChange={(e) => setBase(e.target.value)} 
                rows={5} 
                className={cn(
                  "text-sm",
                  !hasBaseKeywords && (prefixCount > 0 || suffixCount > 0) && "border-destructive/50"
                )}
              />
              {!hasBaseKeywords && (prefixCount > 0 || suffixCount > 0) && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Base keywords are required
                </p>
              )}
            </CardContent>
          </Card>

          {/* Suffixes */}
          <Card className={cn(
            "transition-colors",
            !suffixCount && (hasBaseKeywords || prefixCount > 0) && "border-dashed border-muted-foreground/30"
          )}>
            <CardHeader className="p-3">
              <CardTitle className="text-xs sm:text-sm flex items-center justify-between">
                Suffixes
                {suffixCount > 0 && (
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {suffixCount}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <Textarea 
                placeholder="online&#10;near me&#10;2024" 
                value={suffixes} 
                onChange={(e) => setSuffixes(e.target.value)} 
                rows={5} 
                className={cn(
                  "text-sm",
                  !suffixCount && (hasBaseKeywords || prefixCount > 0) && "border-dashed"
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="p-3 flex-row items-center justify-between gap-2">
            <CardTitle className="text-xs sm:text-sm">Results ({results.length})</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copy(results.join('\n'))} 
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
                  <DropdownMenuItem onClick={() => exportTxt(results, 'mixed-keywords')}>TXT</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportCsv(results.map(k => [k]), 'mixed-keywords')}>CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {results.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title={
                  !hasBaseKeywords 
                    ? "Enter base keywords to start" 
                    : matchTypes.length === 0 
                    ? "Select a match type"
                    : "Add prefixes or suffixes"
                }
                description={
                  !hasBaseKeywords
                    ? "Base keywords are required. Add prefixes and suffixes to create variations."
                    : matchTypes.length === 0
                    ? "Choose at least one match type above to generate results"
                    : "Add prefixes and/or suffixes to mix with your base keywords"
                }
                className="py-8"
              />
            ) : (
              <Textarea value={results.join('\n')} readOnly rows={10} className="font-mono text-xs sm:text-sm" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

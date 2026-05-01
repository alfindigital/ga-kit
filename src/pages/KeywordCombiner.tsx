import { useState } from 'react';
import { Copy, Plus, Trash2, RotateCcw, Sparkles, AlertTriangle, Beaker, Combine } from 'lucide-react';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useClipboard } from '@/hooks/useClipboard';
import { useShortcutAction } from '@/contexts/ShortcutsContext';
import { useToast } from '@/hooks/use-toast';
import { useExport } from '@/hooks/useExport';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useUsageStats } from '@/hooks/useUsageStats';
import { useTranslation } from '@/hooks/useTranslation';
import { KeywordCombinerSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type MatchType = 'broad' | 'phrase' | 'exact';

export default function KeywordCombiner() {
  const [lists, setLists] = useState<string[]>(['', '', '']);
  const [matchTypes, setMatchTypes] = useState<MatchType[]>(['broad']);
  const { copy } = useClipboard();
  const { toast } = useToast();
  const { exportCsv, exportTxt } = useExport();
  const isLoading = usePageLoading(400);
  const { incrementStat } = useUsageStats();
  const { t } = useTranslation();

  const toggleMatchType = (type: MatchType) => {
    setMatchTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Check if any list has content
  const hasAnyContent = lists.some(l => l.trim().length > 0);
  const filledListCount = lists.filter(l => l.split('\n').filter(k => k.trim()).length > 0).length;
  const hasMultipleLists = filledListCount >= 2;

  const combinations = (() => {
    const parsed = lists.map(l => l.split('\n').map(k => k.trim()).filter(Boolean));
    if (parsed.every(l => l.length === 0)) return [];

    const combine = (arrays: string[][]): string[] => {
      const nonEmpty = arrays.filter(a => a.length > 0);
      if (nonEmpty.length === 0) return [];
      if (nonEmpty.length === 1) return nonEmpty[0];
      
      return nonEmpty.reduce((acc, curr) => 
        acc.flatMap(a => curr.map(c => `${a} ${c}`))
      );
    };

    const raw = combine(parsed);
    const results: string[] = [];
    
    raw.forEach(keyword => {
      if (matchTypes.includes('broad')) results.push(keyword);
      if (matchTypes.includes('phrase')) results.push(`"${keyword}"`);
      if (matchTypes.includes('exact')) results.push(`[${keyword}]`);
    });

    return results;
  })();

  const addList = () => setLists(prev => [...prev, '']);
  const removeList = (i: number) => setLists(prev => prev.filter((_, idx) => idx !== i));
  const updateList = (i: number, val: string) => setLists(prev => prev.map((l, idx) => idx === i ? val : l));

  const getListStatus = (listContent: string) => {
    const lines = listContent.split('\n').filter(l => l.trim()).length;
    return lines;
  };

  // Load sample data for demo
  const loadSampleData = () => {
    setLists([
      'buy\nbest\ncheap',
      'running\nbasketball\ntennis',
      'shoes\nsneakers'
    ]);
    toast({ title: t('common.sampleLoaded'), description: t('common.sampleLoadedDesc') });
  };

  // Reset function
  const handleReset = () => setLists(['', '', '']);

  // Keyboard shortcuts (editable via Settings → Keyboard Shortcuts dialog)
  useShortcutAction('page.copy', () => { if (combinations.length > 0) copy(combinations.join('\n')); });
  useShortcutAction('page.reset', handleReset);
  useShortcutAction('page.sample', loadSampleData);

  if (isLoading) return <KeywordCombinerSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <ToolPageHeader
        icon={Combine}
        title={t('tool.keywordCombiner')}
        description={t('tool.keywordCombiner.desc')}
        iconColor="bg-accent/10 text-accent"
        accentGradient="from-accent to-accent/40"
      >
        <Button variant="ghost" size="sm" onClick={loadSampleData} className="h-8 text-xs">
          <Beaker className="h-3.5 w-3.5 mr-1" /> {t('common.sample')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs self-start sm:self-auto">
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> {t('common.reset')}
        </Button>
      </ToolPageHeader>

      {/* Match Types with validation indicator */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {(['broad', 'phrase', 'exact'] as MatchType[]).map(type => (
          <label key={type} className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox checked={matchTypes.includes(type)} onCheckedChange={() => toggleMatchType(type)} />
            <span className="capitalize">{t(`combiner.${type}` as any)}</span>
          </label>
        ))}
        {matchTypes.length === 0 && (
          <span className="text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {t('combiner.selectMatchType')}
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input Lists */}
        <div className="space-y-3">
          {lists.map((list, i) => {
            const lineCount = getListStatus(list);
            const isEmpty = lineCount === 0;
            
            return (
              <Card key={i} className={cn(
                "transition-colors",
                isEmpty && hasAnyContent && "border-dashed border-muted-foreground/30"
              )}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {t('combiner.list')} {i + 1}
                    {lineCount > 0 && (
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {lineCount} {t('common.keywords')}
                      </span>
                    )}
                  </CardTitle>
                  {lists.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeList(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder={t('combiner.enterKeywords')}
                    value={list}
                    onChange={(e) => updateList(i, e.target.value)}
                    rows={4}
                    className={cn(
                      "text-sm transition-colors",
                      isEmpty && hasAnyContent && "border-dashed"
                    )}
                  />
                </CardContent>
              </Card>
            );
          })}
          <Button variant="outline" size="sm" onClick={addList} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> {t('common.addList')}
          </Button>
        </div>

        {/* Results */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle>{t('common.results')} ({combinations.length})</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { copy(combinations.join('\n')); incrementStat('keywordsCombined', combinations.length); }} 
                className="h-7 text-xs"
                disabled={combinations.length === 0}
              >
                <Copy className="h-3 w-3 mr-1" /> {t('common.copy')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={combinations.length === 0}>
                    {t('common.export')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => { exportTxt(combinations, 'keywords'); incrementStat('keywordsCombined', combinations.length); }}>TXT</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { exportCsv(combinations.map(k => [k]), 'keywords'); incrementStat('keywordsCombined', combinations.length); }}>CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            {combinations.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title={!hasAnyContent ? t('combiner.enterToStart') : matchTypes.length === 0 ? t('combiner.selectMatchTypeMsg') : !hasMultipleLists ? t('combiner.addMultipleLists') : t('combiner.noCombinations')}
                description={
                  !hasAnyContent 
                    ? t('combiner.enterToStartDesc')
                    : matchTypes.length === 0
                    ? t('combiner.selectMatchTypeDesc')
                    : !hasMultipleLists
                    ? t('combiner.addMultipleListsDesc')
                    : t('combiner.noCombinationsDesc')
                }
                className="py-8"
              />
            ) : (
              <Textarea value={combinations.join('\n')} readOnly rows={12} className="font-mono text-xs sm:text-sm" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

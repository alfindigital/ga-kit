import { useState } from 'react';
import { Copy, RotateCcw, Sparkles, AlertTriangle, Beaker, Shuffle } from 'lucide-react';
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
import { KeywordMixerSkeleton } from '@/components/skeletons';
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
  const { incrementStat } = useUsageStats();
  const { t } = useTranslation();

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
      if (pres.length === 0 && sufs.length === 0) { combined.push(b); }
      else if (pres.length === 0) { sufs.forEach(s => combined.push(`${b} ${s}`)); }
      else if (sufs.length === 0) { pres.forEach(p => combined.push(`${p} ${b}`)); }
      else { pres.forEach(p => sufs.forEach(s => combined.push(`${p} ${b} ${s}`))); }
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

  const loadSampleData = () => {
    setBase('shoes\nbags\nwatches');
    setPrefixes('best\ncheap\nluxury');
    setSuffixes('online\nnear me\n2024');
    toast({ title: t('common.sampleLoaded'), description: t('common.sampleLoadedDesc') });
  };

  const handleReset = () => { setBase(''); setPrefixes(''); setSuffixes(''); };

  useShortcutAction('page.copy', () => { if (results.length > 0) copy(results.join('\n')); });
  useShortcutAction('page.reset', handleReset);
  useShortcutAction('page.sample', loadSampleData);

  if (isLoading) return <KeywordMixerSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <ToolPageHeader
        icon={Shuffle}
        title={t('tool.keywordMixer')}
        description={t('tool.keywordMixer.desc')}
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

      {/* Match Types with validation */}
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

      <div className="space-y-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          {/* Prefixes */}
          <Card className={cn(
            "transition-colors",
            !prefixCount && (hasBaseKeywords || suffixCount > 0) && "border-dashed border-muted-foreground/30"
          )}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t('mixer.prefixes')}
                {prefixCount > 0 && (
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {prefixCount}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {t('mixer.baseKeywords')}
                  <span className="text-destructive ml-1">*</span>
                </span>
                {baseCount > 0 && (
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {baseCount}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                  {t('mixer.baseRequired')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Suffixes */}
          <Card className={cn(
            "transition-colors",
            !suffixCount && (hasBaseKeywords || prefixCount > 0) && "border-dashed border-muted-foreground/30"
          )}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t('mixer.suffixes')}
                {suffixCount > 0 && (
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {suffixCount}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle>{t('common.results')} ({results.length})</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { copy(results.join('\n')); incrementStat('keywordsMixed', results.length); }} 
                className="h-7 text-xs"
                disabled={results.length === 0}
              >
                <Copy className="h-3 w-3 mr-1" /> {t('common.copy')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled={results.length === 0}>
                    {t('common.export')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => { exportTxt(results, 'mixed-keywords'); incrementStat('keywordsMixed', results.length); }}>TXT</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { exportCsv(results.map(k => [k]), 'mixed-keywords'); incrementStat('keywordsMixed', results.length); }}>CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title={
                  !hasBaseKeywords 
                    ? t('mixer.enterBase')
                    : matchTypes.length === 0 
                    ? t('combiner.selectMatchTypeMsg')
                    : t('mixer.addModifiers')
                }
                description={
                  !hasBaseKeywords
                    ? t('mixer.enterBaseDesc')
                    : matchTypes.length === 0
                    ? t('combiner.selectMatchTypeDesc')
                    : t('mixer.addModifiersDesc')
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

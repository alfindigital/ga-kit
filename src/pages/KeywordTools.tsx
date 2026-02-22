import { useState } from 'react';
import { Copy, RotateCcw, FileText, ArrowRightLeft, CaseSensitive, Beaker, Wrench } from 'lucide-react';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useClipboard } from '@/hooks/useClipboard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useToast } from '@/hooks/use-toast';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useTranslation } from '@/hooks/useTranslation';
import { KeywordToolsSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/ui/empty-state';

export default function KeywordTools() {
  const { copy } = useClipboard();
  const { toast } = useToast();
  const isLoading = usePageLoading(400);
  const { t } = useTranslation();

  // Remove Duplicates state
  const [dupeInput, setDupeInput] = useState('');
  // Case Conversion state
  const [caseInput, setCaseInput] = useState('');
  const [caseMode, setCaseMode] = useState<'lower' | 'upper' | 'title' | 'sentence' | 'kebab' | 'snake'>('lower');
  // Bulk Replace state
  const [replaceInput, setReplaceInput] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);

  // Load sample data for demo
  const loadSampleData = () => {
    setDupeInput('running shoes\nbasketball shoes\nrunning shoes\ntennis shoes\nbasketball shoes');
    setCaseInput('Hello World Example Text');
    setReplaceInput('The quick brown fox jumps over the lazy dog');
    setFindText('fox');
    setReplaceText('cat');
    toast({ title: t('common.sampleLoaded'), description: t('common.sampleLoadedDesc') });
  };

  // Remove Duplicates derived values
  const dupeResult = [...new Set(dupeInput.split('\n').map(k => k.trim().toLowerCase()).filter(Boolean))];
  const dupeInputCount = dupeInput.split('\n').filter(l => l.trim()).length;
  const duplicatesRemoved = dupeInputCount - dupeResult.length;

  // Bulk Replace derived values
  const replaceResult = findText
    ? (caseSensitive ? replaceInput.split(findText).join(replaceText) : replaceInput.replace(new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replaceText))
    : replaceInput;
  const replaceCount = findText ? (replaceInput.split(caseSensitive ? findText : new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')).length - 1) : 0;

  // Keyboard shortcuts — must be called before any early return
  useKeyboardShortcuts([
    { key: 'c', shift: true, action: () => dupeResult.length > 0 && copy(dupeResult.join('\n')), description: 'Copy results' },
    { key: 's', shift: true, action: loadSampleData, description: 'Load sample' },
  ]);

  if (isLoading) return <KeywordToolsSkeleton />;

  // Case Conversion helper (non-hook, safe after early return)
  const convertCase = (text: string, mode: typeof caseMode) => {
    const lines = text.split('\n');
    return lines.map(line => {
      switch (mode) {
        case 'lower': return line.toLowerCase();
        case 'upper': return line.toUpperCase();
        case 'title': return line.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
        case 'sentence': return line.charAt(0).toUpperCase() + line.slice(1).toLowerCase();
        case 'kebab': return line.toLowerCase().replace(/\s+/g, '-');
        case 'snake': return line.toLowerCase().replace(/\s+/g, '_');
        default: return line;
      }
    }).join('\n');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <ToolPageHeader
        icon={Wrench}
        title={t('tool.keywordTools')}
        description={t('tool.keywordTools.desc')}
        iconColor="bg-warning/10 text-warning-foreground"
        accentGradient="from-warning to-warning/40"
      >
        <Button variant="ghost" size="sm" onClick={loadSampleData} className="h-8 text-xs">
          <Beaker className="h-3.5 w-3.5 mr-1" /> {t('common.sample')}
        </Button>
      </ToolPageHeader>

      <Tabs defaultValue="duplicates" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="duplicates" className="text-xs sm:text-sm py-2">{t('ktools.duplicates')}</TabsTrigger>
          <TabsTrigger value="case" className="text-xs sm:text-sm py-2">{t('ktools.case')}</TabsTrigger>
          <TabsTrigger value="replace" className="text-xs sm:text-sm py-2">{t('ktools.replace')}</TabsTrigger>
        </TabsList>

        {/* Duplicates Tab */}
        <TabsContent value="duplicates" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-xs sm:text-sm flex items-center justify-between">
                  {t('common.input')}
                  {dupeInputCount > 0 && (
                    <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {dupeInputCount} {t('common.lines')}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <Textarea placeholder={t('ktools.pasteKeywords')} value={dupeInput} onChange={(e) => setDupeInput(e.target.value)} rows={8} className="text-sm" />
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardHeader className="p-3 flex-row items-center justify-between">
                <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
                  {t('common.result')}
                  {dupeResult.length > 0 && (
                    <>
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {dupeResult.length} {t('common.unique')}
                      </span>
                      {duplicatesRemoved > 0 && (
                        <span className="text-xs font-normal text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                          -{duplicatesRemoved} {t('common.removed')}
                        </span>
                      )}
                    </>
                  )}
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copy(dupeResult.join('\n'))} 
                  className="h-7 text-xs"
                  disabled={dupeResult.length === 0}
                >
                  <Copy className="h-3 w-3 mr-1" /> {t('common.copy')}
                </Button>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {dupeResult.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={t('ktools.pasteToStart')}
                    description={t('ktools.pasteToStartDesc')}
                    className="py-6"
                  />
                ) : (
                  <Textarea value={dupeResult.join('\n')} readOnly rows={8} className="font-mono text-xs sm:text-sm" />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Case Tab */}
        <TabsContent value="case" className="mt-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {(['lower', 'upper', 'title', 'sentence', 'kebab', 'snake'] as const).map(mode => (
              <Button key={mode} variant={caseMode === mode ? 'default' : 'outline'} size="sm" onClick={() => setCaseMode(mode)} className="text-xs h-8">
                {mode === 'lower' ? 'lower' : mode === 'upper' ? 'UPPER' : mode === 'title' ? 'Title' : mode === 'sentence' ? 'Sentence' : mode}
              </Button>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-xs sm:text-sm">{t('common.input')}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <Textarea placeholder={t('ktools.enterTextToConvert')} value={caseInput} onChange={(e) => setCaseInput(e.target.value)} rows={8} className="text-sm" />
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardHeader className="p-3 flex-row items-center justify-between">
                <CardTitle className="text-xs sm:text-sm">{t('common.result')}</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copy(convertCase(caseInput, caseMode))} 
                  className="h-7 text-xs"
                  disabled={!caseInput.trim()}
                >
                  <Copy className="h-3 w-3 mr-1" /> {t('common.copy')}
                </Button>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {!caseInput.trim() ? (
                  <EmptyState
                    icon={CaseSensitive}
                    title={t('ktools.enterToConvert')}
                    description={t('ktools.enterToConvertDesc')}
                    className="py-6"
                  />
                ) : (
                  <Textarea value={convertCase(caseInput, caseMode)} readOnly rows={8} className="font-mono text-xs sm:text-sm" />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Replace Tab */}
        <TabsContent value="replace" className="mt-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 sm:max-w-[180px]">
              <Input 
                placeholder={t('ktools.find')}
                value={findText} 
                onChange={(e) => setFindText(e.target.value)} 
                className="text-sm" 
              />
            </div>
            <div className="flex-1 sm:max-w-[180px]">
              <Input 
                placeholder={t('ktools.replaceWith')}
                value={replaceText} 
                onChange={(e) => setReplaceText(e.target.value)} 
                className="text-sm" 
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={caseSensitive} onCheckedChange={(v) => setCaseSensitive(!!v)} /> 
              {t('ktools.caseSensitive')}
            </label>
            {findText && replaceInput && (
              <span className="text-xs text-muted-foreground flex items-center">
                {replaceCount} {replaceCount !== 1 ? t('ktools.matchesFound') : t('ktools.matchFound')} {t('ktools.found')}
              </span>
            )}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-xs sm:text-sm">{t('common.input')}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <Textarea placeholder={t('ktools.enterText')} value={replaceInput} onChange={(e) => setReplaceInput(e.target.value)} rows={8} className="text-sm" />
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardHeader className="p-3 flex-row items-center justify-between">
                <CardTitle className="text-xs sm:text-sm">{t('common.result')}</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copy(replaceResult)} 
                  className="h-7 text-xs"
                  disabled={!replaceInput.trim()}
                >
                  <Copy className="h-3 w-3 mr-1" /> {t('common.copy')}
                </Button>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {!replaceInput.trim() ? (
                  <EmptyState
                    icon={ArrowRightLeft}
                    title={t('ktools.enterToReplace')}
                    description={t('ktools.enterToReplaceDesc')}
                    className="py-6"
                  />
                ) : (
                  <Textarea value={replaceResult} readOnly rows={8} className="font-mono text-xs sm:text-sm" />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

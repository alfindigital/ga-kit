import { useState, useMemo } from 'react';
import { 
  Ban, 
  Copy, 
  Download, 
  RotateCcw, 
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useClipboard } from '@/hooks/useClipboard';
import { useExport } from '@/hooks/useExport';
import { useToast } from '@/hooks/use-toast';
import { usePageLoading } from '@/hooks/usePageLoading';
import { NegativeKeywordsSkeleton } from '@/components/skeletons';

// Types
interface ParsedKeyword {
  original: string;
  text: string;
  matchType: 'broad' | 'phrase' | 'exact';
  normalized: string;
}

interface Conflict {
  negativeKeyword: string;
  positiveKeyword: string;
  type: 'exact' | 'phrase' | 'broad';
  severity: 'critical' | 'warning' | 'caution';
  message: string;
}

type OutputFormat = 'broad' | 'phrase' | 'exact' | 'keep';

// Helper functions
function parseKeyword(input: string): ParsedKeyword {
  const trimmed = input.trim();
  let text = trimmed;
  let matchType: 'broad' | 'phrase' | 'exact' = 'broad';
  
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    text = trimmed.slice(1, -1);
    matchType = 'phrase';
  } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    text = trimmed.slice(1, -1);
    matchType = 'exact';
  }
  
  return {
    original: trimmed,
    text: text.trim(),
    matchType,
    normalized: text.trim().toLowerCase(),
  };
}

function formatKeyword(keyword: ParsedKeyword, format: OutputFormat): string {
  const text = keyword.text;
  
  switch (format) {
    case 'phrase':
      return `"${text}"`;
    case 'exact':
      return `[${text}]`;
    case 'keep':
      return keyword.original;
    case 'broad':
    default:
      return text;
  }
}

function removeDuplicates(
  keywords: ParsedKeyword[],
  options: { caseInsensitive: boolean; ignoreMatchType: boolean }
): ParsedKeyword[] {
  const seen = new Set<string>();
  const result: ParsedKeyword[] = [];
  
  for (const kw of keywords) {
    let key = options.caseInsensitive ? kw.text.toLowerCase() : kw.text;
    if (!options.ignoreMatchType) {
      key = `${key}|${kw.matchType}`;
    }
    
    if (!seen.has(key)) {
      seen.add(key);
      result.push(kw);
    }
  }
  
  return result;
}

function detectConflicts(negatives: ParsedKeyword[], positives: ParsedKeyword[], t: (key: string, params?: Record<string, string | number>) => string): Conflict[] {
  const conflicts: Conflict[] = [];
  
  for (const neg of negatives) {
    for (const pos of positives) {
      if (neg.normalized === pos.normalized) {
        conflicts.push({
          negativeKeyword: neg.original,
          positiveKeyword: pos.original,
          type: 'exact',
          severity: 'critical',
          message: t('neg.conflictExact', { neg: neg.text, pos: pos.text }),
        });
      }
      else if (neg.matchType === 'phrase' && pos.normalized.includes(neg.normalized)) {
        conflicts.push({
          negativeKeyword: neg.original,
          positiveKeyword: pos.original,
          type: 'phrase',
          severity: 'warning',
          message: t('neg.conflictPhrase', { neg: neg.text, pos: pos.text }),
        });
      }
      else if (neg.matchType === 'broad') {
        const negWords = neg.normalized.split(/\s+/);
        const posWords = pos.normalized.split(/\s+/);
        const matchingWords = negWords.filter(w => posWords.includes(w));
        
        if (matchingWords.length > 0) {
          conflicts.push({
            negativeKeyword: neg.original,
            positiveKeyword: pos.original,
            type: 'broad',
            severity: 'caution',
            message: t('neg.conflictBroad', { neg: neg.text, pos: pos.text, words: matchingWords.join(', ') }),
          });
        }
      }
    }
  }
  
  return conflicts;
}

const sampleNegatives = `free
"cheap shoes"
[discount code]
sale
reviews
tutorial
how to
diy`;

const samplePositives = `buy running shoes online
best sneakers for sale
cheap running gear
shoe reviews 2024
premium athletic footwear
running tutorial videos`;

export default function NegativeKeywords() {
  const isLoading = usePageLoading(400);
  const { copy } = useClipboard();
  const { exportTxt, exportCsv } = useExport();
  const { toast } = useToast();
  const { t } = useTranslation();
  // Input states
  const [negativeInput, setNegativeInput] = useState('');
  const [positiveInput, setPositiveInput] = useState('');
  
  // Options
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('broad');
  const [caseInsensitive, setCaseInsensitive] = useState(true);
  const [ignoreMatchType, setIgnoreMatchType] = useState(true);
  
  // Parse keywords
  const negativeKeywords = useMemo(() => {
    return negativeInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(parseKeyword);
  }, [negativeInput]);
  
  const positiveKeywords = useMemo(() => {
    return positiveInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(parseKeyword);
  }, [positiveInput]);
  
  // Process keywords
  const processedKeywords = useMemo(() => {
    const deduped = removeDuplicates(negativeKeywords, { caseInsensitive, ignoreMatchType });
    return deduped.map(kw => formatKeyword(kw, outputFormat));
  }, [negativeKeywords, outputFormat, caseInsensitive, ignoreMatchType]);
  
  // Detect conflicts
  const conflicts = useMemo(() => {
    if (positiveKeywords.length === 0) return [];
    const deduped = removeDuplicates(negativeKeywords, { caseInsensitive, ignoreMatchType });
    return detectConflicts(deduped, positiveKeywords, t);
  }, [negativeKeywords, positiveKeywords, caseInsensitive, ignoreMatchType, t]);
  
  // Stats
  const stats = {
    totalInput: negativeKeywords.length,
    unique: processedKeywords.length,
    duplicatesRemoved: negativeKeywords.length - processedKeywords.length,
    conflicts: conflicts.length,
    criticalConflicts: conflicts.filter(c => c.severity === 'critical').length,
  };
  
  const handleLoadSample = () => {
    setNegativeInput(sampleNegatives);
    setPositiveInput(samplePositives);
    toast({ title: t('neg.sampleLoaded'), description: t('neg.sampleLoadedDesc') });
  };
  
  const handleReset = () => {
    setNegativeInput('');
    setPositiveInput('');
    toast({ title: t('neg.resetComplete') });
  };
  
  const handleCopyResults = async () => {
    const text = processedKeywords.join('\n');
    await copy(text);
    toast({ title: t('neg.copiedToClipboard'), description: t('neg.keywordsCopied', { count: processedKeywords.length }) });
  };
  
  const handleExportTxt = () => {
    exportTxt(processedKeywords, 'negative-keywords');
    toast({ title: t('neg.exported'), description: t('neg.txtDownloaded') });
  };
  
  const handleExportCsv = () => {
    const data = processedKeywords.map(kw => [kw]);
    exportCsv(data, 'negative-keywords');
    toast({ title: t('neg.exported'), description: t('neg.csvDownloaded') });
  };
  
  const handleExportWithConflicts = () => {
    const lines = [
      '# Negative Keywords',
      '# Generated by GA Toolkit',
      '',
      '## Clean Keywords',
      ...processedKeywords,
      '',
      '## Conflicts Report',
      `Total Conflicts: ${conflicts.length}`,
      '',
      ...conflicts.map(c => `[${c.severity.toUpperCase()}] ${c.message}`),
    ];
    exportTxt(lines, 'negative-keywords-report');
    toast({ title: t('neg.exported'), description: t('neg.reportDownloaded') });
  };
  
  if (isLoading) return <NegativeKeywordsSkeleton />;
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <ToolPageHeader
        icon={Ban}
        title={t('neg.title')}
        description={t('neg.desc')}
        iconColor="bg-destructive/10 text-destructive"
        accentGradient="from-destructive to-destructive/40"
      >
        <Button variant="outline" size="sm" onClick={handleLoadSample}>
          <Lightbulb className="h-4 w-4 mr-1.5" />
          {t('common.sample')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-1.5" />
          {t('common.reset')}
        </Button>
      </ToolPageHeader>
      
      {/* Processing Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('neg.processingOptions')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('neg.outputFormat')}</Label>
            <RadioGroup
              value={outputFormat}
              onValueChange={(v) => setOutputFormat(v as OutputFormat)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="broad" id="broad" />
                <Label htmlFor="broad" className="font-normal cursor-pointer">{t('neg.broad')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phrase" id="phrase" />
                <Label htmlFor="phrase" className="font-normal cursor-pointer">"Phrase"</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exact" id="exact" />
                <Label htmlFor="exact" className="font-normal cursor-pointer">[Exact]</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="keep" id="keep" />
                <Label htmlFor="keep" className="font-normal cursor-pointer">{t('neg.keepOriginal')}</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator />
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="case" 
                checked={caseInsensitive}
                onCheckedChange={(checked) => setCaseInsensitive(checked as boolean)}
              />
              <Label htmlFor="case" className="font-normal cursor-pointer">{t('neg.caseInsensitive')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="matchtype" 
                checked={ignoreMatchType}
                onCheckedChange={(checked) => setIgnoreMatchType(checked as boolean)}
              />
              <Label htmlFor="matchtype" className="font-normal cursor-pointer">{t('neg.ignoreMatchType')}</Label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Input Areas */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Ban className="h-4 w-4 text-destructive" />
              {t('neg.negativeKeywords')}
            </CardTitle>
            <CardDescription>{t('neg.onePerLine')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={t('neg.negPlaceholder')}
              value={negativeInput}
              onChange={(e) => setNegativeInput(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Badge variant="outline">{negativeKeywords.length} {t('neg.keywords')}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {t('neg.positiveKeywords')}
              <Badge variant="secondary" className="ml-1 text-xs">{t('neg.optional')}</Badge>
            </CardTitle>
            <CardDescription>{t('neg.forConflictDetection')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={t('neg.posPlaceholder')}
              value={positiveInput}
              onChange={(e) => setPositiveInput(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Badge variant="outline">{positiveKeywords.length} {t('neg.keywords')}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base">{t('common.results')}</CardTitle>
              <CardDescription className="mt-1">
                {stats.unique} {t('neg.uniqueKeywords')}
                {stats.duplicatesRemoved > 0 && (
                  <span className="text-primary ml-1">
                    ({stats.duplicatesRemoved} {t('neg.duplicatesRemoved')})
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyResults}
                disabled={processedKeywords.length === 0}
              >
                <Copy className="h-4 w-4 mr-1.5" />
                {t('common.copy')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportTxt}
                disabled={processedKeywords.length === 0}
              >
                <Download className="h-4 w-4 mr-1.5" />
                TXT
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportCsv}
                disabled={processedKeywords.length === 0}
              >
                <Download className="h-4 w-4 mr-1.5" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Clean Keywords Output */}
          <div className="rounded-lg border bg-muted/30 p-3">
            {processedKeywords.length > 0 ? (
              <pre className="text-sm font-mono whitespace-pre-wrap max-h-[200px] overflow-auto">
                {processedKeywords.join('\n')}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('neg.enterNegativeKeywords')}
              </p>
            )}
          </div>
          
          {/* Conflicts Section */}
          {positiveKeywords.length > 0 && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning-foreground" />
                    {t('neg.conflictsDetected')} ({conflicts.length})
                  </h3>
                  {conflicts.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleExportWithConflicts}>
                      <Download className="h-4 w-4 mr-1.5" />
                      {t('neg.exportReport')}
                    </Button>
                  )}
                </div>
                
                {conflicts.length === 0 ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>{t('neg.noConflicts')}</AlertTitle>
                    <AlertDescription>
                      {t('neg.noConflictsDesc')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-auto">
                    {conflicts.map((conflict, index) => (
                      <Alert 
                        key={index} 
                        variant={conflict.severity === 'critical' ? 'destructive' : 'default'}
                        className={cn(
                          conflict.severity === 'warning' && 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20',
                          conflict.severity === 'caution' && 'border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20'
                        )}
                      >
                        {conflict.severity === 'critical' && <AlertCircle className="h-4 w-4" />}
                        {conflict.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                        {conflict.severity === 'caution' && <Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                        <AlertDescription className="text-sm">
                          <Badge 
                            variant={conflict.severity === 'critical' ? 'destructive' : 'outline'}
                            className={cn(
                              'mr-2 text-xs',
                              conflict.severity === 'warning' && 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
                              conflict.severity === 'caution' && 'border-orange-500 text-orange-700 dark:text-orange-400'
                            )}
                          >
                            {conflict.severity === 'critical' && t('neg.critical')}
                            {conflict.severity === 'warning' && t('neg.warning')}
                            {conflict.severity === 'caution' && t('neg.caution')}
                          </Badge>
                          {conflict.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Stats Summary */}
      {negativeKeywords.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="text-2xl font-bold">{stats.totalInput}</div>
            <div className="text-xs text-muted-foreground">{t('neg.totalInput')}</div>
          </Card>
          <Card className="p-3">
            <div className="text-2xl font-bold text-primary">{stats.unique}</div>
            <div className="text-xs text-muted-foreground">{t('neg.unique')}</div>
          </Card>
          <Card className="p-3">
            <div className="text-2xl font-bold text-muted-foreground">{stats.duplicatesRemoved}</div>
            <div className="text-xs text-muted-foreground">{t('neg.duplicatesRemovedLabel')}</div>
          </Card>
          <Card className="p-3">
            <div className={cn(
              "text-2xl font-bold",
              stats.criticalConflicts > 0 ? "text-destructive" : stats.conflicts > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-primary"
            )}>
              {stats.conflicts}
            </div>
            <div className="text-xs text-muted-foreground">{t('neg.conflictsFound')}</div>
          </Card>
        </div>
      )}
    </div>
  );
}

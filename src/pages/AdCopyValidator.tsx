import { useState, useMemo } from 'react';
import { Plus, Trash2, Copy, RotateCcw, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useClipboard } from '@/hooks/useClipboard';
import { AdCopyValidatorSkeleton } from '@/components/skeletons';
import { toast } from '@/hooks/use-toast';

interface Headline {
  id: string;
  text: string;
}

interface Description {
  id: string;
  text: string;
}

const MAX_HEADLINE_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 90;
const MAX_HEADLINES = 15;
const MAX_DESCRIPTIONS = 4;

const SAMPLE_HEADLINES: Headline[] = [
  { id: '1', text: 'Shop the Best Deals Today' },
  { id: '2', text: 'Free Shipping on Orders $50+' },
  { id: '3', text: 'Quality Products, Low Prices' },
  { id: '4', text: 'New Arrivals Just In' },
];

const SAMPLE_DESCRIPTIONS: Description[] = [
  { id: '1', text: 'Discover our wide selection of premium products at unbeatable prices. Shop now!' },
  { id: '2', text: 'Join millions of satisfied customers. Fast shipping and easy returns guaranteed.' },
];

export default function AdCopyValidator() {
  const isLoading = usePageLoading(400);
  const { copy } = useClipboard();
  
  const [headlines, setHeadlines] = useState<Headline[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
    { id: '3', text: '' },
  ]);
  
  const [descriptions, setDescriptions] = useState<Description[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ]);

  const [bulkHeadlines, setBulkHeadlines] = useState('');
  const [bulkDescriptions, setBulkDescriptions] = useState('');

  // Validation results
  const headlineValidation = useMemo(() => {
    return headlines.map(h => ({
      ...h,
      length: h.text.length,
      isValid: h.text.length > 0 && h.text.length <= MAX_HEADLINE_LENGTH,
      isEmpty: h.text.length === 0,
      isOverLimit: h.text.length > MAX_HEADLINE_LENGTH,
    }));
  }, [headlines]);

  const descriptionValidation = useMemo(() => {
    return descriptions.map(d => ({
      ...d,
      length: d.text.length,
      isValid: d.text.length > 0 && d.text.length <= MAX_DESCRIPTION_LENGTH,
      isEmpty: d.text.length === 0,
      isOverLimit: d.text.length > MAX_DESCRIPTION_LENGTH,
    }));
  }, [descriptions]);

  // Stats
  const stats = useMemo(() => {
    const validHeadlines = headlineValidation.filter(h => h.isValid).length;
    const validDescriptions = descriptionValidation.filter(d => d.isValid).length;
    const invalidHeadlines = headlineValidation.filter(h => h.isOverLimit).length;
    const invalidDescriptions = descriptionValidation.filter(d => d.isOverLimit).length;
    
    return {
      validHeadlines,
      validDescriptions,
      invalidHeadlines,
      invalidDescriptions,
      totalHeadlines: headlines.length,
      totalDescriptions: descriptions.length,
      isRSAReady: validHeadlines >= 3 && validDescriptions >= 2,
    };
  }, [headlineValidation, descriptionValidation, headlines.length, descriptions.length]);

  const updateHeadline = (id: string, text: string) => {
    setHeadlines(prev => prev.map(h => h.id === id ? { ...h, text } : h));
  };

  const updateDescription = (id: string, text: string) => {
    setDescriptions(prev => prev.map(d => d.id === id ? { ...d, text } : d));
  };

  const addHeadline = () => {
    if (headlines.length >= MAX_HEADLINES) {
      toast({ title: 'Maximum reached', description: `You can only add up to ${MAX_HEADLINES} headlines` });
      return;
    }
    setHeadlines(prev => [...prev, { id: Date.now().toString(), text: '' }]);
  };

  const addDescription = () => {
    if (descriptions.length >= MAX_DESCRIPTIONS) {
      toast({ title: 'Maximum reached', description: `You can only add up to ${MAX_DESCRIPTIONS} descriptions` });
      return;
    }
    setDescriptions(prev => [...prev, { id: Date.now().toString(), text: '' }]);
  };

  const removeHeadline = (id: string) => {
    if (headlines.length <= 3) {
      toast({ title: 'Minimum required', description: 'RSA requires at least 3 headlines' });
      return;
    }
    setHeadlines(prev => prev.filter(h => h.id !== id));
  };

  const removeDescription = (id: string) => {
    if (descriptions.length <= 2) {
      toast({ title: 'Minimum required', description: 'RSA requires at least 2 descriptions' });
      return;
    }
    setDescriptions(prev => prev.filter(d => d.id !== id));
  };

  const loadSample = () => {
    setHeadlines(SAMPLE_HEADLINES);
    setDescriptions(SAMPLE_DESCRIPTIONS);
    toast({ title: 'Sample loaded', description: 'Sample ad copy has been loaded' });
  };

  const reset = () => {
    setHeadlines([
      { id: '1', text: '' },
      { id: '2', text: '' },
      { id: '3', text: '' },
    ]);
    setDescriptions([
      { id: '1', text: '' },
      { id: '2', text: '' },
    ]);
    setBulkHeadlines('');
    setBulkDescriptions('');
    toast({ title: 'Reset', description: 'All fields have been cleared' });
  };

  const importBulk = () => {
    const newHeadlines = bulkHeadlines
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .slice(0, MAX_HEADLINES)
      .map((text, i) => ({ id: `bulk-h-${i}`, text }));
    
    const newDescriptions = bulkDescriptions
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .slice(0, MAX_DESCRIPTIONS)
      .map((text, i) => ({ id: `bulk-d-${i}`, text }));

    if (newHeadlines.length > 0) {
      setHeadlines(newHeadlines.length >= 3 ? newHeadlines : [...newHeadlines, ...Array(3 - newHeadlines.length).fill(null).map((_, i) => ({ id: `empty-h-${i}`, text: '' }))]);
    }
    if (newDescriptions.length > 0) {
      setDescriptions(newDescriptions.length >= 2 ? newDescriptions : [...newDescriptions, ...Array(2 - newDescriptions.length).fill(null).map((_, i) => ({ id: `empty-d-${i}`, text: '' }))]);
    }

    toast({ 
      title: 'Imported', 
      description: `${newHeadlines.length} headlines, ${newDescriptions.length} descriptions imported` 
    });
  };

  const copyAllValid = () => {
    const validH = headlineValidation.filter(h => h.isValid).map(h => h.text);
    const validD = descriptionValidation.filter(d => d.isValid).map(d => d.text);
    const output = `Headlines:\n${validH.join('\n')}\n\nDescriptions:\n${validD.join('\n')}`;
    copy(output);
    toast({ title: 'Copied', description: 'Valid ad copy copied to clipboard' });
  };

  if (isLoading) return <AdCopyValidatorSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Ad Copy Validator
          </h1>
          <p className="text-muted-foreground mt-1">
            Validate character limits for Google Ads RSA headlines and descriptions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadSample}>
            Sample
          </Button>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <Badge variant={stats.isRSAReady ? 'default' : 'secondary'} className="text-xs">
                {stats.isRSAReady ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" /> RSA Ready</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" /> Not Ready</>
                )}
              </Badge>
            </div>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div className="flex gap-4 text-sm">
              <span>
                Headlines: <strong className="text-primary">{stats.validHeadlines}</strong>/{stats.totalHeadlines} valid
              </span>
              <span>
                Descriptions: <strong className="text-primary">{stats.validDescriptions}</strong>/{stats.totalDescriptions} valid
              </span>
            </div>
            {(stats.invalidHeadlines > 0 || stats.invalidDescriptions > 0) && (
              <>
                <Separator orientation="vertical" className="h-6 hidden sm:block" />
                <span className="text-destructive text-sm">
                  {stats.invalidHeadlines + stats.invalidDescriptions} over limit
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="editor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
          <TabsTrigger value="preview">Ad Preview</TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Headlines */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Headlines</CardTitle>
                    <CardDescription>Max {MAX_HEADLINE_LENGTH} characters each (3-{MAX_HEADLINES} required)</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addHeadline} disabled={headlines.length >= MAX_HEADLINES}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {headlines.map((headline, index) => {
                  const validation = headlineValidation[index];
                  return (
                    <div key={headline.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-6">H{index + 1}</span>
                        <div className="flex-1 relative">
                          <Input
                            value={headline.text}
                            onChange={(e) => updateHeadline(headline.id, e.target.value)}
                            placeholder={`Headline ${index + 1}`}
                            className={cn(
                              "pr-16",
                              validation.isOverLimit && "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                          <span className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 text-xs",
                            validation.isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
                          )}>
                            {validation.length}/{MAX_HEADLINE_LENGTH}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeHeadline(headline.id)}
                          disabled={headlines.length <= 3}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {validation.isOverLimit && (
                        <p className="text-xs text-destructive pl-8">
                          Exceeds limit by {validation.length - MAX_HEADLINE_LENGTH} characters
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Descriptions */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Descriptions</CardTitle>
                    <CardDescription>Max {MAX_DESCRIPTION_LENGTH} characters each (2-{MAX_DESCRIPTIONS} required)</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addDescription} disabled={descriptions.length >= MAX_DESCRIPTIONS}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {descriptions.map((description, index) => {
                  const validation = descriptionValidation[index];
                  return (
                    <div key={description.id} className="space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-muted-foreground w-6 mt-2.5">D{index + 1}</span>
                        <div className="flex-1 relative">
                          <Textarea
                            value={description.text}
                            onChange={(e) => updateDescription(description.id, e.target.value)}
                            placeholder={`Description ${index + 1}`}
                            rows={2}
                            className={cn(
                              validation.isOverLimit && "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                          <span className={cn(
                            "absolute right-3 bottom-2 text-xs",
                            validation.isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
                          )}>
                            {validation.length}/{MAX_DESCRIPTION_LENGTH}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive mt-1"
                          onClick={() => removeDescription(description.id)}
                          disabled={descriptions.length <= 2}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {validation.isOverLimit && (
                        <p className="text-xs text-destructive pl-8">
                          Exceeds limit by {validation.length - MAX_DESCRIPTION_LENGTH} characters
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Copy Button */}
          <div className="flex justify-end">
            <Button onClick={copyAllValid} disabled={stats.validHeadlines === 0 && stats.validDescriptions === 0}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Valid Ad Copy
            </Button>
          </div>
        </TabsContent>

        {/* Bulk Import Tab */}
        <TabsContent value="bulk" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bulk Headlines</CardTitle>
                <CardDescription>Paste headlines, one per line (max {MAX_HEADLINES})</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={bulkHeadlines}
                  onChange={(e) => setBulkHeadlines(e.target.value)}
                  placeholder="Headline 1&#10;Headline 2&#10;Headline 3"
                  rows={8}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bulk Descriptions</CardTitle>
                <CardDescription>Paste descriptions, one per line (max {MAX_DESCRIPTIONS})</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={bulkDescriptions}
                  onChange={(e) => setBulkDescriptions(e.target.value)}
                  placeholder="Description 1&#10;Description 2"
                  rows={8}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={importBulk}>
              Import to Editor
            </Button>
          </div>
        </TabsContent>

        {/* Ad Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Google Search Ad Preview</CardTitle>
              <CardDescription>Preview how your ad might appear in search results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-xl space-y-4">
                {/* Desktop Preview */}
                <div className="border rounded-lg p-4 bg-background">
                  <p className="text-xs text-muted-foreground mb-2">Desktop Preview</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-1 py-0.5 border rounded text-[10px]">Ad</span>
                      <span>www.example.com</span>
                    </div>
                    <h3 className="text-lg text-primary font-medium leading-snug">
                      {headlineValidation
                        .filter(h => h.isValid)
                        .slice(0, 3)
                        .map(h => h.text)
                        .join(' | ') || 'Your headlines will appear here'}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {descriptionValidation
                        .filter(d => d.isValid)
                        .slice(0, 2)
                        .map(d => d.text)
                        .join(' ') || 'Your descriptions will appear here'}
                    </p>
                  </div>
                </div>

                {/* Mobile Preview */}
                <div className="border rounded-lg p-4 bg-background max-w-xs">
                  <p className="text-xs text-muted-foreground mb-2">Mobile Preview</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-1 py-0.5 border rounded text-[10px]">Ad</span>
                      <span>example.com</span>
                    </div>
                    <h3 className="text-base text-primary font-medium leading-snug">
                      {headlineValidation
                        .filter(h => h.isValid)
                        .slice(0, 2)
                        .map(h => h.text)
                        .join(' | ') || 'Headlines here'}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {descriptionValidation
                        .filter(d => d.isValid)
                        .slice(0, 1)
                        .map(d => d.text)
                        .join(' ') || 'Description here'}
                    </p>
                  </div>
                </div>

                {/* Validation Summary */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Validation Summary</h4>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Headlines</p>
                      <ul className="space-y-1">
                        {headlineValidation.map((h, i) => (
                          <li key={h.id} className="flex items-center gap-2">
                            {h.isValid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : h.isEmpty ? (
                              <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span className={cn(h.isOverLimit && "text-destructive")}>
                              H{i + 1}: {h.length}/{MAX_HEADLINE_LENGTH}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Descriptions</p>
                      <ul className="space-y-1">
                        {descriptionValidation.map((d, i) => (
                          <li key={d.id} className="flex items-center gap-2">
                            {d.isValid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : d.isEmpty ? (
                              <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span className={cn(d.isOverLimit && "text-destructive")}>
                              D{i + 1}: {d.length}/{MAX_DESCRIPTION_LENGTH}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

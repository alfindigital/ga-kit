import { useState, useMemo } from 'react';
import { Plus, Trash2, Copy, RotateCcw, AlertCircle, CheckCircle2, FileText, AlertTriangle, Link, MessageSquare, List, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

interface Sitelink {
  id: string;
  title: string;
  description1: string;
  description2: string;
}

interface Callout {
  id: string;
  text: string;
}

interface StructuredSnippet {
  id: string;
  header: string;
  values: string[];
}

interface PriceExtension {
  id: string;
  header: string;
  price: string;
  unit: string;
  description: string;
}

const SNIPPET_HEADERS = [
  'Amenities',
  'Brands',
  'Courses',
  'Degree programs',
  'Destinations',
  'Featured hotels',
  'Insurance coverage',
  'Models',
  'Neighborhoods',
  'Service catalog',
  'Shows',
  'Styles',
  'Types',
];

const PRICE_UNITS = [
  'None',
  'per hour',
  'per day',
  'per week',
  'per month',
  'per year',
  'per night',
  'per item',
];

const MAX_HEADLINE_LENGTH = 30;
const MAX_DESCRIPTION_LENGTH = 90;
const MAX_HEADLINES = 15;
const MAX_DESCRIPTIONS = 4;
const MAX_SITELINK_TITLE_LENGTH = 25;
const MAX_SITELINK_DESC_LENGTH = 35;
const MAX_SITELINKS = 6;
const MAX_CALLOUT_LENGTH = 25;
const MAX_CALLOUTS = 10;
const MAX_SNIPPET_VALUE_LENGTH = 25;
const MAX_SNIPPET_VALUES = 10;
const MIN_SNIPPET_VALUES = 3;
const MAX_PRICE_HEADER_LENGTH = 25;
const MAX_PRICE_DESC_LENGTH = 25;
const MAX_PRICES = 8;

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

  const [sitelinks, setSitelinks] = useState<Sitelink[]>([
    { id: '1', title: '', description1: '', description2: '' },
    { id: '2', title: '', description1: '', description2: '' },
  ]);

  const [callouts, setCallouts] = useState<Callout[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
    { id: '3', text: '' },
    { id: '4', text: '' },
  ]);

  const [snippets, setSnippets] = useState<StructuredSnippet[]>([
    { id: '1', header: 'Types', values: ['', '', ''] },
  ]);

  const [prices, setPrices] = useState<PriceExtension[]>([
    { id: '1', header: '', price: '', unit: 'None', description: '' },
    { id: '2', header: '', price: '', unit: 'None', description: '' },
    { id: '3', header: '', price: '', unit: 'None', description: '' },
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

  const sitelinkValidation = useMemo(() => {
    return sitelinks.map(s => ({
      ...s,
      titleLength: s.title.length,
      desc1Length: s.description1.length,
      desc2Length: s.description2.length,
      isTitleValid: s.title.length > 0 && s.title.length <= MAX_SITELINK_TITLE_LENGTH,
      isDesc1Valid: s.description1.length === 0 || s.description1.length <= MAX_SITELINK_DESC_LENGTH,
      isDesc2Valid: s.description2.length === 0 || s.description2.length <= MAX_SITELINK_DESC_LENGTH,
      isTitleEmpty: s.title.length === 0,
      isTitleOverLimit: s.title.length > MAX_SITELINK_TITLE_LENGTH,
      isDesc1OverLimit: s.description1.length > MAX_SITELINK_DESC_LENGTH,
      isDesc2OverLimit: s.description2.length > MAX_SITELINK_DESC_LENGTH,
      isComplete: s.title.length > 0 && s.title.length <= MAX_SITELINK_TITLE_LENGTH,
    }));
  }, [sitelinks]);

  const calloutValidation = useMemo(() => {
    return callouts.map(c => ({
      ...c,
      length: c.text.length,
      isValid: c.text.length > 0 && c.text.length <= MAX_CALLOUT_LENGTH,
      isEmpty: c.text.length === 0,
      isOverLimit: c.text.length > MAX_CALLOUT_LENGTH,
    }));
  }, [callouts]);

  const snippetValidation = useMemo(() => {
    return snippets.map(s => {
      const valueValidations = s.values.map(v => ({
        text: v,
        length: v.length,
        isValid: v.length > 0 && v.length <= MAX_SNIPPET_VALUE_LENGTH,
        isEmpty: v.length === 0,
        isOverLimit: v.length > MAX_SNIPPET_VALUE_LENGTH,
      }));
      const validValues = valueValidations.filter(v => v.isValid).length;
      const invalidValues = valueValidations.filter(v => v.isOverLimit).length;
      return {
        ...s,
        valueValidations,
        validValues,
        invalidValues,
        hasHeader: s.header.length > 0,
        isComplete: s.header.length > 0 && validValues >= MIN_SNIPPET_VALUES,
        hasInvalidValues: invalidValues > 0,
      };
    });
  }, [snippets]);

  const priceValidation = useMemo(() => {
    return prices.map(p => ({
      ...p,
      headerLength: p.header.length,
      descLength: p.description.length,
      isHeaderValid: p.header.length > 0 && p.header.length <= MAX_PRICE_HEADER_LENGTH,
      isDescValid: p.description.length === 0 || p.description.length <= MAX_PRICE_DESC_LENGTH,
      isPriceValid: p.price.length > 0,
      isHeaderEmpty: p.header.length === 0,
      isHeaderOverLimit: p.header.length > MAX_PRICE_HEADER_LENGTH,
      isDescOverLimit: p.description.length > MAX_PRICE_DESC_LENGTH,
      isComplete: p.header.length > 0 && p.header.length <= MAX_PRICE_HEADER_LENGTH && p.price.length > 0,
    }));
  }, [prices]);

  // Stats
  const stats = useMemo(() => {
    const validHeadlines = headlineValidation.filter(h => h.isValid).length;
    const validDescriptions = descriptionValidation.filter(d => d.isValid).length;
    const invalidHeadlines = headlineValidation.filter(h => h.isOverLimit).length;
    const invalidDescriptions = descriptionValidation.filter(d => d.isOverLimit).length;
    const validSitelinks = sitelinkValidation.filter(s => s.isComplete).length;
    const invalidSitelinks = sitelinkValidation.filter(s => s.isTitleOverLimit || s.isDesc1OverLimit || s.isDesc2OverLimit).length;
    const validCallouts = calloutValidation.filter(c => c.isValid).length;
    const invalidCallouts = calloutValidation.filter(c => c.isOverLimit).length;
    const validSnippets = snippetValidation.filter(s => s.isComplete).length;
    const invalidSnippetValues = snippetValidation.reduce((acc, s) => acc + s.invalidValues, 0);
    const validPrices = priceValidation.filter(p => p.isComplete).length;
    const invalidPrices = priceValidation.filter(p => p.isHeaderOverLimit || p.isDescOverLimit).length;
    
    return {
      validHeadlines,
      validDescriptions,
      invalidHeadlines,
      invalidDescriptions,
      validSitelinks,
      invalidSitelinks,
      validCallouts,
      invalidCallouts,
      validSnippets,
      invalidSnippetValues,
      validPrices,
      invalidPrices,
      totalHeadlines: headlines.length,
      totalDescriptions: descriptions.length,
      totalSitelinks: sitelinks.length,
      totalCallouts: callouts.length,
      totalSnippets: snippets.length,
      totalPrices: prices.length,
      isRSAReady: validHeadlines >= 3 && validDescriptions >= 2,
    };
  }, [headlineValidation, descriptionValidation, sitelinkValidation, calloutValidation, snippetValidation, priceValidation, headlines.length, descriptions.length, sitelinks.length, callouts.length, snippets.length, prices.length]);

  const updateHeadline = (id: string, text: string) => {
    setHeadlines(prev => prev.map(h => h.id === id ? { ...h, text } : h));
  };

  const updateDescription = (id: string, text: string) => {
    setDescriptions(prev => prev.map(d => d.id === id ? { ...d, text } : d));
  };

  const updateSitelink = (id: string, field: 'title' | 'description1' | 'description2', value: string) => {
    setSitelinks(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const updateCallout = (id: string, text: string) => {
    setCallouts(prev => prev.map(c => c.id === id ? { ...c, text } : c));
  };

  const updateSnippetHeader = (id: string, header: string) => {
    setSnippets(prev => prev.map(s => s.id === id ? { ...s, header } : s));
  };

  const updateSnippetValue = (snippetId: string, valueIndex: number, value: string) => {
    setSnippets(prev => prev.map(s => 
      s.id === snippetId 
        ? { ...s, values: s.values.map((v, i) => i === valueIndex ? value : v) }
        : s
    ));
  };

  const addSnippetValue = (snippetId: string) => {
    setSnippets(prev => prev.map(s => {
      if (s.id === snippetId && s.values.length < MAX_SNIPPET_VALUES) {
        return { ...s, values: [...s.values, ''] };
      }
      return s;
    }));
  };

  const removeSnippetValue = (snippetId: string, valueIndex: number) => {
    setSnippets(prev => prev.map(s => {
      if (s.id === snippetId && s.values.length > MIN_SNIPPET_VALUES) {
        return { ...s, values: s.values.filter((_, i) => i !== valueIndex) };
      }
      return s;
    }));
  };

  const updatePrice = (id: string, field: 'header' | 'price' | 'unit' | 'description', value: string) => {
    setPrices(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
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

  const addSitelink = () => {
    if (sitelinks.length >= MAX_SITELINKS) {
      toast({ title: 'Maximum reached', description: `You can only add up to ${MAX_SITELINKS} sitelinks` });
      return;
    }
    setSitelinks(prev => [...prev, { id: Date.now().toString(), title: '', description1: '', description2: '' }]);
  };

  const addCallout = () => {
    if (callouts.length >= MAX_CALLOUTS) {
      toast({ title: 'Maximum reached', description: `You can only add up to ${MAX_CALLOUTS} callouts` });
      return;
    }
    setCallouts(prev => [...prev, { id: Date.now().toString(), text: '' }]);
  };

  const addSnippet = () => {
    if (snippets.length >= 2) {
      toast({ title: 'Maximum reached', description: 'You can only add up to 2 structured snippets' });
      return;
    }
    setSnippets(prev => [...prev, { id: Date.now().toString(), header: 'Brands', values: ['', '', ''] }]);
  };

  const addPrice = () => {
    if (prices.length >= MAX_PRICES) {
      toast({ title: 'Maximum reached', description: `You can only add up to ${MAX_PRICES} price items` });
      return;
    }
    setPrices(prev => [...prev, { id: Date.now().toString(), header: '', price: '', unit: 'None', description: '' }]);
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

  const removeSitelink = (id: string) => {
    if (sitelinks.length <= 2) {
      toast({ title: 'Minimum required', description: 'At least 2 sitelinks recommended' });
      return;
    }
    setSitelinks(prev => prev.filter(s => s.id !== id));
  };

  const removeCallout = (id: string) => {
    if (callouts.length <= 4) {
      toast({ title: 'Minimum required', description: 'At least 4 callouts recommended' });
      return;
    }
    setCallouts(prev => prev.filter(c => c.id !== id));
  };

  const removeSnippet = (id: string) => {
    if (snippets.length <= 1) {
      toast({ title: 'Minimum required', description: 'At least 1 structured snippet recommended' });
      return;
    }
    setSnippets(prev => prev.filter(s => s.id !== id));
  };

  const removePrice = (id: string) => {
    if (prices.length <= 3) {
      toast({ title: 'Minimum required', description: 'At least 3 price items recommended' });
      return;
    }
    setPrices(prev => prev.filter(p => p.id !== id));
  };

  const loadSample = () => {
    setHeadlines(SAMPLE_HEADLINES);
    setDescriptions(SAMPLE_DESCRIPTIONS);
    setSitelinks([
      { id: '1', title: 'Shop Now', description1: 'Browse our collection', description2: 'Find your perfect item' },
      { id: '2', title: 'Free Shipping', description1: 'On orders over $50', description2: 'Fast delivery guaranteed' },
      { id: '3', title: 'Contact Us', description1: 'Get in touch today', description2: 'We are here to help' },
    ]);
    setCallouts([
      { id: '1', text: 'Free Returns' },
      { id: '2', text: '24/7 Support' },
      { id: '3', text: 'Price Match' },
      { id: '4', text: 'Fast Delivery' },
    ]);
    setSnippets([
      { id: '1', header: 'Brands', values: ['Nike', 'Adidas', 'Puma', 'Reebok'] },
    ]);
    setPrices([
      { id: '1', header: 'Basic Plan', price: '$9.99', unit: 'per month', description: 'For individuals' },
      { id: '2', header: 'Pro Plan', price: '$29.99', unit: 'per month', description: 'For small teams' },
      { id: '3', header: 'Enterprise', price: '$99.99', unit: 'per month', description: 'For large orgs' },
    ]);
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
    setSitelinks([
      { id: '1', title: '', description1: '', description2: '' },
      { id: '2', title: '', description1: '', description2: '' },
    ]);
    setCallouts([
      { id: '1', text: '' },
      { id: '2', text: '' },
      { id: '3', text: '' },
      { id: '4', text: '' },
    ]);
    setSnippets([
      { id: '1', header: 'Types', values: ['', '', ''] },
    ]);
    setPrices([
      { id: '1', header: '', price: '', unit: 'None', description: '' },
      { id: '2', header: '', price: '', unit: 'None', description: '' },
      { id: '3', header: '', price: '', unit: 'None', description: '' },
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
            <span>
              Sitelinks: <strong className="text-primary">{stats.validSitelinks}</strong>/{stats.totalSitelinks} valid
            </span>
            <span>
              Callouts: <strong className="text-primary">{stats.validCallouts}</strong>/{stats.totalCallouts} valid
            </span>
            <span>
              Snippets: <strong className="text-primary">{stats.validSnippets}</strong>/{stats.totalSnippets} valid
            </span>
            <span>
              Prices: <strong className="text-primary">{stats.validPrices}</strong>/{stats.totalPrices} valid
            </span>
            {(stats.invalidHeadlines > 0 || stats.invalidDescriptions > 0 || stats.invalidSitelinks > 0 || stats.invalidCallouts > 0 || stats.invalidSnippetValues > 0 || stats.invalidPrices > 0) && (
              <>
                <Separator orientation="vertical" className="h-6 hidden sm:block" />
                <span className="text-destructive text-sm">
                  {stats.invalidHeadlines + stats.invalidDescriptions + stats.invalidSitelinks + stats.invalidCallouts + stats.invalidSnippetValues + stats.invalidPrices} over limit
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
          {/* Price Extension Validation Warning Alert */}
          {stats.invalidPrices > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Price Extension Character Limit Exceeded</AlertTitle>
              <AlertDescription>
                {stats.invalidPrices} price item{stats.invalidPrices > 1 ? 's have' : ' has'} fields exceeding character limits.
                Headers and descriptions must be max {MAX_PRICE_HEADER_LENGTH} chars each.
              </AlertDescription>
            </Alert>
          )}
          {/* Structured Snippet Validation Warning Alert */}
          {stats.invalidSnippetValues > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Structured Snippet Character Limit Exceeded</AlertTitle>
              <AlertDescription>
                {stats.invalidSnippetValues} snippet value{stats.invalidSnippetValues > 1 ? 's' : ''} exceed{stats.invalidSnippetValues === 1 ? 's' : ''} the {MAX_SNIPPET_VALUE_LENGTH} character limit.
              </AlertDescription>
            </Alert>
          )}
          {/* Callout Validation Warning Alert */}
          {stats.invalidCallouts > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Callout Character Limit Exceeded</AlertTitle>
              <AlertDescription>
                {stats.invalidCallouts} callout{stats.invalidCallouts > 1 ? 's' : ''} exceed{stats.invalidCallouts === 1 ? 's' : ''} the {MAX_CALLOUT_LENGTH} character limit.
              </AlertDescription>
            </Alert>
          )}
          {/* Sitelink Validation Warning Alert */}
          {stats.invalidSitelinks > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Sitelink Character Limit Exceeded</AlertTitle>
              <AlertDescription>
                {stats.invalidSitelinks} sitelink{stats.invalidSitelinks > 1 ? 's have' : ' has'} fields exceeding character limits.
                Titles must be max {MAX_SITELINK_TITLE_LENGTH} chars, descriptions max {MAX_SITELINK_DESC_LENGTH} chars each.
              </AlertDescription>
            </Alert>
          )}
          {/* Validation Warning Alert */}
          {(stats.invalidHeadlines > 0 || stats.invalidDescriptions > 0) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Character Limit Exceeded</AlertTitle>
              <AlertDescription>
                {stats.invalidHeadlines > 0 && (
                  <span>
                    {stats.invalidHeadlines} headline{stats.invalidHeadlines > 1 ? 's' : ''} exceed{stats.invalidHeadlines === 1 ? 's' : ''} the {MAX_HEADLINE_LENGTH} character limit.
                  </span>
                )}
                {stats.invalidHeadlines > 0 && stats.invalidDescriptions > 0 && ' '}
                {stats.invalidDescriptions > 0 && (
                  <span>
                    {stats.invalidDescriptions} description{stats.invalidDescriptions > 1 ? 's' : ''} exceed{stats.invalidDescriptions === 1 ? 's' : ''} the {MAX_DESCRIPTION_LENGTH} character limit.
                  </span>
                )}
                {' '}Please shorten them to create a valid RSA ad.
              </AlertDescription>
            </Alert>
          )}

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

          {/* Sitelink Extensions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    Sitelink Extensions
                  </CardTitle>
                  <CardDescription>Title max {MAX_SITELINK_TITLE_LENGTH} chars, descriptions max {MAX_SITELINK_DESC_LENGTH} chars each</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addSitelink} disabled={sitelinks.length >= MAX_SITELINKS}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {sitelinks.map((sitelink, index) => {
                const validation = sitelinkValidation[index];
                const hasError = validation.isTitleOverLimit || validation.isDesc1OverLimit || validation.isDesc2OverLimit;
                return (
                  <div key={sitelink.id} className={cn(
                    "p-4 rounded-lg border space-y-3",
                    hasError ? "border-destructive/50 bg-destructive/5" : "border-border"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Sitelink {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSitelink(sitelink.id)}
                        disabled={sitelinks.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Title */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Link Text (Title)</label>
                      <div className="relative">
                        <Input
                          value={sitelink.title}
                          onChange={(e) => updateSitelink(sitelink.id, 'title', e.target.value)}
                          placeholder="e.g., Shop Now"
                          className={cn(
                            "pr-16",
                            validation.isTitleOverLimit && "border-destructive focus-visible:ring-destructive"
                          )}
                        />
                        <span className={cn(
                          "absolute right-3 top-1/2 -translate-y-1/2 text-xs",
                          validation.isTitleOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
                        )}>
                          {validation.titleLength}/{MAX_SITELINK_TITLE_LENGTH}
                        </span>
                      </div>
                      {validation.isTitleOverLimit && (
                        <p className="text-xs text-destructive">
                          Exceeds limit by {validation.titleLength - MAX_SITELINK_TITLE_LENGTH} characters
                        </p>
                      )}
                    </div>

                    {/* Description Lines */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Description Line 1</label>
                        <div className="relative">
                          <Input
                            value={sitelink.description1}
                            onChange={(e) => updateSitelink(sitelink.id, 'description1', e.target.value)}
                            placeholder="e.g., Browse our collection"
                            className={cn(
                              "pr-14",
                              validation.isDesc1OverLimit && "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                          <span className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 text-xs",
                            validation.isDesc1OverLimit ? "text-destructive font-medium" : "text-muted-foreground"
                          )}>
                            {validation.desc1Length}/{MAX_SITELINK_DESC_LENGTH}
                          </span>
                        </div>
                        {validation.isDesc1OverLimit && (
                          <p className="text-xs text-destructive">
                            Exceeds limit by {validation.desc1Length - MAX_SITELINK_DESC_LENGTH} characters
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Description Line 2</label>
                        <div className="relative">
                          <Input
                            value={sitelink.description2}
                            onChange={(e) => updateSitelink(sitelink.id, 'description2', e.target.value)}
                            placeholder="e.g., Find your perfect item"
                            className={cn(
                              "pr-14",
                              validation.isDesc2OverLimit && "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                          <span className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 text-xs",
                            validation.isDesc2OverLimit ? "text-destructive font-medium" : "text-muted-foreground"
                          )}>
                            {validation.desc2Length}/{MAX_SITELINK_DESC_LENGTH}
                          </span>
                        </div>
                        {validation.isDesc2OverLimit && (
                          <p className="text-xs text-destructive">
                            Exceeds limit by {validation.desc2Length - MAX_SITELINK_DESC_LENGTH} characters
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Callout Extensions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Callout Extensions
                  </CardTitle>
                  <CardDescription>Max {MAX_CALLOUT_LENGTH} characters each (4-{MAX_CALLOUTS} recommended)</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addCallout} disabled={callouts.length >= MAX_CALLOUTS}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {callouts.map((callout, index) => {
                  const validation = calloutValidation[index];
                  return (
                    <div key={callout.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5">C{index + 1}</span>
                        <div className="flex-1 relative">
                          <Input
                            value={callout.text}
                            onChange={(e) => updateCallout(callout.id, e.target.value)}
                            placeholder={`Callout ${index + 1}`}
                            className={cn(
                              "pr-14",
                              validation.isOverLimit && "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                          <span className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 text-xs",
                            validation.isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
                          )}>
                            {validation.length}/{MAX_CALLOUT_LENGTH}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeCallout(callout.id)}
                          disabled={callouts.length <= 4}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {validation.isOverLimit && (
                        <p className="text-xs text-destructive pl-7">
                          Exceeds limit by {validation.length - MAX_CALLOUT_LENGTH} characters
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Structured Snippet Extensions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <List className="h-5 w-5" />
                    Structured Snippet Extensions
                  </CardTitle>
                  <CardDescription>Select a header and add {MIN_SNIPPET_VALUES}-{MAX_SNIPPET_VALUES} values (max {MAX_SNIPPET_VALUE_LENGTH} chars each)</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addSnippet} disabled={snippets.length >= 2}>
                  <Plus className="h-4 w-4 mr-1" /> Add Snippet
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {snippets.map((snippet, snippetIndex) => {
                const validation = snippetValidation[snippetIndex];
                return (
                  <div key={snippet.id} className={cn(
                    "p-4 rounded-lg border space-y-3",
                    validation.hasInvalidValues ? "border-destructive/50 bg-destructive/5" : "border-border"
                  )}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm font-medium whitespace-nowrap">Snippet {snippetIndex + 1}</span>
                        <Select value={snippet.header} onValueChange={(value) => updateSnippetHeader(snippet.id, value)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select header" />
                          </SelectTrigger>
                          <SelectContent>
                            {SNIPPET_HEADERS.map((header) => (
                              <SelectItem key={header} value={header}>{header}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSnippet(snippet.id)}
                        disabled={snippets.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground">Values ({validation.validValues}/{snippet.values.length} valid, min {MIN_SNIPPET_VALUES})</label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addSnippetValue(snippet.id)}
                          disabled={snippet.values.length >= MAX_SNIPPET_VALUES}
                          className="h-7 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Value
                        </Button>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {snippet.values.map((value, valueIndex) => {
                          const valueValidation = validation.valueValidations[valueIndex];
                          return (
                            <div key={valueIndex} className="space-y-1">
                              <div className="flex items-center gap-1">
                                <div className="flex-1 relative">
                                  <Input
                                    value={value}
                                    onChange={(e) => updateSnippetValue(snippet.id, valueIndex, e.target.value)}
                                    placeholder={`Value ${valueIndex + 1}`}
                                    className={cn(
                                      "pr-14 h-9",
                                      valueValidation.isOverLimit && "border-destructive focus-visible:ring-destructive"
                                    )}
                                  />
                                  <span className={cn(
                                    "absolute right-3 top-1/2 -translate-y-1/2 text-xs",
                                    valueValidation.isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
                                  )}>
                                    {valueValidation.length}/{MAX_SNIPPET_VALUE_LENGTH}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                                  onClick={() => removeSnippetValue(snippet.id, valueIndex)}
                                  disabled={snippet.values.length <= MIN_SNIPPET_VALUES}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              {valueValidation.isOverLimit && (
                                <p className="text-xs text-destructive">
                                  Exceeds by {valueValidation.length - MAX_SNIPPET_VALUE_LENGTH} chars
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Price Extensions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Price Extensions
                  </CardTitle>
                  <CardDescription>Header & description max {MAX_PRICE_HEADER_LENGTH} chars each (3-{MAX_PRICES} items)</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addPrice} disabled={prices.length >= MAX_PRICES}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {prices.map((price, index) => {
                const validation = priceValidation[index];
                const hasError = validation.isHeaderOverLimit || validation.isDescOverLimit;
                return (
                  <div key={price.id} className={cn(
                    "p-3 rounded-lg border",
                    hasError ? "border-destructive/50 bg-destructive/5" : "border-border"
                  )}>
                    <div className="flex items-start gap-3">
                      <span className="text-xs text-muted-foreground w-5 mt-2.5">P{index + 1}</span>
                      <div className="flex-1 grid sm:grid-cols-4 gap-2">
                        {/* Header */}
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Header</label>
                          <div className="relative">
                            <Input
                              value={price.header}
                              onChange={(e) => updatePrice(price.id, 'header', e.target.value)}
                              placeholder="e.g., Basic Plan"
                              className={cn(
                                "pr-14 h-9",
                                validation.isHeaderOverLimit && "border-destructive focus-visible:ring-destructive"
                              )}
                            />
                            <span className={cn(
                              "absolute right-2 top-1/2 -translate-y-1/2 text-xs",
                              validation.isHeaderOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
                            )}>
                              {validation.headerLength}/{MAX_PRICE_HEADER_LENGTH}
                            </span>
                          </div>
                          {validation.isHeaderOverLimit && (
                            <p className="text-xs text-destructive">Over by {validation.headerLength - MAX_PRICE_HEADER_LENGTH}</p>
                          )}
                        </div>
                        
                        {/* Price */}
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Price</label>
                          <Input
                            value={price.price}
                            onChange={(e) => updatePrice(price.id, 'price', e.target.value)}
                            placeholder="e.g., $9.99"
                            className="h-9"
                          />
                        </div>
                        
                        {/* Unit */}
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Unit</label>
                          <Select value={price.unit} onValueChange={(value) => updatePrice(price.id, 'unit', value)}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRICE_UNITS.map((unit) => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Description */}
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Description</label>
                          <div className="relative">
                            <Input
                              value={price.description}
                              onChange={(e) => updatePrice(price.id, 'description', e.target.value)}
                              placeholder="e.g., For individuals"
                              className={cn(
                                "pr-14 h-9",
                                validation.isDescOverLimit && "border-destructive focus-visible:ring-destructive"
                              )}
                            />
                            <span className={cn(
                              "absolute right-2 top-1/2 -translate-y-1/2 text-xs",
                              validation.isDescOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
                            )}>
                              {validation.descLength}/{MAX_PRICE_DESC_LENGTH}
                            </span>
                          </div>
                          {validation.isDescOverLimit && (
                            <p className="text-xs text-destructive">Over by {validation.descLength - MAX_PRICE_DESC_LENGTH}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive mt-5"
                        onClick={() => removePrice(price.id)}
                        disabled={prices.length <= 3}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

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
          {/* Main RSA Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Google Search Ad Preview</CardTitle>
              <CardDescription>Preview how your ad might appear in search results with all extensions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl space-y-6">
                {/* Desktop Preview */}
                <div className="border rounded-lg p-4 bg-background">
                  <p className="text-xs text-muted-foreground mb-3">Desktop Preview</p>
                  <div className="space-y-2">
                    {/* Ad Header */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] font-medium">Sponsored</span>
                      <span>www.example.com</span>
                    </div>
                    
                    {/* Headlines */}
                    <h3 className="text-xl text-primary font-medium leading-snug hover:underline cursor-pointer">
                      {headlineValidation
                        .filter(h => h.isValid)
                        .slice(0, 3)
                        .map(h => h.text)
                        .join(' | ') || 'Your headlines will appear here'}
                    </h3>
                    
                    {/* Descriptions */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {descriptionValidation
                        .filter(d => d.isValid)
                        .slice(0, 2)
                        .map(d => d.text)
                        .join(' ') || 'Your descriptions will appear here'}
                    </p>

                    {/* Sitelinks Preview */}
                    {sitelinkValidation.filter(s => s.isComplete).length > 0 && (
                      <div className="pt-2 border-t mt-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {sitelinkValidation
                            .filter(s => s.isComplete)
                            .slice(0, 4)
                            .map((s, i) => (
                              <div key={i} className="space-y-0.5">
                                <p className="text-sm text-primary font-medium hover:underline cursor-pointer truncate">
                                  {s.title}
                                </p>
                                {(s.description1 || s.description2) && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {[s.description1, s.description2].filter(Boolean).join(' · ')}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Callouts Preview */}
                    {calloutValidation.filter(c => c.isValid).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 text-xs text-muted-foreground">
                        {calloutValidation
                          .filter(c => c.isValid)
                          .slice(0, 10)
                          .map((c, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <span className="text-muted-foreground/50">✓</span>
                              {c.text}
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Structured Snippets Preview */}
                    {snippetValidation.filter(s => s.isComplete).length > 0 && (
                      <div className="pt-2 text-xs text-muted-foreground space-y-1">
                        {snippetValidation
                          .filter(s => s.isComplete)
                          .map((s, i) => (
                            <p key={i}>
                              <span className="font-medium">{s.header}:</span>{' '}
                              {s.valueValidations
                                .filter(v => v.isValid)
                                .map(v => v.text)
                                .join(', ')}
                            </p>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Preview */}
                <div className="border rounded-lg p-4 bg-background max-w-sm">
                  <p className="text-xs text-muted-foreground mb-3">Mobile Preview</p>
                  <div className="space-y-2">
                    {/* Ad Header */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] font-medium">Sponsored</span>
                      <span>example.com</span>
                    </div>
                    
                    {/* Headlines */}
                    <h3 className="text-base text-primary font-medium leading-snug">
                      {headlineValidation
                        .filter(h => h.isValid)
                        .slice(0, 2)
                        .map(h => h.text)
                        .join(' | ') || 'Headlines here'}
                    </h3>
                    
                    {/* Descriptions */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {descriptionValidation
                        .filter(d => d.isValid)
                        .slice(0, 1)
                        .map(d => d.text)
                        .join(' ') || 'Description here'}
                    </p>

                    {/* Sitelinks Preview (Mobile - horizontal scroll) */}
                    {sitelinkValidation.filter(s => s.isComplete).length > 0 && (
                      <div className="pt-2 border-t mt-2">
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {sitelinkValidation
                            .filter(s => s.isComplete)
                            .slice(0, 4)
                            .map((s, i) => (
                              <span key={i} className="text-xs text-primary font-medium whitespace-nowrap px-2 py-1 bg-muted/50 rounded hover:underline cursor-pointer">
                                {s.title}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Callouts Preview (Mobile) */}
                    {calloutValidation.filter(c => c.isValid).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-muted-foreground">
                        {calloutValidation
                          .filter(c => c.isValid)
                          .slice(0, 6)
                          .map((c, i) => (
                            <span key={i}>{c.text}</span>
                          ))
                          .reduce((prev, curr, i) => (
                            i === 0 ? [curr] : [...prev, <span key={`sep-${i}`} className="text-muted-foreground/40">·</span>, curr]
                          ), [] as React.ReactNode[])}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Extensions Preview */}
          {priceValidation.filter(p => p.isComplete).length >= 3 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Price Extensions Preview
                </CardTitle>
                <CardDescription>How your price assets appear below ads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-background">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {priceValidation
                      .filter(p => p.isComplete)
                      .slice(0, 8)
                      .map((p, i) => (
                        <div key={i} className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                          <p className="text-sm font-medium text-primary truncate">{p.header}</p>
                          <p className="text-lg font-bold mt-1">
                            {p.price}
                            {p.unit !== 'None' && <span className="text-xs font-normal text-muted-foreground ml-1">{p.unit}</span>}
                          </p>
                          {p.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.description}</p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Extensions Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Extensions Summary</CardTitle>
              <CardDescription>Overview of all ad assets and their validation status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Headlines Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Headlines</h4>
                    <Badge variant={stats.validHeadlines >= 3 ? 'default' : 'secondary'} className="text-xs">
                      {stats.validHeadlines}/{stats.totalHeadlines}
                    </Badge>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {headlineValidation.slice(0, 5).map((h, i) => (
                      <li key={h.id} className="flex items-center gap-2">
                        {h.isValid ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        ) : h.isEmpty ? (
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                        )}
                        <span className={cn("truncate", h.isOverLimit && "text-destructive")}>
                          {h.text || `H${i + 1}`} <span className="text-muted-foreground text-xs">({h.length}/{MAX_HEADLINE_LENGTH})</span>
                        </span>
                      </li>
                    ))}
                    {headlineValidation.length > 5 && (
                      <li className="text-xs text-muted-foreground pl-5">+{headlineValidation.length - 5} more</li>
                    )}
                  </ul>
                </div>

                {/* Descriptions Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Descriptions</h4>
                    <Badge variant={stats.validDescriptions >= 2 ? 'default' : 'secondary'} className="text-xs">
                      {stats.validDescriptions}/{stats.totalDescriptions}
                    </Badge>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {descriptionValidation.map((d, i) => (
                      <li key={d.id} className="flex items-center gap-2">
                        {d.isValid ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        ) : d.isEmpty ? (
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                        )}
                        <span className={cn("truncate", d.isOverLimit && "text-destructive")}>
                          {d.text ? d.text.substring(0, 30) + (d.text.length > 30 ? '...' : '') : `D${i + 1}`}
                          <span className="text-muted-foreground text-xs ml-1">({d.length}/{MAX_DESCRIPTION_LENGTH})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sitelinks Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm flex items-center gap-1">
                      <Link className="h-3.5 w-3.5" />
                      Sitelinks
                    </h4>
                    <Badge variant={stats.validSitelinks >= 2 ? 'default' : 'secondary'} className="text-xs">
                      {stats.validSitelinks}/{stats.totalSitelinks}
                    </Badge>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {sitelinkValidation.map((s, i) => (
                      <li key={s.id} className="flex items-center gap-2">
                        {s.isComplete ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        ) : s.isTitleEmpty ? (
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                        )}
                        <span className="truncate">{s.title || `Sitelink ${i + 1}`}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Callouts Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Callouts
                    </h4>
                    <Badge variant={stats.validCallouts >= 4 ? 'default' : 'secondary'} className="text-xs">
                      {stats.validCallouts}/{stats.totalCallouts}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {calloutValidation.map((c, i) => (
                      <span
                        key={c.id}
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          c.isValid ? "bg-green-500/10 text-green-700 dark:text-green-400" :
                          c.isEmpty ? "bg-muted text-muted-foreground" :
                          "bg-destructive/10 text-destructive"
                        )}
                      >
                        {c.text || `C${i + 1}`}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Structured Snippets Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm flex items-center gap-1">
                      <List className="h-3.5 w-3.5" />
                      Snippets
                    </h4>
                    <Badge variant={stats.validSnippets >= 1 ? 'default' : 'secondary'} className="text-xs">
                      {stats.validSnippets}/{stats.totalSnippets}
                    </Badge>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {snippetValidation.map((s) => (
                      <li key={s.id} className="flex items-center gap-2">
                        {s.isComplete ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="truncate">
                          {s.header}: {s.validValues}/{s.valueValidations.length} values
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Prices Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      Prices
                    </h4>
                    <Badge variant={stats.validPrices >= 3 ? 'default' : 'secondary'} className="text-xs">
                      {stats.validPrices}/{stats.totalPrices}
                    </Badge>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {priceValidation.slice(0, 4).map((p, i) => (
                      <li key={p.id} className="flex items-center gap-2">
                        {p.isComplete ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        ) : p.isHeaderEmpty ? (
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                        )}
                        <span className="truncate">
                          {p.header || `Price ${i + 1}`}
                          {p.price && <span className="text-muted-foreground ml-1">({p.price})</span>}
                        </span>
                      </li>
                    ))}
                    {priceValidation.length > 4 && (
                      <li className="text-xs text-muted-foreground pl-5">+{priceValidation.length - 4} more</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

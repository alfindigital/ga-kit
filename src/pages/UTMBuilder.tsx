import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Copy, Plus, Trash2, Save, History, X, RotateCcw, Check, Link2, AlertCircle, ClipboardPaste, Zap, Download, QrCode, Beaker, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useClipboard } from '@/hooks/useClipboard';
import { useShortcutAction } from '@/contexts/ShortcutsContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useUsageStats } from '@/hooks/useUsageStats';
import { useValidation, validators } from '@/hooks/useValidation';
import { useUrlHistory } from '@/hooks/useUrlHistory';
import { UTMBuilderSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { InputError } from '@/components/ui/input-error';
import { BulkUrlImport } from '@/components/BulkUrlImport';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface UTMParams {
  url: string;
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  customParams: { key: string; value: string }[];
}

interface ValueTrackMacro {
  id: string;
  label: string;
  macro: string;
  description: string;
}

const VALUE_TRACK_MACROS: ValueTrackMacro[] = [
  { id: 'campaignid', label: 'Campaign ID', macro: '{campaignid}', description: 'The campaign ID' },
  { id: 'adgroupid', label: 'Ad Group ID', macro: '{adgroupid}', description: 'The ad group ID' },
  { id: 'creative', label: 'Creative ID', macro: '{creative}', description: 'The creative ID' },
  { id: 'keyword', label: 'Keyword', macro: '{keyword}', description: 'The keyword that triggered the ad' },
  { id: 'matchtype', label: 'Match Type', macro: '{matchtype}', description: 'Keyword match type (e, p, b)' },
  { id: 'device', label: 'Device', macro: '{device}', description: 'Device type (m, t, c)' },
  { id: 'network', label: 'Network', macro: '{network}', description: 'Network type (g, s, d)' },
  { id: 'placement', label: 'Placement', macro: '{placement}', description: 'The placement domain' },
  { id: 'targetid', label: 'Target ID', macro: '{targetid}', description: 'The target ID' },
  { id: 'gclid', label: 'GCLID', macro: '{gclid}', description: 'Google Click Identifier' },
];

// Quick presets for common platforms
const QUICK_PRESETS = [
  { label: 'Google Ads', source: 'google', medium: 'cpc', icon: '🔍' },
  { label: 'Facebook Ads', source: 'facebook', medium: 'paid-social', icon: '📘' },
  { label: 'Instagram', source: 'instagram', medium: 'social', icon: '📷' },
  { label: 'LinkedIn', source: 'linkedin', medium: 'social', icon: '💼' },
  { label: 'Twitter/X', source: 'twitter', medium: 'social', icon: '🐦' },
  { label: 'Email Newsletter', source: 'newsletter', medium: 'email', icon: '📧' },
  { label: 'TikTok Ads', source: 'tiktok', medium: 'paid-social', icon: '🎵' },
  { label: 'YouTube Ads', source: 'youtube', medium: 'video', icon: '▶️' },
];

const DEFAULT_PARAMS: UTMParams = {
  url: '',
  source: '',
  medium: '',
  campaign: '',
  term: '',
  content: '',
  customParams: [],
};

interface Preset {
  id: string;
  name: string;
  params: UTMParams;
  valueTrack: string[];
}

// Legacy interface removed - now using unified useUrlHistory

// Helper to format UTM values: lowercase, spaces to hyphens, remove special chars
const formatUtmValue = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');
};

export default function UTMBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useState<UTMParams>(DEFAULT_PARAMS);
  const [selectedValueTrack, setSelectedValueTrack] = useState<string[]>([]);
  const [presets, setPresets] = useLocalStorage<Preset[]>('utm-presets', []);
  const [presetName, setPresetName] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkUrls, setBulkUrls] = useState<string[]>([]);
  
  const { copy, copied } = useClipboard();
  const { toast } = useToast();
  const { addToHistory, history: urlHistory, filters, setFilters } = useUrlHistory();
  const isLoading = usePageLoading(400);
  const { incrementStat } = useUsageStats();
  const { t } = useTranslation();

  const { validate, touch, getFieldState, clearErrors } = useValidation({
    url: [validators.url('Please enter a valid URL')],
  });

  // Load history item from navigation state
  useEffect(() => {
    const historyItem = (location.state as any)?.historyItem;
    if (historyItem && historyItem.toolType === 'utm') {
      try {
        const url = new URL(historyItem.url);
        setParams({
          url: historyItem.originalUrl || url.origin + url.pathname,
          source: url.searchParams.get('utm_source') || historyItem.metadata?.source || '',
          medium: url.searchParams.get('utm_medium') || historyItem.metadata?.medium || '',
          campaign: url.searchParams.get('utm_campaign') || historyItem.metadata?.campaign || '',
          term: url.searchParams.get('utm_term') || historyItem.metadata?.term || '',
          content: url.searchParams.get('utm_content') || historyItem.metadata?.content || '',
          customParams: [],
        });
        // Clear the state so it doesn't reload on re-render
        window.history.replaceState({}, '');
      } catch {}
    }
  }, [location.state]);

  const urlState = getFieldState('url');

  const handleUrlChange = useCallback((value: string) => {
    setParams(prev => ({ ...prev, url: value }));
    if (urlState.isTouched) {
      validate('url', value);
    }
  }, [validate, urlState.isTouched]);

  const handleUrlBlur = useCallback(() => {
    touch('url');
    validate('url', params.url);
  }, [touch, validate, params.url]);

  // Paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUrlChange(text.trim());
        toast({ title: t('common.pasted'), description: t('toast.pasteFromClipboard') });
      }
    } catch {
      toast({ 
        title: t('toast.cannotAccessClipboard'), 
        description: t('toast.pasteManually'),
        variant: 'destructive'
      });
    }
  }, [handleUrlChange, toast]);

  // Handle UTM param change with auto-formatting
  const handleUtmParamChange = useCallback((key: string, value: string) => {
    const formattedValue = formatUtmValue(value);
    setParams(prev => ({ ...prev, [key]: formattedValue }));
  }, []);

  // Apply quick preset
  const applyQuickPreset = useCallback((preset: typeof QUICK_PRESETS[0]) => {
    setParams(prev => ({
      ...prev,
      source: preset.source,
      medium: preset.medium,
    }));
    toast({ title: t('toast.applied'), description: `${preset.label} ${t('toast.presetApplied')}` });
  }, [toast]);


  // Generate URL with UTM params for a given base URL
  const generateUtmUrl = (baseUrl: string): string => {
    if (!baseUrl) return '';
    
    let cleanUrl = baseUrl.trim();
    
    // Ensure URL has protocol
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    // Prevent double protocol
    cleanUrl = cleanUrl.replace(/^(https?:\/\/)+/, 'https://');
    
    try {
      const url = new URL(cleanUrl);
      
      // Add UTM params
      if (params.source) url.searchParams.set('utm_source', params.source);
      if (params.medium) url.searchParams.set('utm_medium', params.medium);
      if (params.campaign) url.searchParams.set('utm_campaign', params.campaign);
      if (params.term) url.searchParams.set('utm_term', params.term);
      if (params.content) url.searchParams.set('utm_content', params.content);
      
      // Add custom params
      params.customParams.forEach(({ key, value }) => {
        if (key && value) url.searchParams.set(key, value);
      });
      
      // Add ValueTrack macros
      selectedValueTrack.forEach((id) => {
        const macro = VALUE_TRACK_MACROS.find(m => m.id === id);
        if (macro) {
          url.searchParams.set(id, macro.macro);
        }
      });
      
      return url.toString();
    } catch {
      return '';
    }
  };

  const generatedUrl = generateUtmUrl(params.url);

  // Generate bulk URLs
  const bulkGeneratedUrls = useMemo(() => {
    return bulkUrls.map(url => ({
      original: url,
      generated: generateUtmUrl(url)
    })).filter(item => item.generated);
  }, [bulkUrls, params, selectedValueTrack]);

  // Handle bulk URL import
  const handleBulkImport = useCallback((urls: string[]) => {
    setBulkUrls(urls);
    setBulkMode(true);
  }, []);

  // Copy all bulk URLs
  const handleCopyBulkUrls = useCallback(() => {
    if (bulkGeneratedUrls.length === 0) return;
    const allUrls = bulkGeneratedUrls.map(item => item.generated).join('\n');
    copy(allUrls, t('toast.bulkUrlsCopied', { count: bulkGeneratedUrls.length }));
    incrementStat('utmsCreated', bulkGeneratedUrls.length);
    
    // Add all to unified URL history with extracted UTM params as tags
    bulkGeneratedUrls.forEach((item) => {
      const tags: string[] = [];
      if (params.source) tags.push(params.source);
      if (params.medium) tags.push(params.medium);
      if (params.campaign) tags.push(params.campaign);
      
      addToHistory({
        url: item.generated,
        originalUrl: item.original,
        toolType: 'utm',
        name: params.campaign || `UTM ${new Date().toLocaleDateString()}`,
        starred: false,
        tags,
        metadata: {
          source: params.source,
          medium: params.medium,
          campaign: params.campaign,
          term: params.term,
          content: params.content,
        },
      });
    });
  }, [bulkGeneratedUrls, copy, incrementStat, addToHistory, params]);

  // Export bulk URLs as CSV
  const handleExportBulkCsv = useCallback(() => {
    if (bulkGeneratedUrls.length === 0) return;
    
    const headers = ['Original URL', 'UTM URL', 'Source', 'Medium', 'Campaign', 'Term', 'Content'];
    const rows = bulkGeneratedUrls.map(item => [
      item.original,
      item.generated,
      params.source,
      params.medium,
      params.campaign,
      params.term,
      params.content
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `utm-bulk-${dateStr}.csv`;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast({ title: t('toast.exported'), description: t('toast.bulkUrlsExported', { count: bulkGeneratedUrls.length, filename }) });
  }, [bulkGeneratedUrls, params, toast, t]);

  // Extract query string only
  const queryStringOnly = useMemo(() => {
    if (!generatedUrl) return '';
    try {
      const url = new URL(generatedUrl);
      return url.search;
    } catch {
      return '';
    }
  }, [generatedUrl]);

  const handleCopy = () => {
    if (generatedUrl) {
      copy(generatedUrl, t('toast.urlCopied'));
      incrementStat('utmsCreated');
      
      // Extract UTM params as searchable tags
      const tags: string[] = [];
      if (params.source) tags.push(params.source);
      if (params.medium) tags.push(params.medium);
      if (params.campaign) tags.push(params.campaign);
      
      // Add to unified URL history
      addToHistory({
        url: generatedUrl,
        originalUrl: params.url,
        toolType: 'utm',
        name: params.campaign || `UTM ${new Date().toLocaleDateString()}`,
        starred: false,
        tags,
        metadata: {
          source: params.source,
          medium: params.medium,
          campaign: params.campaign,
          term: params.term,
          content: params.content,
        },
      });
    }
  };

  const handleCopyQuery = async () => {
    if (queryStringOnly) {
      try {
        await navigator.clipboard.writeText(queryStringOnly);
        setCopiedQuery(true);
        setTimeout(() => setCopiedQuery(false), 2000);
        toast({ title: t('common.copied'), description: t('toast.queryCopied') });
      } catch {
        toast({ title: t('toast.copyFailed'), variant: 'destructive' });
      }
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({ title: t('toast.error'), description: t('toast.presetNameRequired'), variant: 'destructive' });
      return;
    }
    
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: presetName,
      params,
      valueTrack: selectedValueTrack,
    };
    
    setPresets(prev => [...prev, newPreset]);
    setPresetName('');
    toast({ title: t('toast.saved'), description: t('toast.presetSavedDesc', { name: presetName }) });
  };

  const loadPreset = (preset: Preset) => {
    setParams(preset.params);
    setSelectedValueTrack(preset.valueTrack);
    clearErrors();
    toast({ title: t('toast.loaded'), description: t('toast.presetLoadedDesc', { name: preset.name }) });
  };

  const deletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  };

  const addCustomParam = () => {
    setParams(prev => ({
      ...prev,
      customParams: [...prev.customParams, { key: '', value: '' }],
    }));
  };

  const removeCustomParam = (index: number) => {
    setParams(prev => ({
      ...prev,
      customParams: prev.customParams.filter((_, i) => i !== index),
    }));
  };

  const updateCustomParam = (index: number, field: 'key' | 'value', value: string) => {
    setParams(prev => ({
      ...prev,
      customParams: prev.customParams.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setSelectedValueTrack([]);
    setBulkUrls([]);
    setBulkMode(false);
    clearErrors();
    toast({ title: t('common.resetComplete') });
  };

  const toggleValueTrack = (id: string) => {
    setSelectedValueTrack(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  // Get UTM-specific history for display
  const utmHistory = useMemo(() => {
    return urlHistory.filter(item => item.toolType === 'utm');
  }, [urlHistory]);

  // Load sample data for demo
  const loadSampleData = () => {
    setParams({
      url: 'https://example.com/landing-page',
      source: 'google',
      medium: 'cpc',
      campaign: 'summer-sale-2024',
      term: 'running-shoes',
      content: 'hero-banner',
      customParams: [],
    });
    toast({ title: t('common.sampleLoaded'), description: t('common.sampleLoadedDesc') });
  };

  // Keyboard shortcuts
  useShortcutAction('page.copy', handleCopy);
  useShortcutAction('page.reset', handleReset);
  useShortcutAction('page.sample', loadSampleData);

  if (isLoading) return <UTMBuilderSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <ToolPageHeader
        icon={Link2}
        title={t('tool.utmBuilder')}
        description={t('tool.utmBuilder.desc')}
        iconColor="bg-primary/10 text-primary"
        accentGradient="from-primary to-primary/40"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={loadSampleData} className="h-8 text-xs">
            <Beaker className="h-3.5 w-3.5 mr-1" />
            {t('common.sample')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            {t('common.reset')}
          </Button>
          
          {/* Quick Presets Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Zap className="h-3.5 w-3.5 mr-1" />
                {t('common.quickFill')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {t('utm.popularPlatforms')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {QUICK_PRESETS.map((preset) => (
                <DropdownMenuItem 
                  key={preset.label} 
                  onClick={() => applyQuickPreset(preset)}
                  className="cursor-pointer"
                >
                  <span className="mr-2">{preset.icon}</span>
                  <span>{preset.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Presets Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Save className="h-3.5 w-3.5 mr-1" />
                {t('common.presets')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <div className="flex gap-2">
                  <Input 
                    placeholder={t('utm.presetName')} 
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button size="sm" onClick={handleSavePreset} className="h-8">
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {presets.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {presets.map((preset) => (
                    <DropdownMenuItem key={preset.id} className="flex justify-between">
                      <span onClick={() => loadPreset(preset)} className="flex-1 cursor-pointer">
                        {preset.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePreset(preset.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </ToolPageHeader>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        {/* Input Section - 60% */}
        <div className="lg:col-span-3 space-y-4">
          {/* Mode Toggle and Target URL */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {t('utm.targetUrl')}{!bulkMode && <span className="text-destructive">*</span>}
                </CardTitle>
                <Tabs value={bulkMode ? 'bulk' : 'single'} onValueChange={(v) => setBulkMode(v === 'bulk')}>
                  <TabsList className="h-7">
                    <TabsTrigger value="single" className="text-xs h-5 px-2">{t('utm.single')}</TabsTrigger>
                    <TabsTrigger value="bulk" className="text-xs h-5 px-2">{t('utm.bulkImport')}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {bulkMode ? (
                <div className="space-y-3">
                  <BulkUrlImport onImport={handleBulkImport} />
                  {bulkUrls.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{bulkUrls.length} URL{bulkUrls.length > 1 ? 's' : ''} loaded</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setBulkUrls([])}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      </div>
                      <Textarea
                        value={bulkUrls.join('\n')}
                        onChange={(e) => setBulkUrls(e.target.value.split('\n').filter(l => l.trim()))}
                        placeholder="URLs will appear here..."
                        className="text-xs min-h-[100px] font-mono"
                        rows={5}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="https://example.com/page"
                      value={params.url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      onBlur={handleUrlBlur}
                      className={cn(
                        "text-sm",
                        urlState.hasError && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    <InputError message={urlState.error} />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    onClick={handlePaste}
                    title="Paste from clipboard"
                  >
                    <ClipboardPaste className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    onClick={() => {
                      setParams(prev => ({ ...prev, url: '' }));
                      clearErrors();
                    }}
                    title="Clear URL"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* UTM Parameters */}
          <Card>
            <CardHeader>
              <CardTitle>{t('utm.utmParams')}</CardTitle>
              <CardDescription className="text-xs">{t('utm.autoFormat')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: 'source', label: 'Source', placeholder: 'google, facebook' },
                { key: 'medium', label: 'Medium', placeholder: 'cpc, email' },
                { key: 'campaign', label: 'Campaign', placeholder: 'summer_sale' },
                { key: 'term', label: 'Term', placeholder: 'keyword' },
                { key: 'content', label: 'Content', placeholder: 'logolink' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <Label className="w-20 text-xs sm:text-sm font-medium shrink-0">{label}</Label>
                  <div className="flex gap-2 flex-1">
                    <Input
                      placeholder={placeholder}
                      value={params[key as keyof UTMParams] as string}
                      onChange={(e) => handleUtmParamChange(key, e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 flex-shrink-0"
                      onClick={() => setParams(prev => ({ ...prev, [key]: '' }))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Custom Parameters */}
              {params.customParams.map((param, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <Input
                    placeholder="Key"
                    value={param.key}
                    onChange={(e) => updateCustomParam(index, 'key', e.target.value)}
                    className="w-full sm:w-24 text-sm"
                  />
                  <div className="flex gap-2 flex-1">
                    <Input
                      placeholder="Value"
                      value={param.value}
                      onChange={(e) => updateCustomParam(index, 'value', e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 flex-shrink-0"
                      onClick={() => removeCustomParam(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" size="sm" onClick={addCustomParam} className="text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" />
                {t('utm.addCustomParam')}
              </Button>
            </CardContent>
          </Card>

          {/* ValueTrack Macros */}
          <Card>
            <CardHeader>
              <CardTitle>{t('utm.valueTrack')}</CardTitle>
              <CardDescription className="text-xs">{t('utm.selectMacros')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {VALUE_TRACK_MACROS.map((macro) => (
                  <label
                    key={macro.id}
                    className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-muted cursor-pointer transition-colors text-xs sm:text-sm"
                  >
                    <Checkbox
                      checked={selectedValueTrack.includes(macro.id)}
                      onCheckedChange={() => toggleValueTrack(macro.id)}
                    />
                    <span className="truncate">{macro.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section - 40% */}
        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-20 border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {bulkMode ? t('utm.generatedUrls') : t('utm.livePreview')}
                {bulkMode && bulkGeneratedUrls.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">({bulkGeneratedUrls.length})</span>
                )}
                {!bulkMode && generatedUrl && <Check className="h-4 w-4 text-accent" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bulkMode ? (
                bulkGeneratedUrls.length === 0 ? (
                  <EmptyState
                    icon={Upload}
                    title={t('utm.importUrls')}
                    description={t('utm.importUrlsDesc')}
                    className="py-6"
                  />
                ) : (
                  <>
                    <div className="p-3 bg-muted rounded-lg max-h-[200px] overflow-y-auto text-xs font-mono space-y-1">
                      {bulkGeneratedUrls.map((item, idx) => (
                        <div key={idx} className="break-all py-1 border-b border-border/50 last:border-0">
                          {item.generated}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCopyBulkUrls} 
                        className="flex-1 text-sm"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {t('utm.copyAll')} ({bulkGeneratedUrls.length})
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleExportBulkCsv}
                        className="text-sm"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        CSV
                      </Button>
                    </div>
                  </>
                )
              ) : !params.url ? (
                <EmptyState
                  icon={Link2}
                  title={t('utm.enterUrl')}
                  description={t('utm.enterUrlDesc')}
                  className="py-6"
                />
              ) : urlState.hasError ? (
                <EmptyState
                  icon={AlertCircle}
                  title={t('utm.invalidUrl')}
                  description={t('utm.invalidUrlDesc')}
                  variant="error"
                  className="py-6"
                />
              ) : (
                <>
                  <div className="p-3 bg-muted rounded-lg min-h-[80px] break-all text-xs sm:text-sm font-mono">
                    {generatedUrl || <span className="text-muted-foreground">Processing...</span>}
                  </div>
                  
                  {/* Query String Only Preview */}
                  {queryStringOnly && (
                    <div className="p-2 bg-muted/50 rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">{t('utm.queryStringOnly')}</p>
                      <code className="text-xs break-all">{queryStringOnly}</code>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCopy} 
                      disabled={!generatedUrl}
                      className="flex-1 text-sm"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          {t('common.copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          {t('utm.copyUrl')}
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleCopyQuery}
                      disabled={!queryStringOnly}
                      className="text-sm"
                      title="Copy query string only"
                    >
                      {copiedQuery ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          {t('utm.copyQuery')}
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!generatedUrl) {
                          toast({
                            title: t('qr.utmEmpty'),
                            description: t('qr.utmEmptyDesc'),
                            variant: 'destructive',
                          });
                          return;
                        }
                        navigate(`/qr-generator?content=${encodeURIComponent(generatedUrl)}`);
                      }}
                      disabled={!generatedUrl}
                      className="text-sm"
                      title="Generate QR code"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
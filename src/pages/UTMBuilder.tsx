import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Plus, Trash2, Save, History, X, RotateCcw, Check, Link2, AlertCircle, ClipboardPaste, Zap, Download, QrCode, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useClipboard } from '@/hooks/useClipboard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useValidation, validators } from '@/hooks/useValidation';
import { UTMBuilderSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { InputError } from '@/components/ui/input-error';
import { cn } from '@/lib/utils';
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

interface HistoryItem {
  id: string;
  url: string;
  timestamp: number;
}

// Helper to format UTM values: lowercase, spaces to hyphens, remove special chars
const formatUtmValue = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');
};

export default function UTMBuilder() {
  const navigate = useNavigate();
  const [params, setParams] = useState<UTMParams>(DEFAULT_PARAMS);
  const [selectedValueTrack, setSelectedValueTrack] = useState<string[]>([]);
  const [presets, setPresets] = useLocalStorage<Preset[]>('utm-presets', []);
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('utm-history', []);
  const [presetName, setPresetName] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);
  
  const { copy, copied } = useClipboard();
  const { toast } = useToast();
  const isLoading = usePageLoading(400);

  const { validate, touch, getFieldState, clearErrors } = useValidation({
    url: [validators.url('Please enter a valid URL')],
  });

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
        toast({ title: 'Pasted!', description: 'URL pasted from clipboard' });
      }
    } catch {
      toast({ 
        title: 'Cannot access clipboard', 
        description: 'Please paste manually using Ctrl+V',
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
    toast({ title: 'Applied!', description: `${preset.label} preset applied` });
  }, [toast]);

  if (isLoading) return <UTMBuilderSkeleton />;

  const generatedUrl = (() => {
    if (!params.url) return '';
    
    let baseUrl = params.url.trim();
    
    // Ensure URL has protocol
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'https://' + baseUrl;
    }
    
    // Prevent double protocol
    baseUrl = baseUrl.replace(/^(https?:\/\/)+/, 'https://');
    
    try {
      const url = new URL(baseUrl);
      
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
  })();

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
      copy(generatedUrl, 'URL copied to clipboard');
      
      // Add to history
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        url: generatedUrl,
        timestamp: Date.now(),
      };
      setHistory(prev => [newItem, ...prev.slice(0, 49)]);
    }
  };

  const handleCopyQuery = async () => {
    if (queryStringOnly) {
      try {
        await navigator.clipboard.writeText(queryStringOnly);
        setCopiedQuery(true);
        setTimeout(() => setCopiedQuery(false), 2000);
        toast({ title: 'Copied!', description: 'Query string copied to clipboard' });
      } catch {
        toast({ title: 'Failed to copy', variant: 'destructive' });
      }
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({ title: 'Error', description: 'Please enter a preset name', variant: 'destructive' });
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
    toast({ title: 'Saved!', description: `Preset "${presetName}" saved` });
  };

  const loadPreset = (preset: Preset) => {
    setParams(preset.params);
    setSelectedValueTrack(preset.valueTrack);
    clearErrors();
    toast({ title: 'Loaded', description: `Preset "${preset.name}" loaded` });
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
    clearErrors();
  };

  const toggleValueTrack = (id: string) => {
    setSelectedValueTrack(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  // Export history to CSV
  const handleExportHistory = () => {
    if (history.length === 0) return;

    // Parse UTM params from each URL
    const rows = history.map((item) => {
      let campaign = '';
      let medium = '';
      let source = '';
      
      try {
        const url = new URL(item.url);
        campaign = url.searchParams.get('utm_campaign') || '';
        medium = url.searchParams.get('utm_medium') || '';
        source = url.searchParams.get('utm_source') || '';
      } catch {
        // Invalid URL, leave params empty
      }

      const date = new Date(item.timestamp).toLocaleString();
      return [date, item.url, campaign, medium, source];
    });

    // Build CSV with BOM for Excel compatibility
    const headers = ['Date', 'URL', 'Campaign', 'Medium', 'Source'];
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Generate filename with date
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `utm-history-${dateStr}.csv`;
    
    // Download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast({ title: 'Exported!', description: `${history.length} URLs exported to ${filename}` });
  };

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
    toast({ title: 'Sample loaded!', description: 'Demo data has been added' });
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'c', shift: true, action: handleCopy, description: 'Copy URL' },
    { key: 'r', shift: true, action: handleReset, description: 'Reset form' },
    { key: 's', shift: true, action: loadSampleData, description: 'Load sample' },
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">UTM Builder</h1>
          <p className="text-sm text-muted-foreground">Build campaign URLs with UTM parameters</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={loadSampleData} className="h-8 text-xs">
            <Beaker className="h-3.5 w-3.5 mr-1" />
            Sample
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
          
          {/* Quick Presets Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Zap className="h-3.5 w-3.5 mr-1" />
                Quick Fill
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Popular Platforms
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
                Presets
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Preset name" 
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

          {/* History Dialog */}
          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <History className="h-3.5 w-3.5 mr-1" />
                History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[70vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>URL History</DialogTitle>
                  {history.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleExportHistory}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export CSV
                    </Button>
                  )}
                </div>
              </DialogHeader>
              <div className="space-y-2">
                {history.length === 0 ? (
                  <EmptyState
                    icon={History}
                    title="No history yet"
                    description="Generated URLs will appear here for quick access"
                  />
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <span className="flex-1 text-xs sm:text-sm truncate">{item.url}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={() => copy(item.url)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        {/* Input Section - 60% */}
        <div className="lg:col-span-3 space-y-4">
          {/* Target URL */}
          <Card>
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                Target URL
                <span className="text-destructive">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
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
            </CardContent>
          </Card>

          {/* UTM Parameters */}
          <Card>
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="text-sm">UTM Parameters</CardTitle>
              <CardDescription className="text-xs">Auto-formatted: lowercase, spaces → hyphens</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
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
                Add Custom Parameter
              </Button>
            </CardContent>
          </Card>

          {/* ValueTrack Macros */}
          <Card>
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="text-sm">Google Ads ValueTrack</CardTitle>
              <CardDescription className="text-xs">Select macros to include</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
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
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                Live Preview
                {generatedUrl && <Check className="h-4 w-4 text-accent" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
              {!params.url ? (
                <EmptyState
                  icon={Link2}
                  title="Enter a URL to start"
                  description="Type or paste your target URL above to generate UTM parameters"
                  className="py-6"
                />
              ) : urlState.hasError ? (
                <EmptyState
                  icon={AlertCircle}
                  title="Invalid URL"
                  description="Please correct the URL format to see the preview"
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
                      <p className="text-xs text-muted-foreground mb-1">Query string only:</p>
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
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy URL
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
                          Query
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/qr-generator?content=${encodeURIComponent(generatedUrl)}`)}
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
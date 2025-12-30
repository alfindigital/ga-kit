import { useState, useMemo, useCallback } from 'react';
import { Copy, Plus, Trash2, Save, History, X, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useClipboard } from '@/hooks/useClipboard';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
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

export default function UTMBuilder() {
  const [params, setParams] = useState<UTMParams>(DEFAULT_PARAMS);
  const [selectedValueTrack, setSelectedValueTrack] = useState<string[]>([]);
  const [presets, setPresets] = useLocalStorage<Preset[]>('utm-presets', []);
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('utm-history', []);
  const [presetName, setPresetName] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  
  const { copy, copied } = useClipboard();
  const { toast } = useToast();

  const generatedUrl = useMemo(() => {
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
  }, [params, selectedValueTrack]);

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
  };

  const toggleValueTrack = (id: string) => {
    setSelectedValueTrack(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">UTM Builder</h1>
          <p className="text-muted-foreground">Build campaign URLs with UTM parameters and Google Ads ValueTrack</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          
          {/* Presets Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-1" />
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
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-1" />
                History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>URL History</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {history.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No history yet</p>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <span className="flex-1 text-sm truncate">{item.url}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
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

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input Section - 60% */}
        <div className="lg:col-span-3 space-y-6">
          {/* Target URL */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Target URL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/page"
                  value={params.url}
                  onChange={(e) => setParams(prev => ({ ...prev, url: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setParams(prev => ({ ...prev, url: '' }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* UTM Parameters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">UTM Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'source', label: 'Source', placeholder: 'google, facebook, newsletter' },
                { key: 'medium', label: 'Medium', placeholder: 'cpc, email, social' },
                { key: 'campaign', label: 'Campaign', placeholder: 'summer_sale, product_launch' },
                { key: 'term', label: 'Term', placeholder: 'running+shoes, keyword' },
                { key: 'content', label: 'Content', placeholder: 'logolink, textlink' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="flex items-center gap-3">
                  <Label className="w-24 text-sm font-medium">{label}</Label>
                  <Input
                    placeholder={placeholder}
                    value={params[key as keyof UTMParams] as string}
                    onChange={(e) => setParams(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setParams(prev => ({ ...prev, [key]: '' }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {/* Custom Parameters */}
              {params.customParams.map((param, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Input
                    placeholder="Key"
                    value={param.key}
                    onChange={(e) => updateCustomParam(index, 'key', e.target.value)}
                    className="w-24"
                  />
                  <Input
                    placeholder="Value"
                    value={param.value}
                    onChange={(e) => updateCustomParam(index, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeCustomParam(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              <Button variant="outline" size="sm" onClick={addCustomParam}>
                <Plus className="h-4 w-4 mr-1" />
                Add Custom Parameter
              </Button>
            </CardContent>
          </Card>

          {/* ValueTrack Macros */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Google Ads ValueTrack</CardTitle>
              <CardDescription>Select macros to include in your URL</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {VALUE_TRACK_MACROS.map((macro) => (
                  <label
                    key={macro.id}
                    className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-muted cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedValueTrack.includes(macro.id)}
                      onCheckedChange={() => toggleValueTrack(macro.id)}
                    />
                    <span className="text-sm">{macro.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section - 40% */}
        <div className="lg:col-span-2">
          <Card className="sticky top-20 border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Live Preview
                {generatedUrl && <Check className="h-4 w-4 text-accent" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg min-h-[100px] break-all text-sm font-mono">
                {generatedUrl || <span className="text-muted-foreground">Enter a URL to see preview</span>}
              </div>
              
              <Button 
                onClick={handleCopy} 
                disabled={!generatedUrl}
                className="w-full"
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

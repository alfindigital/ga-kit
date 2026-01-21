import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Link2, 
  QrCode, 
  Copy, 
  Trash2, 
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ClipboardPaste,
  ArrowRight,
  Filter,
  Code,
  ArrowRightLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useExport } from '@/hooks/useExport';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';
import { UrlValidatorSkeleton } from '@/components/skeletons';

interface ValidationResult {
  url: string;
  normalizedUrl: string;
  isValidFormat: boolean;
  protocol: string;
  domain: string;
  path: string;
  statusMessage: string;
  hasQueryParams: boolean;
  isSecure: boolean;
}

type FilterType = 'all' | 'valid' | 'invalid';

function validateUrl(input: string): ValidationResult {
  const trimmedUrl = input.trim();
  
  // Default result for invalid URLs
  const invalidResult: ValidationResult = {
    url: trimmedUrl,
    normalizedUrl: '',
    isValidFormat: false,
    protocol: '',
    domain: '',
    path: '',
    statusMessage: 'Invalid URL format',
    hasQueryParams: false,
    isSecure: false,
  };
  
  if (!trimmedUrl) {
    return { ...invalidResult, statusMessage: 'URL is empty' };
  }
  
  // Add protocol if missing
  let urlToTest = trimmedUrl;
  if (!/^https?:\/\//i.test(urlToTest)) {
    urlToTest = 'https://' + urlToTest;
  }
  
  try {
    const url = new URL(urlToTest);
    
    // Check for valid domain (must have at least one dot or be localhost)
    const domain = url.hostname;
    const isValidDomain = domain.includes('.') || domain === 'localhost';
    
    if (!isValidDomain) {
      return { ...invalidResult, statusMessage: 'Invalid domain format' };
    }
    
    // Check for common invalid patterns
    if (domain.startsWith('.') || domain.endsWith('.')) {
      return { ...invalidResult, statusMessage: 'Invalid domain format' };
    }
    
    return {
      url: trimmedUrl,
      normalizedUrl: url.href,
      isValidFormat: true,
      protocol: url.protocol.replace(':', ''),
      domain: url.hostname,
      path: url.pathname + url.search + url.hash,
      statusMessage: 'Valid URL',
      hasQueryParams: url.search.length > 0,
      isSecure: url.protocol === 'https:',
    };
  } catch {
    return invalidResult;
  }
}

export default function UrlValidator() {
  const isLoading = usePageLoading(400);
  const { toast } = useToast();
  const { exportCsv } = useExport();
  
  // Single URL mode
  const [singleUrl, setSingleUrl] = useState('');
  const [singleResult, setSingleResult] = useState<ValidationResult | null>(null);
  
  // Bulk mode
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkResults, setBulkResults] = useState<ValidationResult[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isValidating, setIsValidating] = useState(false);
  
  // Encoding/Decoding mode
  const [encodeInput, setEncodeInput] = useState('');
  const [encodeOutput, setEncodeOutput] = useState('');
  const [decodeInput, setDecodeInput] = useState('');
  const [decodeOutput, setDecodeOutput] = useState('');
  
  // Base64 encoding/decoding
  const [base64EncodeInput, setBase64EncodeInput] = useState('');
  const [base64EncodeOutput, setBase64EncodeOutput] = useState('');
  const [base64DecodeInput, setBase64DecodeInput] = useState('');
  const [base64DecodeOutput, setBase64DecodeOutput] = useState('');
  
  const handleSingleValidate = useCallback(() => {
    if (!singleUrl.trim()) {
      toast({ title: "Enter a URL", description: "Please enter a URL to validate", variant: "destructive" });
      return;
    }
    const result = validateUrl(singleUrl);
    setSingleResult(result);
  }, [singleUrl, toast]);
  
  const handleBulkValidate = useCallback(async () => {
    const urls = bulkUrls.split('\n').filter(url => url.trim());
    if (urls.length === 0) {
      toast({ title: "No URLs", description: "Please enter at least one URL", variant: "destructive" });
      return;
    }
    
    setIsValidating(true);
    setBulkResults([]);
    
    // Simulate async processing for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const results = urls.map(url => validateUrl(url));
    setBulkResults(results);
    setIsValidating(false);
    
    const validCount = results.filter(r => r.isValidFormat).length;
    toast({ 
      title: "Validation complete", 
      description: `${validCount} valid, ${results.length - validCount} invalid URLs` 
    });
  }, [bulkUrls, toast]);
  
  const handlePaste = useCallback(async (mode: 'single' | 'bulk') => {
    try {
      const text = await navigator.clipboard.readText();
      if (mode === 'single') {
        setSingleUrl(text);
      } else {
        setBulkUrls(text);
      }
      toast({ title: "Pasted!", description: "Content pasted from clipboard" });
    } catch {
      toast({ title: "Paste failed", description: "Unable to read clipboard", variant: "destructive" });
    }
  }, [toast]);
  
  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "URL copied to clipboard" });
  }, [toast]);
  
  const handleExportResults = useCallback(() => {
    if (bulkResults.length === 0) return;
    
    const filteredResults = getFilteredResults();
    const data = [
      ['Original URL', 'Normalized URL', 'Status', 'Protocol', 'Domain', 'Secure'],
      ...filteredResults.map(r => [
        r.url,
        r.normalizedUrl,
        r.isValidFormat ? 'Valid' : 'Invalid',
        r.protocol || '-',
        r.domain || '-',
        r.isSecure ? 'Yes' : 'No'
      ])
    ];
    exportCsv(data, 'url-validation-results');
  }, [bulkResults, filter, exportCsv]);
  
  const handleClearSingle = useCallback(() => {
    setSingleUrl('');
    setSingleResult(null);
  }, []);
  
  const handleClearBulk = useCallback(() => {
    setBulkUrls('');
    setBulkResults([]);
  }, []);
  
  // Encoding handlers
  const handleEncode = useCallback(() => {
    if (!encodeInput.trim()) {
      toast({ title: "Enter text", description: "Please enter text to encode", variant: "destructive" });
      return;
    }
    try {
      const encoded = encodeURIComponent(encodeInput);
      setEncodeOutput(encoded);
      toast({ title: "Encoded!", description: "Text successfully URL encoded" });
    } catch {
      toast({ title: "Encoding failed", description: "Unable to encode the text", variant: "destructive" });
    }
  }, [encodeInput, toast]);
  
  const handleDecode = useCallback(() => {
    if (!decodeInput.trim()) {
      toast({ title: "Enter text", description: "Please enter text to decode", variant: "destructive" });
      return;
    }
    try {
      const decoded = decodeURIComponent(decodeInput);
      setDecodeOutput(decoded);
      toast({ title: "Decoded!", description: "Text successfully URL decoded" });
    } catch {
      toast({ title: "Decoding failed", description: "Invalid encoded text", variant: "destructive" });
    }
  }, [decodeInput, toast]);
  
  const handleClearEncode = useCallback(() => {
    setEncodeInput('');
    setEncodeOutput('');
  }, []);
  
  const handleClearDecode = useCallback(() => {
    setDecodeInput('');
    setDecodeOutput('');
  }, []);
  
  // Base64 handlers
  const handleBase64Encode = useCallback(() => {
    if (!base64EncodeInput.trim()) {
      toast({ title: "Enter text", description: "Please enter text to encode", variant: "destructive" });
      return;
    }
    try {
      const encoded = btoa(unescape(encodeURIComponent(base64EncodeInput)));
      setBase64EncodeOutput(encoded);
      toast({ title: "Encoded!", description: "Text successfully Base64 encoded" });
    } catch {
      toast({ title: "Encoding failed", description: "Unable to encode the text", variant: "destructive" });
    }
  }, [base64EncodeInput, toast]);
  
  const handleBase64Decode = useCallback(() => {
    if (!base64DecodeInput.trim()) {
      toast({ title: "Enter text", description: "Please enter Base64 text to decode", variant: "destructive" });
      return;
    }
    try {
      const decoded = decodeURIComponent(escape(atob(base64DecodeInput)));
      setBase64DecodeOutput(decoded);
      toast({ title: "Decoded!", description: "Base64 text successfully decoded" });
    } catch {
      toast({ title: "Decoding failed", description: "Invalid Base64 text", variant: "destructive" });
    }
  }, [base64DecodeInput, toast]);
  
  const handleClearBase64Encode = useCallback(() => {
    setBase64EncodeInput('');
    setBase64EncodeOutput('');
  }, []);
  
  const handleClearBase64Decode = useCallback(() => {
    setBase64DecodeInput('');
    setBase64DecodeOutput('');
  }, []);
  
  const getFilteredResults = useCallback(() => {
    switch (filter) {
      case 'valid':
        return bulkResults.filter(r => r.isValidFormat);
      case 'invalid':
        return bulkResults.filter(r => !r.isValidFormat);
      default:
        return bulkResults;
    }
  }, [bulkResults, filter]);
  
  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'v', shift: true, action: () => singleUrl ? handleSingleValidate() : handleBulkValidate(), description: 'Validate URL(s)' },
    { key: 'r', shift: true, action: () => { handleClearSingle(); handleClearBulk(); }, description: 'Reset form' },
  ]);
  
  if (isLoading) return <UrlValidatorSkeleton />;
  
  const filteredResults = getFilteredResults();
  const validCount = bulkResults.filter(r => r.isValidFormat).length;
  const invalidCount = bulkResults.length - validCount;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">URL Validator</h1>
        </div>
        <p className="text-muted-foreground">
          Validate URL format before using in campaigns. Check protocol, domain, and structure.
        </p>
      </div>
      
      <Tabs defaultValue="single" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="single">Single URL</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Validation</TabsTrigger>
          <TabsTrigger value="encode">Encode/Decode</TabsTrigger>
        </TabsList>
        
        {/* Single URL Mode */}
        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Validate URL</CardTitle>
              <CardDescription>Enter a URL to validate its format and structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="https://example.com/page?param=value"
                    value={singleUrl}
                    onChange={(e) => setSingleUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSingleValidate()}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => handlePaste('single')}
                  >
                    <ClipboardPaste className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={handleSingleValidate}>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Validate
                </Button>
                {singleUrl && (
                  <Button variant="outline" size="icon" onClick={handleClearSingle}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Single Result */}
              {singleResult && (
                <Card className={cn(
                  "border-2",
                  singleResult.isValidFormat 
                    ? "border-green-500/30 bg-green-500/5" 
                    : "border-destructive/30 bg-destructive/5"
                )}>
                  <CardContent className="pt-4 space-y-4">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {singleResult.isValidFormat ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <span className={cn(
                        "font-medium",
                        singleResult.isValidFormat ? "text-green-600 dark:text-green-400" : "text-destructive"
                      )}>
                        {singleResult.statusMessage}
                      </span>
                    </div>
                    
                    {singleResult.isValidFormat && (
                      <>
                        {/* Details */}
                        <div className="grid gap-3 text-sm">
                          <div className="flex items-center justify-between py-2 border-b border-border/50">
                            <span className="text-muted-foreground">Protocol</span>
                            <Badge variant={singleResult.isSecure ? "default" : "secondary"}>
                              {singleResult.protocol.toUpperCase()}
                              {!singleResult.isSecure && (
                                <AlertTriangle className="h-3 w-3 ml-1" />
                              )}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-border/50">
                            <span className="text-muted-foreground">Domain</span>
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                              {singleResult.domain}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-border/50">
                            <span className="text-muted-foreground">Path</span>
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">
                              {singleResult.path || '/'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-muted-foreground">Query Params</span>
                            <Badge variant="outline">
                              {singleResult.hasQueryParams ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Normalized URL */}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Normalized URL</Label>
                          <div className="flex gap-2">
                            <Input 
                              value={singleResult.normalizedUrl} 
                              readOnly 
                              className="font-mono text-xs"
                            />
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleCopy(singleResult.normalizedUrl)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/utm-builder?url=${encodeURIComponent(singleResult.normalizedUrl)}`}>
                              <Link2 className="h-4 w-4 mr-2" />
                              Send to UTM Builder
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/qr-generator?url=${encodeURIComponent(singleResult.normalizedUrl)}`}>
                              <QrCode className="h-4 w-4 mr-2" />
                              Send to QR Generator
                            </Link>
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Bulk Mode */}
        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Bulk URL Validation</CardTitle>
              <CardDescription>Enter multiple URLs (one per line) to validate all at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>URLs (one per line)</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handlePaste('bulk')}
                  >
                    <ClipboardPaste className="h-4 w-4 mr-1" />
                    Paste
                  </Button>
                </div>
                <Textarea
                  placeholder="https://example.com/page1&#10;https://example.com/page2&#10;invalid-url"
                  value={bulkUrls}
                  onChange={(e) => setBulkUrls(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{bulkUrls.split('\n').filter(l => l.trim()).length} URLs</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleBulkValidate} 
                  disabled={isValidating}
                  className="flex-1 sm:flex-none"
                >
                  {isValidating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 mr-2" />
                  )}
                  Validate All
                </Button>
                {bulkUrls && (
                  <Button variant="outline" onClick={handleClearBulk}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Bulk Results */}
          {bulkResults.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">Results</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="default" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {validCount} Valid
                      </Badge>
                      <Badge variant="default" className="bg-destructive/10 text-destructive border-destructive/30">
                        <XCircle className="h-3 w-3 mr-1" />
                        {invalidCount} Invalid
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All URLs</SelectItem>
                        <SelectItem value="valid">Valid Only</SelectItem>
                        <SelectItem value="invalid">Invalid Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={handleExportResults}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">URL</th>
                          <th className="text-center p-3 font-medium w-24">Status</th>
                          <th className="text-center p-3 font-medium w-24">Protocol</th>
                          <th className="text-left p-3 font-medium w-40">Domain</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredResults.map((result, index) => (
                          <tr key={index} className="hover:bg-muted/30">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs truncate max-w-[300px]">
                                  {result.url}
                                </span>
                                {result.isValidFormat && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 flex-shrink-0"
                                    onClick={() => handleCopy(result.normalizedUrl)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {result.isValidFormat ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive mx-auto" />
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {result.protocol ? (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs",
                                    result.isSecure 
                                      ? "border-green-500/30 text-green-600 dark:text-green-400" 
                                      : "border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
                                  )}
                                >
                                  {result.protocol.toUpperCase()}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              {result.domain ? (
                                <span className="font-mono text-xs">{result.domain}</span>
                              ) : (
                                <span className="text-muted-foreground text-xs">{result.statusMessage}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Encode/Decode Mode */}
        <TabsContent value="encode" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Encode Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  URL Encode
                </CardTitle>
                <CardDescription>Convert special characters to URL-safe format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Input Text</Label>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Hello World! Special chars: @#$%"
                      value={encodeInput}
                      onChange={(e) => setEncodeInput(e.target.value)}
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleEncode} className="flex-1">
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Encode
                  </Button>
                  {encodeInput && (
                    <Button variant="outline" size="icon" onClick={handleClearEncode}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {encodeOutput && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Encoded Output</Label>
                    <div className="flex gap-2">
                      <Textarea
                        value={encodeOutput}
                        readOnly
                        rows={3}
                        className="font-mono text-xs bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => handleCopy(encodeOutput)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Decode Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  URL Decode
                </CardTitle>
                <CardDescription>Convert URL-encoded text back to readable format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Encoded Text</Label>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Hello%20World%21%20Special%20chars%3A%20%40%23%24%25"
                      value={decodeInput}
                      onChange={(e) => setDecodeInput(e.target.value)}
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleDecode} className="flex-1">
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Decode
                  </Button>
                  {decodeInput && (
                    <Button variant="outline" size="icon" onClick={handleClearDecode}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {decodeOutput && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Decoded Output</Label>
                    <div className="flex gap-2">
                      <Textarea
                        value={decodeOutput}
                        readOnly
                        rows={3}
                        className="font-mono text-xs bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => handleCopy(decodeOutput)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Encoding Info */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Code className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">About URL Encoding</p>
                  <p className="text-muted-foreground">
                    URL encoding converts special characters (like spaces, @, #, etc.) into percent-encoded format 
                    that is safe for use in URLs. Use this when building query parameters or passing data in URLs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Base64 Section */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Base64 Encode Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Base64 Encode
                </CardTitle>
                <CardDescription>Convert text to Base64 encoded format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Input Text</Label>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Hello World! Enter any text..."
                      value={base64EncodeInput}
                      onChange={(e) => setBase64EncodeInput(e.target.value)}
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleBase64Encode} className="flex-1">
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Encode
                  </Button>
                  {base64EncodeInput && (
                    <Button variant="outline" size="icon" onClick={handleClearBase64Encode}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {base64EncodeOutput && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Base64 Output</Label>
                    <div className="flex gap-2">
                      <Textarea
                        value={base64EncodeOutput}
                        readOnly
                        rows={3}
                        className="font-mono text-xs bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => handleCopy(base64EncodeOutput)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Base64 Decode Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Base64 Decode
                </CardTitle>
                <CardDescription>Convert Base64 encoded text back to readable format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Base64 Text</Label>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="SGVsbG8gV29ybGQh"
                      value={base64DecodeInput}
                      onChange={(e) => setBase64DecodeInput(e.target.value)}
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleBase64Decode} className="flex-1">
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Decode
                  </Button>
                  {base64DecodeInput && (
                    <Button variant="outline" size="icon" onClick={handleClearBase64Decode}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {base64DecodeOutput && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Decoded Output</Label>
                    <div className="flex gap-2">
                      <Textarea
                        value={base64DecodeOutput}
                        readOnly
                        rows={3}
                        className="font-mono text-xs bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => handleCopy(base64DecodeOutput)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Base64 Info */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Code className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">About Base64 Encoding</p>
                  <p className="text-muted-foreground">
                    Base64 encoding converts binary data or text into ASCII characters. It's commonly used for 
                    embedding images in CSS/HTML, encoding data in URLs, and transmitting data over text-based protocols.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">About URL Validation</p>
              <p className="text-muted-foreground">
                This tool validates URL format and structure client-side. It checks protocol, domain format, 
                and URL syntax. Full accessibility checks (HTTP status) require server-side validation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

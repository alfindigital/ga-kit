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
  ArrowRightLeft,
  Hash,
  FileDigit,
  Upload
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
  
  // Hash generator
  const [hashInput, setHashInput] = useState('');
  const [hashResults, setHashResults] = useState<{ md5: string; sha1: string; sha256: string } | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileHashing, setIsFileHashing] = useState(false);
  const [fileHashResults, setFileHashResults] = useState<{ md5: string; sha1: string; sha256: string } | null>(null);
  const [isFileDragging, setIsFileDragging] = useState(false);
  
  // Checksum comparison
  const [checksumFile, setChecksumFile] = useState<File | null>(null);
  const [expectedHash, setExpectedHash] = useState('');
  const [checksumAlgorithm, setChecksumAlgorithm] = useState<'md5' | 'sha1' | 'sha256'>('sha256');
  const [checksumResult, setChecksumResult] = useState<{ computed: string; match: boolean } | null>(null);
  const [isChecksumHashing, setIsChecksumHashing] = useState(false);
  const [isChecksumDragging, setIsChecksumDragging] = useState(false);
  
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
  
  // MD5 implementation (pure JS since Web Crypto doesn't support it)
  const md5 = useCallback((str: string): string => {
    function rotateLeft(x: number, n: number) {
      return (x << n) | (x >>> (32 - n));
    }
    
    function addUnsigned(x: number, y: number) {
      const x8 = x & 0x80000000;
      const y8 = y & 0x80000000;
      const x4 = x & 0x40000000;
      const y4 = y & 0x40000000;
      const result = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);
      if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8;
      if (x4 | y4) {
        if (result & 0x40000000) return result ^ 0xC0000000 ^ x8 ^ y8;
        return result ^ 0x40000000 ^ x8 ^ y8;
      }
      return result ^ x8 ^ y8;
    }
    
    function F(x: number, y: number, z: number) { return (x & y) | (~x & z); }
    function G(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
    function H(x: number, y: number, z: number) { return x ^ y ^ z; }
    function I(x: number, y: number, z: number) { return y ^ (x | ~z); }
    
    function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
      a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
      a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
      a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
      a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    
    function wordToHex(n: number) {
      let hex = '';
      for (let c = 0; c <= 3; c++) {
        hex += ((n >>> (c * 8)) & 0xFF).toString(16).padStart(2, '0');
      }
      return hex;
    }
    
    // Convert string to UTF-8 bytes
    const utf8 = unescape(encodeURIComponent(str));
    const words: number[] = [];
    const len = utf8.length;
    
    for (let i = 0; i < len; i++) {
      words[i >> 2] |= utf8.charCodeAt(i) << ((i % 4) * 8);
    }
    words[len >> 2] |= 0x80 << ((len % 4) * 8);
    
    const totalLen = (((len + 8) >> 6) + 1) * 16;
    while (words.length < totalLen) words.push(0);
    words[totalLen - 2] = len * 8;
    
    let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
    
    for (let k = 0; k < words.length; k += 16) {
      const AA = a, BB = b, CC = c, DD = d;
      const x = words.slice(k, k + 16);
      
      a = FF(a, b, c, d, x[0], 7, 0xD76AA478); d = FF(d, a, b, c, x[1], 12, 0xE8C7B756);
      c = FF(c, d, a, b, x[2], 17, 0x242070DB); b = FF(b, c, d, a, x[3], 22, 0xC1BDCEEE);
      a = FF(a, b, c, d, x[4], 7, 0xF57C0FAF); d = FF(d, a, b, c, x[5], 12, 0x4787C62A);
      c = FF(c, d, a, b, x[6], 17, 0xA8304613); b = FF(b, c, d, a, x[7], 22, 0xFD469501);
      a = FF(a, b, c, d, x[8], 7, 0x698098D8); d = FF(d, a, b, c, x[9], 12, 0x8B44F7AF);
      c = FF(c, d, a, b, x[10], 17, 0xFFFF5BB1); b = FF(b, c, d, a, x[11], 22, 0x895CD7BE);
      a = FF(a, b, c, d, x[12], 7, 0x6B901122); d = FF(d, a, b, c, x[13], 12, 0xFD987193);
      c = FF(c, d, a, b, x[14], 17, 0xA679438E); b = FF(b, c, d, a, x[15], 22, 0x49B40821);
      
      a = GG(a, b, c, d, x[1], 5, 0xF61E2562); d = GG(d, a, b, c, x[6], 9, 0xC040B340);
      c = GG(c, d, a, b, x[11], 14, 0x265E5A51); b = GG(b, c, d, a, x[0], 20, 0xE9B6C7AA);
      a = GG(a, b, c, d, x[5], 5, 0xD62F105D); d = GG(d, a, b, c, x[10], 9, 0x02441453);
      c = GG(c, d, a, b, x[15], 14, 0xD8A1E681); b = GG(b, c, d, a, x[4], 20, 0xE7D3FBC8);
      a = GG(a, b, c, d, x[9], 5, 0x21E1CDE6); d = GG(d, a, b, c, x[14], 9, 0xC33707D6);
      c = GG(c, d, a, b, x[3], 14, 0xF4D50D87); b = GG(b, c, d, a, x[8], 20, 0x455A14ED);
      a = GG(a, b, c, d, x[13], 5, 0xA9E3E905); d = GG(d, a, b, c, x[2], 9, 0xFCEFA3F8);
      c = GG(c, d, a, b, x[7], 14, 0x676F02D9); b = GG(b, c, d, a, x[12], 20, 0x8D2A4C8A);
      
      a = HH(a, b, c, d, x[5], 4, 0xFFFA3942); d = HH(d, a, b, c, x[8], 11, 0x8771F681);
      c = HH(c, d, a, b, x[11], 16, 0x6D9D6122); b = HH(b, c, d, a, x[14], 23, 0xFDE5380C);
      a = HH(a, b, c, d, x[1], 4, 0xA4BEEA44); d = HH(d, a, b, c, x[4], 11, 0x4BDECFA9);
      c = HH(c, d, a, b, x[7], 16, 0xF6BB4B60); b = HH(b, c, d, a, x[10], 23, 0xBEBFBC70);
      a = HH(a, b, c, d, x[13], 4, 0x289B7EC6); d = HH(d, a, b, c, x[0], 11, 0xEAA127FA);
      c = HH(c, d, a, b, x[3], 16, 0xD4EF3085); b = HH(b, c, d, a, x[6], 23, 0x04881D05);
      a = HH(a, b, c, d, x[9], 4, 0xD9D4D039); d = HH(d, a, b, c, x[12], 11, 0xE6DB99E5);
      c = HH(c, d, a, b, x[15], 16, 0x1FA27CF8); b = HH(b, c, d, a, x[2], 23, 0xC4AC5665);
      
      a = II(a, b, c, d, x[0], 6, 0xF4292244); d = II(d, a, b, c, x[7], 10, 0x432AFF97);
      c = II(c, d, a, b, x[14], 15, 0xAB9423A7); b = II(b, c, d, a, x[5], 21, 0xFC93A039);
      a = II(a, b, c, d, x[12], 6, 0x655B59C3); d = II(d, a, b, c, x[3], 10, 0x8F0CCC92);
      c = II(c, d, a, b, x[10], 15, 0xFFEFF47D); b = II(b, c, d, a, x[1], 21, 0x85845DD1);
      a = II(a, b, c, d, x[8], 6, 0x6FA87E4F); d = II(d, a, b, c, x[15], 10, 0xFE2CE6E0);
      c = II(c, d, a, b, x[6], 15, 0xA3014314); b = II(b, c, d, a, x[13], 21, 0x4E0811A1);
      a = II(a, b, c, d, x[4], 6, 0xF7537E82); d = II(d, a, b, c, x[11], 10, 0xBD3AF235);
      c = II(c, d, a, b, x[2], 15, 0x2AD7D2BB); b = II(b, c, d, a, x[9], 21, 0xEB86D391);
      
      a = addUnsigned(a, AA); b = addUnsigned(b, BB);
      c = addUnsigned(c, CC); d = addUnsigned(d, DD);
    }
    
    return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
  }, []);
  
  // SHA-1 and SHA-256 using Web Crypto API
  const computeHash = useCallback(async (text: string, algorithm: 'SHA-1' | 'SHA-256'): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);
  
  const handleGenerateHashes = useCallback(async () => {
    if (!hashInput.trim()) {
      toast({ title: "Enter text", description: "Please enter text to hash", variant: "destructive" });
      return;
    }
    
    setIsHashing(true);
    try {
      const [sha1, sha256] = await Promise.all([
        computeHash(hashInput, 'SHA-1'),
        computeHash(hashInput, 'SHA-256')
      ]);
      const md5Hash = md5(hashInput);
      
      setHashResults({ md5: md5Hash, sha1, sha256 });
      toast({ title: "Hashes generated!", description: "All hash values computed successfully" });
    } catch {
      toast({ title: "Hashing failed", description: "Unable to compute hashes", variant: "destructive" });
    }
    setIsHashing(false);
  }, [hashInput, toast, computeHash, md5]);
  
  const handleClearHash = useCallback(() => {
    setHashInput('');
    setHashResults(null);
  }, []);
  
  // MD5 for ArrayBuffer
  const md5ArrayBuffer = useCallback((buffer: ArrayBuffer): string => {
    function rotateLeft(x: number, n: number) {
      return (x << n) | (x >>> (32 - n));
    }
    
    function addUnsigned(x: number, y: number) {
      const x8 = x & 0x80000000;
      const y8 = y & 0x80000000;
      const x4 = x & 0x40000000;
      const y4 = y & 0x40000000;
      const result = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);
      if (x4 & y4) return result ^ 0x80000000 ^ x8 ^ y8;
      if (x4 | y4) {
        if (result & 0x40000000) return result ^ 0xC0000000 ^ x8 ^ y8;
        return result ^ 0x40000000 ^ x8 ^ y8;
      }
      return result ^ x8 ^ y8;
    }
    
    function F(x: number, y: number, z: number) { return (x & y) | (~x & z); }
    function G(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
    function H(x: number, y: number, z: number) { return x ^ y ^ z; }
    function I(x: number, y: number, z: number) { return y ^ (x | ~z); }
    
    function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
      a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
      a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
      a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
      a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    
    function wordToHex(n: number) {
      let hex = '';
      for (let c = 0; c <= 3; c++) {
        hex += ((n >>> (c * 8)) & 0xFF).toString(16).padStart(2, '0');
      }
      return hex;
    }
    
    const bytes = new Uint8Array(buffer);
    const len = bytes.length;
    const words: number[] = [];
    
    for (let i = 0; i < len; i++) {
      words[i >> 2] |= bytes[i] << ((i % 4) * 8);
    }
    words[len >> 2] |= 0x80 << ((len % 4) * 8);
    
    const totalLen = (((len + 8) >> 6) + 1) * 16;
    while (words.length < totalLen) words.push(0);
    words[totalLen - 2] = len * 8;
    
    let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
    
    for (let k = 0; k < words.length; k += 16) {
      const AA = a, BB = b, CC = c, DD = d;
      const x = words.slice(k, k + 16);
      
      a = FF(a, b, c, d, x[0], 7, 0xD76AA478); d = FF(d, a, b, c, x[1], 12, 0xE8C7B756);
      c = FF(c, d, a, b, x[2], 17, 0x242070DB); b = FF(b, c, d, a, x[3], 22, 0xC1BDCEEE);
      a = FF(a, b, c, d, x[4], 7, 0xF57C0FAF); d = FF(d, a, b, c, x[5], 12, 0x4787C62A);
      c = FF(c, d, a, b, x[6], 17, 0xA8304613); b = FF(b, c, d, a, x[7], 22, 0xFD469501);
      a = FF(a, b, c, d, x[8], 7, 0x698098D8); d = FF(d, a, b, c, x[9], 12, 0x8B44F7AF);
      c = FF(c, d, a, b, x[10], 17, 0xFFFF5BB1); b = FF(b, c, d, a, x[11], 22, 0x895CD7BE);
      a = FF(a, b, c, d, x[12], 7, 0x6B901122); d = FF(d, a, b, c, x[13], 12, 0xFD987193);
      c = FF(c, d, a, b, x[14], 17, 0xA679438E); b = FF(b, c, d, a, x[15], 22, 0x49B40821);
      
      a = GG(a, b, c, d, x[1], 5, 0xF61E2562); d = GG(d, a, b, c, x[6], 9, 0xC040B340);
      c = GG(c, d, a, b, x[11], 14, 0x265E5A51); b = GG(b, c, d, a, x[0], 20, 0xE9B6C7AA);
      a = GG(a, b, c, d, x[5], 5, 0xD62F105D); d = GG(d, a, b, c, x[10], 9, 0x02441453);
      c = GG(c, d, a, b, x[15], 14, 0xD8A1E681); b = GG(b, c, d, a, x[4], 20, 0xE7D3FBC8);
      a = GG(a, b, c, d, x[9], 5, 0x21E1CDE6); d = GG(d, a, b, c, x[14], 9, 0xC33707D6);
      c = GG(c, d, a, b, x[3], 14, 0xF4D50D87); b = GG(b, c, d, a, x[8], 20, 0x455A14ED);
      a = GG(a, b, c, d, x[13], 5, 0xA9E3E905); d = GG(d, a, b, c, x[2], 9, 0xFCEFA3F8);
      c = GG(c, d, a, b, x[7], 14, 0x676F02D9); b = GG(b, c, d, a, x[12], 20, 0x8D2A4C8A);
      
      a = HH(a, b, c, d, x[5], 4, 0xFFFA3942); d = HH(d, a, b, c, x[8], 11, 0x8771F681);
      c = HH(c, d, a, b, x[11], 16, 0x6D9D6122); b = HH(b, c, d, a, x[14], 23, 0xFDE5380C);
      a = HH(a, b, c, d, x[1], 4, 0xA4BEEA44); d = HH(d, a, b, c, x[4], 11, 0x4BDECFA9);
      c = HH(c, d, a, b, x[7], 16, 0xF6BB4B60); b = HH(b, c, d, a, x[10], 23, 0xBEBFBC70);
      a = HH(a, b, c, d, x[13], 4, 0x289B7EC6); d = HH(d, a, b, c, x[0], 11, 0xEAA127FA);
      c = HH(c, d, a, b, x[3], 16, 0xD4EF3085); b = HH(b, c, d, a, x[6], 23, 0x04881D05);
      a = HH(a, b, c, d, x[9], 4, 0xD9D4D039); d = HH(d, a, b, c, x[12], 11, 0xE6DB99E5);
      c = HH(c, d, a, b, x[15], 16, 0x1FA27CF8); b = HH(b, c, d, a, x[2], 23, 0xC4AC5665);
      
      a = II(a, b, c, d, x[0], 6, 0xF4292244); d = II(d, a, b, c, x[7], 10, 0x432AFF97);
      c = II(c, d, a, b, x[14], 15, 0xAB9423A7); b = II(b, c, d, a, x[5], 21, 0xFC93A039);
      a = II(a, b, c, d, x[12], 6, 0x655B59C3); d = II(d, a, b, c, x[3], 10, 0x8F0CCC92);
      c = II(c, d, a, b, x[10], 15, 0xFFEFF47D); b = II(b, c, d, a, x[1], 21, 0x85845DD1);
      a = II(a, b, c, d, x[8], 6, 0x6FA87E4F); d = II(d, a, b, c, x[15], 10, 0xFE2CE6E0);
      c = II(c, d, a, b, x[6], 15, 0xA3014314); b = II(b, c, d, a, x[13], 21, 0x4E0811A1);
      a = II(a, b, c, d, x[4], 6, 0xF7537E82); d = II(d, a, b, c, x[11], 10, 0xBD3AF235);
      c = II(c, d, a, b, x[2], 15, 0x2AD7D2BB); b = II(b, c, d, a, x[9], 21, 0xEB86D391);
      
      a = addUnsigned(a, AA); b = addUnsigned(b, BB);
      c = addUnsigned(c, CC); d = addUnsigned(d, DD);
    }
    
    return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
  }, []);
  
  // Hash ArrayBuffer using Web Crypto API
  const computeHashFromBuffer = useCallback(async (buffer: ArrayBuffer, algorithm: 'SHA-1' | 'SHA-256'): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileHashResults(null);
    }
  }, []);
  
  const handleFileDrop = useCallback((file: File) => {
    setSelectedFile(file);
    setFileHashResults(null);
    toast({ title: "File selected", description: `${file.name} ready for hashing` });
  }, [toast]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsFileDragging(true);
    }
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsFileDragging(false);
    }
  }, []);
  
  const handleDropFile = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileDrop(files[0]);
    }
  }, [handleFileDrop]);
  
  const handleGenerateFileHashes = useCallback(async () => {
    if (!selectedFile) {
      toast({ title: "Select a file", description: "Please select a file to hash", variant: "destructive" });
      return;
    }
    
    setIsFileHashing(true);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const [sha1, sha256] = await Promise.all([
        computeHashFromBuffer(buffer, 'SHA-1'),
        computeHashFromBuffer(buffer, 'SHA-256')
      ]);
      const md5Hash = md5ArrayBuffer(buffer);
      
      setFileHashResults({ md5: md5Hash, sha1, sha256 });
      toast({ title: "File hashes generated!", description: `Computed hashes for ${selectedFile.name}` });
    } catch {
      toast({ title: "Hashing failed", description: "Unable to compute file hashes", variant: "destructive" });
    }
    setIsFileHashing(false);
  }, [selectedFile, toast, computeHashFromBuffer, md5ArrayBuffer]);
  
  const handleClearFileHash = useCallback(() => {
    setSelectedFile(null);
    setFileHashResults(null);
  }, []);
  
  // Checksum comparison handlers
  const handleChecksumFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setChecksumFile(file);
      setChecksumResult(null);
    }
  }, []);
  
  const handleChecksumFileDrop = useCallback((file: File) => {
    setChecksumFile(file);
    setChecksumResult(null);
    toast({ title: "File selected", description: `${file.name} ready for verification` });
  }, [toast]);
  
  const handleChecksumDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsChecksumDragging(true);
    }
  }, []);
  
  const handleChecksumDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsChecksumDragging(false);
    }
  }, []);
  
  const handleChecksumDropFile = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsChecksumDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleChecksumFileDrop(files[0]);
    }
  }, [handleChecksumFileDrop]);
  
  const handleVerifyChecksum = useCallback(async () => {
    if (!checksumFile) {
      toast({ title: "Select a file", description: "Please select a file to verify", variant: "destructive" });
      return;
    }
    if (!expectedHash.trim()) {
      toast({ title: "Enter expected hash", description: "Please enter the expected hash value", variant: "destructive" });
      return;
    }
    
    setIsChecksumHashing(true);
    try {
      const buffer = await checksumFile.arrayBuffer();
      let computed: string;
      
      if (checksumAlgorithm === 'md5') {
        computed = md5ArrayBuffer(buffer);
      } else if (checksumAlgorithm === 'sha1') {
        computed = await computeHashFromBuffer(buffer, 'SHA-1');
      } else {
        computed = await computeHashFromBuffer(buffer, 'SHA-256');
      }
      
      const normalizedExpected = expectedHash.trim().toLowerCase().replace(/\s/g, '');
      const match = computed.toLowerCase() === normalizedExpected;
      
      setChecksumResult({ computed, match });
      
      if (match) {
        toast({ title: "✓ Checksum verified!", description: "The file matches the expected hash" });
      } else {
        toast({ title: "✗ Checksum mismatch", description: "The file does NOT match the expected hash", variant: "destructive" });
      }
    } catch {
      toast({ title: "Verification failed", description: "Unable to compute file hash", variant: "destructive" });
    }
    setIsChecksumHashing(false);
  }, [checksumFile, expectedHash, checksumAlgorithm, toast, md5ArrayBuffer, computeHashFromBuffer]);
  
  const handleClearChecksum = useCallback(() => {
    setChecksumFile(null);
    setExpectedHash('');
    setChecksumResult(null);
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
    { key: 'h', shift: true, action: handleGenerateHashes, description: 'Generate hashes' },
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
          
          {/* Hash Generator Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Hash Generator
              </CardTitle>
              <CardDescription>Generate MD5, SHA-1, and SHA-256 hashes from text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Input Text</Label>
                <Textarea
                  placeholder="Enter text to hash..."
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleGenerateHashes} disabled={isHashing} className="flex-1 sm:flex-none">
                  {isHashing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileDigit className="h-4 w-4 mr-2" />
                  )}
                  Generate Hashes
                </Button>
                {hashInput && (
                  <Button variant="outline" size="icon" onClick={handleClearHash}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {hashResults && (
                <div className="space-y-3">
                  {/* MD5 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">MD5</Badge>
                      <span>32 characters</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={hashResults.md5}
                        readOnly
                        className="font-mono text-xs bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => handleCopy(hashResults.md5)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* SHA-1 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">SHA-1</Badge>
                      <span>40 characters</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={hashResults.sha1}
                        readOnly
                        className="font-mono text-xs bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => handleCopy(hashResults.sha1)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* SHA-256 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">SHA-256</Badge>
                      <span>64 characters</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={hashResults.sha256}
                        readOnly
                        className="font-mono text-xs bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => handleCopy(hashResults.sha256)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* File Hash Generator Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-4 w-4" />
                File Hash Generator
              </CardTitle>
              <CardDescription>Generate MD5, SHA-1, and SHA-256 hashes from uploaded files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDropFile}
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
                  isFileDragging 
                    ? "border-primary bg-primary/5 scale-[1.02]" 
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                  isFileHashing && "pointer-events-none opacity-60"
                )}
              >
                {isFileHashing ? (
                  <div className="space-y-3">
                    <div className="relative mx-auto w-12 h-12">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Processing {selectedFile?.name}...</p>
                      <p className="text-xs text-muted-foreground">Computing MD5, SHA-1, and SHA-256 hashes</p>
                    </div>
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileDigit className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button onClick={handleGenerateFileHashes} size="sm">
                        <FileDigit className="h-4 w-4 mr-2" />
                        Generate Hashes
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearFileHash}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block space-y-3">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className={cn(
                      "mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-all",
                      isFileDragging 
                        ? "bg-primary/20 scale-110" 
                        : "bg-muted"
                    )}>
                      <Upload className={cn(
                        "h-6 w-6 transition-colors",
                        isFileDragging ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium text-foreground">Click to upload</span>{" "}
                        <span className="text-muted-foreground">or drag and drop</span>
                      </p>
                      <p className="text-xs text-muted-foreground">Any file type supported</p>
                    </div>
                  </label>
                )}
              </div>
              
              {fileHashResults && (
                <div className="space-y-3">
                  {/* MD5 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">MD5</Badge>
                      <span>32 characters</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={fileHashResults.md5}
                        readOnly
                        className="font-mono text-xs bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => handleCopy(fileHashResults.md5)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* SHA-1 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">SHA-1</Badge>
                      <span>40 characters</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={fileHashResults.sha1}
                        readOnly
                        className="font-mono text-xs bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => handleCopy(fileHashResults.sha1)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* SHA-256 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">SHA-256</Badge>
                      <span>64 characters</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={fileHashResults.sha256}
                        readOnly
                        className="font-mono text-xs bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => handleCopy(fileHashResults.sha256)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Checksum Comparison Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Checksum Verification
              </CardTitle>
              <CardDescription>Verify downloaded files by comparing computed hashes against expected values</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Expected Hash Input */}
              <div className="space-y-2">
                <Label>Expected Hash</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste the expected hash value here..."
                    value={expectedHash}
                    onChange={(e) => setExpectedHash(e.target.value)}
                    className="font-mono text-sm flex-1"
                  />
                  <Select value={checksumAlgorithm} onValueChange={(v) => setChecksumAlgorithm(v as 'md5' | 'sha1' | 'sha256')}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="md5">MD5</SelectItem>
                      <SelectItem value="sha1">SHA-1</SelectItem>
                      <SelectItem value="sha256">SHA-256</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleChecksumDragOver}
                onDragLeave={handleChecksumDragLeave}
                onDrop={handleChecksumDropFile}
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
                  isChecksumDragging 
                    ? "border-primary bg-primary/5 scale-[1.02]" 
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                  isChecksumHashing && "pointer-events-none opacity-60"
                )}
              >
                {isChecksumHashing ? (
                  <div className="space-y-3">
                    <div className="relative mx-auto w-12 h-12">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Verifying {checksumFile?.name}...</p>
                      <p className="text-xs text-muted-foreground">Computing {checksumAlgorithm.toUpperCase()} hash</p>
                    </div>
                  </div>
                ) : checksumFile ? (
                  <div className="space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileDigit className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{checksumFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(checksumFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button onClick={handleVerifyChecksum} size="sm" disabled={!expectedHash.trim()}>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Verify Checksum
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearChecksum}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block space-y-3">
                    <input
                      type="file"
                      onChange={handleChecksumFileSelect}
                      className="hidden"
                    />
                    <div className={cn(
                      "mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-all",
                      isChecksumDragging 
                        ? "bg-primary/20 scale-110" 
                        : "bg-muted"
                    )}>
                      <Upload className={cn(
                        "h-6 w-6 transition-colors",
                        isChecksumDragging ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium text-foreground">Click to upload</span>{" "}
                        <span className="text-muted-foreground">or drag and drop</span>
                      </p>
                      <p className="text-xs text-muted-foreground">Select file to verify its integrity</p>
                    </div>
                  </label>
                )}
              </div>
              
              {/* Checksum Result */}
              {checksumResult && (
                <div className={cn(
                  "p-4 rounded-lg border-2 space-y-3",
                  checksumResult.match 
                    ? "border-green-500/50 bg-green-500/10" 
                    : "border-red-500/50 bg-red-500/10"
                )}>
                  <div className="flex items-center gap-2">
                    {checksumResult.match ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-green-600 dark:text-green-400">Checksum Match!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="font-medium text-red-600 dark:text-red-400">Checksum Mismatch!</span>
                      </>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground w-20 flex-shrink-0">Expected:</span>
                      <code className="font-mono text-xs break-all bg-muted/50 px-1.5 py-0.5 rounded">
                        {expectedHash.trim().toLowerCase().replace(/\s/g, '')}
                      </code>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground w-20 flex-shrink-0">Computed:</span>
                      <code className="font-mono text-xs break-all bg-muted/50 px-1.5 py-0.5 rounded">
                        {checksumResult.computed}
                      </code>
                    </div>
                  </div>
                  {!checksumResult.match && (
                    <p className="text-xs text-muted-foreground">
                      The file may be corrupted or modified. Try downloading it again from a trusted source.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Hash Info */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">About Hash Functions</p>
                  <p className="text-muted-foreground">
                    Hash functions create fixed-size fingerprints of data. MD5 (128-bit) is fast but considered weak for security. 
                    SHA-1 (160-bit) is deprecated for cryptographic use. SHA-256 (256-bit) is recommended for security-sensitive applications.
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

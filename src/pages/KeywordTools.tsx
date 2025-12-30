import { useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useClipboard } from '@/hooks/useClipboard';

export default function KeywordTools() {
  const { copy } = useClipboard();

  // Remove Duplicates
  const [dupeInput, setDupeInput] = useState('');
  const dupeResult = [...new Set(dupeInput.split('\n').map(k => k.trim().toLowerCase()).filter(Boolean))];

  // Case Conversion
  const [caseInput, setCaseInput] = useState('');
  const [caseMode, setCaseMode] = useState<'lower' | 'upper' | 'title' | 'sentence' | 'kebab' | 'snake'>('lower');
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

  // Bulk Replace
  const [replaceInput, setReplaceInput] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const replaceResult = findText ? 
    (caseSensitive ? replaceInput.split(findText).join(replaceText) : replaceInput.replace(new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replaceText)) 
    : replaceInput;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Keyword Tools</h1>
        <p className="text-sm text-muted-foreground">Remove duplicates, convert case, and bulk replace</p>
      </div>

      <Tabs defaultValue="duplicates" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="duplicates" className="text-xs sm:text-sm py-2">Duplicates</TabsTrigger>
          <TabsTrigger value="case" className="text-xs sm:text-sm py-2">Case</TabsTrigger>
          <TabsTrigger value="replace" className="text-xs sm:text-sm py-2">Replace</TabsTrigger>
        </TabsList>

        <TabsContent value="duplicates" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="p-3"><CardTitle className="text-xs sm:text-sm">Input ({dupeInput.split('\n').filter(Boolean).length} lines)</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0">
                <Textarea placeholder="Paste keywords here..." value={dupeInput} onChange={(e) => setDupeInput(e.target.value)} rows={8} className="text-sm" />
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardHeader className="p-3 flex-row items-center justify-between">
                <CardTitle className="text-xs sm:text-sm">Result ({dupeResult.length} unique)</CardTitle>
                <Button variant="outline" size="sm" onClick={() => copy(dupeResult.join('\n'))} className="h-7 text-xs"><Copy className="h-3 w-3 mr-1" /> Copy</Button>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <Textarea value={dupeResult.join('\n')} readOnly rows={8} className="font-mono text-xs sm:text-sm" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
              <CardHeader className="p-3"><CardTitle className="text-xs sm:text-sm">Input</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0">
                <Textarea placeholder="Enter text to convert..." value={caseInput} onChange={(e) => setCaseInput(e.target.value)} rows={8} className="text-sm" />
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardHeader className="p-3 flex-row items-center justify-between">
                <CardTitle className="text-xs sm:text-sm">Result</CardTitle>
                <Button variant="outline" size="sm" onClick={() => copy(convertCase(caseInput, caseMode))} className="h-7 text-xs"><Copy className="h-3 w-3 mr-1" /> Copy</Button>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <Textarea value={convertCase(caseInput, caseMode)} readOnly rows={8} className="font-mono text-xs sm:text-sm" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="replace" className="mt-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input placeholder="Find..." value={findText} onChange={(e) => setFindText(e.target.value)} className="flex-1 sm:max-w-[180px] text-sm" />
            <Input placeholder="Replace with..." value={replaceText} onChange={(e) => setReplaceText(e.target.value)} className="flex-1 sm:max-w-[180px] text-sm" />
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={caseSensitive} onCheckedChange={(v) => setCaseSensitive(!!v)} /> Case sensitive</label>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="p-3"><CardTitle className="text-xs sm:text-sm">Input</CardTitle></CardHeader>
              <CardContent className="p-3 pt-0">
                <Textarea placeholder="Enter text..." value={replaceInput} onChange={(e) => setReplaceInput(e.target.value)} rows={8} className="text-sm" />
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardHeader className="p-3 flex-row items-center justify-between">
                <CardTitle className="text-xs sm:text-sm">Result</CardTitle>
                <Button variant="outline" size="sm" onClick={() => copy(replaceResult)} className="h-7 text-xs"><Copy className="h-3 w-3 mr-1" /> Copy</Button>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <Textarea value={replaceResult} readOnly rows={8} className="font-mono text-xs sm:text-sm" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

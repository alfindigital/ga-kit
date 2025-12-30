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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Keyword Tools</h1>
        <p className="text-muted-foreground">Remove duplicates, convert case, and bulk replace text</p>
      </div>

      <Tabs defaultValue="duplicates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="duplicates">Remove Duplicates</TabsTrigger>
          <TabsTrigger value="case">Convert Case</TabsTrigger>
          <TabsTrigger value="replace">Bulk Replace</TabsTrigger>
        </TabsList>

        <TabsContent value="duplicates" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm">Input ({dupeInput.split('\n').filter(Boolean).length} lines)</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <Textarea placeholder="Paste keywords here..." value={dupeInput} onChange={(e) => setDupeInput(e.target.value)} rows={10} />
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardHeader className="py-3 flex-row items-center justify-between">
                <CardTitle className="text-sm">Result ({dupeResult.length} unique)</CardTitle>
                <Button variant="outline" size="sm" onClick={() => copy(dupeResult.join('\n'))}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
              </CardHeader>
              <CardContent className="pt-0">
                <Textarea value={dupeResult.join('\n')} readOnly rows={10} className="font-mono text-sm" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="case" className="mt-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {(['lower', 'upper', 'title', 'sentence', 'kebab', 'snake'] as const).map(mode => (
              <Button key={mode} variant={caseMode === mode ? 'default' : 'outline'} size="sm" onClick={() => setCaseMode(mode)}>
                {mode === 'lower' ? 'lowercase' : mode === 'upper' ? 'UPPERCASE' : mode === 'title' ? 'Title Case' : mode === 'sentence' ? 'Sentence case' : mode}
              </Button>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm">Input</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <Textarea placeholder="Enter text to convert..." value={caseInput} onChange={(e) => setCaseInput(e.target.value)} rows={10} />
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardHeader className="py-3 flex-row items-center justify-between">
                <CardTitle className="text-sm">Result</CardTitle>
                <Button variant="outline" size="sm" onClick={() => copy(convertCase(caseInput, caseMode))}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
              </CardHeader>
              <CardContent className="pt-0">
                <Textarea value={convertCase(caseInput, caseMode)} readOnly rows={10} className="font-mono text-sm" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="replace" className="mt-4">
          <div className="flex gap-4 mb-4 flex-wrap">
            <Input placeholder="Find..." value={findText} onChange={(e) => setFindText(e.target.value)} className="w-48" />
            <Input placeholder="Replace with..." value={replaceText} onChange={(e) => setReplaceText(e.target.value)} className="w-48" />
            <label className="flex items-center gap-2"><Checkbox checked={caseSensitive} onCheckedChange={(v) => setCaseSensitive(!!v)} /> Case sensitive</label>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm">Input</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <Textarea placeholder="Enter text..." value={replaceInput} onChange={(e) => setReplaceInput(e.target.value)} rows={10} />
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardHeader className="py-3 flex-row items-center justify-between">
                <CardTitle className="text-sm">Result</CardTitle>
                <Button variant="outline" size="sm" onClick={() => copy(replaceResult)}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
              </CardHeader>
              <CardContent className="pt-0">
                <Textarea value={replaceResult} readOnly rows={10} className="font-mono text-sm" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

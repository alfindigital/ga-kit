import { useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useClipboard } from '@/hooks/useClipboard';
import { useExport } from '@/hooks/useExport';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type MatchType = 'broad' | 'phrase' | 'exact';

export default function KeywordMixer() {
  const [base, setBase] = useState('');
  const [prefixes, setPrefixes] = useState('');
  const [suffixes, setSuffixes] = useState('');
  const [matchTypes, setMatchTypes] = useState<MatchType[]>(['broad']);
  const { copy } = useClipboard();
  const { exportCsv, exportTxt } = useExport();

  const toggleMatchType = (type: MatchType) => {
    setMatchTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const results = (() => {
    const bases = base.split('\n').map(k => k.trim()).filter(Boolean);
    const pres = prefixes.split('\n').map(k => k.trim()).filter(Boolean);
    const sufs = suffixes.split('\n').map(k => k.trim()).filter(Boolean);
    if (bases.length === 0) return [];

    const combined: string[] = [];
    bases.forEach(b => {
      if (pres.length === 0 && sufs.length === 0) {
        combined.push(b);
      } else if (pres.length === 0) {
        sufs.forEach(s => combined.push(`${b} ${s}`));
      } else if (sufs.length === 0) {
        pres.forEach(p => combined.push(`${p} ${b}`));
      } else {
        pres.forEach(p => sufs.forEach(s => combined.push(`${p} ${b} ${s}`)));
      }
    });

    const unique = [...new Set(combined)];
    const final: string[] = [];
    unique.forEach(kw => {
      if (matchTypes.includes('broad')) final.push(kw);
      if (matchTypes.includes('phrase')) final.push(`"${kw}"`);
      if (matchTypes.includes('exact')) final.push(`[${kw}]`);
    });
    return final;
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Keyword Mixer</h1>
          <p className="text-muted-foreground">Mix base keywords with prefixes and suffixes</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setBase(''); setPrefixes(''); setSuffixes(''); }}>
          <RotateCcw className="h-4 w-4 mr-1" /> Reset
        </Button>
      </div>

      <div className="flex gap-4">
        {(['broad', 'phrase', 'exact'] as MatchType[]).map(type => (
          <label key={type} className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={matchTypes.includes(type)} onCheckedChange={() => toggleMatchType(type)} />
            <span className="capitalize">{type}</span>
          </label>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">Prefixes</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <Textarea placeholder="best&#10;cheap&#10;top" value={prefixes} onChange={(e) => setPrefixes(e.target.value)} rows={6} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">Base Keywords</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <Textarea placeholder="shoes&#10;bags&#10;watches" value={base} onChange={(e) => setBase(e.target.value)} rows={6} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">Suffixes</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <Textarea placeholder="online&#10;near me&#10;2024" value={suffixes} onChange={(e) => setSuffixes(e.target.value)} rows={6} />
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader className="py-3 flex-row items-center justify-between">
            <CardTitle className="text-sm">Results ({results.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copy(results.join('\n'))}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Export</Button></DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportTxt(results, 'mixed-keywords')}>TXT</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportCsv(results.map(k => [k]), 'mixed-keywords')}>CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea value={results.join('\n')} readOnly rows={12} className="font-mono text-sm" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

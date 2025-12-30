import { useState } from 'react';
import { Copy, Plus, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useClipboard } from '@/hooks/useClipboard';
import { useExport } from '@/hooks/useExport';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type MatchType = 'broad' | 'phrase' | 'exact';

export default function KeywordCombiner() {
  const [lists, setLists] = useState<string[]>(['', '', '']);
  const [matchTypes, setMatchTypes] = useState<MatchType[]>(['broad']);
  const { copy } = useClipboard();
  const { exportCsv, exportTxt } = useExport();

  const toggleMatchType = (type: MatchType) => {
    setMatchTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const combinations = (() => {
    const parsed = lists.map(l => l.split('\n').map(k => k.trim()).filter(Boolean));
    if (parsed.every(l => l.length === 0)) return [];

    const combine = (arrays: string[][]): string[] => {
      const nonEmpty = arrays.filter(a => a.length > 0);
      if (nonEmpty.length === 0) return [];
      if (nonEmpty.length === 1) return nonEmpty[0];
      
      return nonEmpty.reduce((acc, curr) => 
        acc.flatMap(a => curr.map(c => `${a} ${c}`))
      );
    };

    const raw = combine(parsed);
    const results: string[] = [];
    
    raw.forEach(keyword => {
      if (matchTypes.includes('broad')) results.push(keyword);
      if (matchTypes.includes('phrase')) results.push(`"${keyword}"`);
      if (matchTypes.includes('exact')) results.push(`[${keyword}]`);
    });

    return results;
  })();

  const addList = () => setLists(prev => [...prev, '']);
  const removeList = (i: number) => setLists(prev => prev.filter((_, idx) => idx !== i));
  const updateList = (i: number, val: string) => setLists(prev => prev.map((l, idx) => idx === i ? val : l));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Keyword Combiner</h1>
          <p className="text-sm text-muted-foreground">Combine keyword lists into combinations</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setLists(['', '', ''])} className="h-8 text-xs self-start sm:self-auto">
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
        </Button>
      </div>

      {/* Match Types */}
      <div className="flex flex-wrap gap-3 sm:gap-4">
        {(['broad', 'phrase', 'exact'] as MatchType[]).map(type => (
          <label key={type} className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox checked={matchTypes.includes(type)} onCheckedChange={() => toggleMatchType(type)} />
            <span className="capitalize">{type}</span>
          </label>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input Lists */}
        <div className="space-y-3">
          {lists.map((list, i) => (
            <Card key={i}>
              <CardHeader className="p-3 sm:py-3 flex-row items-center justify-between">
                <CardTitle className="text-xs sm:text-sm">List {i + 1}</CardTitle>
                {lists.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeList(i)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <Textarea
                  placeholder="Enter keywords, one per line"
                  value={list}
                  onChange={(e) => updateList(i, e.target.value)}
                  rows={4}
                  className="text-sm"
                />
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" size="sm" onClick={addList} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add List
          </Button>
        </div>

        {/* Results */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="p-3 sm:py-3 flex-row items-center justify-between gap-2">
            <CardTitle className="text-xs sm:text-sm">Results ({combinations.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copy(combinations.join('\n'))} className="h-7 text-xs">
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">Export</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportTxt(combinations, 'keywords')}>TXT</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportCsv(combinations.map(k => [k]), 'keywords')}>CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <Textarea value={combinations.join('\n')} readOnly rows={12} className="font-mono text-xs sm:text-sm" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

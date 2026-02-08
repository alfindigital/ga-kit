import { useState } from 'react';
import { GitCompareArrows, TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROASScenario } from '@/hooks/useROASScenarios';

interface ScenarioCompareProps {
  scenarios: ROASScenario[];
}

interface MetricRow {
  label: string;
  group: string;
  valueA: number | null;
  valueB: number | null;
  format: 'currency' | 'percent' | 'number';
}

function computeMetrics(data: ROASScenario['data']): MetricRow[] {
  const rows: MetricRow[] = [];
  const spend = parseFloat(data.roasAdSpend) || 0;
  const revenue = parseFloat(data.roasRevenue) || 0;

  if (spend > 0 && revenue > 0) {
    const roas = revenue / spend;
    const profit = revenue - spend;
    const roi = ((revenue - spend) / spend) * 100;
    rows.push(
      { label: 'Ad Spend', group: 'ROAS', valueA: spend, valueB: null, format: 'currency' },
      { label: 'Revenue', group: 'ROAS', valueA: revenue, valueB: null, format: 'currency' },
      { label: 'ROAS', group: 'ROAS', valueA: roas, valueB: null, format: 'number' },
      { label: 'Profit/Loss', group: 'ROAS', valueA: profit, valueB: null, format: 'currency' },
      { label: 'ROI', group: 'ROAS', valueA: roi, valueB: null, format: 'percent' },
    );
  }

  const target = parseFloat(data.targetRevenue) || 0;
  const expROAS = parseFloat(data.expectedROAS) || 0;
  if (target > 0 && expROAS > 0) {
    const reqBudget = target / expROAS;
    rows.push(
      { label: 'Target Revenue', group: 'Budget', valueA: target, valueB: null, format: 'currency' },
      { label: 'Expected ROAS', group: 'Budget', valueA: expROAS, valueB: null, format: 'number' },
      { label: 'Required Budget', group: 'Budget', valueA: reqBudget, valueB: null, format: 'currency' },
    );
  }

  const aov = parseFloat(data.aov) || 0;
  const margin = parseFloat(data.profitMargin) || 0;
  const tgtProfit = parseFloat(data.targetProfit) || 0;
  if (aov > 0 && margin > 0) {
    const grossProfit = aov * (margin / 100);
    const maxCPA = grossProfit * (1 - tgtProfit / 100);
    rows.push(
      { label: 'AOV', group: 'CPA', valueA: aov, valueB: null, format: 'currency' },
      { label: 'Break-even CPA', group: 'CPA', valueA: grossProfit, valueB: null, format: 'currency' },
      { label: `Max CPA (${tgtProfit}% profit)`, group: 'CPA', valueA: maxCPA, valueB: null, format: 'currency' },
    );
  }

  const budget = parseFloat(data.monthlyBudget) || 0;
  const cpc = parseFloat(data.avgCPC) || 0;
  const cvr = parseFloat(data.conversionRate) || 0;
  const orderVal = parseFloat(data.avgOrderValue) || 0;
  if (budget > 0 && cpc > 0 && cvr > 0 && orderVal > 0) {
    const clicks = budget / cpc;
    const conversions = clicks * (cvr / 100);
    const rev = conversions * orderVal;
    const advROAS = rev / budget;
    rows.push(
      { label: 'Monthly Budget', group: 'Advanced', valueA: budget, valueB: null, format: 'currency' },
      { label: 'Est. Clicks', group: 'Advanced', valueA: clicks, valueB: null, format: 'number' },
      { label: 'Est. Conversions', group: 'Advanced', valueA: conversions, valueB: null, format: 'number' },
      { label: 'Est. Revenue', group: 'Advanced', valueA: rev, valueB: null, format: 'currency' },
      { label: 'Est. ROAS', group: 'Advanced', valueA: advROAS, valueB: null, format: 'number' },
    );
  }

  return rows;
}

function formatValue(value: number | null, format: 'currency' | 'percent' | 'number'): string {
  if (value === null) return '—';
  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
  if (format === 'percent') {
    return `${value.toFixed(1)}%`;
  }
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

function DiffBadge({ a, b, format }: { a: number | null; b: number | null; format: 'currency' | 'percent' | 'number' }) {
  if (a === null || b === null) return null;
  const diff = a - b;
  if (Math.abs(diff) < 0.01) {
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <Minus className="h-3 w-3" /> Same
      </Badge>
    );
  }
  const pctDiff = b !== 0 ? ((diff / Math.abs(b)) * 100) : 0;
  const isPositive = diff > 0;
  return (
    <Badge variant={isPositive ? 'default' : 'destructive'} className="text-xs gap-1">
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{format === 'percent' ? `${diff.toFixed(1)}pp` : format === 'currency' ? formatValue(diff, 'currency') : diff.toFixed(2)}
      {b !== 0 && <span className="opacity-70">({isPositive ? '+' : ''}{pctDiff.toFixed(1)}%)</span>}
    </Badge>
  );
}

export function ScenarioCompare({ scenarios }: ScenarioCompareProps) {
  const [open, setOpen] = useState(false);
  const [scenarioA, setScenarioA] = useState<string>('');
  const [scenarioB, setScenarioB] = useState<string>('');

  const scA = scenarios.find(s => s.id === scenarioA);
  const scB = scenarios.find(s => s.id === scenarioB);

  // Merge metrics from both scenarios
  const comparisonRows = (() => {
    if (!scA || !scB) return [];
    const metricsA = computeMetrics(scA.data);
    const metricsB = computeMetrics(scB.data);

    // Union of all labels
    const allLabels = new Map<string, MetricRow>();
    for (const m of metricsA) {
      allLabels.set(m.label, { ...m });
    }
    for (const m of metricsB) {
      if (allLabels.has(m.label)) {
        allLabels.get(m.label)!.valueB = m.valueA;
      } else {
        allLabels.set(m.label, { ...m, valueB: m.valueA, valueA: null });
      }
    }
    return Array.from(allLabels.values());
  })();

  // Group rows
  const groups = comparisonRows.reduce<Record<string, MetricRow[]>>((acc, row) => {
    (acc[row.group] ??= []).push(row);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={scenarios.length < 2}>
          <GitCompareArrows className="h-4 w-4 mr-1" />
          Compare
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-primary" />
            Compare Scenarios
          </DialogTitle>
          <DialogDescription>
            Select two scenarios to compare side-by-side
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Scenario A</label>
            <Select value={scenarioA} onValueChange={setScenarioA}>
              <SelectTrigger>
                <SelectValue placeholder="Select scenario..." />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map(s => (
                  <SelectItem key={s.id} value={s.id} disabled={s.id === scenarioB}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Scenario B</label>
            <Select value={scenarioB} onValueChange={setScenarioB}>
              <SelectTrigger>
                <SelectValue placeholder="Select scenario..." />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map(s => (
                  <SelectItem key={s.id} value={s.id} disabled={s.id === scenarioA}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {scA && scB ? (
          <div className="overflow-y-auto flex-1 -mx-6 px-6 pb-2">
            {Object.entries(groups).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No comparable data found between these scenarios.</p>
                <p className="text-sm">Both scenarios need data in the same calculators.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groups).map(([group, rows]) => (
                  <div key={group}>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">{group}</h4>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left p-2 font-medium text-muted-foreground">Metric</th>
                            <th className="text-right p-2 font-medium text-primary">{scA.name}</th>
                            <th className="text-right p-2 font-medium text-primary">{scB.name}</th>
                            <th className="text-right p-2 font-medium text-muted-foreground">Diff</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, i) => (
                            <tr key={row.label} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/20')}>
                              <td className="p-2 font-medium">{row.label}</td>
                              <td className="p-2 text-right tabular-nums">{formatValue(row.valueA, row.format)}</td>
                              <td className="p-2 text-right tabular-nums">{formatValue(row.valueB, row.format)}</td>
                              <td className="p-2 text-right">
                                <DiffBadge a={row.valueA} b={row.valueB} format={row.format} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <GitCompareArrows className="h-12 w-12 mb-4 opacity-50" />
            <p>Select two scenarios above to compare</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

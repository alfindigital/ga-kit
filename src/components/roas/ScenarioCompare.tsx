import { useState } from 'react';
import { GitCompareArrows, TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROASScenario } from '@/hooks/useROASScenarios';
import { useTranslation } from '@/hooks/useTranslation';

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

function formatValue(value: number | null, format: 'currency' | 'percent' | 'number'): string {
  if (value === null) return '—';
  if (format === 'currency') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  if (format === 'percent') return `${value.toFixed(1)}%`;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

function DiffBadge({ a, b, format, sameLabel }: { a: number | null; b: number | null; format: 'currency' | 'percent' | 'number'; sameLabel: string }) {
  if (a === null || b === null) return null;
  const diff = a - b;
  if (Math.abs(diff) < 0.01) {
    return (<Badge variant="secondary" className="text-xs gap-1"><Minus className="h-3 w-3" /> {sameLabel}</Badge>);
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
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [scenarioA, setScenarioA] = useState<string>('');
  const [scenarioB, setScenarioB] = useState<string>('');

  const scA = scenarios.find(s => s.id === scenarioA);
  const scB = scenarios.find(s => s.id === scenarioB);

  function computeMetrics(data: ROASScenario['data']): MetricRow[] {
    const rows: MetricRow[] = [];
    const spend = parseFloat(data.roasAdSpend) || 0;
    const revenue = parseFloat(data.roasRevenue) || 0;
    if (spend > 0 && revenue > 0) {
      const roas = revenue / spend;
      const profit = revenue - spend;
      const roi = ((revenue - spend) / spend) * 100;
      rows.push(
        { label: t('compare.adSpend'), group: 'ROAS', valueA: spend, valueB: null, format: 'currency' },
        { label: t('compare.revenue'), group: 'ROAS', valueA: revenue, valueB: null, format: 'currency' },
        { label: 'ROAS', group: 'ROAS', valueA: roas, valueB: null, format: 'number' },
        { label: t('compare.profitLoss'), group: 'ROAS', valueA: profit, valueB: null, format: 'currency' },
        { label: 'ROI', group: 'ROAS', valueA: roi, valueB: null, format: 'percent' },
      );
    }
    const target = parseFloat(data.targetRevenue) || 0;
    const expROAS = parseFloat(data.expectedROAS) || 0;
    if (target > 0 && expROAS > 0) {
      rows.push(
        { label: t('compare.targetRevenue'), group: 'Budget', valueA: target, valueB: null, format: 'currency' },
        { label: t('compare.expectedRoas'), group: 'Budget', valueA: expROAS, valueB: null, format: 'number' },
        { label: t('compare.requiredBudget'), group: 'Budget', valueA: target / expROAS, valueB: null, format: 'currency' },
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
        { label: t('compare.breakEvenCpa'), group: 'CPA', valueA: grossProfit, valueB: null, format: 'currency' },
        { label: t('compare.maxCpa', { percent: tgtProfit }), group: 'CPA', valueA: maxCPA, valueB: null, format: 'currency' },
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
        { label: t('compare.monthlyBudget'), group: 'Advanced', valueA: budget, valueB: null, format: 'currency' },
        { label: t('compare.estClicks'), group: 'Advanced', valueA: clicks, valueB: null, format: 'number' },
        { label: t('compare.estConversions'), group: 'Advanced', valueA: conversions, valueB: null, format: 'number' },
        { label: t('compare.estRevenue'), group: 'Advanced', valueA: rev, valueB: null, format: 'currency' },
        { label: t('compare.estRoas'), group: 'Advanced', valueA: advROAS, valueB: null, format: 'number' },
      );
    }
    return rows;
  }

  const comparisonRows = (() => {
    if (!scA || !scB) return [];
    const metricsA = computeMetrics(scA.data);
    const metricsB = computeMetrics(scB.data);
    const allLabels = new Map<string, MetricRow>();
    for (const m of metricsA) allLabels.set(m.label, { ...m });
    for (const m of metricsB) {
      if (allLabels.has(m.label)) allLabels.get(m.label)!.valueB = m.valueA;
      else allLabels.set(m.label, { ...m, valueB: m.valueA, valueA: null });
    }
    return Array.from(allLabels.values());
  })();

  const groups = comparisonRows.reduce<Record<string, MetricRow[]>>((acc, row) => {
    (acc[row.group] ??= []).push(row);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={scenarios.length < 2}>
          <GitCompareArrows className="h-4 w-4 mr-1" />
          {t('compare.compare')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-primary" />
            {t('compare.title')}
          </DialogTitle>
          <DialogDescription>{t('compare.desc')}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{t('compare.scenarioA')}</label>
            <Select value={scenarioA} onValueChange={setScenarioA}>
              <SelectTrigger><SelectValue placeholder={t('compare.selectPlaceholder')} /></SelectTrigger>
              <SelectContent>
                {scenarios.map(s => (<SelectItem key={s.id} value={s.id} disabled={s.id === scenarioB}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{t('compare.scenarioB')}</label>
            <Select value={scenarioB} onValueChange={setScenarioB}>
              <SelectTrigger><SelectValue placeholder={t('compare.selectPlaceholder')} /></SelectTrigger>
              <SelectContent>
                {scenarios.map(s => (<SelectItem key={s.id} value={s.id} disabled={s.id === scenarioA}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {scA && scB ? (
          <div className="overflow-y-auto flex-1 -mx-6 px-6 pb-2">
            {Object.entries(groups).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('compare.noData')}</p>
                <p className="text-sm">{t('compare.noDataHint')}</p>
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
                            <th className="text-left p-2 font-medium text-muted-foreground">{t('compare.metric')}</th>
                            <th className="text-right p-2 font-medium text-primary">{scA.name}</th>
                            <th className="text-right p-2 font-medium text-primary">{scB.name}</th>
                            <th className="text-right p-2 font-medium text-muted-foreground">{t('compare.diff')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, i) => (
                            <tr key={row.label} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-muted/20')}>
                              <td className="p-2 font-medium">{row.label}</td>
                              <td className="p-2 text-right tabular-nums">{formatValue(row.valueA, row.format)}</td>
                              <td className="p-2 text-right tabular-nums">{formatValue(row.valueB, row.format)}</td>
                              <td className="p-2 text-right"><DiffBadge a={row.valueA} b={row.valueB} format={row.format} sameLabel={t('compare.same')} /></td>
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
            <p>{t('compare.selectTwo')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Calculator, DollarSign, TrendingUp, Target, Percent, AlertCircle, CheckCircle2, Info, RotateCcw } from 'lucide-react';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { usePageLoading } from '@/hooks/usePageLoading';
import { ROASCalculatorSkeleton } from '@/components/skeletons';
import { useROASScenarios, ROASScenarioData } from '@/hooks/useROASScenarios';
import { ScenarioManager } from '@/components/roas/ScenarioManager';
import { ScenarioCompare } from '@/components/roas/ScenarioCompare';
import { ScenarioExport } from '@/components/roas/ScenarioExport';

interface CalculatorResult {
  value: number | null;
  label: string;
  description: string;
  isPositive?: boolean;
  _format?: 'currency' | 'number' | 'decimal' | 'percent';
}

export default function ROASCalculator() {
  const isLoading = usePageLoading(400);
  const { t } = useTranslation();
  
  // Scenario management
  const {
    scenarios,
    currentScenarioId,
    currentScenario,
    saveScenario,
    updateScenario,
    deleteScenario,
    loadScenario,
    duplicateScenario,
    renameScenario,
    clearCurrentScenario,
    importScenarios,
  } = useROASScenarios();

  // ROAS Calculator state
  const [roasAdSpend, setRoasAdSpend] = useState('');
  const [roasRevenue, setRoasRevenue] = useState('');

  // Budget Estimator state
  const [targetRevenue, setTargetRevenue] = useState('');
  const [expectedROAS, setExpectedROAS] = useState('');

  // Break-even CPA state
  const [aov, setAOV] = useState('');
  const [profitMargin, setProfitMargin] = useState('');
  const [targetProfit, setTargetProfit] = useState('20');

  // Advanced Calculator state
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [avgCPC, setAvgCPC] = useState('');
  const [conversionRate, setConversionRate] = useState('');
  const [avgOrderValue, setAvgOrderValue] = useState('');

  // Current data for scenario management
  const currentData: ROASScenarioData = useMemo(() => ({
    roasAdSpend,
    roasRevenue,
    targetRevenue,
    expectedROAS,
    aov,
    profitMargin,
    targetProfit,
    monthlyBudget,
    avgCPC,
    conversionRate,
    avgOrderValue,
  }), [roasAdSpend, roasRevenue, targetRevenue, expectedROAS, aov, profitMargin, targetProfit, monthlyBudget, avgCPC, conversionRate, avgOrderValue]);

  // Ref to always have latest data for cleanup effects
  const currentDataRef = useRef(currentData);
  const currentScenarioIdRef = useRef(currentScenarioId);
  useEffect(() => { currentDataRef.current = currentData; }, [currentData]);
  useEffect(() => { currentScenarioIdRef.current = currentScenarioId; }, [currentScenarioId]);

  const hasAnyData = useCallback((data: ROASScenarioData) => {
    return Object.entries(data).some(([k, v]) => v !== '' && !(k === 'targetProfit' && v === '20'));
  }, []);

  // Auto-save draft to localStorage on unmount / beforeunload
  const DRAFT_KEY = 'roas-calculator-draft';

  const saveDraft = useCallback(() => {
    const data = currentDataRef.current;
    if (hasAnyData(data)) {
      const draft = {
        data,
        scenarioId: currentScenarioIdRef.current,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [hasAnyData]);

  // Save on browser close / tab switch
  useEffect(() => {
    const handleBeforeUnload = () => saveDraft();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveDraft();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      // Save on route change (component unmount)
      saveDraft();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveDraft]);

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      // Only restore if saved within last 24 hours
      const savedAt = new Date(draft.savedAt).getTime();
      if (Date.now() - savedAt > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }
      const d = draft.data as ROASScenarioData;
      if (d) {
        setRoasAdSpend(d.roasAdSpend || '');
        setRoasRevenue(d.roasRevenue || '');
        setTargetRevenue(d.targetRevenue || '');
        setExpectedROAS(d.expectedROAS || '');
        setAOV(d.aov || '');
        setProfitMargin(d.profitMargin || '');
        setTargetProfit(d.targetProfit || '20');
        setMonthlyBudget(d.monthlyBudget || '');
        setAvgCPC(d.avgCPC || '');
        setConversionRate(d.conversionRate || '');
        setAvgOrderValue(d.avgOrderValue || '');
      }
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }, []);

  // Load scenario data into form
  const handleLoadScenario = useCallback((id: string) => {
    const scenario = loadScenario(id);
    if (scenario) {
      setRoasAdSpend(scenario.data.roasAdSpend);
      setRoasRevenue(scenario.data.roasRevenue);
      setTargetRevenue(scenario.data.targetRevenue);
      setExpectedROAS(scenario.data.expectedROAS);
      setAOV(scenario.data.aov);
      setProfitMargin(scenario.data.profitMargin);
      setTargetProfit(scenario.data.targetProfit);
      setMonthlyBudget(scenario.data.monthlyBudget);
      setAvgCPC(scenario.data.avgCPC);
      setConversionRate(scenario.data.conversionRate);
      setAvgOrderValue(scenario.data.avgOrderValue);
    }
    return scenario;
  }, [loadScenario]);

  // ROAS Calculation
  const roasResult = useMemo((): CalculatorResult[] => {
    const spend = parseFloat(roasAdSpend) || 0;
    const revenue = parseFloat(roasRevenue) || 0;

    if (spend <= 0 || revenue <= 0) {
      return [];
    }

    const roas = revenue / spend;
    const roasPercent = roas * 100;
    const profit = revenue - spend;
    const roi = ((revenue - spend) / spend) * 100;

    return [
      {
        value: roas,
        label: 'ROAS',
        description: t('roas.roasPerDollar', { value: roas.toFixed(2) }),
        isPositive: roas >= 1,
        _format: 'decimal',
      },
      {
        value: roasPercent,
        label: 'ROAS %',
        description: t('roas.roasPercentReturn', { value: roasPercent.toFixed(0) }),
        isPositive: roasPercent >= 100,
        _format: 'percent',
      },
      {
        value: profit,
        label: t('roas.profitLoss'),
        description: profit >= 0 ? t('roas.profitLossDescPositive') : t('roas.profitLossDescNegative'),
        isPositive: profit >= 0,
        _format: 'currency',
      },
      {
        value: roi,
        label: t('roas.roiPercent'),
        description: t('roas.roiDesc'),
        isPositive: roi >= 0,
        _format: 'percent',
      },
    ];
  }, [roasAdSpend, roasRevenue, t]);

  // Budget Estimation
  const budgetResult = useMemo((): CalculatorResult[] => {
    const target = parseFloat(targetRevenue) || 0;
    const roas = parseFloat(expectedROAS) || 0;

    if (target <= 0 || roas <= 0) {
      return [];
    }

    const requiredBudget = target / roas;
    const dailyBudget = requiredBudget / 30;
    const weeklyBudget = requiredBudget / 4;

    return [
      {
        value: requiredBudget,
        label: t('roas.monthlyBudgetLabel'),
        description: t('roas.monthlyBudgetDesc'),
        isPositive: true,
      },
      {
        value: weeklyBudget,
        label: t('roas.weeklyBudget'),
        description: t('roas.weeklyBudgetDesc'),
        isPositive: true,
      },
      {
        value: dailyBudget,
        label: t('roas.dailyBudget'),
        description: t('roas.dailyBudgetDesc'),
        isPositive: true,
      },
    ];
  }, [targetRevenue, expectedROAS, t]);

  // Break-even CPA Calculation
  const cpaResult = useMemo((): CalculatorResult[] => {
    const orderValue = parseFloat(aov) || 0;
    const margin = parseFloat(profitMargin) || 0;
    const targetProfitPercent = parseFloat(targetProfit) || 0;

    if (orderValue <= 0 || margin <= 0) {
      return [];
    }

    const grossProfit = orderValue * (margin / 100);
    const breakEvenCPA = grossProfit;
    const maxCPAForProfit = grossProfit * (1 - targetProfitPercent / 100);
    const profitPerSale = grossProfit - maxCPAForProfit;

    return [
      {
        value: breakEvenCPA,
        label: t('roas.breakEvenCpaLabel'),
        description: t('roas.breakEvenCpaDesc'),
        isPositive: true,
      },
      {
        value: maxCPAForProfit,
        label: t('roas.maxCpaProfit', { percent: targetProfitPercent }),
        description: t('roas.maxCpaProfitDesc', { percent: targetProfitPercent }),
        isPositive: true,
      },
      {
        value: profitPerSale,
        label: t('roas.targetProfitSale'),
        description: t('roas.targetProfitSaleDesc'),
        isPositive: true,
      },
      {
        value: grossProfit,
        label: t('roas.grossProfitSale'),
        description: t('roas.grossProfitSaleDesc'),
        isPositive: true,
      },
    ];
  }, [aov, profitMargin, targetProfit, t]);

  // Advanced Calculator
  const advancedResult = useMemo((): CalculatorResult[] => {
    const budget = parseFloat(monthlyBudget) || 0;
    const cpc = parseFloat(avgCPC) || 0;
    const cvr = parseFloat(conversionRate) || 0;
    const orderValue = parseFloat(avgOrderValue) || 0;

    if (budget <= 0 || cpc <= 0 || cvr <= 0 || orderValue <= 0) {
      return [];
    }

    const clicks = budget / cpc;
    const conversions = clicks * (cvr / 100);
    const revenue = conversions * orderValue;
    const roas = revenue / budget;
    const cpa = budget / conversions;
    const profit = revenue - budget;

    return [
      {
        value: clicks,
        label: t('roas.estClicks'),
        description: t('roas.estClicksDesc'),
        isPositive: true,
        _format: 'number',
      },
      {
        value: conversions,
        label: t('roas.estConversions'),
        description: t('roas.estConversionsDesc'),
        isPositive: true,
        _format: 'number',
      },
      {
        value: revenue,
        label: t('roas.estRevenue'),
        description: t('roas.estRevenueDesc'),
        isPositive: true,
        _format: 'currency',
      },
      {
        value: cpa,
        label: t('roas.estCpa'),
        description: t('roas.estCpaDesc'),
        isPositive: true,
        _format: 'currency',
      },
      {
        value: roas,
        label: t('roas.estRoas'),
        description: t('roas.estRoasDesc'),
        isPositive: roas >= 1,
        _format: 'decimal',
      },
      {
        value: profit,
        label: t('roas.estProfit'),
        description: t('roas.estProfitDesc'),
        isPositive: profit >= 0,
        _format: 'currency',
      },
    ];
  }, [monthlyBudget, avgCPC, conversionRate, avgOrderValue, t]);

  const resetAll = () => {
    setRoasAdSpend('');
    setRoasRevenue('');
    setTargetRevenue('');
    setExpectedROAS('');
    setAOV('');
    setProfitMargin('');
    setTargetProfit('20');
    setMonthlyBudget('');
    setAvgCPC('');
    setConversionRate('');
    setAvgOrderValue('');
    clearCurrentScenario();
    localStorage.removeItem(DRAFT_KEY);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  if (isLoading) return <ROASCalculatorSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <ToolPageHeader
        icon={Calculator}
        title={t('roas.title')}
        description={t('roas.desc')}
        iconColor="bg-accent/10 text-accent"
        accentGradient="from-accent to-accent/40"
      >
        {currentScenario && (
          <Badge variant="outline">
            {t('roas.editing', { name: currentScenario.name })}
          </Badge>
        )}
        <ScenarioManager
          scenarios={scenarios}
          currentScenarioId={currentScenarioId}
          currentData={currentData}
          onSave={saveScenario}
          onLoad={handleLoadScenario}
          onDelete={deleteScenario}
          onDuplicate={duplicateScenario}
          onRename={renameScenario}
          onUpdate={updateScenario}
        />
        <ScenarioCompare scenarios={scenarios} />
        <ScenarioExport scenarios={scenarios} onImport={importScenarios} />
        <Button variant="outline" size="sm" onClick={resetAll}>
          <RotateCcw className="h-4 w-4 mr-1" />
          {t('roas.resetAll')}
        </Button>
      </ToolPageHeader>

      <Tabs defaultValue="roas" className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full">
          <TabsTrigger value="roas" className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">ROAS</span>
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">{t('roas.budget')}</span>
          </TabsTrigger>
          <TabsTrigger value="cpa" className="flex items-center gap-1.5">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">{t('roas.breakEvenCpa')}</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1.5">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">{t('roas.advanced')}</span>
          </TabsTrigger>
        </TabsList>

        {/* ROAS Calculator */}
        <TabsContent value="roas" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                   {t('roas.calculator')}
                </CardTitle>
                <CardDescription>
                  {t('roas.calculatorDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adSpend" className="flex items-center gap-2">
                    {t('roas.adSpend')}
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('roas.totalSpent')}
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="adSpend"
                    type="number"
                    placeholder={t('roas.egAdSpend')}
                    value={roasAdSpend}
                    onChange={(e) => setRoasAdSpend(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenue" className="flex items-center gap-2">
                    {t('roas.revenue')}
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('roas.totalRevenue')}
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="revenue"
                    type="number"
                    placeholder={t('roas.egRevenue')}
                    value={roasRevenue}
                    onChange={(e) => setRoasRevenue(e.target.value)}
                  />
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t('roas.roasInfo')}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('roas.results')}</CardTitle>
                <CardDescription>{t('roas.resultsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {roasResult.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Calculator className="h-12 w-12 mb-4 opacity-50" />
                    <p>{t('roas.enterAdSpendRevenue')}</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {roasResult.map((result, index) => (
                      <div
                        key={result.label}
                        className={cn(
                          "p-4 rounded-lg border bg-card",
                          result.isPositive ? "border-primary/20" : "border-destructive/20"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-muted-foreground">
                            {result.label}
                          </span>
                          <Badge variant={result.isPositive ? "default" : "destructive"}>
                            {result.isPositive ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            {result.isPositive ? t('roas.good') : t('roas.warning')}
                          </Badge>
                        </div>
                        <div className={cn(
                          "text-2xl font-bold",
                          result.isPositive ? "text-primary" : "text-destructive"
                        )}>
                          {result._format === 'currency'
                            ? formatCurrency(result.value!)
                            : result._format === 'percent'
                            ? `${formatNumber(result.value!)}%`
                            : formatNumber(result.value!)
                          }
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Budget Estimator */}
        <TabsContent value="budget" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  {t('roas.budgetEstimator')}
                </CardTitle>
                <CardDescription>
                  {t('roas.budgetEstimatorDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="targetRevenue" className="flex items-center gap-2">
                    {t('roas.targetMonthlyRevenue')}
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('roas.desiredMonthlyRevenue')}
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="targetRevenue"
                    type="number"
                    placeholder={t('roas.egTargetRevenue')}
                    value={targetRevenue}
                    onChange={(e) => setTargetRevenue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedROAS" className="flex items-center gap-2">
                    {t('roas.expectedRoas')}
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('roas.expectedRoasTooltip')}
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="expectedROAS"
                    type="number"
                    step="0.1"
                    placeholder={t('roas.egExpectedRoas')}
                    value={expectedROAS}
                    onChange={(e) => setExpectedROAS(e.target.value)}
                  />
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t('roas.budgetInfo')}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('roas.budgetRequirements')}</CardTitle>
                <CardDescription>{t('roas.estimatedBudgetNeeded')}</CardDescription>
              </CardHeader>
              <CardContent>
                {budgetResult.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <DollarSign className="h-12 w-12 mb-4 opacity-50" />
                    <p>{t('roas.enterTargetRevenue')}</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {budgetResult.map((result) => (
                      <div
                        key={result.label}
                        className="p-4 rounded-lg border bg-card border-primary/20"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-muted-foreground">
                            {result.label}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(result.value!)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Break-even CPA */}
        <TabsContent value="cpa" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  {t('roas.cpaCalculator')}
                </CardTitle>
                <CardDescription>
                  {t('roas.cpaCalculatorDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aov" className="flex items-center gap-2">
                    {t('roas.aov')}
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('roas.aovTooltip')}
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="aov"
                    type="number"
                    placeholder={t('roas.egAov')}
                    value={aov}
                    onChange={(e) => setAOV(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profitMargin" className="flex items-center gap-2">
                    {t('roas.profitMargin')}
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('roas.profitMarginTooltip')}
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="profitMargin"
                    type="number"
                    placeholder={t('roas.egMargin')}
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetProfit" className="flex items-center gap-2">
                    {t('roas.targetProfitMargin')}
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('roas.targetProfitTooltip')}
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="targetProfit"
                    type="number"
                    placeholder={t('roas.egTargetProfit')}
                    value={targetProfit}
                    onChange={(e) => setTargetProfit(e.target.value)}
                  />
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t('roas.cpaInfo')}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('roas.cpaThresholds')}</CardTitle>
                <CardDescription>{t('roas.cpaThresholdsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {cpaResult.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Target className="h-12 w-12 mb-4 opacity-50" />
                    <p>{t('roas.enterAovMargin')}</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {cpaResult.map((result) => (
                      <div
                        key={result.label}
                        className="p-4 rounded-lg border bg-card border-primary/20"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-muted-foreground">
                            {result.label}
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(result.value!)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Calculator */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  {t('roas.advancedEstimator')}
                </CardTitle>
                <CardDescription>
                  {t('roas.advancedEstimatorDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyBudget" className="flex items-center gap-2">
                      {t('roas.monthlyBudget')}
                    </Label>
                    <Input
                      id="monthlyBudget"
                      type="number"
                      placeholder="e.g., 5000"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avgCPC" className="flex items-center gap-2">
                      {t('roas.avgCpc')}
                    </Label>
                    <Input
                      id="avgCPC"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 2.50"
                      value={avgCPC}
                      onChange={(e) => setAvgCPC(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="conversionRate" className="flex items-center gap-2">
                      {t('roas.conversionRate')}
                    </Label>
                    <Input
                      id="conversionRate"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 3"
                      value={conversionRate}
                      onChange={(e) => setConversionRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avgOrderValue" className="flex items-center gap-2">
                      {t('roas.avgOrderValue')}
                    </Label>
                    <Input
                      id="avgOrderValue"
                      type="number"
                      placeholder="e.g., 150"
                      value={avgOrderValue}
                      onChange={(e) => setAvgOrderValue(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t('roas.advancedInfo')}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('roas.campaignForecast')}</CardTitle>
                <CardDescription>{t('roas.campaignForecastDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {advancedResult.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Calculator className="h-12 w-12 mb-4 opacity-50" />
                    <p>{t('roas.fillAllFields')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {advancedResult.map((result) => (
                      <div
                        key={result.label}
                        className={cn(
                          "p-3 rounded-lg border bg-card",
                          result.isPositive ? "border-primary/20" : "border-destructive/20"
                        )}
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {result.label}
                        </span>
                        <div className={cn(
                          "text-lg font-bold",
                          result.isPositive ? "text-primary" : "text-destructive"
                        )}>
                          {result._format === 'currency'
                            ? formatCurrency(result.value!)
                            : result._format === 'decimal'
                            ? formatNumber(result.value!)
                            : formatNumber(result.value!, 0)
                          }
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {result.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

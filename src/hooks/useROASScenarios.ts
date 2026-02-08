import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { toast } from '@/hooks/use-toast';

export interface ROASScenario {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: {
    // ROAS Calculator
    roasAdSpend: string;
    roasRevenue: string;
    // Budget Estimator
    targetRevenue: string;
    expectedROAS: string;
    // Break-even CPA
    aov: string;
    profitMargin: string;
    targetProfit: string;
    // Advanced Calculator
    monthlyBudget: string;
    avgCPC: string;
    conversionRate: string;
    avgOrderValue: string;
  };
}

export interface ROASScenarioData {
  roasAdSpend: string;
  roasRevenue: string;
  targetRevenue: string;
  expectedROAS: string;
  aov: string;
  profitMargin: string;
  targetProfit: string;
  monthlyBudget: string;
  avgCPC: string;
  conversionRate: string;
  avgOrderValue: string;
}

const generateId = () => `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function useROASScenarios() {
  const [scenarios, setScenarios] = useLocalStorage<ROASScenario[]>('roas-scenarios', []);
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(null);

  const saveScenario = useCallback((name: string, data: ROASScenarioData): ROASScenario => {
    const now = new Date().toISOString();
    const newScenario: ROASScenario = {
      id: generateId(),
      name: name.trim() || `Scenario ${scenarios.length + 1}`,
      createdAt: now,
      updatedAt: now,
      data,
    };

    setScenarios(prev => [...prev, newScenario]);
    setCurrentScenarioId(newScenario.id);

    toast({
      title: 'Scenario saved',
      description: `"${newScenario.name}" has been saved successfully.`,
    });

    return newScenario;
  }, [scenarios.length, setScenarios]);

  const updateScenario = useCallback((id: string, data: Partial<Pick<ROASScenario, 'name' | 'data'>>) => {
    setScenarios(prev => prev.map(scenario => {
      if (scenario.id === id) {
        return {
          ...scenario,
          ...data,
          updatedAt: new Date().toISOString(),
        };
      }
      return scenario;
    }));

    toast({
      title: 'Scenario updated',
      description: 'Changes have been saved.',
    });
  }, [setScenarios]);

  const deleteScenario = useCallback((id: string) => {
    const scenario = scenarios.find(s => s.id === id);
    setScenarios(prev => prev.filter(s => s.id !== id));
    
    if (currentScenarioId === id) {
      setCurrentScenarioId(null);
    }

    toast({
      title: 'Scenario deleted',
      description: scenario ? `"${scenario.name}" has been deleted.` : 'Scenario deleted.',
    });
  }, [scenarios, currentScenarioId, setScenarios]);

  const loadScenario = useCallback((id: string): ROASScenario | undefined => {
    const scenario = scenarios.find(s => s.id === id);
    if (scenario) {
      setCurrentScenarioId(id);
      toast({
        title: 'Scenario loaded',
        description: `"${scenario.name}" has been loaded.`,
      });
    }
    return scenario;
  }, [scenarios]);

  const duplicateScenario = useCallback((id: string): ROASScenario | undefined => {
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return undefined;

    const now = new Date().toISOString();
    const newScenario: ROASScenario = {
      id: generateId(),
      name: `${scenario.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      data: { ...scenario.data },
    };

    setScenarios(prev => [...prev, newScenario]);
    setCurrentScenarioId(newScenario.id);

    toast({
      title: 'Scenario duplicated',
      description: `"${newScenario.name}" has been created.`,
    });

    return newScenario;
  }, [scenarios, setScenarios]);

  const renameScenario = useCallback((id: string, newName: string) => {
    setScenarios(prev => prev.map(scenario => {
      if (scenario.id === id) {
        return {
          ...scenario,
          name: newName.trim() || scenario.name,
          updatedAt: new Date().toISOString(),
        };
      }
      return scenario;
    }));

    toast({
      title: 'Scenario renamed',
      description: `Renamed to "${newName.trim()}"`,
    });
  }, [setScenarios]);

  const clearCurrentScenario = useCallback(() => {
    setCurrentScenarioId(null);
  }, []);

  const importScenarios = useCallback((items: { name: string; data: ROASScenarioData }[]) => {
    const now = new Date().toISOString();
    const newScenarios: ROASScenario[] = items.map((item) => ({
      id: generateId(),
      name: item.name,
      createdAt: now,
      updatedAt: now,
      data: item.data,
    }));
    setScenarios(prev => [...prev, ...newScenarios]);
  }, [setScenarios]);

  return {
    scenarios,
    currentScenarioId,
    currentScenario: scenarios.find(s => s.id === currentScenarioId),
    saveScenario,
    updateScenario,
    deleteScenario,
    loadScenario,
    duplicateScenario,
    renameScenario,
    clearCurrentScenario,
    importScenarios,
  };
}

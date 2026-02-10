import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  exportToJSON,
  exportToCSV,
  importFromJSON,
  importFromCSV,
  downloadBlob,
  CSV_HEADERS,
} from '../scenarioFileUtils';
import { ROASScenario } from '@/hooks/useROASScenarios';

const mockScenarioData = {
  roasAdSpend: '1000',
  roasRevenue: '5000',
  targetRevenue: '10000',
  expectedROAS: '5',
  aov: '50',
  profitMargin: '30',
  targetProfit: '20',
  monthlyBudget: '3000',
  avgCPC: '1.5',
  conversionRate: '3',
  avgOrderValue: '50',
};

const mockScenario: ROASScenario = {
  id: 'test-1',
  name: 'Test Scenario',
  data: mockScenarioData,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('scenarioFileUtils', () => {
  describe('importFromJSON', () => {
    it('imports scenarios with { scenarios: [...] } format', () => {
      const json = JSON.stringify({
        version: 1,
        scenarios: [{ name: 'S1', data: mockScenarioData }],
      });
      const result = importFromJSON(json);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('S1');
      expect(result[0].data.roasAdSpend).toBe('1000');
    });

    it('imports from a plain array', () => {
      const json = JSON.stringify([{ name: 'A', data: mockScenarioData }]);
      const result = importFromJSON(json);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('A');
    });

    it('imports a single object', () => {
      const json = JSON.stringify({ name: 'Single', data: mockScenarioData });
      const result = importFromJSON(json);
      expect(result).toHaveLength(1);
    });

    it('skips entries without data object', () => {
      const json = JSON.stringify({ scenarios: [{ name: 'Bad' }, { name: 'Good', data: mockScenarioData }] });
      const result = importFromJSON(json);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Good');
    });

    it('defaults name to "Imported Scenario" when missing', () => {
      const json = JSON.stringify([{ data: mockScenarioData }]);
      const result = importFromJSON(json);
      expect(result[0].name).toBe('Imported Scenario');
    });

    it('throws on invalid JSON', () => {
      expect(() => importFromJSON('not json')).toThrow();
    });
  });

  describe('importFromCSV', () => {
    it('imports valid CSV rows', () => {
      const header = CSV_HEADERS.join(',');
      const row = [
        'My Scenario', '1000', '5000', '10000', '5', '50', '30', '20', '3000', '1.5', '3', '50', '2025-01-01', '2025-01-01',
      ].join(',');
      const csv = `${header}\n${row}`;
      const result = importFromCSV(csv);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('My Scenario');
      expect(result[0].data.roasAdSpend).toBe('1000');
      expect(result[0].data.avgOrderValue).toBe('50');
    });

    it('returns empty for header-only CSV', () => {
      expect(importFromCSV(CSV_HEADERS.join(','))).toHaveLength(0);
    });

    it('returns empty for empty string', () => {
      expect(importFromCSV('')).toHaveLength(0);
    });

    it('skips rows with fewer than 12 columns', () => {
      const csv = `${CSV_HEADERS.join(',')}\nshort,row`;
      expect(importFromCSV(csv)).toHaveLength(0);
    });

    it('strips surrounding quotes from CSV values', () => {
      const header = CSV_HEADERS.join(',');
      const row = [
        '"MyScenario"', '1000', '5000', '10000', '5', '50', '30', '20', '3000', '1.5', '3', '50', '2025-01-01', '2025-01-01',
      ].join(',');
      const csv = `${header}\n${row}`;
      const result = importFromCSV(csv);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('MyScenario');
    });

    it('defaults targetProfit to "20" when empty', () => {
      const header = CSV_HEADERS.join(',');
      const row = ['Name', '100', '200', '300', '4', '50', '30', '', '1000', '1', '2', '40', '', ''].join(',');
      const csv = `${header}\n${row}`;
      const result = importFromCSV(csv);
      expect(result[0].data.targetProfit).toBe('20');
    });
  });

  describe('downloadBlob', () => {
    it('creates and clicks a download link', () => {
      const revokeURL = vi.fn();
      const createURL = vi.fn(() => 'blob:mock');
      vi.stubGlobal('URL', { createObjectURL: createURL, revokeObjectURL: revokeURL });

      const clickSpy = vi.fn();
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        (node as HTMLAnchorElement).click = clickSpy;
        return node;
      });
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

      downloadBlob(new Blob(['test']), 'test.txt');

      expect(createURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeURL).toHaveBeenCalledWith('blob:mock');

      appendSpy.mockRestore();
      removeSpy.mockRestore();
      vi.unstubAllGlobals();
    });
  });
});

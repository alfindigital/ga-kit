import { useRef } from 'react';
import { Download, Upload, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROASScenario, ROASScenarioData } from '@/hooks/useROASScenarios';
import { toast } from '@/hooks/use-toast';

interface ScenarioExportProps {
  scenarios: ROASScenario[];
  onImport: (scenarios: { name: string; data: ROASScenarioData }[]) => void;
}

const CSV_HEADERS = [
  'Name',
  'Ad Spend',
  'Revenue',
  'Target Revenue',
  'Expected ROAS',
  'AOV',
  'Profit Margin',
  'Target Profit',
  'Monthly Budget',
  'Avg CPC',
  'Conversion Rate',
  'Avg Order Value',
  'Created At',
  'Updated At',
] as const;

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ScenarioExport({ scenarios, onImport }: ScenarioExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      scenarios: scenarios.map(({ id, ...rest }) => rest),
    };
    const json = JSON.stringify(exportData, null, 2);
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(json, `roas-scenarios-${date}.json`, 'application/json');

    toast({
      title: 'Exported to JSON',
      description: `${scenarios.length} scenario(s) exported successfully.`,
    });
  };

  const handleExportCSV = () => {
    const rows = scenarios.map((s) => [
      escapeCsv(s.name),
      s.data.roasAdSpend,
      s.data.roasRevenue,
      s.data.targetRevenue,
      s.data.expectedROAS,
      s.data.aov,
      s.data.profitMargin,
      s.data.targetProfit,
      s.data.monthlyBudget,
      s.data.avgCPC,
      s.data.conversionRate,
      s.data.avgOrderValue,
      s.createdAt,
      s.updatedAt,
    ]);

    const csv = [CSV_HEADERS.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(csv, `roas-scenarios-${date}.csv`, 'text/csv');

    toast({
      title: 'Exported to CSV',
      description: `${scenarios.length} scenario(s) exported successfully.`,
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        const items: { name: string; data: ROASScenarioData }[] = [];

        const list = parsed.scenarios || (Array.isArray(parsed) ? parsed : [parsed]);
        for (const s of list) {
          if (s.data && typeof s.data === 'object') {
            items.push({ name: s.name || 'Imported Scenario', data: s.data });
          }
        }

        if (items.length === 0) {
          toast({ title: 'Import failed', description: 'No valid scenarios found in the JSON file.', variant: 'destructive' });
          return;
        }

        onImport(items);
        toast({ title: 'Imported from JSON', description: `${items.length} scenario(s) imported successfully.` });
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n').filter((l) => l.trim());
        if (lines.length < 2) {
          toast({ title: 'Import failed', description: 'CSV file is empty or has no data rows.', variant: 'destructive' });
          return;
        }

        const items: { name: string; data: ROASScenarioData }[] = [];
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length < 12) continue;
          items.push({
            name: cols[0] || `Imported ${i}`,
            data: {
              roasAdSpend: cols[1] || '',
              roasRevenue: cols[2] || '',
              targetRevenue: cols[3] || '',
              expectedROAS: cols[4] || '',
              aov: cols[5] || '',
              profitMargin: cols[6] || '',
              targetProfit: cols[7] || '20',
              monthlyBudget: cols[8] || '',
              avgCPC: cols[9] || '',
              conversionRate: cols[10] || '',
              avgOrderValue: cols[11] || '',
            },
          });
        }

        if (items.length === 0) {
          toast({ title: 'Import failed', description: 'No valid rows found in the CSV file.', variant: 'destructive' });
          return;
        }

        onImport(items);
        toast({ title: 'Imported from CSV', description: `${items.length} scenario(s) imported successfully.` });
      } else {
        toast({ title: 'Unsupported file', description: 'Please upload a .json or .csv file.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Import failed', description: 'Could not parse the file. Please check the format.', variant: 'destructive' });
    } finally {
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleExportJSON}
            disabled={scenarios.length === 0}
          >
            <FileJson className="h-4 w-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleExportCSV}
            disabled={scenarios.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-2" />
            Import from file
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

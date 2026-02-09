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
import {
  exportToJSON,
  exportToCSV,
  exportToExcel,
  importFromJSON,
  importFromCSV,
  importFromExcel,
  ScenarioImportItem,
} from '@/utils/scenarioFileUtils';

interface ScenarioExportProps {
  scenarios: ROASScenario[];
  onImport: (scenarios: ScenarioImportItem[]) => void;
}

export function ScenarioExport({ scenarios, onImport }: ScenarioExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasScenarios = scenarios.length > 0;

  const handleExport = async (format: 'json' | 'csv' | 'xlsx') => {
    try {
      if (format === 'json') exportToJSON(scenarios);
      else if (format === 'csv') exportToCSV(scenarios);
      else await exportToExcel(scenarios);

      const label = format === 'xlsx' ? 'Excel' : format.toUpperCase();
      toast({
        title: `Exported to ${label}`,
        description: `${scenarios.length} scenario(s) exported successfully.`,
      });
    } catch {
      toast({ title: 'Export failed', description: 'Could not generate the file.', variant: 'destructive' });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let items: ScenarioImportItem[] = [];
      let label = '';

      if (file.name.endsWith('.json')) {
        items = importFromJSON(await file.text());
        label = 'JSON';
      } else if (file.name.endsWith('.csv')) {
        items = importFromCSV(await file.text());
        label = 'CSV';
      } else if (file.name.endsWith('.xlsx')) {
        items = await importFromExcel(file);
        label = 'Excel';
      } else {
        toast({ title: 'Unsupported file', description: 'Please upload a .json, .csv, or .xlsx file.', variant: 'destructive' });
        return;
      }

      if (items.length === 0) {
        toast({ title: 'Import failed', description: `No valid scenarios found in the ${label} file.`, variant: 'destructive' });
        return;
      }

      onImport(items);
      toast({ title: `Imported from ${label}`, description: `${items.length} scenario(s) imported successfully.` });
    } catch {
      toast({ title: 'Import failed', description: 'Could not parse the file. Please check the format.', variant: 'destructive' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv,.xlsx"
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
          <DropdownMenuItem onClick={() => handleExport('json')} disabled={!hasScenarios}>
            <FileJson className="h-4 w-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('csv')} disabled={!hasScenarios}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('xlsx')} disabled={!hasScenarios}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import from file
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

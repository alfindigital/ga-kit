import { useRef } from 'react';
import { Download, Upload, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ROASScenario, ROASScenarioData } from '@/hooks/useROASScenarios';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { exportToJSON, exportToCSV, exportToExcel, importFromJSON, importFromCSV, importFromExcel, ScenarioImportItem } from '@/utils/scenarioFileUtils';

interface ScenarioExportProps {
  scenarios: ROASScenario[];
  onImport: (scenarios: ScenarioImportItem[]) => void;
}

export function ScenarioExport({ scenarios, onImport }: ScenarioExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const hasScenarios = scenarios.length > 0;

  const handleExport = async (format: 'json' | 'csv' | 'xlsx') => {
    try {
      if (format === 'json') exportToJSON(scenarios);
      else if (format === 'csv') exportToCSV(scenarios);
      else await exportToExcel(scenarios);
      const label = format === 'xlsx' ? 'Excel' : format.toUpperCase();
      toast({ title: t('export.exported', { format: label }), description: t('export.exportedDesc', { count: scenarios.length }) });
    } catch {
      toast({ title: t('export.exportFailed'), description: t('export.exportFailedDesc'), variant: 'destructive' });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let items: ScenarioImportItem[] = [];
      let label = '';
      if (file.name.endsWith('.json')) { items = importFromJSON(await file.text()); label = 'JSON'; }
      else if (file.name.endsWith('.csv')) { items = importFromCSV(await file.text()); label = 'CSV'; }
      else if (file.name.endsWith('.xlsx')) { items = await importFromExcel(file); label = 'Excel'; }
      else { toast({ title: t('export.unsupported'), description: t('export.unsupportedDesc'), variant: 'destructive' }); return; }

      if (items.length === 0) { toast({ title: t('export.importFailed'), description: t('export.noScenarios', { format: label }), variant: 'destructive' }); return; }
      onImport(items);
      toast({ title: t('export.imported', { format: label }), description: t('export.importedDesc', { count: items.length }) });
    } catch {
      toast({ title: t('export.importFailed'), description: t('export.importParseError'), variant: 'destructive' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".json,.csv,.xlsx" className="hidden" onChange={handleFileChange} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            {t('export.export')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport('json')} disabled={!hasScenarios}>
            <FileJson className="h-4 w-4 mr-2" /> {t('export.exportJson')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('csv')} disabled={!hasScenarios}>
            <FileSpreadsheet className="h-4 w-4 mr-2" /> {t('export.exportCsv')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('xlsx')} disabled={!hasScenarios}>
            <FileSpreadsheet className="h-4 w-4 mr-2" /> {t('export.exportExcel')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> {t('export.importFile')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

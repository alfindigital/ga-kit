import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useExport() {
  const { toast } = useToast();

  const exportTxt = useCallback((data: string[], filename: string) => {
    const content = data.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    downloadBlob(blob, `${filename}.txt`);
    toast({ title: "Exported!", description: `${filename}.txt downloaded` });
  }, [toast]);

  const exportCsv = useCallback((data: string[][], filename: string) => {
    const content = data.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    downloadBlob(blob, `${filename}.csv`);
    toast({ title: "Exported!", description: `${filename}.csv downloaded` });
  }, [toast]);

  const exportXlsx = useCallback(async (data: string[][], filename: string) => {
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast({ title: "Exported!", description: `${filename}.xlsx downloaded` });
    } catch (error) {
      toast({ 
        title: "Export failed", 
        description: "Unable to export Excel file",
        variant: "destructive" 
      });
    }
  }, [toast]);

  return { exportTxt, exportCsv, exportXlsx };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

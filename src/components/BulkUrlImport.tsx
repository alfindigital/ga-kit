import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface BulkUrlImportProps {
  onImport: (urls: string[]) => void;
  accept?: string;
  className?: string;
  compact?: boolean;
}

export function BulkUrlImport({ 
  onImport, 
  accept = '.csv,.txt', 
  className,
  compact = false 
}: BulkUrlImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const parseFile = useCallback(async (file: File): Promise<string[]> => {
    const text = await file.text();
    const lines = text.split(/[\r\n]+/).filter(line => line.trim());
    if (file.name.endsWith('.csv')) {
      const urls: string[] = [];
      lines.forEach(line => {
        const cells = line.match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g) || [];
        cells.forEach(cell => {
          const cleaned = cell.replace(/^,?"?|"?$/g, '').trim();
          if (cleaned && (cleaned.includes('http') || cleaned.includes('www.'))) {
            urls.push(cleaned);
          }
        });
      });
      return urls;
    }
    return lines;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    try {
      const urls = await parseFile(file);
      if (urls.length === 0) {
        toast.error(t('bulk.noUrls'));
        return;
      }
      setFileName(file.name);
      onImport(urls);
      toast.success(t('bulk.imported', { count: urls.length, name: file.name }));
    } catch {
      toast.error(t('bulk.parseFailed'));
    }
  }, [parseFile, onImport, t]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(f => f.name.endsWith('.csv') || f.name.endsWith('.txt'));
    if (!validFile) { toast.error(t('bulk.dropCsvTxt')); return; }
    handleFile(validFile);
  }, [handleFile, t]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  const handleClear = useCallback(() => { setFileName(null); }, []);

  if (compact) {
    return (
      <>
        <input ref={fileInputRef} type="file" accept={accept} className="hidden" onChange={handleInputChange} />
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5 mr-1" />
          {t('bulk.import')}
        </Button>
      </>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input ref={fileInputRef} type="file" accept={accept} className="hidden" onChange={handleInputChange} />
      <div
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        )}
      >
        {fileName ? (
          <div className="flex items-center justify-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{fileName}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleClear(); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <Upload className={cn("h-6 w-6 mx-auto transition-transform", isDragging ? "text-primary scale-110" : "text-muted-foreground")} />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{t('bulk.clickUpload')}</span> {t('bulk.orDragDrop')}
            </p>
            <p className="text-xs text-muted-foreground">{t('bulk.csvTxtFiles')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

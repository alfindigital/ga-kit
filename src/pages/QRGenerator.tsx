import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Copy, RotateCcw, X, QrCode, AlertCircle, Beaker } from 'lucide-react';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClipboard } from '@/hooks/useClipboard';
import { useShortcutAction } from '@/contexts/ShortcutsContext';
import { useToast } from '@/hooks/use-toast';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useUsageStats } from '@/hooks/useUsageStats';
import { useValidation, validators } from '@/hooks/useValidation';
import { useUrlHistory } from '@/hooks/useUrlHistory';
import { QRGeneratorSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { InputError } from '@/components/ui/input-error';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export default function QRGenerator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialContent = searchParams.get('content') || '';
  
  const [text, setText] = useState(initialContent);
  const [size, setSize] = useState('256');
  const [margin, setMargin] = useState('1');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [logo, setLogo] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { copy } = useClipboard();
  const { toast } = useToast();
  const isLoading = usePageLoading(400);
  const { incrementStat } = useUsageStats();
  const { addToHistory } = useUrlHistory();
  const { t } = useTranslation();
  
  // Clear URL param after reading it
  useEffect(() => {
    if (searchParams.has('content')) {
      toast({
        title: t('qr.loadedFromUtm'),
        description: t('qr.loadedFromUtmDesc'),
      });
      setSearchParams({}, { replace: true });
    }
  }, []);

  const { validate, touch, getFieldState, clearErrors } = useValidation({
    fgColor: [validators.hexColor('Please enter a valid hex color (e.g., #000000)')],
    bgColor: [validators.hexColor('Please enter a valid hex color (e.g., #FFFFFF)')],
  });

  const fgColorState = getFieldState('fgColor');
  const bgColorState = getFieldState('bgColor');

  const handleColorChange = (field: 'fgColor' | 'bgColor', value: string) => {
    if (field === 'fgColor') {
      setFgColor(value);
    } else {
      setBgColor(value);
    }
    
    if (getFieldState(field).isTouched) {
      validate(field, value);
    }
  };

  const handleColorBlur = (field: 'fgColor' | 'bgColor', value: string) => {
    touch(field);
    validate(field, value);
  };

  useEffect(() => {
    if (!text) {
      setQrDataUrl('');
      return;
    }

    // Don't generate if colors are invalid
    if (fgColorState.hasError || bgColorState.hasError) {
      return;
    }

    const generateQR = async () => {
      try {
        const QRCode = await import('qrcode');
        const sizeNum = parseInt(size);
        const marginNum = parseInt(margin);
        
        const dataUrl = await QRCode.toDataURL(text, {
          width: sizeNum,
          margin: marginNum,
          color: { dark: fgColor, light: bgColor },
        });

        if (logo) {
          // Draw QR with logo overlay
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = sizeNum;
          canvas.height = sizeNum;

          const qrImg = new Image();
          qrImg.onload = () => {
            ctx.drawImage(qrImg, 0, 0);
            
            const logoImg = new Image();
            logoImg.onload = () => {
              const logoSize = sizeNum * 0.25;
              const logoX = (sizeNum - logoSize) / 2;
              const logoY = (sizeNum - logoSize) / 2;
              
              // White background for logo
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8);
              
              ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
              setQrDataUrl(canvas.toDataURL('image/png'));
            };
            logoImg.src = logo;
          };
          qrImg.src = dataUrl;
        } else {
          setQrDataUrl(dataUrl);
        }
      } catch (error) {
        console.error('QR generation failed:', error);
      }
    };

    generateQR();
  }, [text, size, margin, fgColor, bgColor, logo, fgColorState.hasError, bgColorState.hasError]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogo(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const downloadPNG = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'qrcode.png';
    a.click();
    incrementStat('qrCodesGenerated');
    
    // Add to unified history
    addToHistory({
      url: text,
      originalUrl: text,
      toolType: 'qr',
      name: `QR: ${text.slice(0, 30)}${text.length > 30 ? '...' : ''}`,
      starred: false,
      tags: ['qr-code'],
      metadata: { qrContent: text },
    });
    
    toast({ title: t('toast.downloaded'), description: t('qr.savedPng') });
  };

  const downloadSVG = async () => {
    if (!text) return;
    try {
      const QRCode = await import('qrcode');
      const svg = await QRCode.toString(text, { type: 'svg', margin: parseInt(margin), color: { dark: fgColor, light: bgColor } });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qrcode.svg';
      a.click();
      URL.revokeObjectURL(url);
      incrementStat('qrCodesGenerated');
      toast({ title: t('toast.downloaded'), description: t('qr.savedSvg') });
    } catch (error) {
      toast({ title: t('toast.error'), description: t('toast.svgGenFailed'), variant: 'destructive' });
    }
  };

  const handleReset = () => {
    setText('');
    setLogo(null);
    setFgColor('#000000');
    setBgColor('#ffffff');
    clearErrors();
    toast({ title: t('common.resetComplete') });
  };

  // Load sample data for demo
  const loadSampleData = () => {
    setText('https://example.com/my-awesome-page?utm_source=qr&utm_medium=print');
    toast({ title: t('common.sampleLoaded'), description: t('common.sampleLoadedDesc') });
  };

  // Keyboard shortcuts
  useShortcutAction('page.copy', () => { if (qrDataUrl) copy(qrDataUrl, t('toast.dataUrlCopied')); });
  useShortcutAction('page.reset', handleReset);
  useShortcutAction('page.sample', loadSampleData);

  if (isLoading) return <QRGeneratorSkeleton />;

  const hasColorError = fgColorState.hasError || bgColorState.hasError;

  return (
    <div className="space-y-4 sm:space-y-6">
      <ToolPageHeader
        icon={QrCode}
        title={t('tool.qrGenerator')}
        description={t('tool.qrGenerator.desc')}
        iconColor="bg-tool-qr/10 text-tool-qr"
        accentGradient="from-tool-qr to-tool-qr/40"
      >
        <Button variant="ghost" size="sm" onClick={loadSampleData} className="h-8 text-xs">
          <Beaker className="h-3.5 w-3.5 mr-1" /> {t('common.sample')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs self-start sm:self-auto">
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> {t('common.reset')}
        </Button>
      </ToolPageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>{t('qr.content')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs sm:text-sm">
                  {t('qr.textOrUrl')}
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input 
                  placeholder="https://example.com" 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  className="text-sm" 
                />
                <p className="text-xs text-muted-foreground mt-1">{text.length} {t('common.characters')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs sm:text-sm">{t('qr.size')}</Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="128">128px</SelectItem>
                      <SelectItem value="256">256px</SelectItem>
                      <SelectItem value="512">512px</SelectItem>
                      <SelectItem value="1024">1024px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">{t('qr.margin')}</Label>
                  <Select value={margin} onValueChange={setMargin}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t('common.none')}</SelectItem>
                      <SelectItem value="1">{t('common.small')}</SelectItem>
                      <SelectItem value="2">{t('common.medium')}</SelectItem>
                      <SelectItem value="4">{t('common.large')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs sm:text-sm">{t('qr.qrColor')}</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={fgColor} 
                      onChange={(e) => handleColorChange('fgColor', e.target.value)} 
                      className="w-10 h-9 p-1 flex-shrink-0" 
                    />
                    <Input 
                      value={fgColor} 
                      onChange={(e) => handleColorChange('fgColor', e.target.value)}
                      onBlur={() => handleColorBlur('fgColor', fgColor)}
                      className={cn(
                        "flex-1 text-sm",
                        fgColorState.hasError && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                  </div>
                  <InputError message={fgColorState.error} />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">{t('qr.background')}</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={bgColor} 
                      onChange={(e) => handleColorChange('bgColor', e.target.value)} 
                      className="w-10 h-9 p-1 flex-shrink-0" 
                    />
                    <Input 
                      value={bgColor} 
                      onChange={(e) => handleColorChange('bgColor', e.target.value)}
                      onBlur={() => handleColorBlur('bgColor', bgColor)}
                      className={cn(
                        "flex-1 text-sm",
                        bgColorState.hasError && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                  </div>
                  <InputError message={bgColorState.error} />
                </div>
              </div>

              <div>
                <Label className="text-xs sm:text-sm">{t('qr.logo')}</Label>
                <div className="flex gap-2 items-center">
                  <label className="flex-1 cursor-pointer">
                    <div className={cn(
                      "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm font-medium transition-colors",
                      logo 
                        ? "border-primary bg-primary/5 text-primary" 
                        : "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary"
                    )}>
                      <Download className="h-4 w-4 rotate-180" />
                      {logo ? 'Logo selected ✓' : 'Upload Logo'}
                    </div>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {logo && (
                    <Button variant="ghost" size="icon" onClick={() => setLogo(null)} className="h-9 w-9 flex-shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader><CardTitle>{t('common.preview')}</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="w-48 h-48 sm:w-64 sm:h-64 bg-muted rounded-lg flex items-center justify-center">
              {!text ? (
                <EmptyState
                  icon={QrCode}
                  title={t('qr.enterContent')}
                  description={t('qr.enterContentDesc')}
                  className="py-0"
                />
              ) : hasColorError ? (
                <EmptyState
                  icon={AlertCircle}
                  title={t('qr.invalidColors')}
                  description={t('qr.invalidColorsDesc')}
                  variant="error"
                  className="py-0"
                />
              ) : qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="max-w-full max-h-full" />
              ) : (
                <p className="text-muted-foreground text-xs sm:text-sm text-center px-4">{t('qr.generating')}</p>
              )}
            </div>

            <div className="flex gap-2 w-full">
              <Button onClick={downloadPNG} disabled={!qrDataUrl || hasColorError} className="flex-1 text-xs sm:text-sm">
                <Download className="h-3.5 w-3.5 mr-1" /> PNG
              </Button>
              <Button onClick={downloadSVG} disabled={!text || hasColorError} variant="outline" className="flex-1 text-xs sm:text-sm">
                <Download className="h-3.5 w-3.5 mr-1" /> SVG
              </Button>
              <Button onClick={() => copy(qrDataUrl, 'Data URL copied')} disabled={!qrDataUrl || hasColorError} variant="outline" size="icon" className="h-9 w-9 flex-shrink-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

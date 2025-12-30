import { useState, useEffect, useRef } from 'react';
import { Download, Copy, RotateCcw, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClipboard } from '@/hooks/useClipboard';
import { useToast } from '@/hooks/use-toast';
import { usePageLoading } from '@/hooks/usePageLoading';
import { QRGeneratorSkeleton } from '@/components/skeletons';

export default function QRGenerator() {
  const [text, setText] = useState('');
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

  if (isLoading) return <QRGeneratorSkeleton />;

  useEffect(() => {
    if (!text) {
      setQrDataUrl('');
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
  }, [text, size, margin, fgColor, bgColor, logo]);

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
    toast({ title: 'Downloaded!', description: 'QR code saved as PNG' });
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
      toast({ title: 'Downloaded!', description: 'QR code saved as SVG' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate SVG', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">QR Generator</h1>
          <p className="text-sm text-muted-foreground">Generate QR codes with custom colors</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setText(''); setLogo(null); }} className="h-8 text-xs self-start sm:self-auto">
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader className="p-3"><CardTitle className="text-xs sm:text-sm">Content</CardTitle></CardHeader>
            <CardContent className="p-3 pt-0 space-y-4">
              <div>
                <Label className="text-xs sm:text-sm">Text or URL</Label>
                <Input placeholder="https://example.com" value={text} onChange={(e) => setText(e.target.value)} className="text-sm" />
                <p className="text-xs text-muted-foreground mt-1">{text.length} characters</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs sm:text-sm">Size</Label>
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
                  <Label className="text-xs sm:text-sm">Margin</Label>
                  <Select value={margin} onValueChange={setMargin}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      <SelectItem value="1">Small</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="4">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs sm:text-sm">QR Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-10 h-9 p-1 flex-shrink-0" />
                    <Input value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="flex-1 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Background</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-9 p-1 flex-shrink-0" />
                    <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 text-sm" />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs sm:text-sm">Logo (optional)</Label>
                <div className="flex gap-2">
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} className="flex-1 text-sm" />
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
          <CardHeader className="p-3"><CardTitle className="text-xs sm:text-sm">Preview</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0 flex flex-col items-center gap-4">
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="w-48 h-48 sm:w-64 sm:h-64 bg-muted rounded-lg flex items-center justify-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="max-w-full max-h-full" />
              ) : (
                <p className="text-muted-foreground text-xs sm:text-sm text-center px-4">Enter text to generate QR</p>
              )}
            </div>

            <div className="flex gap-2 w-full">
              <Button onClick={downloadPNG} disabled={!qrDataUrl} className="flex-1 text-xs sm:text-sm">
                <Download className="h-3.5 w-3.5 mr-1" /> PNG
              </Button>
              <Button onClick={downloadSVG} disabled={!text} variant="outline" className="flex-1 text-xs sm:text-sm">
                <Download className="h-3.5 w-3.5 mr-1" /> SVG
              </Button>
              <Button onClick={() => copy(qrDataUrl, 'Data URL copied')} disabled={!qrDataUrl} variant="outline" size="icon" className="h-9 w-9 flex-shrink-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

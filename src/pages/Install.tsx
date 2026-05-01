import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Download, Smartphone, Wifi, WifiOff, Zap, CheckCircle2, Share, PlusSquare,
} from 'lucide-react';

export default function Install() {
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();
  const { t } = useTranslation();

  const features = [
    { icon: WifiOff, key: 'install.featureOffline' as const },
    { icon: Zap, key: 'install.featureFast' as const },
    { icon: Smartphone, key: 'install.featureNative' as const },
    { icon: Download, key: 'install.featureNoStore' as const },
  ];

  return (
    <div className="container max-w-lg px-4 py-6 sm:py-10 space-y-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Download className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('install.title')}</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">{t('install.description')}</p>
      </div>

      {/* Already installed */}
      {isInstalled && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="font-medium">{t('install.alreadyInstalled')}</p>
              <p className="text-sm text-muted-foreground">{t('install.alreadyInstalledDesc')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Install CTA */}
      {!isInstalled && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t('install.ctaTitle')}</CardTitle>
            <CardDescription>{t('install.ctaDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canInstall && (
              <Button onClick={promptInstall} size="lg" className="w-full gap-2">
                <Download className="h-5 w-5" />
                {t('install.button')}
              </Button>
            )}

            {isIOS && (
              <div className="rounded-lg bg-muted/50 p-4 border space-y-3">
                <p className="text-sm font-medium">{t('install.iosTitle')}</p>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <Badge variant="secondary" className="shrink-0 mt-0.5">1</Badge>
                    <span className="flex items-center gap-1.5">
                      {t('install.iosStep1')} <Share className="h-4 w-4 inline" />
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="secondary" className="shrink-0 mt-0.5">2</Badge>
                    <span className="flex items-center gap-1.5">
                      {t('install.iosStep2')} <PlusSquare className="h-4 w-4 inline" />
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="secondary" className="shrink-0 mt-0.5">3</Badge>
                    <span>{t('install.iosStep3')}</span>
                  </li>
                </ol>
              </div>
            )}

            {!canInstall && !isIOS && (
              <p className="text-sm text-center text-muted-foreground">{t('install.browserHint')}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <div className="grid grid-cols-2 gap-3">
        {features.map(({ icon: Icon, key }) => (
          <Card key={key} className="p-4">
            <div className="flex flex-col items-center text-center gap-2">
              <Icon className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">{t(key)}</span>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground">{t('install.note')}</p>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, History, Link2, QrCode, Youtube, Star, BarChart3, List, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UrlHistoryPanel } from '@/components/UrlHistoryPanel';
import { HistoryAnalytics } from '@/components/HistoryAnalytics';
import { QuickStats } from '@/components/QuickStats';
import { useUrlHistory, UrlHistoryItem } from '@/hooks/useUrlHistory';
import { usePageLoading } from '@/hooks/usePageLoading';
import { ToolPageSkeleton } from '@/components/skeletons';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

export default function UrlHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isLoading = usePageLoading(400);
  const { stats, allHistory } = useUrlHistory();
  const [activeTab, setActiveTab] = useState<'history' | 'analytics' | 'activity'>('history');

  if (isLoading) return <ToolPageSkeleton />;

  const toolDisplayName = (type: string) =>
    type === 'utm' ? 'UTM Builder' : type === 'qr' ? 'QR Generator' : 'YT Finder';

  const handleLoadUrl = (item: UrlHistoryItem) => {
    switch (item.toolType) {
      case 'utm':
        navigate(`/utm-builder?preload=${encodeURIComponent(item.originalUrl)}`);
        break;
      case 'qr':
        navigate(`/qr-generator?content=${encodeURIComponent(item.url)}`);
        break;
      case 'yt-finder':
        navigate('/yt-finder');
        sessionStorage.setItem('yt-finder-preload', item.url);
        break;
    }
    toast({
      title: t('urlHistory.loaded'),
      description: t('urlHistory.redirecting', { tool: toolDisplayName(item.toolType) }),
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <History className="h-5 w-5 sm:h-6 sm:w-6" />
              {t('urlHistory.title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('urlHistory.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border-primary/20">
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">{t('urlHistory.totalUrls')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.byTool.utm}</p>
                <p className="text-xs text-muted-foreground">{t('urlHistory.utmUrls')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-accent" />
              <div>
                <p className="text-2xl font-bold">{stats.byTool.qr}</p>
                <p className="text-xs text-muted-foreground">{t('urlHistory.qrCodes')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{stats.byTool['yt-finder']}</p>
                <p className="text-xs text-muted-foreground">{t('urlHistory.ytSearches')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-warning" />
              <div>
                <p className="text-2xl font-bold">{stats.starred}</p>
                <p className="text-xs text-muted-foreground">{t('urlHistory.starred')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for History and Analytics */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'history' | 'analytics' | 'activity')}>
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="history" className="gap-2">
            <List className="h-4 w-4" />
            {t('urlHistory.historyTab')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('urlHistory.analyticsTab')}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            {t('stats.yourActivity')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle>{t('urlHistory.allHistory')}</CardTitle>
            </CardHeader>
            <UrlHistoryPanel 
              onLoadUrl={handleLoadUrl}
              maxHeight="calc(100vh - 480px)"
            />
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <HistoryAnalytics history={allHistory} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <QuickStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}

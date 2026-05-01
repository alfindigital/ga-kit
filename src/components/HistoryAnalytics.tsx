import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUrlHistory, UrlHistoryItem } from '@/hooks/useUrlHistory';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { TrendingUp, Calendar, Globe, Megaphone } from 'lucide-react';

const CHART_COLORS = [
  'hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))',
];

interface HistoryAnalyticsProps {
  history: UrlHistoryItem[];
}

export function HistoryAnalytics({ history }: HistoryAnalyticsProps) {
  const { t } = useTranslation();

  // URLs per day for the last 14 days
  const urlsPerDay = useMemo(() => {
    const today = startOfDay(new Date());
    const twoWeeksAgo = subDays(today, 13);
    const days = eachDayOfInterval({ start: twoWeeksAgo, end: today });
    const countsByDay = new Map<string, { utm: number; qr: number; yt: number }>();
    days.forEach(day => { countsByDay.set(format(day, 'yyyy-MM-dd'), { utm: 0, qr: 0, yt: 0 }); });
    history.forEach(item => {
      const dayKey = format(startOfDay(new Date(item.timestamp)), 'yyyy-MM-dd');
      if (countsByDay.has(dayKey)) {
        const counts = countsByDay.get(dayKey)!;
        if (item.toolType === 'utm') counts.utm++;
        else if (item.toolType === 'qr') counts.qr++;
        else if (item.toolType === 'yt-finder') counts.yt++;
      }
    });
    return days.map(day => ({
      date: format(day, 'MMM d'),
      fullDate: format(day, 'yyyy-MM-dd'),
      UTM: countsByDay.get(format(day, 'yyyy-MM-dd'))?.utm || 0,
      QR: countsByDay.get(format(day, 'yyyy-MM-dd'))?.qr || 0,
      YT: countsByDay.get(format(day, 'yyyy-MM-dd'))?.yt || 0,
    }));
  }, [history]);

  // Most used UTM sources
  const topSources = useMemo(() => {
    const sourceCounts = new Map<string, number>();
    history.filter(item => item.toolType === 'utm' && item.metadata.source).forEach(item => {
      const source = item.metadata.source!;
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    });
    return Array.from(sourceCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
  }, [history]);

  // Most used UTM mediums
  const topMediums = useMemo(() => {
    const mediumCounts = new Map<string, number>();
    history.filter(item => item.toolType === 'utm' && item.metadata.medium).forEach(item => {
      const medium = item.metadata.medium!;
      mediumCounts.set(medium, (mediumCounts.get(medium) || 0) + 1);
    });
    return Array.from(mediumCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
  }, [history]);

  // Most used campaigns
  const topCampaigns = useMemo(() => {
    const campaignCounts = new Map<string, number>();
    history.filter(item => item.toolType === 'utm' && item.metadata.campaign).forEach(item => {
      const campaign = item.metadata.campaign!;
      campaignCounts.set(campaign, (campaignCounts.get(campaign) || 0) + 1);
    });
    return Array.from(campaignCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));
  }, [history]);

  // Peak usage hours
  const hourlyUsage = useMemo(() => {
    const hourCounts = new Array(24).fill(0);
    history.forEach(item => { hourCounts[new Date(item.timestamp).getHours()]++; });
    return hourCounts.map((count, hour) => ({ hour: `${hour.toString().padStart(2, '0')}:00`, count }));
  }, [history]);

  // Calculate week-over-week change
  const weekOverWeekChange = useMemo(() => {
    const today = startOfDay(new Date());
    const oneWeekAgo = subDays(today, 7);
    const twoWeeksAgo = subDays(today, 14);
    const thisWeek = history.filter(item => new Date(item.timestamp) >= oneWeekAgo).length;
    const lastWeek = history.filter(item => new Date(item.timestamp) >= twoWeeksAgo && new Date(item.timestamp) < oneWeekAgo).length;
    if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  }, [history]);

  const hasData = history.length > 0;
  const hasUtmData = topSources.length > 0 || topMediums.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>{t('analytics.noData')}</p>
          <p className="text-sm mt-1">{t('analytics.noDataDesc')}</p>
        </CardContent>
      </Card>
    );
  }

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${weekOverWeekChange >= 0 ? 'text-accent' : 'text-destructive'}`} />
              <div>
                <p className="text-xl sm:text-2xl font-bold">{weekOverWeekChange >= 0 ? '+' : ''}{weekOverWeekChange}%</p>
                <p className="text-xs text-muted-foreground">{t('analytics.vsLastWeek')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xl sm:text-2xl font-bold">{urlsPerDay.reduce((sum, d) => sum + d.UTM + d.QR + d.YT, 0)}</p>
                <p className="text-xs text-muted-foreground">{t('analytics.last14Days')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-chart-2" />
              <div>
                <p className="text-xl sm:text-2xl font-bold">{topSources.length}</p>
                <p className="text-xs text-muted-foreground">{t('analytics.uniqueSources')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-chart-3" />
              <div>
                <p className="text-xl sm:text-2xl font-bold">{topCampaigns.length}</p>
                <p className="text-xs text-muted-foreground">{t('analytics.campaigns')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle>{t('analytics.urlsGenerated')}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="h-[200px] sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={urlsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="UTM" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="QR" stackId="a" fill="hsl(var(--chart-4))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="YT" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {hasUtmData && (
        <div className="grid gap-4 md:grid-cols-2">
          {topSources.length > 0 && (
            <Card>
              <CardHeader className="p-3 sm:p-4 pb-2">
                <CardTitle>{t('analytics.topSources')}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={topSources} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                        {topSources.map((_, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          {topMediums.length > 0 && (
            <Card>
              <CardHeader className="p-3 sm:p-4 pb-2">
                <CardTitle>{t('analytics.topMediums')}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topMediums} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle>{t('analytics.peakHours')}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="h-[150px] sm:h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} className="text-muted-foreground" tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(label) => t('analytics.time', { label })} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {topCampaigns.length > 0 && (
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardTitle>{t('analytics.topCampaigns')}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="space-y-2">
              {topCampaigns.map((campaign, index) => (
                <div key={campaign.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{campaign.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{campaign.value} {t('analytics.urls')}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(campaign.value / topCampaigns[0].value) * 100}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

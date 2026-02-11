import { Link } from 'react-router-dom';
import { 
  Link2, 
  Combine, 
  Shuffle, 
  Wrench, 
  Youtube, 
  QrCode,
  ArrowRight,
  Sparkles,
  Star,
  Pin,
  History,
  ShieldCheck,
  Ban,
  FileText,
  Calculator
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePageLoading } from '@/hooks/usePageLoading';
import { DashboardSkeleton } from '@/components/skeletons';
import { WelcomeBanner } from '@/components/OnboardingTour';
import { QuickStats } from '@/components/QuickStats';
import { useFavoriteTools } from '@/hooks/useFavoriteTools';

const toolColors: Record<string, { border: string; shadow: string; gradient: string; dot: string }> = {
  'utm-builder':       { border: 'border-l-primary',       shadow: 'hover:shadow-glow-primary',      gradient: 'from-primary to-primary/70',      dot: 'bg-primary' },
  'keyword-combiner':  { border: 'border-l-accent',        shadow: 'hover:shadow-glow-accent',       gradient: 'from-accent to-accent/70',        dot: 'bg-accent' },
  'keyword-mixer':     { border: 'border-l-accent',        shadow: 'hover:shadow-glow-accent',       gradient: 'from-accent to-accent/70',        dot: 'bg-accent' },
  'keyword-tools':     { border: 'border-l-warning',       shadow: '',                                gradient: 'from-warning to-warning/70',      dot: 'bg-warning' },
  'yt-finder':         { border: 'border-l-destructive',   shadow: 'hover:shadow-glow-destructive',  gradient: 'from-destructive to-destructive/70', dot: 'bg-destructive' },
  'qr-generator':      { border: 'border-l-tool-qr',      shadow: 'hover:shadow-glow-purple',       gradient: 'from-tool-qr to-tool-qr/70',     dot: 'bg-tool-qr' },
  'url-validator':     { border: 'border-l-accent',        shadow: 'hover:shadow-glow-accent',       gradient: 'from-accent to-accent/70',        dot: 'bg-accent' },
  'negative-keywords': { border: 'border-l-destructive',   shadow: 'hover:shadow-glow-destructive',  gradient: 'from-destructive to-destructive/70', dot: 'bg-destructive' },
  'ad-copy-validator': { border: 'border-l-primary',       shadow: 'hover:shadow-glow-primary',      gradient: 'from-primary to-primary/70',      dot: 'bg-primary' },
  'roas-calculator':   { border: 'border-l-accent',        shadow: 'hover:shadow-glow-accent',       gradient: 'from-accent to-accent/70',        dot: 'bg-accent' },
  'url-history':       { border: 'border-l-muted-foreground', shadow: '',                             gradient: 'from-muted-foreground to-muted-foreground/70', dot: 'bg-muted-foreground' },
};

const tools = [
  {
    id: 'utm-builder',
    title: 'UTM Builder',
    description: 'Build campaign URLs with UTM parameters and Google Ads ValueTrack',
    icon: Link2,
    path: '/utm-builder',
    color: 'bg-primary/10 text-primary',
    features: ['UTM Parameters', 'ValueTrack Macros', 'Live Preview'],
  },
  {
    id: 'keyword-combiner',
    title: 'Keyword Combiner',
    description: 'Combine keyword lists into all possible combinations',
    icon: Combine,
    path: '/keyword-combiner',
    color: 'bg-accent/10 text-accent',
    features: ['Multi-column Lists', 'Match Types', 'Export Options'],
  },
  {
    id: 'keyword-mixer',
    title: 'Keyword Mixer',
    description: 'Mix base keywords with prefixes and suffixes',
    icon: Shuffle,
    path: '/keyword-mixer',
    color: 'bg-accent/10 text-accent',
    features: ['Prefix/Suffix', 'De-duplicate', 'Bulk Processing'],
  },
  {
    id: 'keyword-tools',
    title: 'Keyword Tools',
    description: 'Remove duplicates, convert case, and bulk replace text',
    icon: Wrench,
    path: '/keyword-tools',
    color: 'bg-warning/10 text-warning-foreground',
    features: ['De-duplicate', 'Case Convert', 'Bulk Replace'],
  },
  {
    id: 'yt-finder',
    title: 'YT Channel Finder',
    description: 'Extract channel info from YouTube video URLs',
    icon: Youtube,
    path: '/yt-finder',
    color: 'bg-destructive/10 text-destructive',
    features: ['Bulk URLs', 'oEmbed API', 'Export Data'],
  },
  {
    id: 'qr-generator',
    title: 'QR Generator',
    description: 'Generate QR codes with custom colors and logo',
    icon: QrCode,
    path: '/qr-generator',
    color: 'bg-tool-qr/10 text-tool-qr',
    features: ['Custom Colors', 'Logo Support', 'PNG/SVG Export'],
  },
  {
    id: 'url-validator',
    title: 'URL Validator',
    description: 'Validate URL format and structure before use',
    icon: ShieldCheck,
    path: '/url-validator',
    color: 'bg-accent/10 text-accent',
    features: ['Format Check', 'Bulk Validation', 'Quick Actions'],
  },
  {
    id: 'negative-keywords',
    title: 'Negative Keywords',
    description: 'Manage, deduplicate, and detect conflicts in negative keywords',
    icon: Ban,
    path: '/negative-keywords',
    color: 'bg-destructive/10 text-destructive',
    features: ['Deduplicate', 'Match Types', 'Conflict Detection'],
  },
  {
    id: 'ad-copy-validator',
    title: 'Ad Copy Validator',
    description: 'Validate RSA headlines (30 chars) and descriptions (90 chars)',
    icon: FileText,
    path: '/ad-copy-validator',
    color: 'bg-primary/10 text-primary',
    features: ['Character Limits', 'RSA Preview', 'Bulk Import'],
  },
  {
    id: 'roas-calculator',
    title: 'ROAS Calculator',
    description: 'Calculate Return on Ad Spend, budget estimation, and break-even CPA',
    icon: Calculator,
    path: '/roas-calculator',
    color: 'bg-accent/10 text-accent',
    features: ['ROAS & ROI', 'Budget Planning', 'Break-even CPA'],
  },
  {
    id: 'url-history',
    title: 'URL History',
    description: 'Search, filter, and re-use all your generated URLs',
    icon: History,
    path: '/history',
    color: 'bg-muted text-muted-foreground',
    features: ['Search & Filter', 'Star Favorites', 'Export/Import'],
  },
];

export default function Dashboard() {
  const isLoading = usePageLoading(400);
  const { favorites, toggleFavorite, isFavorite } = useFavoriteTools();

  if (isLoading) return <DashboardSkeleton />;

  const favoriteTools = tools.filter(tool => favorites.includes(tool.id));
  const hasFavorites = favoriteTools.length > 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Quick Stats */}
      <QuickStats />

      {/* Pinned Tools */}
      {hasFavorites && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Pin className="h-4 w-4" />
            <span className="font-medium">Quick Access</span>
          </div>
          <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {favoriteTools.map((tool, index) => {
              const colors = toolColors[tool.id];
              return (
                <Link 
                  key={tool.id} 
                  to={tool.path}
                  className={cn(
                    "quick-access-pill flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border bg-card shadow-sm",
                    "hover:border-primary/30",
                    "stagger-enter group",
                    colors?.shadow
                  )}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className={cn("quick-access-icon p-1.5 sm:p-2 rounded-lg flex-shrink-0", tool.color)}>
                    <tool.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {tool.title}
                  </span>
                  <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 text-primary" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative text-center py-8 sm:py-10 lg:py-14 overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-tool-qr/3 rounded-full blur-3xl" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-pulse-gentle" />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold">
            <span className="gradient-text">GA</span>{' '}
            <span className="text-foreground">Toolkit</span>
          </h1>
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-accent animate-pulse-gentle" />
        </div>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-2">
          Your complete toolkit for Google Ads campaign management. 
          Build UTMs, combine keywords, and generate QR codes.
        </p>
      </section>

      {/* Tools Grid */}
      <section data-tour="tools-grid" className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        {tools.map((tool, index) => {
          const starred = isFavorite(tool.id);
          const colors = toolColors[tool.id];
          return (
            <Card 
              key={tool.id} 
              className={cn(
                "tool-card group relative overflow-hidden border-l-4",
                "stagger-enter shadow-sm",
                colors?.border,
                starred && "ring-1 ring-primary/20"
              )}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                <div className="flex items-start justify-between">
                  <div className={cn("tool-icon p-1.5 sm:p-2 rounded-xl w-fit", tool.color)}>
                    <tool.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 sm:h-8 sm:w-8 -mt-1 -mr-1 transition-all duration-200",
                      starred ? "text-yellow-500 scale-100" : "text-muted-foreground opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(tool.id);
                    }}
                  >
                    <Star className={cn("h-4 w-4 transition-transform duration-200", starred && "fill-current")} />
                  </Button>
                </div>
                <CardTitle className="text-sm sm:text-base lg:text-lg">{tool.title}</CardTitle>
                <CardDescription className="text-xs sm:text-sm line-clamp-2">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <ul className="hidden sm:block text-xs text-muted-foreground space-y-1 mb-3 sm:mb-4">
                  {tool.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", colors?.dot || 'bg-primary')} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild size="sm" className={cn(
                  "tool-launch-btn w-full text-xs sm:text-sm active:scale-[0.98] transition-all",
                  "bg-gradient-to-r text-primary-foreground hover:opacity-90",
                  colors?.gradient
                )}>
                  <Link to={tool.path} className="flex items-center justify-center gap-1.5 sm:gap-2">
                    Launch
                    <ArrowRight className="tool-arrow h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

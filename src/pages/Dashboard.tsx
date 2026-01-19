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
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePageLoading } from '@/hooks/usePageLoading';
import { DashboardSkeleton } from '@/components/skeletons';
import { WelcomeBanner } from '@/components/OnboardingTour';
import { QuickStats } from '@/components/QuickStats';
import { useFavoriteTools } from '@/hooks/useFavoriteTools';

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
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    features: ['Custom Colors', 'Logo Support', 'PNG/SVG Export'],
  },
  {
    id: 'url-validator',
    title: 'URL Validator',
    description: 'Validate URL format and structure before use',
    icon: ShieldCheck,
    path: '/url-validator',
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    features: ['Format Check', 'Bulk Validation', 'Quick Actions'],
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
            {favoriteTools.map((tool, index) => (
              <Link 
                key={tool.id} 
                to={tool.path}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border bg-card",
                  "hover:bg-accent/50 hover:border-primary/30 transition-all",
                  "opacity-0 animate-fade-in group"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn("p-1.5 sm:p-2 rounded-md flex-shrink-0", tool.color)}>
                  <tool.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <span className="text-xs sm:text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {tool.title}
                </span>
                <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="text-center py-6 sm:py-8 lg:py-12">
        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-pulse-gentle" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            GA <span className="text-primary italic">Toolkit</span>
          </h1>
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-pulse-gentle" />
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
          return (
            <Card 
              key={tool.id} 
              className={cn(
                "tool-card group relative overflow-hidden",
                "opacity-0 animate-fade-in",
                starred && "ring-1 ring-primary/20"
              )}
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
                <div className="flex items-start justify-between">
                  <div className={cn("p-1.5 sm:p-2 rounded-lg w-fit", tool.color)}>
                    <tool.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 sm:h-8 sm:w-8 -mt-1 -mr-1",
                      starred ? "text-yellow-500" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(tool.id);
                    }}
                  >
                    <Star className={cn("h-4 w-4", starred && "fill-current")} />
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
                      <span className="h-1 w-1 rounded-full bg-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild size="sm" className="w-full text-xs sm:text-sm group-hover:bg-primary/90 active:scale-[0.98] transition-all">
                  <Link to={tool.path} className="flex items-center justify-center gap-1.5 sm:gap-2">
                    Launch
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
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

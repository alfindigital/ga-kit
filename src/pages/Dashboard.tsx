import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';
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
  PinOff,
  GripVertical,
  History,
  ShieldCheck,
  Ban,
  FileText,
  Calculator,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { usePageLoading } from '@/hooks/usePageLoading';
import { DashboardSkeleton } from '@/components/skeletons';
import { WelcomeBanner } from '@/components/OnboardingTour';

import { useFavoriteTools } from '@/hooks/useFavoriteTools';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

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
  'headline-analyzer': { border: 'border-l-warning',       shadow: '',                                gradient: 'from-warning to-warning/70',      dot: 'bg-warning' },
  'url-history':       { border: 'border-l-muted-foreground', shadow: '',                             gradient: 'from-muted-foreground to-muted-foreground/70', dot: 'bg-muted-foreground' },
};

// Tool definitions with i18n keys
const toolDefs = [
  { id: 'utm-builder', titleKey: 'tool.utmBuilder' as const, descKey: 'tool.utmBuilder.desc' as const, icon: Link2, path: '/utm-builder', color: 'bg-primary/10 text-primary', features: ['UTM Parameters', 'ValueTrack Macros', 'Live Preview'] },
  { id: 'keyword-combiner', titleKey: 'tool.keywordCombiner' as const, descKey: 'tool.keywordCombiner.desc' as const, icon: Combine, path: '/keyword-combiner', color: 'bg-accent/10 text-accent', features: ['Multi-column Lists', 'Match Types', 'Export Options'] },
  { id: 'keyword-mixer', titleKey: 'tool.keywordMixer' as const, descKey: 'tool.keywordMixer.desc' as const, icon: Shuffle, path: '/keyword-mixer', color: 'bg-accent/10 text-accent', features: ['Prefix/Suffix', 'De-duplicate', 'Bulk Processing'] },
  { id: 'keyword-tools', titleKey: 'tool.keywordTools' as const, descKey: 'tool.keywordTools.desc' as const, icon: Wrench, path: '/keyword-tools', color: 'bg-warning/10 text-warning-foreground', features: ['De-duplicate', 'Case Convert', 'Bulk Replace'] },
  { id: 'yt-finder', titleKey: 'tool.ytFinder' as const, descKey: 'tool.ytFinder.desc' as const, icon: Youtube, path: '/yt-finder', color: 'bg-destructive/10 text-destructive', features: ['Bulk URLs', 'oEmbed API', 'Export Data'] },
  { id: 'qr-generator', titleKey: 'tool.qrGenerator' as const, descKey: 'tool.qrGenerator.desc' as const, icon: QrCode, path: '/qr-generator', color: 'bg-tool-qr/10 text-tool-qr', features: ['Custom Colors', 'Logo Support', 'PNG/SVG Export'] },
  { id: 'url-validator', titleKey: 'tool.urlValidator' as const, descKey: 'tool.urlValidator.desc' as const, icon: ShieldCheck, path: '/url-validator', color: 'bg-accent/10 text-accent', features: ['Format Check', 'Bulk Validation', 'Quick Actions'] },
  { id: 'negative-keywords', titleKey: 'tool.negativeKeywords' as const, descKey: 'tool.negativeKeywords.desc' as const, icon: Ban, path: '/negative-keywords', color: 'bg-destructive/10 text-destructive', features: ['Deduplicate', 'Match Types', 'Conflict Detection'] },
  { id: 'ad-copy-validator', titleKey: 'tool.adCopyValidator' as const, descKey: 'tool.adCopyValidator.desc' as const, icon: FileText, path: '/ad-copy-validator', color: 'bg-primary/10 text-primary', features: ['Character Limits', 'RSA Preview', 'Bulk Import'] },
  { id: 'roas-calculator', titleKey: 'tool.roasCalculator' as const, descKey: 'tool.roasCalculator.desc' as const, icon: Calculator, path: '/roas-calculator', color: 'bg-accent/10 text-accent', features: ['ROAS & ROI', 'Budget Planning', 'Break-even CPA'] },
  { id: 'headline-analyzer', titleKey: 'tool.headlineAnalyzer' as const, descKey: 'tool.headlineAnalyzer.desc' as const, icon: Lightbulb, path: '/headline-analyzer', color: 'bg-warning/10 text-warning-foreground', features: ['A/B Compare', 'Power Words', 'CTA Detection'] },
  { id: 'url-history', titleKey: 'tool.urlHistory' as const, descKey: 'tool.urlHistory.desc' as const, icon: History, path: '/history', color: 'bg-muted text-muted-foreground', features: ['Search & Filter', 'Star Favorites', 'Export/Import'] },
];

export default function Dashboard() {
  const isLoading = usePageLoading(400);
  const { favorites, toggleFavorite, isFavorite, reorderFavorites } = useFavoriteTools();
  const { t } = useTranslation();

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  if (isLoading) return <DashboardSkeleton />;

  const favoriteTools = toolDefs.filter(tool => favorites.includes(tool.id));
  favoriteTools.sort((a, b) => favorites.indexOf(a.id) - favorites.indexOf(b.id));
  const hasFavorites = favoriteTools.length > 0;

  const handleToggleFavorite = (e: React.MouseEvent, tool: typeof toolDefs[0], starred: boolean) => {
    e.preventDefault();
    toggleFavorite(tool.id);
    if (!starred) {
      toast.success(`${t(tool.titleKey)} ${t('toast.pinned')}`, {
        description: t('toast.pinnedDesc'),
        icon: '📌',
      });
    } else {
      toast(`${t(tool.titleKey)} ${t('toast.unpinned')}`, { icon: '🗑️' });
    }
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
    setDraggingIndex(index);
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      reorderFavorites(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIndex(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <WelcomeBanner />
      <QuickStats />

      {/* ── Pinned / Quick Access ── */}
      {hasFavorites ? (
        <section className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Pin className="h-4 w-4 text-primary" />
              {t('dashboard.quickAccess')}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({favoriteTools.length})
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {t('dashboard.dragToReorder')}
            </p>
          </div>
          <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {favoriteTools.map((tool, index) => {
              const colors = toolColors[tool.id];
              return (
                <div
                  key={tool.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={cn(
                    "transition-all duration-200",
                    draggingIndex === index && "opacity-40 scale-95"
                  )}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <Link
                    to={tool.path}
                    className={cn(
                      "group relative flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border bg-card shadow-sm",
                      "transition-all duration-200 hover:border-primary/40 hover:shadow-elevated",
                      colors?.shadow
                    )}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 cursor-grab active:cursor-grabbing flex-shrink-0 hidden sm:block" />
                    <div className={cn("p-1.5 sm:p-2 rounded-lg flex-shrink-0", tool.color)}>
                      <tool.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium truncate group-hover:text-primary transition-colors flex-1">
                      {t(tool.titleKey)}
                    </span>
                    <button
                      onClick={(e) => handleToggleFavorite(e, tool, true)}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                      title="Unpin"
                    >
                      <PinOff className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}


      {/* Tools Grid */}
      <section data-tour="tools-grid" className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        {toolDefs.map((tool, index) => {
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7 sm:h-8 sm:w-8 -mt-1 -mr-1 transition-all duration-200",
                          starred
                            ? "text-warning scale-100 opacity-100"
                            : "text-muted-foreground opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                        )}
                        onClick={(e) => handleToggleFavorite(e, tool, starred)}
                        aria-label={starred ? 'Unpin tool' : 'Pin to Quick Access'}
                      >
                        <Star className={cn("h-4 w-4 transition-all duration-200", starred && "fill-current")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {starred ? 'Remove from Quick Access' : 'Pin to Quick Access'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardTitle className="text-sm sm:text-base lg:text-lg">{t(tool.titleKey)}</CardTitle>
                <CardDescription className="text-xs sm:text-sm line-clamp-2">
                  {t(tool.descKey)}
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
                    {t('common.launch')}
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

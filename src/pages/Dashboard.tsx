import { Link } from 'react-router-dom';
import { 
  Link2, 
  Combine, 
  Shuffle, 
  Wrench, 
  Youtube, 
  QrCode,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
];

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <section className="text-center py-8 lg:py-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-primary animate-pulse-gentle" />
          <h1 className="text-3xl lg:text-4xl font-bold">
            GA <span className="text-primary italic">Toolkit</span>
          </h1>
          <Sparkles className="h-6 w-6 text-primary animate-pulse-gentle" />
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Your complete toolkit for Google Ads campaign management. 
          Build UTMs, combine keywords, and generate QR codes.
        </p>
      </section>

      {/* Tools Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool, index) => (
          <Card 
            key={tool.id} 
            className={cn(
              "tool-card group relative overflow-hidden",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={cn("p-2 rounded-lg w-fit", tool.color)}>
                  <tool.icon className="h-5 w-5" />
                </div>
              </div>
              <CardTitle className="text-lg">{tool.title}</CardTitle>
              <CardDescription className="text-sm">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                {tool.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full group-hover:bg-primary/90">
                <Link to={tool.path} className="flex items-center gap-2">
                  Launch
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

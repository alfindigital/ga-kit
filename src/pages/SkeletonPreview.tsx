import { UTMBuilderSkeleton } from '@/components/skeletons';
import { KeywordCombinerSkeleton } from '@/components/skeletons';
import { ROASCalculatorSkeleton } from '@/components/skeletons';
import { YTFinderSkeleton } from '@/components/skeletons';

export default function SkeletonPreview() {
  return (
    <div className="space-y-16">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-semibold">UTM Builder Skeleton</p>
        <UTMBuilderSkeleton />
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-semibold">Keyword Combiner Skeleton</p>
        <KeywordCombinerSkeleton />
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-semibold">ROAS Calculator Skeleton</p>
        <ROASCalculatorSkeleton />
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-semibold">YT Finder Skeleton</p>
        <YTFinderSkeleton />
      </div>
    </div>
  );
}

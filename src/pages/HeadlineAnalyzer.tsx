import { useState, useMemo } from 'react';
import { ToolPageHeader } from '@/components/ToolPageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useClipboard } from '@/hooks/useClipboard';
import { ToolPageSkeleton } from '@/components/skeletons';
import { toast } from 'sonner';
import {
  RotateCcw, Sparkles, Trophy, AlertTriangle, CheckCircle2,
  Type, Zap, Heart, Target, BarChart3, ArrowRightLeft, Copy, Lightbulb,
} from 'lucide-react';

// ── Power words by category ──
const POWER_WORDS = {
  urgency: ['now', 'today', 'hurry', 'limited', 'fast', 'instant', 'quick', 'immediately', 'deadline', 'expires', 'last chance', 'don\'t miss', 'act now', 'rush', 'running out', 'sekarang', 'segera', 'cepat', 'terbatas', 'buruan'],
  curiosity: ['secret', 'discover', 'revealed', 'hidden', 'unlock', 'surprising', 'shocking', 'unbelievable', 'mystery', 'insider', 'rahasia', 'temukan', 'terungkap', 'tersembunyi'],
  value: ['free', 'save', 'bonus', 'exclusive', 'premium', 'guaranteed', 'proven', 'best', 'top', 'ultimate', 'gratis', 'hemat', 'bonus', 'eksklusif', 'terbaik', 'diskon'],
  trust: ['official', 'certified', 'trusted', 'verified', 'authentic', 'reliable', 'safe', 'secure', 'professional', 'expert', 'resmi', 'terpercaya', 'aman', 'profesional'],
  emotion: ['amazing', 'incredible', 'powerful', 'love', 'beautiful', 'brilliant', 'stunning', 'life-changing', 'transform', 'dream', 'luar biasa', 'menakjubkan', 'impian'],
};

const CTA_WORDS = ['buy', 'get', 'try', 'start', 'join', 'sign up', 'subscribe', 'download', 'learn', 'shop', 'order', 'claim', 'grab', 'explore', 'book', 'call', 'click', 'register', 'beli', 'dapatkan', 'coba', 'mulai', 'gabung', 'daftar', 'unduh', 'pelajari', 'pesan', 'klaim'];

const EMOTIONAL_TRIGGERS = ['you', 'your', 'because', 'imagine', 'new', 'finally', 'introducing', 'announcing', 'kamu', 'anda', 'karena', 'bayangkan', 'baru', 'akhirnya'];

interface HeadlineScore {
  overall: number;
  length: { score: number; charCount: number; wordCount: number; feedback: string };
  powerWords: { score: number; found: string[]; category: string; feedback: string };
  cta: { score: number; found: string[]; feedback: string };
  emotion: { score: number; found: string[]; feedback: string };
  capitalization: { score: number; feedback: string };
  numbers: { score: number; hasNumber: boolean; feedback: string };
}

function analyzeHeadline(headline: string): HeadlineScore {
  const text = headline.trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const charCount = text.length;
  const wordCount = words.length;

  // 1. Length score (ideal: 6-12 words, 40-70 chars for ads)
  let lengthScore = 0;
  let lengthFeedback = '';
  if (charCount === 0) {
    lengthFeedback = 'headline.feedback.empty';
  } else if (charCount >= 25 && charCount <= 30) {
    lengthScore = 100; lengthFeedback = 'headline.feedback.lengthPerfect';
  } else if (charCount >= 20 && charCount <= 40) {
    lengthScore = 85; lengthFeedback = 'headline.feedback.lengthGood';
  } else if (charCount >= 10 && charCount <= 60) {
    lengthScore = 60; lengthFeedback = 'headline.feedback.lengthOk';
  } else if (charCount < 10) {
    lengthScore = 30; lengthFeedback = 'headline.feedback.lengthShort';
  } else {
    lengthScore = 40; lengthFeedback = 'headline.feedback.lengthLong';
  }

  // 2. Power words
  const foundPower: string[] = [];
  let topCategory = '';
  let maxCatCount = 0;
  for (const [cat, wordList] of Object.entries(POWER_WORDS)) {
    let catCount = 0;
    for (const w of wordList) {
      if (lower.includes(w)) { foundPower.push(w); catCount++; }
    }
    if (catCount > maxCatCount) { maxCatCount = catCount; topCategory = cat; }
  }
  const powerScore = Math.min(100, foundPower.length * 30);
  const powerFeedback = foundPower.length === 0
    ? 'headline.feedback.noPower'
    : foundPower.length >= 3
      ? 'headline.feedback.powerExcellent'
      : 'headline.feedback.powerGood';

  // 3. CTA
  const foundCta = CTA_WORDS.filter(w => lower.includes(w));
  const ctaScore = foundCta.length > 0 ? (foundCta.length >= 2 ? 100 : 75) : 0;
  const ctaFeedback = foundCta.length === 0
    ? 'headline.feedback.noCta'
    : 'headline.feedback.ctaFound';

  // 4. Emotional triggers
  const foundEmotion = EMOTIONAL_TRIGGERS.filter(w => {
    const regex = new RegExp(`\\b${w}\\b`, 'i');
    return regex.test(lower);
  });
  const emotionScore = Math.min(100, foundEmotion.length * 35);
  const emotionFeedback = foundEmotion.length === 0
    ? 'headline.feedback.noEmotion'
    : 'headline.feedback.emotionFound';

  // 5. Capitalization (title case is best)
  const titleCaseWords = words.filter(w => /^[A-Z]/.test(w));
  const titleCaseRatio = wordCount > 0 ? titleCaseWords.length / wordCount : 0;
  const capScore = titleCaseRatio >= 0.6 ? 100 : titleCaseRatio >= 0.3 ? 60 : 30;
  const capFeedback = capScore >= 80
    ? 'headline.feedback.capGood'
    : 'headline.feedback.capImprove';

  // 6. Numbers
  const hasNumber = /\d/.test(text);
  const numberScore = hasNumber ? 100 : 0;
  const numberFeedback = hasNumber
    ? 'headline.feedback.numberFound'
    : 'headline.feedback.noNumber';

  // Overall weighted score
  const overall = Math.round(
    lengthScore * 0.2 +
    powerScore * 0.25 +
    ctaScore * 0.2 +
    emotionScore * 0.15 +
    capScore * 0.1 +
    numberScore * 0.1
  );

  return {
    overall,
    length: { score: lengthScore, charCount, wordCount, feedback: lengthFeedback },
    powerWords: { score: powerScore, found: foundPower, category: topCategory, feedback: powerFeedback },
    cta: { score: ctaScore, found: foundCta, feedback: ctaFeedback },
    emotion: { score: emotionScore, found: foundEmotion, feedback: emotionFeedback },
    capitalization: { score: capScore, feedback: capFeedback },
    numbers: { score: numberScore, hasNumber, feedback: numberFeedback },
  };
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreGrade(score: number) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function getProgressColor(score: number) {
  if (score >= 80) return '[&>div]:bg-green-500';
  if (score >= 50) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-red-500';
}

export default function HeadlineAnalyzer() {
  const isLoading = usePageLoading(300);
  const { t } = useTranslation();
  const { copy } = useClipboard();
  const [headlineA, setHeadlineA] = useState('');
  const [headlineB, setHeadlineB] = useState('');

  const scoreA = useMemo(() => analyzeHeadline(headlineA), [headlineA]);
  const scoreB = useMemo(() => analyzeHeadline(headlineB), [headlineB]);

  const handleSample = () => {
    setHeadlineA('Get 50% Off Today — Limited Time Offer!');
    setHeadlineB('Our Products Are Available For Purchase');
    toast.success(t('common.sampleLoaded'));
  };

  const handleReset = () => {
    setHeadlineA('');
    setHeadlineB('');
    toast.success(t('common.resetComplete'));
  };

  if (isLoading) return <ToolPageSkeleton />;

  const winner = headlineA && headlineB
    ? scoreA.overall > scoreB.overall ? 'A' : scoreA.overall < scoreB.overall ? 'B' : 'tie'
    : null;

  const ScoreCard = ({ label, headline, score, variant }: {
    label: string; headline: string; score: HeadlineScore; variant: 'a' | 'b';
  }) => {
    const isEmpty = headline.trim().length === 0;
    const grade = getScoreGrade(score.overall);
  const colorClass = variant === 'a' ? 'border-l-primary' : 'border-l-accent';

    const criteria = [
      { icon: Type, label: t('headline.length' as any), score: score.length.score, feedback: t(score.length.feedback as any), detail: `${score.length.charCount} ${t('common.characters')} · ${score.length.wordCount} ${t('headline.words' as any)}` },
      { icon: Zap, label: t('headline.powerWords' as any), score: score.powerWords.score, feedback: t(score.powerWords.feedback as any), detail: score.powerWords.found.length > 0 ? score.powerWords.found.join(', ') : '' },
      { icon: Target, label: t('headline.cta' as any), score: score.cta.score, feedback: t(score.cta.feedback as any), detail: score.cta.found.length > 0 ? score.cta.found.join(', ') : '' },
      { icon: Heart, label: t('headline.emotionalTriggers' as any), score: score.emotion.score, feedback: t(score.emotion.feedback as any), detail: score.emotion.found.length > 0 ? score.emotion.found.join(', ') : '' },
      { icon: Type, label: t('headline.capitalization' as any), score: score.capitalization.score, feedback: t(score.capitalization.feedback as any), detail: '' },
      { icon: BarChart3, label: t('headline.numbers' as any), score: score.numbers.score, feedback: t(score.numbers.feedback as any), detail: '' },
    ];

    return (
      <Card className={cn('border-l-4', colorClass)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{label}</CardTitle>
            {!isEmpty && (
              <div className="flex items-center gap-2">
                <span className={cn('text-2xl font-bold', getScoreColor(score.overall))}>{score.overall}</span>
                <Badge variant={score.overall >= 70 ? 'default' : score.overall >= 40 ? 'secondary' : 'destructive'}>
                  {grade}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t('headline.enterHeadline')}</p>
          ) : (
            <>
              <div className="rounded-lg bg-muted/50 p-3 border">
                <p className="text-sm font-medium break-words">{headline}</p>
              </div>
              <Progress value={score.overall} className={cn('h-2', getProgressColor(score.overall))} />
              <div className="space-y-3">
                {criteria.map((c, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <c.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{c.label}</span>
                      </div>
                      <span className={cn('text-sm font-bold', getScoreColor(c.score))}>{c.score}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">{c.feedback}</p>
                    {c.detail && (
                      <div className="ml-6 flex flex-wrap gap-1">
                        {c.detail.split(', ').map((item, j) => (
                          <Badge key={j} variant="outline" className="text-xs">{item}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <ToolPageHeader
        title={t('tool.headlineAnalyzer')}
        description={t('tool.headlineAnalyzer.desc')}
        icon={Sparkles}
      />

      <Tabs defaultValue="ab" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ab" className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            {t('headline.abCompare')}
          </TabsTrigger>
          <TabsTrigger value="tips" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            {t('headline.tips')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ab" className="space-y-4">
          {/* Input area */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('headline.inputTitle')}</CardTitle>
              <CardDescription>{t('headline.inputDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Badge className="bg-primary">A</Badge>
                    {t('headline.headlineA')}
                  </label>
                  <Textarea
                    value={headlineA}
                    onChange={(e) => setHeadlineA(e.target.value)}
                    placeholder={t('headline.placeholderA')}
                    rows={2}
                    maxLength={200}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">{headlineA.length}/200</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Badge variant="secondary" className="bg-accent text-accent-foreground">B</Badge>
                    {t('headline.headlineB')}
                  </label>
                  <Textarea
                    value={headlineB}
                    onChange={(e) => setHeadlineB(e.target.value)}
                    placeholder={t('headline.placeholderB')}
                    rows={2}
                    maxLength={200}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">{headlineB.length}/200</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleSample} className="gap-2">
                  <Sparkles className="h-4 w-4" /> {t('common.sample')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> {t('common.reset')}
                </Button>
                {headlineA && (
                  <Button variant="outline" size="sm" onClick={() => copy(`A: ${headlineA}\nB: ${headlineB}`)} className="gap-2">
                    <Copy className="h-4 w-4" /> {t('common.copy')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Winner banner */}
          {winner && winner !== 'tie' && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex items-center gap-3 pt-6">
                <Trophy className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <p className="font-medium">
                    {t('headline.winner')}: {t('headline.headline')} {winner}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('headline.winnerDesc', {
                      winner,
                      scoreA: scoreA.overall.toString(),
                      scoreB: scoreB.overall.toString(),
                    } as any)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {winner === 'tie' && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="flex items-center gap-3 pt-6">
                <ArrowRightLeft className="h-6 w-6 text-warning shrink-0" />
                <div>
                  <p className="font-medium">{t('headline.tie')}</p>
                  <p className="text-sm text-muted-foreground">{t('headline.tieDesc')}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Score cards side by side */}
          <div className="grid gap-4 sm:grid-cols-2">
            <ScoreCard label={`${t('headline.headline')} A`} headline={headlineA} score={scoreA} variant="a" />
            <ScoreCard label={`${t('headline.headline')} B`} headline={headlineB} score={scoreB} variant="b" />
          </div>
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                {t('headline.tipsTitle')}
              </CardTitle>
              <CardDescription>{t('headline.tipsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: Type, title: t('headline.tipLength'), desc: t('headline.tipLengthDesc') },
                { icon: Zap, title: t('headline.tipPower'), desc: t('headline.tipPowerDesc') },
                { icon: Target, title: t('headline.tipCta'), desc: t('headline.tipCtaDesc') },
                { icon: Heart, title: t('headline.tipEmotion'), desc: t('headline.tipEmotionDesc') },
                { icon: BarChart3, title: t('headline.tipNumbers'), desc: t('headline.tipNumbersDesc') },
                { icon: CheckCircle2, title: t('headline.tipCapitalization'), desc: t('headline.tipCapitalizationDesc') },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
                  <tip.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{tip.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Power words reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('headline.powerWordsRef')}</CardTitle>
              <CardDescription>{t('headline.powerWordsRefDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(POWER_WORDS).map(([cat, words]) => (
                <div key={cat}>
                  <p className="text-sm font-medium capitalize mb-1.5">{t(`headline.cat.${cat}` as any)}</p>
                  <div className="flex flex-wrap gap-1">
                    {words.filter(w => /^[a-z]/.test(w)).slice(0, 10).map(w => (
                      <Badge key={w} variant="outline" className="text-xs">{w}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

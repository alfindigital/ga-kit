import { useTranslation } from '@/hooks/useTranslation';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="sticky bottom-0 z-40 gradient-border bg-background/95 backdrop-blur-md">
      <div className="container py-5 flex items-center justify-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-ga-indigo">
          <span className="text-primary-foreground text-[10px] font-bold">GA</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {t('footer.tagline')}
        </span>
      </div>
    </footer>
  );
}

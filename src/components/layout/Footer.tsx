export function Footer() {
  return (
    <footer className="mt-auto gradient-border">
      <div className="container py-5 flex items-center justify-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-ga-indigo">
          <span className="text-primary-foreground text-[10px] font-bold">GA</span>
        </div>
        <span className="text-sm text-muted-foreground">
          GAtool.site – concept v1
        </span>
      </div>
    </footer>
  );
}

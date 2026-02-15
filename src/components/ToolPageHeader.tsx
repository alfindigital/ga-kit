import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ToolPageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Tailwind color class for the icon bubble, e.g. "bg-primary/10 text-primary" */
  iconColor?: string;
  /** Gradient CSS classes for the accent bar */
  accentGradient?: string;
  children?: ReactNode; // action buttons
}

export function ToolPageHeader({
  icon: Icon,
  title,
  description,
  iconColor = 'bg-primary/10 text-primary',
  accentGradient = 'from-primary to-accent',
  children,
}: ToolPageHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 sm:p-2.5 rounded-xl transition-transform duration-300 tool-icon",
            iconColor
          )}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2 flex-wrap">
            {children}
          </div>
        )}
      </div>
      {/* Gradient accent line */}
      <div className={cn(
        "h-0.5 rounded-full bg-gradient-to-r opacity-60",
        accentGradient
      )} />
    </div>
  );
}

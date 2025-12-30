import { LucideIcon, FileSearch, AlertCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  variant?: 'default' | 'search' | 'error';
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  variant = 'default',
  className,
  children 
}: EmptyStateProps) {
  const getIcon = () => {
    if (icon) return icon;
    switch (variant) {
      case 'search': return FileSearch;
      case 'error': return AlertCircle;
      default: return Inbox;
    }
  };

  const Icon = getIcon();
  
  const variantStyles = {
    default: 'text-muted-foreground',
    search: 'text-muted-foreground',
    error: 'text-destructive',
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-8 px-4 text-center',
      className
    )}>
      <div className={cn(
        'w-16 h-16 rounded-full flex items-center justify-center mb-4',
        variant === 'error' ? 'bg-destructive/10' : 'bg-muted'
      )}>
        <Icon className={cn('w-8 h-8', variantStyles[variant])} />
      </div>
      <h3 className={cn(
        'font-medium text-sm sm:text-base mb-1',
        variantStyles[variant]
      )}>
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground max-w-[250px]">
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

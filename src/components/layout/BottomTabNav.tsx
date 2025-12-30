import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard,
  Link2,
  Combine,
  Wrench,
  QrCode,
} from 'lucide-react';

const tabItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/utm-builder', label: 'UTM', icon: Link2 },
  { path: '/keyword-combiner', label: 'Combine', icon: Combine },
  { path: '/keyword-tools', label: 'Tools', icon: Wrench },
  { path: '/qr-generator', label: 'QR', icon: QrCode },
];

export function BottomTabNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 safe-area-bottom animate-slide-up">
      <div className="flex items-center justify-around h-14 sm:h-16 max-w-lg mx-auto">
        {tabItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 active:scale-95",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full animate-scale-in" />
              )}
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-200",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

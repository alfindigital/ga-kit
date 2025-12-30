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
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

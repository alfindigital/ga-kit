import { Header } from './Header';
import { Footer } from './Footer';
import { BottomTabNav } from './BottomTabNav';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-6 pb-20 lg:pb-6">
        {children}
      </main>
      <Footer />
      <BottomTabNav />
    </div>
  );
}

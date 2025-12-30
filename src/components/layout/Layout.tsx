import { Header } from './Header';
import { Footer } from './Footer';
import { BottomTabNav } from './BottomTabNav';
import { PageTransition } from '../PageTransition';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background">
      <Header />
      <main className="flex-1 container px-3 sm:px-4 lg:px-6 py-4 sm:py-6 pb-20 lg:pb-6">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer />
      <BottomTabNav />
    </div>
  );
}

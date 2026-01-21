import { ReactNode } from 'react';
import { MobileNav } from './MobileNav';

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppLayout({ children, hideNav = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className={hideNav ? '' : 'pb-20 md:pb-0'}>
        {children}
      </main>
      {!hideNav && <MobileNav />}
    </div>
  );
}

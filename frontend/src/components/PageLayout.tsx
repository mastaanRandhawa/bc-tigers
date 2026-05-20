import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className="min-h-dvh min-h-screen flex flex-col w-full overflow-x-hidden">
      <Navbar />
      <main className={`flex-1 w-full min-w-0 ${className ?? ''}`}>{children}</main>
      <Footer />
    </div>
  );
}

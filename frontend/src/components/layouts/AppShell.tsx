import { cn } from '@/lib/utils';

import Navbar from '@/components/Navbar';

import Footer from '@/components/Footer';



interface AppShellProps {

  children: React.ReactNode;

  className?: string;

  subNav?: React.ReactNode;

  showFooter?: boolean;

  heroTheme?: boolean;

}



export default function AppShell({

  children,

  className,

  subNav,

  showFooter = true,

  heroTheme = false,

}: AppShellProps) {

  return (

    <div

      className={cn(

        'min-h-dvh min-h-screen flex flex-col w-full overflow-x-hidden',

        heroTheme ? 'bg-primary' : 'bg-surface-muted'

      )}

    >

      <Navbar variant={heroTheme ? 'hero' : 'default'} />

      {subNav}

      <main className={cn('flex-1 w-full min-w-0', className)}>{children}</main>

      {showFooter && <Footer />}

    </div>

  );

}


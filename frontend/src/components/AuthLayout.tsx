import type { ReactNode } from 'react';
import PageLayout from './PageLayout';
import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <PageLayout className="bg-[#0038FF] selection:bg-[#CCFF00] selection:text-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="bg-[#CCFF00] p-2 rounded-2xl">
            <Trophy className="w-6 h-6 text-black" />
          </div>
          <div className="flex items-center">
            <span className="font-black text-white text-2xl tracking-tight">BC</span>
            <span className="font-black text-[#CCFF00] text-2xl tracking-tight">TIGERS</span>
          </div>
        </Link>

        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </PageLayout>
  );
}

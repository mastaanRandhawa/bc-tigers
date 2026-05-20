import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon: Icon, children }: PageHeaderProps) {
  return (
    <div className="bg-[#0038FF] text-white py-12 sm:py-16 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {Icon && <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-[#CCFF00] flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <h1
              className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter text-[#CCFF00] break-words"
              style={{ fontFamily: '"Arial Black", Impact, sans-serif', textShadow: '4px 4px 0 #001A99' }}
            >
              {title}
            </h1>
            {subtitle && <p className="text-white/80 text-base sm:text-lg mt-2 sm:mt-3">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

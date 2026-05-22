import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface AnimatedTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface AnimatedTabsProps {
  tabs: AnimatedTab[];
  defaultTab?: string;
  className?: string;
}

export function AnimatedTabs({ tabs, defaultTab, className }: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab ?? tabs[0]?.id ?? '');

  if (!tabs.length) return null;

  const active = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div className={cn('flex w-full flex-col gap-y-3', className)}>
      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-zinc-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative rounded-lg px-3 py-1.5 text-sm font-medium outline-none transition-colors',
              activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 rounded-lg bg-white shadow-sm"
                transition={{ type: 'spring', duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>
      <motion.div
        key={active.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {active.content}
      </motion.div>
    </div>
  );
}

export default AnimatedTabs;

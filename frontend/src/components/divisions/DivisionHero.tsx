import { useState } from 'react';
import { Pencil, CalendarClock } from 'lucide-react';
import type { Division } from '@/types';
import type { DivisionTheme } from '@/lib/division-theme';
import { themeChipStyle } from '@/lib/division-theme';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';
import { AdminActionButton } from '@/components/admin/inline/AdminActionButton';
import DivisionFormDialog from '@/components/admin/forms/DivisionFormDialog';
import { useGenerateSchedule } from '@/hooks/useDivisions';

interface DivisionHeroProps {
  division: Division;
  theme: DivisionTheme;
}

export default function DivisionHero({ division, theme }: DivisionHeroProps) {
  const canEdit = useCanAdminEdit();
  const [editOpen, setEditOpen] = useState(false);
  const generateSchedule = useGenerateSchedule();
  const [genPending, setGenPending] = useState(false);

  const handleGenerateSchedule = async () => {
    if (!confirm('Generate schedule for this division? Existing scheduled matches will not be overwritten unless you choose "force".')) return;
    setGenPending(true);
    try {
      await generateSchedule.mutateAsync({ id: division.id });
    } catch {
      alert('Failed to generate schedule.');
    } finally {
      setGenPending(false);
    }
  };

  return (
    <div className="page-container relative z-10 pt-3 pb-4">
      <div className="flex items-start gap-3">
        {/* Division color swatch */}
        <div
          className="theme-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
          style={themeChipStyle(theme)}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7" fill="none">
            <circle cx="12" cy="12" r="9" stroke={theme.primary} strokeWidth="1.5" />
            <circle cx="12" cy="12" r="2.5" fill={theme.primary} />
            <path
              d="M12 3 L12 6.5M12 17.5 L12 21M3 12 L6.5 12M17.5 12 L21 12"
              stroke={theme.primary}
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.4"
            />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <h1
            className="division-hero-headline truncate text-2xl sm:text-3xl md:text-4xl"
            style={{ color: theme.primary }}
          >
            {division.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {division.age_group && (
              <span className="division-badge">{division.age_group}</span>
            )}
            <span className="division-badge">{division.gender}</span>
            <span className="division-badge">{division.format}</span>
          </div>
        </div>

        {/* Admin actions */}
        {canEdit && (
          <div className="flex shrink-0 items-center gap-1.5 pt-1">
            <AdminActionButton size="xs" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3 w-3" />
              Edit
            </AdminActionButton>
            <AdminActionButton
              size="xs"
              variant="ghost"
              onClick={handleGenerateSchedule}
              disabled={genPending}
              title="Generate match schedule"
            >
              <CalendarClock className="h-3 w-3" />
              {genPending ? 'Generating…' : 'Schedule'}
            </AdminActionButton>
          </div>
        )}
      </div>

      <DivisionFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        division={division}
      />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAdminSettings, useUpdateSettings } from '@/hooks/useSettings';
import { Save, Globe, Lock } from 'lucide-react';
import type { SiteSettings } from '@/types';
import { toast } from 'sonner';
import { formatDateTime, fromDatetimeLocalValue, toDatetimeLocalValue } from '@/lib/utils';

export function SiteInformationCard() {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState<Partial<SiteSettings>>({});
  const [scheduledLocal, setScheduledLocal] = useState('');
  const [publicScheduledLocal, setPublicScheduledLocal] = useState('');

  useEffect(() => {
    if (settings) {
      setForm(settings);
      setScheduledLocal(toDatetimeLocalValue(settings.coach_lock_scheduled_at));
      setPublicScheduledLocal(
        toDatetimeLocalValue(settings.rosters_public_scheduled_at),
      );
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        ...form,
        coach_lock_scheduled_at: fromDatetimeLocalValue(scheduledLocal),
        rosters_public_scheduled_at:
          fromDatetimeLocalValue(publicScheduledLocal),
      });
      toast.success('Site information saved.');
    } catch {
      toast.error('Failed to save site information.');
    }
  };

  const scheduleDirty =
    scheduledLocal !== toDatetimeLocalValue(settings?.coach_lock_scheduled_at);
  const scheduledPending = scheduleDirty
    ? false
    : (settings?.coach_lock_scheduled_pending ?? false);
  const scheduledActive = scheduleDirty
    ? false
    : (settings?.coach_lock_scheduled_active ?? false);
  const effectiveLocked =
    (form.coach_management_locked ?? false) ||
    (settings?.coach_lock_effective ?? false);

  const publicScheduleDirty =
    publicScheduledLocal !==
    toDatetimeLocalValue(settings?.rosters_public_scheduled_at);
  const publicScheduledPending = publicScheduleDirty
    ? false
    : (settings?.rosters_public_scheduled_pending ?? false);
  const publicScheduledActive = publicScheduleDirty
    ? false
    : (settings?.rosters_public_scheduled_active ?? false);
  const effectivePublic =
    (form.rosters_public ?? false) ||
    (settings?.rosters_public_effective ?? false);

  if (isLoading) {
    return (
      <div className="admin-card p-4 text-sm text-muted-foreground">Loading site settings…</div>
    );
  }

  return (
    <div className="admin-card">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <Globe className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="text-subsection m-0">Site Information</h2>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Site Name</Label>
            <Input
              value={form.site_name ?? ''}
              onChange={(e) => setForm({ ...form, site_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Contact Email</Label>
            <Input
              type="email"
              value={form.contact_email ?? ''}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Contact Phone</Label>
            <Input
              value={form.contact_phone ?? ''}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Contact Address</Label>
            <Input
              value={form.contact_address ?? ''}
              onChange={(e) => setForm({ ...form, contact_address: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max_players_per_team">Max players per team</Label>
            <Input
              id="max_players_per_team"
              type="number"
              min={1}
              max={99}
              value={form.max_players_per_team ?? 25}
              onChange={(e) =>
                setForm({
                  ...form,
                  max_players_per_team: Math.max(1, parseInt(e.target.value, 10) || 25),
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Applies to all teams when admins or coaches add players to a roster.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground m-0">Global coach lock</h3>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Lock immediately</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Prevents all coaches from editing team details and rosters. Does not change
                whether rosters are shown publicly.
              </p>
            </div>
            <Switch
              checked={form.coach_management_locked ?? false}
              onCheckedChange={(checked) =>
                setForm({ ...form, coach_management_locked: checked })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coach_lock_scheduled_at">Schedule lock date &amp; time</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="coach_lock_scheduled_at"
                type="datetime-local"
                value={scheduledLocal}
                onChange={(e) => setScheduledLocal(e.target.value)}
                className="max-w-xs"
              />
              {scheduledLocal && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScheduledLocal('')}
                >
                  Clear schedule
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Coaches will be locked automatically at this date and time (your local timezone).
              Save settings to apply. When the time passes, the lock turns on automatically.
            </p>
          </div>

          {scheduleDirty && scheduledLocal && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
              <p>Schedule changed — click Save to apply the new lock time.</p>
            </div>
          )}

          {(effectiveLocked || scheduledPending) && !scheduleDirty && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {form.coach_management_locked && <p>Immediate global lock is on.</p>}
              {scheduledPending && settings?.coach_lock_scheduled_at && (
                <p>
                  Scheduled lock activates on{' '}
                  {formatDateTime(settings.coach_lock_scheduled_at)}.
                </p>
              )}
              {scheduledActive && !form.coach_management_locked && (
                <p>Scheduled lock is active — coaches cannot edit until you turn off the lock.</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground m-0">Roster public display</h3>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Show rosters publicly</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Makes team rosters visible to everyone on the public site. Independent of the
                coach lock — coaches can still be locked or unlocked separately.
              </p>
            </div>
            <Switch
              checked={form.rosters_public ?? false}
              onCheckedChange={(checked) =>
                setForm({ ...form, rosters_public: checked })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rosters_public_scheduled_at">Schedule publish date &amp; time</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="rosters_public_scheduled_at"
                type="datetime-local"
                value={publicScheduledLocal}
                onChange={(e) => setPublicScheduledLocal(e.target.value)}
                className="max-w-xs"
              />
              {publicScheduledLocal && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPublicScheduledLocal('')}
                >
                  Clear schedule
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Rosters will be published automatically at this date and time (your local timezone).
              Save settings to apply.
            </p>
          </div>

          {publicScheduleDirty && publicScheduledLocal && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
              <p>Schedule changed — click Save to apply the new publish time.</p>
            </div>
          )}

          {(effectivePublic || publicScheduledPending) && !publicScheduleDirty && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              {form.rosters_public && <p>Rosters are public now.</p>}
              {publicScheduledPending && settings?.rosters_public_scheduled_at && (
                <p>
                  Rosters become public on{' '}
                  {formatDateTime(settings.rosters_public_scheduled_at)}.
                </p>
              )}
              {publicScheduledActive && !form.rosters_public && (
                <p>Scheduled publish is active — rosters are public until you turn this off.</p>
              )}
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          <Save className="h-4 w-4" aria-hidden />
          {updateSettings.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

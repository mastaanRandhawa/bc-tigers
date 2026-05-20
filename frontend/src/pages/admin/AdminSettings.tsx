import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import QueryState from '@/components/shared/QueryState';
import { useAdminSettings, useUpdateSettings } from '@/hooks/useSettings';
import { Save, Globe, Bell, Shield, Database } from 'lucide-react';
import type { SiteSettings } from '@/types';

export default function AdminSettings() {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState<Partial<SiteSettings>>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    await updateSettings.mutateAsync(form);
  };

  const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 p-5 border-b border-border">
        <Icon className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );

  const Toggle = ({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-semibold text-foreground text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-gray-200'} relative`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5 left-0.5' : 'left-0.5'}`} />
      </button>
    </div>
  );

  return (
    <AdminLayout title="Settings">
      <QueryState isLoading={isLoading} isEmpty={!settings}>
        <div className="max-w-3xl space-y-6">
          <Section icon={Globe} title="Tournament">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Site Name</Label>
                <Input value={form.site_name ?? ''} onChange={(e) => setForm({ ...form, site_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Input value={form.timezone ?? ''} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
              </div>
            </div>
          </Section>

          <Section icon={Bell} title="Notifications">
            <Toggle
              label="Email Notifications"
              description="Send email notifications for key events"
              value={!!form.notifications_enabled}
              onChange={(v) => setForm({ ...form, notifications_enabled: v })}
            />
            <Toggle
              label="Live Score Updates"
              description="Enable real-time score push notifications"
              value={!!form.live_score_updates}
              onChange={(v) => setForm({ ...form, live_score_updates: v })}
            />
          </Section>

          <Section icon={Shield} title="Registration">
            <Toggle
              label="Registration Open"
              description="Allow new teams and players to register"
              value={!!form.registration_open}
              onChange={(v) => setForm({ ...form, registration_open: v })}
            />
            <div className="space-y-1.5">
              <Label>Max Teams per Division</Label>
              <Input
                type="number"
                value={form.max_teams_per_division ?? 10}
                onChange={(e) => setForm({ ...form, max_teams_per_division: parseInt(e.target.value) || 10 })}
                className="w-32"
              />
            </div>
          </Section>

          <Section icon={Database} title="Points System">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Win</Label>
                <Input type="number" value={form.points_win ?? 3} onChange={(e) => setForm({ ...form, points_win: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Draw</Label>
                <Input type="number" value={form.points_draw ?? 1} onChange={(e) => setForm({ ...form, points_draw: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Loss</Label>
                <Input type="number" value={form.points_loss ?? 0} onChange={(e) => setForm({ ...form, points_loss: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </Section>

          <Button onClick={handleSave} size="lg" disabled={updateSettings.isPending}>
            <Save className="w-4 h-4" /> {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </QueryState>
    </AdminLayout>
  );
}

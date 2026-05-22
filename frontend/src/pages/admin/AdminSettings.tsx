import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import QueryState from '@/components/shared/QueryState';
import { useAdminSettings, useUpdateSettings } from '@/hooks/useSettings';
import { Save, Globe, Bell, Shield } from 'lucide-react';
import type { SiteSettings } from '@/types';

function SettingsSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="admin-card">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Icon className="w-4 h-4 text-primary" aria-hidden />
        <h2 className="text-subsection m-0">{title}</h2>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function SettingsToggle({ label, description, value, onChange }: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold text-foreground text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={value} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

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

  return (
    <AdminLayout title="Settings">
      <QueryState isLoading={isLoading} isEmpty={!settings}>
        <div className="max-w-3xl space-y-5">
          <SettingsSection icon={Globe} title="Tournament">
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
          </SettingsSection>

          <SettingsSection icon={Bell} title="Notifications">
            <SettingsToggle
              label="Email Notifications"
              description="Send email notifications for key events"
              value={!!form.notifications_enabled}
              onChange={(v) => setForm({ ...form, notifications_enabled: v })}
            />
            <SettingsToggle
              label="Live Score Updates"
              description="Enable real-time score push notifications"
              value={!!form.live_score_updates}
              onChange={(v) => setForm({ ...form, live_score_updates: v })}
            />
          </SettingsSection>

          <SettingsSection icon={Shield} title="Registration">
            <SettingsToggle
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
          </SettingsSection>

          <p className="text-sm text-muted-foreground">
            Standings points are configured per division under Admin → Divisions → Edit.
          </p>

          <Button onClick={handleSave} size="lg" disabled={updateSettings.isPending}>
            <Save className="w-4 h-4" aria-hidden /> {updateSettings.isPending ? 'Saving…' : 'Save Settings'}
          </Button>
        </div>
      </QueryState>
    </AdminLayout>
  );
}

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAdminSettings, useUpdateSettings } from '@/hooks/useSettings';
import { Save, Globe } from 'lucide-react';
import type { SiteSettings } from '@/types';
import { toast } from 'sonner';

export function SiteInformationCard() {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState<Partial<SiteSettings>>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(form);
      toast.success('Site information saved.');
    } catch {
      toast.error('Failed to save site information.');
    }
  };

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
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          <Save className="h-4 w-4" aria-hidden />
          {updateSettings.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { getRoleLabel } from '@/lib/auth-utils';
import { isAxiosError } from 'axios';
import { Save, KeyRound } from 'lucide-react';
import PageLoader from '@/components/shared/PageLoader';

export default function ProfilePage() {
  const { user, refreshUser } = useAuthStore();
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    profile_image: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone ?? '',
        profile_image: user.profile_image ?? '',
      });
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await authService.updateProfile(profile);
      await refreshUser();
      setMessage('Profile updated successfully.');
    } catch {
      setError('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwMessage('');
    if (pw.next.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    setChangingPw(true);
    try {
      const { data } = await authService.changePassword(pw.current, pw.next);
      setPwMessage(data.message ?? 'Password updated successfully.');
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwError(
        isAxiosError(err)
          ? (err.response?.data?.message ?? 'Failed to change password.')
          : 'Failed to change password.',
      );
    } finally {
      setChangingPw(false);
    }
  };

  if (!user) return <PageLoader />;

  return (
    <PageLayout>
      <section className="py-12 px-4 bg-muted min-h-[60vh]">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground mt-1">{user.email} · {getRoleLabel(user.role)}</p>
          </div>

          {message && <div className="p-3 rounded-xl bg-green-50 text-green-700 text-sm">{message}</div>}
          {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

          <form onSubmit={handleProfileSave} className="rounded-lg border border-border bg-card shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Profile Image URL</Label>
              <Input value={profile.profile_image} onChange={(e) => setProfile({ ...profile, profile_image: e.target.value })} />
            </div>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4" /> Save Profile
            </Button>
          </form>

          <form onSubmit={handlePasswordChange} className="rounded-lg border border-border bg-card shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Change Password</h2>
            {pwMessage && <div className="p-3 rounded-xl bg-green-50 text-green-700 text-sm">{pwMessage}</div>}
            {pwError && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{pwError}</div>}
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <PasswordInput
                autoComplete="current-password"
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <PasswordInput
                  autoComplete="new-password"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <PasswordInput
                  autoComplete="new-password"
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" disabled={changingPw}>
              <KeyRound className="w-4 h-4" /> {changingPw ? 'Updating…' : 'Update Password'}
            </Button>
          </form>
        </div>
      </section>
    </PageLayout>
  );
}

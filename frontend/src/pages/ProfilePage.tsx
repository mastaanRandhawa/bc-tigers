import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/PageLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { getRoleLabel } from '@/lib/auth-utils';
import { getCoachTeamPath } from '@/lib/coach-utils';
import { Save, Lock } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuthStore();
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    profile_image: '',
  });
  const [passwords, setPasswords] = useState({ current: '', next: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await authService.changePassword(passwords.current, passwords.next);
      setPasswords({ current: '', next: '' });
      setMessage('Password updated successfully.');
    } catch {
      setError('Failed to update password. Check your current password.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

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

          <form onSubmit={handlePasswordSave} className="rounded-lg border border-border bg-card shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Change Password</h2>
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} required minLength={8} />
            </div>
            <Button type="submit" disabled={saving}>
              <Lock className="w-4 h-4" /> Update Password
            </Button>
          </form>

          {user.role === 'COACH' && (user.coach?.team_coaches?.length ?? 0) > 0 && (
            <div className="rounded-lg border border-border bg-card shadow-sm p-6">
              <h2 className="font-semibold text-foreground mb-2">Your Teams</h2>
              <ul className="space-y-2 m-0 p-0 list-none">
                {user.coach!.team_coaches!.map((tc) => {
                  const team = tc.team;
                  if (!team) return null;
                  const path = getCoachTeamPath(team);
                  return (
                    <li key={tc.id}>
                      {path ? (
                        <Link to={path} className="text-primary font-semibold hover:underline">
                          {team.name}
                        </Link>
                      ) : (
                        <span className="font-semibold">{team.name}</span>
                      )}
                      {team.division?.name && (
                        <span className="text-sm text-muted-foreground ml-2">{team.division.name}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}

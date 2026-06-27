import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AuthLayout from '@/components/AuthLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import { teamsService, type TeamDirectoryEntry } from '@/services/teams.service';
import { getApiErrorMessage } from '@/lib/errors';
import { UserPlus, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function CoachRegisterPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    team_id: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: directory = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['team-directory'],
    queryFn: async () => (await teamsService.directory()).data,
    staleTime: 5 * 60 * 1000,
  });

  // Group teams by division (the API already sorts tournament → division → team).
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; teams: TeamDirectoryEntry[] }>();
    for (const t of directory) {
      const label = `${t.division.name} · ${t.division.tournament.name}`;
      if (!map.has(t.division.id)) map.set(t.division.id, { label, teams: [] });
      map.get(t.division.id)!.teams.push(t);
    }
    return [...map.values()];
  }, [directory]);

  const teamById = useMemo(
    () => new Map(directory.map((t) => [t.id, t])),
    [directory],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const team = teamById.get(form.team_id);
    if (!team) {
      setError('Please select the team you would like to coach.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.registerCoach({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        phone: form.phone.trim(),
        coaching_request: `${team.name} (${team.division.name})`,
      });
      setSubmitted(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout title="Registration Received" subtitle="Your coach account is pending approval">
        <div className="text-center py-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            An administrator will review your account. You will be able to sign in once approved.
          </p>
          <Link to="/login" className="block mt-6 text-sm text-primary font-semibold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Coach Registration" subtitle="Request access to manage your team roster">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="team_id">Team you&apos;d like to coach</Label>
          <select
            id="team_id"
            value={form.team_id}
            onChange={(e) => setForm({ ...form, team_id: e.target.value })}
            required
            disabled={teamsLoading}
            className="h-11 w-full rounded-xl border border-border/80 bg-card px-3 text-sm text-foreground shadow-[var(--shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
          >
            <option value="" disabled>
              {teamsLoading ? 'Loading teams…' : 'Select a team…'}
            </option>
            {groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Pick the team you are requesting to manage. An administrator will review and assign you.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          <UserPlus className="w-4 h-4" />
          {isLoading ? 'Submitting...' : 'Register as Coach'}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { getPostLoginPath } from '@/lib/auth-utils';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const defaultCoach = searchParams.get('coach') === '1';
  const [accountType, setAccountType] = useState<'COACH' | 'VIEWER'>(defaultCoach ? 'COACH' : 'VIEWER');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm: '' });
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      alert('Passwords do not match');
      return;
    }
    try {
      const user = await register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        role: accountType,
      });
      navigate(getPostLoginPath(user));
    } catch {
      // handled by store
    }
  };

  return (
    <AuthLayout
      title={accountType === 'COACH' ? 'Coach registration' : 'Create account'}
      subtitle={accountType === 'COACH' ? 'Create a coach account' : 'Join BC Tigers Soccer'}
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Account type</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAccountType('COACH')}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                accountType === 'COACH'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:bg-zinc-50'
              }`}
            >
              Coach
            </button>
            <button
              type="button"
              onClick={() => setAccountType('VIEWER')}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                accountType === 'VIEWER'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:bg-zinc-50'
              }`}
            >
              Fan / viewer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">First Name</Label>
            <Input id="first_name" value={form.first_name} onChange={handleChange('first_name')} placeholder="John" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name">Last Name</Label>
            <Input id="last_name" value={form.last_name} onChange={handleChange('last_name')} placeholder="Smith" required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" value={form.email} onChange={handleChange('email')} placeholder="you@example.com" required autoComplete="email" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={form.password} onChange={handleChange('password')} placeholder="••••••••" required minLength={8} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm Password</Label>
          <Input id="confirm" type="password" value={form.confirm} onChange={handleChange('confirm')} placeholder="••••••••" required />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          <UserPlus className="w-4 h-4" />
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
      </p>
    </AuthLayout>
  );
}

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { isAdminRole, isCoachRole, getRoleDashboardPath } from '@/lib/auth-utils';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      const user = await login(email, password);
      if (isAdminRole(user.role)) {
        navigate(from?.startsWith('/admin') ? from : '/admin/dashboard', { replace: true });
      } else if (isCoachRole(user.role)) {
        navigate(from?.startsWith('/coach') ? from : '/coach', { replace: true });
      } else {
        navigate(from ?? '/', { replace: true });
      }
    } catch {
      // Error displayed via store
    }
  };

  return (
    <AuthLayout title="Sign In" subtitle="Welcome back to BC Tigers">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <span className="text-xs text-muted-foreground">
              Forgot your password? Reach out to an admin.
            </span>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          <LogIn className="w-4 h-4" />
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Coach?{' '}
        <Link to="/coach/register" className="text-primary font-semibold hover:underline">
          Register for team management
        </Link>
      </p>
    </AuthLayout>
  );
}

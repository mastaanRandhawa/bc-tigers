import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage } from '@/lib/errors';
import { UserPlus, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function CoachRegisterPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    coaching_request: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authService.registerCoach({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        coaching_request: form.coaching_request.trim(),
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
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="coaching_request">Team you&apos;d like to coach</Label>
          <Textarea
            id="coaching_request"
            value={form.coaching_request}
            onChange={(e) => setForm({ ...form, coaching_request: e.target.value })}
            placeholder="e.g. BC Tigers U14 Boys, Miri Piri FC"
            required
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Enter the team name you are requesting to manage. An administrator will review and assign you.
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

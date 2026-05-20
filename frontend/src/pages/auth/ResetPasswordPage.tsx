import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage } from '@/lib/errors';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return;
    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to reset password'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="New Password" subtitle="Enter your new password below">
      {done ? (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="font-black text-gray-900">Password Updated!</h3>
          <p className="text-sm text-gray-500 mt-2">Redirecting to sign in...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required />
            </div>
            {password && confirm && password !== confirm && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={!password || password !== confirm || isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            <Link to="/login" className="text-[#0038FF] font-semibold hover:underline">Back to Sign In</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage } from '@/lib/errors';
import { Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [coachMessage, setCoachMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCoachMessage('');
    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      const message = res.data.message ?? '';
      if (message.includes('administrator')) {
        setCoachMessage(message);
        return;
      }
      setSent(true);
    } catch (err) {
      setCoachMessage(getApiErrorMessage(err, 'Failed to send reset link'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email and we'll send a reset link">
      {coachMessage ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">{coachMessage}</p>
          <Link to="/login" className="block mt-6 text-sm text-primary font-semibold hover:underline">
            Back to Sign In
          </Link>
        </div>
      ) : sent ? (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="font-semibold text-foreground text-lg">Check Your Email</h3>
          <p className="text-sm text-muted-foreground mt-2">
            If <strong>{email}</strong> is registered, check your inbox for a reset link (expires in 1 hour).
          </p>
          <Link to="/login" className="block mt-6 text-sm text-primary font-semibold hover:underline">
            Back to Sign In
          </Link>
        </div>
      ) : (
        <>
          {coachMessage && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">{coachMessage}</div>
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
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              <Mail className="w-4 h-4" /> {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Back to Sign In
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}

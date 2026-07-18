import { useState, type FormEvent } from 'react';
import { Mail, ArrowLeft, MailCheck } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Link, useNavigate } from '../../lib/router';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../lib/toast';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast.error('Could not send email', error);
      return;
    }
    setSent(true);
    toast.success('Reset link sent', 'Check your inbox for a password reset link.');
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a secure link to set a new password.">
      {sent ? (
        <div className="text-center">
          <div className="surface-2 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl">
            <MailCheck className="h-6 w-6 text-accent-500" />
          </div>
          <p className="text-ink-900 dark:text-white mt-4 font-semibold">Check your email</p>
          <p className="text-muted mt-1.5 text-sm">We sent a reset link to <span className="font-medium text-ink-700 dark:text-ink-200">{email}</span>.</p>
          <Button className="mt-6" variant="outline" fullWidth onClick={() => navigate('/login')}>
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            required
            icon={Mail}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Send reset link
          </Button>
        </form>
      )}
      <p className="text-muted mt-6 text-center text-sm">
        Remembered it?{' '}
        <Link to="/login" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}

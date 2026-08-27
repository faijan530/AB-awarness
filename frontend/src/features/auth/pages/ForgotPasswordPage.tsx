import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/hooks/useToast';
import { AuthService } from '@/services/api/auth-service';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  useDocumentTitle('Forgot Password — Abhishek Bhardwaj Media');
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await AuthService.forgotPassword(email);
      setIsSubmitted(true);
      toast.success('Recovery Email Sent', 'If an account exists, a password reset link has been dispatched.');
    } catch (err: any) {
      // Privacy preserving response behavior
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card variant="glass" className="w-full max-w-md p-8 space-y-6 bg-slate-950/90 backdrop-blur-2xl border border-slate-800">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-white font-serif">Forgot Password?</h1>
          <p className="text-xs text-slate-400">
            Enter your registered email address below to receive password recovery instructions.
          </p>
        </div>

        {isSubmitted ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Recovery instructions dispatched to <span className="text-rose-400 font-mono">{email}</span>
            </p>
            <p className="text-xs text-slate-400">
              Please check your email inbox and spam folders.
            </p>
            <Link to="/login" className="block pt-2">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email Address"
              type="email"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error || undefined}
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<Send className="w-4 h-4" />}
            >
              {isLoading ? 'Sending Link...' : 'Send Reset Link'}
            </Button>
          </form>
        )}

        <div className="text-center border-t border-slate-800/80 pt-4">
          <Link to="/login" className="text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </Card>
    </div>
  );
};

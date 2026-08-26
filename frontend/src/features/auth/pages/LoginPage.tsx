import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useToast } from '@/hooks/useToast';
import { Shield, Lock, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  useDocumentTitle('Login');
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Module 1 Auth Shell', 'Full authentication logic will plug in during Module 2.');
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card variant="glass" className="space-y-6 p-8 border-slate-800">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white">Sign In to Platform</h2>
          <p className="text-xs text-slate-400">Access Super Admin or Citizen Contributor desk</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@abmedia.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <Button type="submit" variant="primary" className="w-full">
            Sign In
          </Button>
        </form>

        <p className="text-xs text-center text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-rose-400 font-bold hover:underline">
            Register as Citizen Reporter
          </Link>
        </p>
      </Card>
    </div>
  );
};

import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { useToast } from '@/hooks/useToast';
import { UserCheck, Lock, Mail, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RegisterPage: React.FC = () => {
  useDocumentTitle('Register');
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Module 1 Auth Shell', 'Registration pipeline will plug in during Module 2.');
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card variant="glass" className="space-y-6 p-8 border-slate-800">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white">Join Citizen Journalism</h2>
          <p className="text-xs text-slate-400">Register to submit local news & evidence</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" placeholder="Abhishek Sharma" leftIcon={<User className="w-4 h-4" />} />
          <Input label="Email Address" type="email" placeholder="abhishek@gmail.com" leftIcon={<Mail className="w-4 h-4" />} />
          <Select
            label="Primary District"
            options={[
              { label: 'Palamu District', value: 'palamu' },
              { label: 'Garhwa District', value: 'garhwa' },
              { label: 'Latehar District', value: 'latehar' },
              { label: 'Ranchi', value: 'ranchi' },
            ]}
          />
          <Input label="Password" type="password" placeholder="••••••••" leftIcon={<Lock className="w-4 h-4" />} />

          <Button type="submit" variant="emerald" className="w-full">
            Register Account
          </Button>
        </form>

        <p className="text-xs text-center text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </Card>
    </div>
  );
};

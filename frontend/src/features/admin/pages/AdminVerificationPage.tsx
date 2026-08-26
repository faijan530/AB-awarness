import React from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card } from '@/components/common/Card';
import { ShieldCheck } from 'lucide-react';

export const AdminVerificationPage: React.FC = () => {
  useDocumentTitle('Fact Verification');

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" /> Originality & Fact Verification
        </h1>
        <p className="text-xs text-slate-400">Claim extraction, source verification, and duplicate similarity checks</p>
      </div>

      <Card variant="glass">
        <p className="text-xs text-slate-300">
          Fact verification desk foundation established. Detailed AI decision-support tools will plug in during Module 7.
        </p>
      </Card>
    </div>
  );
};

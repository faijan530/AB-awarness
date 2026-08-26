import React from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card } from '@/components/common/Card';
import { AlertTriangle } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  useDocumentTitle('Reports & Flagged Content');

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-rose-500" /> Flagged Content & Reports
        </h1>
        <p className="text-xs text-slate-400">User reports, abuse flags, and editorial compliance</p>
      </div>

      <Card variant="glass">
        <p className="text-xs text-slate-300">
          Content report desk foundation established. Will plug in during Module 9.
        </p>
      </Card>
    </div>
  );
};

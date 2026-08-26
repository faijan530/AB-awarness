import React from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card } from '@/components/common/Card';
import { Settings } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  useDocumentTitle('System Settings');

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-400" /> Platform System Settings
        </h1>
        <p className="text-xs text-slate-400">Global site configuration, categories, and locations</p>
      </div>

      <Card variant="glass">
        <p className="text-xs text-slate-300">
          System settings foundation established. Will plug in during Module 11 (Analytics & Audit).
        </p>
      </Card>
    </div>
  );
};

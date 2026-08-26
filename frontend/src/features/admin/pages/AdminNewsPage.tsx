import React from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Newspaper } from 'lucide-react';

export const AdminNewsPage: React.FC = () => {
  useDocumentTitle('News Management');

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Newspaper className="w-6 h-6 text-rose-500" /> News Management
        </h1>
        <p className="text-xs text-slate-400">Editorial management, drafts, publishing, and scheduling</p>
      </div>

      <Card variant="glass">
        <p className="text-xs text-slate-300">
          News publishing lifecycle foundation established. Full CRUD features will plug in during Module 5.
        </p>
      </Card>
    </div>
  );
};

import React from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card } from '@/components/common/Card';
import { MessageSquare } from 'lucide-react';

export const AdminCommentsPage: React.FC = () => {
  useDocumentTitle('Comments Moderation');

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-amber-400" /> Comments Moderation
        </h1>
        <p className="text-xs text-slate-400">Review public comments and discussion moderation</p>
      </div>

      <Card variant="glass">
        <p className="text-xs text-slate-300">
          Comments moderation foundation established. Will plug in during Module 9 (Engagement).
        </p>
      </Card>
    </div>
  );
};

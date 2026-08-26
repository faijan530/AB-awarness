import React from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card } from '@/components/common/Card';
import { Image as ImageIcon } from 'lucide-react';

export const AdminMediaPage: React.FC = () => {
  useDocumentTitle('Media Library');

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-sky-400" /> Media Library & Object Storage
        </h1>
        <p className="text-xs text-slate-400">Photos, videos, and document assets repository</p>
      </div>

      <Card variant="glass">
        <p className="text-xs text-slate-300">
          Media library architecture established. CDN and object storage integration will plug in during Module 7.
        </p>
      </Card>
    </div>
  );
};

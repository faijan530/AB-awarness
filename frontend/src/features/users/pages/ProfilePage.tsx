import React from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ImageUploader } from '@/components/media/ImageUploader';
import { UserCheck, MapPin, UploadCloud, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  useDocumentTitle('Citizen Reporter Profile');

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="emerald">Role: USER (Citizen Reporter)</Badge>
            <span className="text-xs text-slate-400 font-mono">Panel 2 — Contributor Portal</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Citizen Contributor Dashboard</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="glass" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center font-bold text-white text-xl">
              AB
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Abhishek Bhardwaj</h3>
              <p className="text-xs text-slate-400">Citizen Journalist</p>
              <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" /> Palamu Division
              </p>
            </div>
          </div>
        </Card>

        <Card variant="glass" className="lg:col-span-2 space-y-4 border-emerald-500/30">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-lg">Submit News or Evidence to Super Admin</h3>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <ImageUploader label="Attach Incident Photo / Evidence" />
            <div className="flex justify-end">
              <Button variant="emerald">Submit to Editorial Desk</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

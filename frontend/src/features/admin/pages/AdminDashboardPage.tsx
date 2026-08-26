import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/hooks/useToast';
import { Shield, Clock, CheckCircle2, AlertTriangle, Users, FileText, Layers, Activity, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { HealthService } from '@/services/api/health-service';

export const AdminDashboardPage: React.FC = () => {
  useDocumentTitle('Super Admin Dashboard');
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: healthData, isSuccess } = useQuery({
    queryKey: ['admin-backend-health'],
    queryFn: () => HealthService.getHealth(),
    refetchInterval: 10000,
    retry: 1,
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="rose" pulse>Role: SUPER_ADMIN</Badge>
            <span className="text-xs text-slate-400 font-mono">Panel 1 — Final Editorial Authority</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1 tracking-tight">Super Admin Editorial Desk</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <Activity className={`w-3.5 h-3.5 ${isSuccess ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-slate-400">PostgreSQL / Redis:</span>
            <span className={isSuccess ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {isSuccess ? 'CONNECTED' : 'STANDBY'}
            </span>
          </div>

          <Button variant="primary" leftIcon={<FileText className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            Quick Create Article
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card variant="glass" hoverEffect className="space-y-2 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Pending Reviews</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white font-mono">18</p>
          <p className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Awaiting Editorial Review
          </p>
        </Card>

        <Card variant="glass" hoverEffect className="space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Published News</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white font-mono">1,240</p>
          <p className="text-[11px] text-emerald-400 font-bold">Active Stories in Feed</p>
        </Card>

        <Card variant="glass" hoverEffect className="space-y-2 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Fact-Check Requests</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-black text-white font-mono">5</p>
          <p className="text-[11px] text-rose-400 font-bold">Originality & Claim Check</p>
        </Card>

        <Card variant="glass" hoverEffect className="space-y-2 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Registered Citizens</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-3xl font-black text-white font-mono">8,450</p>
          <p className="text-[11px] text-sky-400 font-bold">Jharkhand Readers & Reporters</p>
        </Card>
      </div>

      {/* Editorial Review Queue Table */}
      <Card variant="glass" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <Layers className="w-5 h-5 text-rose-500" /> Editorial Review Queue
          </h3>
          <span className="text-xs text-slate-400 font-mono">REST API /api/v1 Connected</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="p-3.5">Title / Headline</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">District</th>
                <th className="p-3.5">Lifecycle State</th>
                <th className="p-3.5 text-right">Editorial Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="p-3.5 font-bold text-slate-100 font-sans">Daltonganj Water Supply Pipeline Repair Update</td>
                <td className="p-3.5 text-emerald-400">Local News</td>
                <td className="p-3.5 text-slate-300">Palamu</td>
                <td className="p-3.5"><Badge variant="amber" pulse>UNDER_REVIEW</Badge></td>
                <td className="p-3.5 text-right space-x-2">
                  <Button variant="emerald" size="sm" onClick={() => toast.success('Approved', 'Story published to public feed')}>
                    Approve
                  </Button>
                </td>
              </tr>
              <tr className="hover:bg-slate-900/60 transition-colors">
                <td className="p-3.5 font-bold text-slate-100 font-sans">Garhwa District Inter-School Athletics Results</td>
                <td className="p-3.5 text-sky-400">Sports</td>
                <td className="p-3.5 text-slate-300">Garhwa</td>
                <td className="p-3.5"><Badge variant="sky" pulse>FACT_CHECK</Badge></td>
                <td className="p-3.5 text-right space-x-2">
                  <Button variant="emerald" size="sm" onClick={() => toast.success('Approved', 'Story published to public feed')}>
                    Approve
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Dialog */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Quick Article Creation Modal">
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            This modal verifies the accessible Modal UI component foundation. Full article creation forms will plug in during Module 5.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>Save Draft</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

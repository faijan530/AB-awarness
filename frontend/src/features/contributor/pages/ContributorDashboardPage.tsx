import React from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery } from '@tanstack/react-query';
import { ContributorService } from '@/services/api/contributor-service';
import { Link } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  Layers,
  MapPin,
  Eye,
  ShieldCheck,
  Edit3
} from 'lucide-react';

export const ContributorDashboardPage: React.FC = () => {
  useDocumentTitle('Contributor Workspace — Reporter Desk');

  const { data, isLoading } = useQuery({
    queryKey: ['my-submissions-dashboard'],
    queryFn: () => ContributorService.getMySubmissions({ limit: 50 }),
  });

  const articles = data?.articles || [];

  const draftsCount = articles.filter((a) => a.status === 'DRAFT').length;
  const pendingCount = articles.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length;
  const revisionCount = articles.filter((a) => a.status === 'REVISION_REQUIRED' || a.status === 'REJECTED').length;
  const approvedCount = articles.filter((a) => a.status === 'APPROVED' || a.status === 'PUBLISHED').length;

  const recentArticles = articles.slice(0, 5);

  return (
    <div className="space-y-8 pb-16">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-500/15 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30">
              REPORTER DESK
            </span>
            <span className="text-xs text-slate-400 font-medium">Jharkhand Citizen Journalism Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            Contributor Workspace
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/contributor/news/create">
            <Button variant="emerald" leftIcon={<Plus className="w-4 h-4" />}>
              Write New Story
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Drafts */}
        <div className="glass-card-user rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Unfinished Drafts</span>
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shadow-inner">
              <Edit3 className="w-4.5 h-4.5" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <p className="text-3xl font-black text-white font-mono tracking-tight">{draftsCount}</p>
          )}
          <span className="text-xs text-slate-400 font-medium">Saved in Local Workspace</span>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-600/50" />
        </div>

        {/* Card 2: Pending Editorial Review */}
        <div className="glass-card-user rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Under Editorial Review</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shadow-inner">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <p className="text-3xl font-black text-white font-mono tracking-tight">{pendingCount}</p>
          )}
          <span className="text-xs text-amber-400 font-medium">Awaiting Super Admin Verification</span>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500/50" />
        </div>

        {/* Card 3: Revision Required */}
        <div className="glass-card-user rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Revision Requested</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <p className="text-3xl font-black text-white font-mono tracking-tight">{revisionCount}</p>
          )}
          <span className="text-xs text-rose-400 font-medium">Editor Remarks Waiting Action</span>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500/50" />
        </div>

        {/* Card 4: Published & Approved */}
        <div className="glass-card-user rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Published Stories</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <p className="text-3xl font-black text-white font-mono tracking-tight">{approvedCount}</p>
          )}
          <span className="text-xs text-emerald-400 font-medium">Live on Public News Portal</span>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/50" />
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="glass-card-user rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-inner">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base">Recent Submissions & Status</h3>
          </div>

          <Link to="/contributor/submissions">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Submissions
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : recentArticles.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Submissions Found"
            description="You haven't written or submitted any citizen news stories yet."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#090d19]/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-200 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Headline Story Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {recentArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-semibold text-slate-100 font-sans max-w-xs truncate">
                      {art.title}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold">
                        {art.category?.name || 'GENERAL'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400" /> {art.location?.name || 'Jharkhand'}
                    </td>
                    <td className="p-4">
                      {art.status === 'PUBLISHED' ? (
                        <Badge variant="emerald">PUBLISHED</Badge>
                      ) : art.status === 'REVISION_REQUIRED' || art.status === 'REJECTED' ? (
                        <Badge variant="rose" pulse>REVISION REQUESTED</Badge>
                      ) : (
                        <Badge variant="amber" pulse>{art.status}</Badge>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <Link to={`/contributor/submissions/${art.id}`}>
                        <Button variant="outline" size="sm" rightIcon={<Eye className="w-3.5 h-3.5" />}>
                          Status Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

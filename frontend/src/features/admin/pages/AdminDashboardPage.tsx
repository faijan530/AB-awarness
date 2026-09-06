import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminNewsService } from '@/services/api/admin-news-service';
import { AdminUserService } from '@/services/api/admin-user-service';
import { CreateNewsModal } from '@/features/news/components/CreateNewsModal';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileText,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  useDocumentTitle('Super Admin Dashboard — Executive Overview');
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 1. Fetch Live Admin News Data
  const { data: newsData, isLoading: isLoadingNews } = useQuery({
    queryKey: ['admin-news-dashboard'],
    queryFn: async () => {
      try {
        const res = await AdminNewsService.getAdminNews({ page: 1, limit: 100 });
        return res;
      } catch (err) {
        return { articles: [], total: 0, page: 1, limit: 100, totalPages: 1 };
      }
    },
  });

  // 2. Fetch Live Registered Users Data
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users-dashboard'],
    queryFn: async () => {
      try {
        const res = await AdminUserService.getUsers({ page: 1, limit: 1 });
        return res;
      } catch (err) {
        return { users: [], total: 0, page: 1, limit: 1, totalPages: 1 };
      }
    },
  });

  // Action Mutation to Approve & Publish Live directly from Dashboard Queue
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await AdminNewsService.approveNews(id);
      return AdminNewsService.publishNews(id);
    },
    onSuccess: () => {
      toast.success('Approved & Published Live!', 'Story is now active on the public user portal.');
      queryClient.invalidateQueries({ queryKey: ['admin-news-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      queryClient.invalidateQueries({ queryKey: ['news-feed'] });
    },
  });

  // Safe data extractions
  const rawArticles = (newsData as any)?.articles || (newsData as any)?.data?.articles || (Array.isArray(newsData) ? newsData : []);
  const articles = Array.isArray(rawArticles) ? rawArticles : [];

  const pendingQueue = articles.filter(
    (a) => a && (a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW')
  );
  const publishedCount = articles.filter((a) => a && a.status === 'PUBLISHED').length;
  const rejectedCount = articles.filter((a) => a && a.status === 'REJECTED').length;

  const totalUsers =
    (usersData as any)?.total ||
    (usersData as any)?.meta?.total ||
    (usersData as any)?.data?.total ||
    (Array.isArray((usersData as any)?.users) ? (usersData as any).users.length : 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/15 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              SUPER ADMIN DESK
            </span>
            <span className="text-xs text-slate-400 font-medium">Live Database Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            Editorial Control Desk
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" leftIcon={<FileText className="w-4 h-4" />} onClick={() => setIsCreateModalOpen(true)}>
            Create Citizen Report
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Pending Reviews */}
        <div className="glass-card-admin rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pending Reviews</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shadow-inner">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          {isLoadingNews ? (
            <Skeleton className="h-9 w-20" />
          ) : (
            <p className="text-3xl font-black text-white font-mono tracking-tight">{pendingQueue.length}</p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Awaiting Verification</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500/50" />
        </div>

        {/* Card 2: Published News */}
        <div className="glass-card-admin rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Published News</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          {isLoadingNews ? (
            <Skeleton className="h-9 w-20" />
          ) : (
            <p className="text-3xl font-black text-white font-mono tracking-tight">{publishedCount}</p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span>Active Stories in Feed</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/50" />
        </div>

        {/* Card 3: Rejected Submissions */}
        <div className="glass-card-admin rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Returned Drafts</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          {isLoadingNews ? (
            <Skeleton className="h-9 w-20" />
          ) : (
            <p className="text-3xl font-black text-white font-mono tracking-tight">{rejectedCount}</p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
            <span>Rejection Remarks Logged</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500/50" />
        </div>

        {/* Card 4: Registered Citizens */}
        <div className="glass-card-admin rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Registered Citizens</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center shadow-inner">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          {isLoadingUsers ? (
            <Skeleton className="h-9 w-20" />
          ) : (
            <p className="text-3xl font-black text-white font-mono tracking-tight">{totalUsers}</p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium">
            <span>Jharkhand Account Holders</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500/50" />
        </div>
      </div>

      {/* Editorial Review Queue Table */}
      <div className="glass-card-admin rounded-2xl space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-indigo-500/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">
              Live Editorial Review Queue
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-indigo-300/80 font-medium bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-500/20">
              {pendingQueue.length} pending verification
            </span>
            <Link to="/admin/news">
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View All News Desk
              </Button>
            </Link>
          </div>
        </div>

        {isLoadingNews ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : pendingQueue.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="w-7 h-7 text-indigo-400" />}
            title="Editorial Queue Clear"
            description="There are currently no pending story submissions awaiting review."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-indigo-500/15 bg-[#090d19]/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-indigo-950/40 text-indigo-200 uppercase font-semibold border-b border-indigo-500/15">
                <tr>
                  <th className="p-4">Headline Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/10 font-medium">
                {pendingQueue.map((art) => (
                  <tr key={art.id} className="hover:bg-indigo-950/30 transition-colors">
                    <td className="p-4 font-semibold text-slate-100 font-sans max-w-xs truncate">
                      {art.title}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {art.category?.name || 'GENERAL'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{art.location?.name || 'Jharkhand'}</td>
                    <td className="p-4 text-slate-300 font-semibold">{art.author?.fullName || 'Citizen'}</td>
                    <td className="p-4">
                      <Badge variant="amber" pulse>{art.status}</Badge>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        variant="emerald"
                        size="sm"
                        isLoading={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(art.id)}
                      >
                        Approve & Publish Live
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Citizen News Submission Modal */}
      <CreateNewsModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
};

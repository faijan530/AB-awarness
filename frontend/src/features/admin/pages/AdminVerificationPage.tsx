import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery } from '@tanstack/react-query';
import {
  VerificationService,
  VerificationDashboardMetrics,
  VerificationQueueItem,
} from '@/services/api/verification-service';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Award,
} from 'lucide-react';

import { useDebounce } from '@/hooks/useDebounce';

export const AdminVerificationPage: React.FC = () => {
  useDocumentTitle('Originality & Fact Verification Desk — Super Admin');

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [page, setPage] = useState(1);
  const limit = 8;

  // 1. Fetch Dashboard Metrics
  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
  } = useQuery<VerificationDashboardMetrics>({
    queryKey: ['admin-verification-metrics'],
    queryFn: () => VerificationService.getAdminDashboard(),
    refetchInterval: 20000,
  });

  // 2. Fetch Verification Queue
  const {
    data: queueData,
    isLoading: isLoadingQueue,
    isRefetching,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ['admin-verification-queue', statusFilter, typeFilter, debouncedSearch, page],
    queryFn: () =>
      VerificationService.getAdminQueue({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        search: debouncedSearch.trim() || undefined,
        page,
        limit,
      }),
    placeholderData: (prev) => prev,
  });

  const handleRefresh = () => {
    refetchMetrics();
    refetchQueue();
  };

  const getDuplicateBadge = (level: string) => {
    switch (level) {
      case 'EXACT_DUPLICATE':
        return <Badge variant="rose">Exact Duplicate (&gt;90%)</Badge>;
      case 'HIGHLY_SIMILAR':
        return <Badge variant="amber">High Similarity (&gt;60%)</Badge>;
      case 'RELATED_STORY':
        return <Badge variant="slate">Related Story</Badge>;
      default:
        return <Badge variant="emerald">Original Content</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge variant="emerald"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> Verified</Badge>;
      case 'IN_REVIEW':
        return <Badge variant="indigo"><Clock className="w-3 h-3 mr-1 inline" /> Editorial Review</Badge>;
      case 'PARTIALLY_VERIFIED':
        return <Badge variant="amber"><AlertTriangle className="w-3 h-3 mr-1 inline" /> Needs Revision</Badge>;
      case 'REJECTED':
        return <Badge variant="rose"><XCircle className="w-3 h-3 mr-1 inline" /> Rejected</Badge>;
      default:
        return <Badge variant="slate"><Clock className="w-3 h-3 mr-1 inline" /> Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black font-serif text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
              Fact Verification & Moderation Desk
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Module 7
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Algorithmic originality scoring, duplicate detection, claim-level evidence verification & editorial review
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isRefetching}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh Desk
          </Button>
          <Link to="/admin/moderation">
            <Button variant="outline" size="sm">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-rose-400" /> Moderation Incidents
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card variant="glass" className="p-4 border-indigo-500/20">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Queue</div>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            {isLoadingMetrics ? <Skeleton className="h-7 w-12" /> : metrics?.totalCount ?? 0}
          </div>
        </Card>

        <Card variant="glass" className="p-4 border-amber-500/20">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> In Review
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">
            {isLoadingMetrics ? <Skeleton className="h-7 w-12" /> : metrics?.inReviewCount ?? 0}
          </div>
        </Card>

        <Card variant="glass" className="p-4 border-emerald-500/20">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">
            {isLoadingMetrics ? <Skeleton className="h-7 w-12" /> : metrics?.verifiedCount ?? 0}
          </div>
        </Card>

        <Card variant="glass" className="p-4 border-orange-500/20">
          <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Revision Req
          </div>
          <div className="text-2xl font-black text-orange-300 mt-1 font-mono">
            {isLoadingMetrics ? <Skeleton className="h-7 w-12" /> : metrics?.needsRevisionCount ?? 0}
          </div>
        </Card>

        <Card variant="glass" className="p-4 border-rose-500/20">
          <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </div>
          <div className="text-2xl font-black text-rose-300 mt-1 font-mono">
            {isLoadingMetrics ? <Skeleton className="h-7 w-12" /> : metrics?.rejectedCount ?? 0}
          </div>
        </Card>

        <Card variant="glass" className="p-4 border-purple-500/20 bg-purple-950/10">
          <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Similarity Alerts
          </div>
          <div className="text-2xl font-black text-purple-300 mt-1 font-mono">
            {isLoadingMetrics ? <Skeleton className="h-7 w-12" /> : metrics?.highSimilarityAlertsCount ?? 0}
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card variant="glass" className="p-4 space-y-3 border-slate-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search verification queue by article title..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {/* Status Pills */}
            {[
              { id: 'ALL', label: 'All Status' },
              { id: 'IN_REVIEW', label: 'In Review' },
              { id: 'VERIFIED', label: 'Verified' },
              { id: 'PARTIALLY_VERIFIED', label: 'Needs Revision' },
              { id: 'REJECTED', label: 'Rejected' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setStatusFilter(s.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === s.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Verification Queue Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Verification Queue ({queueData?.meta?.total ?? 0})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Page {queueData?.meta?.page ?? 1} of {queueData?.meta?.totalPages ?? 1}
          </span>
        </div>

        {isLoadingQueue ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-16 rounded-xl w-full" />
            <Skeleton className="h-16 rounded-xl w-full" />
            <Skeleton className="h-16 rounded-xl w-full" />
          </div>
        ) : queueData?.items.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={ShieldCheck}
              title="Verification Queue Empty"
              description="No articles currently match your selected status or search filter."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {queueData?.items.map((item: VerificationQueueItem) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 hover:bg-slate-850/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(item.verificationStatus)}
                    {getDuplicateBadge(item.duplicateLevel)}
                    <span className="text-[11px] font-mono text-slate-400">
                      Type: <strong className="text-slate-300">{item.verificationType}</strong>
                    </span>
                  </div>

                  <Link to={`/admin/verification/${item.id}`}>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-1 font-serif">
                      {item.articleTitle}
                    </h3>
                  </Link>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>Author: <strong className="text-slate-300">{item.author?.fullName || 'Contributor'}</strong></span>
                    <span>•</span>
                    <span>Claims Extracted: <strong className="text-emerald-400 font-bold">{item.claimsCount}</strong></span>
                    <span>•</span>
                    <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Score Progress Bars */}
                <div className="flex items-center gap-4 shrink-0 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Originality</div>
                    <div className={`text-base font-black font-mono ${item.originalityScore >= 80 ? 'text-emerald-400' : item.originalityScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {item.originalityScore}%
                    </div>
                  </div>

                  <div className="w-px h-8 bg-slate-800" />

                  <div className="text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Fact Support</div>
                    <div className={`text-base font-black font-mono ${item.factSupportScore >= 75 ? 'text-emerald-400' : item.factSupportScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {item.factSupportScore}%
                    </div>
                  </div>

                  <div className="w-px h-8 bg-slate-800" />

                  <div className="text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Composite</div>
                    <div className={`text-base font-black font-mono ${item.overallScore >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {item.overallScore}%
                    </div>
                  </div>

                  <Link to={`/admin/verification/${item.id}`} className="ml-2">
                    <Button variant="primary" size="sm" className="whitespace-nowrap">
                      Inspect & Decide <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {queueData?.meta && queueData.meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between font-mono text-xs text-slate-400 bg-slate-950/40">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span>
              Page {queueData.meta.page} of {queueData.meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= queueData.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

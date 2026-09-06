import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminNewsService } from '@/services/api/admin-news-service';
import { NewsArticle } from '@/services/api/news-service';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Newspaper,
  Search,
  CheckCircle,
  XCircle,
  Send,
  Flame,
  Star,
  Eye,
  Clock,
  MapPin,
  Tag,
  AlertCircle,
  RefreshCw,
  FileCheck
} from 'lucide-react';

import { useDebounce } from '@/hooks/useDebounce';

export const AdminNewsPage: React.FC = () => {
  useDocumentTitle('News Editorial Desk — Super Admin Governance');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const debouncedSearch = useDebounce(search, 250);
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Reject Modal State
  const [rejectingArticle, setRejectingArticle] = useState<NewsArticle | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Fetch Live Admin News Listing
  const {
    data: newsData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-news', page, activeTab, debouncedSearch],
    queryFn: () =>
      AdminNewsService.getAdminNews({
        page,
        limit,
        status: activeTab === 'ALL' ? undefined : (activeTab as any),
        search: debouncedSearch.trim() || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  // Mutations for Editorial Actions
  const reviewMutation = useMutation({
    mutationFn: (id: string) => AdminNewsService.startReview(id),
    onSuccess: () => {
      toast.success('Review Initiated', 'Article marked under editorial review.');
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
    },
    onError: (err: any) => {
      toast.error('Review Failed', err.response?.data?.message || err.message || 'Failed to initiate review.');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => AdminNewsService.publishNews(id),
    onSuccess: () => {
      toast.success('Article Approved & Published Live!', 'Story is now active on the public user portal.');
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      queryClient.invalidateQueries({ queryKey: ['news-feed'] });
      queryClient.invalidateQueries({ queryKey: ['featured-news'] });
      queryClient.invalidateQueries({ queryKey: ['breaking-news'] });
    },
    onError: (err: any) => {
      toast.error('Approval Failed', err.response?.data?.message || err.message || 'Failed to approve and publish article.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => AdminNewsService.rejectNews(id, reason),
    onSuccess: () => {
      toast.success('Article Rejected', 'Rejection remarks logged in editorial actions.');
      setRejectingArticle(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
    },
    onError: (err: any) => {
      toast.error('Rejection Failed', err.response?.data?.message || 'Failed to reject article.');
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => AdminNewsService.publishNews(id),
    onSuccess: () => {
      toast.success('Story Published Live', 'Article is now active across public feeds.');
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      queryClient.invalidateQueries({ queryKey: ['news-feed'] });
      queryClient.invalidateQueries({ queryKey: ['featured-news'] });
      queryClient.invalidateQueries({ queryKey: ['breaking-news'] });
    },
    onError: (err: any) => {
      toast.error('Publish Failed', err.response?.data?.message || err.message || 'Failed to publish story.');
    },
  });

  const toggleBreakingMutation = useMutation({
    mutationFn: ({ id, isBreaking }: { id: string; isBreaking: boolean }) =>
      AdminNewsService.toggleBreaking(id, isBreaking),
    onSuccess: (_, vars) => {
      toast.success('Breaking Ticker Updated', `Story ${vars.isBreaking ? 'added to' : 'removed from'} breaking alerts.`);
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
    },
    onError: (err: any) => {
      toast.error('Action Failed', err.response?.data?.message || 'Failed to update breaking status.');
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      AdminNewsService.toggleFeatured(id, isFeatured),
    onSuccess: (_, vars) => {
      toast.success('Featured Hero Updated', `Story ${vars.isFeatured ? 'set as' : 'removed from'} hero spotlight.`);
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
    },
    onError: (err: any) => {
      toast.error('Action Failed', err.response?.data?.message || 'Failed to update featured status.');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="emerald">PUBLISHED</Badge>;
      case 'APPROVED':
        return <Badge variant="indigo">APPROVED</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="amber">UNDER REVIEW</Badge>;
      case 'SUBMITTED':
        return <Badge variant="cyan">SUBMITTED</Badge>;
      case 'DRAFT':
        return <Badge variant="slate">DRAFT</Badge>;
      case 'REJECTED':
        return <Badge variant="rose">REJECTED</Badge>;
      case 'ARCHIVED':
        return <Badge variant="slate">ARCHIVED</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-950/60 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5 font-serif">
            <Newspaper className="w-6 h-6 text-indigo-400" /> Editorial Desk & Story Governance
          </h1>
          <p className="text-xs text-slate-400">
            Review submitted stories, verify source details, approve publication, and manage breaking news tickers.
          </p>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="p-4 space-y-1 border-indigo-500/20">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Total Editorial Database</span>
          <div className="text-2xl font-black text-white">{newsData?.total || 0}</div>
          <span className="text-[11px] text-indigo-300 font-medium">Stories tracked across state</span>
        </Card>

        <Card variant="glass" className="p-4 space-y-1 border-emerald-500/20">
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block">Live Published</span>
          <div className="text-2xl font-black text-emerald-400">
            {newsData?.articles.filter((a) => a.status === 'PUBLISHED').length || 0}
          </div>
          <span className="text-[11px] text-slate-400">Accessible on user portal</span>
        </Card>

        <Card variant="glass" className="p-4 space-y-1 border-amber-500/20">
          <span className="text-[10px] font-mono font-bold uppercase text-amber-400 block">Pending Editorial Review</span>
          <div className="text-2xl font-black text-amber-300">
            {newsData?.articles.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length || 0}
          </div>
          <span className="text-[11px] text-slate-400">Awaiting verification</span>
        </Card>

        <Card variant="glass" className="p-4 space-y-1 border-rose-500/20">
          <span className="text-[10px] font-mono font-bold uppercase text-rose-400 block">Active Breaking Ticker</span>
          <div className="text-2xl font-black text-rose-400">
            {newsData?.articles.filter((a) => a.isBreaking).length || 0}
          </div>
          <span className="text-[11px] text-slate-400">Top urgent alerts</span>
        </Card>
      </div>

      {/* Control Bar: Search & Status Filter Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#090d19] p-3 rounded-2xl border border-indigo-500/15 shadow-xl">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Stories' },
            { id: 'SUBMITTED', label: 'Submitted' },
            { id: 'UNDER_REVIEW', label: 'Under Review' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'PUBLISHED', label: 'Published' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search headline title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500/50 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <Card variant="glass" className="space-y-4 p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      )}

      {/* Error Retry State */}
      {isError && (
        <Card variant="glass" className="border-rose-500/30 text-rose-300 p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <h4 className="font-bold text-sm">Failed to Load Editorial Stories</h4>
          <p className="text-xs text-slate-400">{error?.message || 'Database communication error'}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry Connection
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && newsData?.articles.length === 0 && (
        <EmptyState
          title="No Articles Found"
          description="No editorial articles match the current status tab and search criteria."
        />
      )}

      {/* News Table */}
      {!isLoading && !isError && newsData && newsData.articles.length > 0 && (
        <Card variant="glass" className="p-0 overflow-hidden border-indigo-500/15">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Headline & Summary</th>
                  <th className="p-4">Category & Location</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Highlights</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                {newsData.articles.map((art: NewsArticle) => (
                  <tr key={art.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 max-w-sm space-y-1">
                      <h4 className="font-bold text-white leading-snug line-clamp-2">{art.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{art.summary || 'No summary provided'}</p>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Created: {formatDate(art.createdAt)}
                      </span>
                    </td>

                    <td className="p-4 space-y-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 block w-max">
                        {art.category?.name || 'Uncategorized'}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-400" /> {art.location?.name || 'Jharkhand'}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                          {art.author?.fullName ? art.author.fullName.substring(0, 2).toUpperCase() : 'ED'}
                        </div>
                        <span className="text-slate-300">{art.author?.fullName || 'Senior Desk'}</span>
                      </div>
                    </td>

                    <td className="p-4">{getStatusBadge(art.status)}</td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleBreakingMutation.mutate({ id: art.id, isBreaking: !art.isBreaking })}
                          className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                            art.isBreaking
                              ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-950'
                              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                          title="Toggle Breaking News Alert"
                        >
                          <Flame className="w-3 h-3" /> Breaking
                        </button>

                        <button
                          onClick={() => toggleFeaturedMutation.mutate({ id: art.id, isFeatured: !art.isFeatured })}
                          className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                            art.isFeatured
                              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-950 font-black'
                              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                          title="Toggle Featured Hero Spotlight"
                        >
                          <Star className="w-3 h-3" /> Featured
                        </button>
                      </div>
                    </td>

                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {art.status === 'SUBMITTED' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => reviewMutation.mutate(art.id)}
                        >
                          Start Review
                        </Button>
                      )}

                      {(art.status === 'SUBMITTED' || art.status === 'UNDER_REVIEW') && (
                        <>
                          <Button
                            variant="emerald"
                            size="sm"
                            onClick={() => approveMutation.mutate(art.id)}
                            isLoading={approveMutation.isPending}
                          >
                            Approve & Publish Live
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setRejectingArticle(art)}
                          >
                            Reject
                          </Button>
                        </>
                      )}

                      {(art.status === 'APPROVED' || art.status === 'DRAFT') && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => publishMutation.mutate(art.id)}
                        >
                          Publish Live
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {newsData.totalPages > 1 && (
            <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>
                Page {newsData.page} of {newsData.totalPages} ({newsData.total} items)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= newsData.totalPages}
                  onClick={() => setPage((p) => Math.min(newsData.totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectingArticle}
        onClose={() => {
          setRejectingArticle(null);
          setRejectionReason('');
        }}
        title="Reject Article & Provide Remarks"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Specify the editorial reason for rejecting <strong className="text-white">"{rejectingArticle?.title}"</strong>. The author will be notified to correct and resubmit.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Rejection Remarks / Needed Verification</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Needs secondary verification from district administration chief engineer..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500/50 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none transition-all h-24 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRejectingArticle(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!rejectionReason.trim()}
              onClick={() => {
                if (rejectingArticle && rejectionReason.trim()) {
                  rejectMutation.mutate({ id: rejectingArticle.id, reason: rejectionReason.trim() });
                }
              }}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

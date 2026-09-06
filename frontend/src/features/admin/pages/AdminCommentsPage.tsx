import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EngagementService, CommentStatus, CommentItem } from '@/services/api/engagement-service';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import {
  MessageSquare,
  Search,
  RefreshCw,
  EyeOff,
  Eye,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Filter,
} from 'lucide-react';

const formatRelativeTime = (dateInput?: string | Date): string => {
  if (!dateInput) return 'Recently';
  const date = new Date(dateInput);
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Comments', value: 'ALL' },
  { label: 'Published / Approved', value: 'APPROVED' },
  { label: 'Flagged / Hidden', value: 'FLAGGED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Deleted', value: 'DELETED' },
];

export const AdminCommentsPage: React.FC = () => {
  useDocumentTitle('Comments Moderation Desk — Super Admin');

  const toast = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [page, setPage] = useState<number>(1);
  const limit = 12;

  // Selected comment for reject action modal
  const [rejectingCommentId, setRejectingCommentId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const {
    data: commentsData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-comments-list', statusFilter, debouncedSearch, page],
    queryFn: () =>
      EngagementService.adminGetComments({
        status: statusFilter === 'ALL' ? undefined : (statusFilter as CommentStatus),
        search: debouncedSearch.trim() || undefined,
        page,
        limit,
      }),
  });

  // Hide comment mutation
  const hideMutation = useMutation({
    mutationFn: (id: string) => EngagementService.adminHideComment(id, 'Flagged by Super Admin'),
    onSuccess: () => {
      toast.success('Comment Hidden', 'Comment has been removed from public view.');
      queryClient.invalidateQueries({ queryKey: ['admin-comments-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to hide comment');
    },
  });

  // Restore comment mutation
  const restoreMutation = useMutation({
    mutationFn: (id: string) => EngagementService.adminRestoreComment(id),
    onSuccess: () => {
      toast.success('Comment Restored', 'Comment is now published and visible to the public.');
      queryClient.invalidateQueries({ queryKey: ['admin-comments-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to restore comment');
    },
  });

  // Reject comment mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      EngagementService.adminRejectComment(id, reason),
    onSuccess: () => {
      toast.success('Comment Rejected', 'Comment marked as policy violation.');
      setRejectingCommentId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-comments-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to reject comment');
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => EngagementService.adminDeleteComment(id),
    onSuccess: () => {
      toast.success('Comment Deleted', 'Comment permanently deleted.');
      queryClient.invalidateQueries({ queryKey: ['admin-comments-list'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete comment');
    },
  });

  const getStatusBadge = (status: CommentStatus) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="emerald">PUBLISHED</Badge>;
      case 'FLAGGED':
        return <Badge variant="amber">FLAGGED / HIDDEN</Badge>;
      case 'REJECTED':
        return <Badge variant="rose">REJECTED</Badge>;
      case 'DELETED':
        return <Badge variant="slate">DELETED</Badge>;
      case 'PENDING':
        return <Badge variant="indigo">PENDING REVIEW</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const comments = commentsData?.comments || [];
  const total = commentsData?.total || 0;
  const totalPages = commentsData?.totalPages || 1;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 font-serif">
            <MessageSquare className="w-6 h-6 text-rose-500" /> Comments Moderation Desk
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Review, moderate, and enforce community standards across reader discussions ({total} Total)
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          isLoading={isRefetching}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Feed
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                statusFilter === f.value
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>
      </div>

      {/* Comments List Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No comments found"
          description="There are no comments matching your selected filter criteria."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comments.map((c) => (
            <Card
              key={c.id}
              variant="glass"
              className="p-5 flex flex-col justify-between space-y-4 border-slate-800/80 hover:border-slate-700 transition-all"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs">
                      {c.user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{c.user?.fullName}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {formatRelativeTime(c.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div>{getStatusBadge(c.status)}</div>
                </div>

                {/* News story reference */}
                {(c as any).news && (
                  <div className="flex items-center gap-1 text-[11px] text-rose-400 font-serif line-clamp-1 italic bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800">
                    <FileText className="w-3 h-3 shrink-0" />
                    <span>Story: {(c as any).news?.title}</span>
                  </div>
                )}

                {/* Content */}
                <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 line-clamp-4">
                  {c.content}
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">ID: {c.id.slice(0, 8)}...</span>

                <div className="flex items-center gap-1.5">
                  {c.status === 'APPROVED' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => hideMutation.mutate(c.id)}
                      isLoading={hideMutation.isPending}
                      leftIcon={<EyeOff className="w-3 h-3" />}
                    >
                      Hide
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreMutation.mutate(c.id)}
                      isLoading={restoreMutation.isPending}
                      leftIcon={<Eye className="w-3 h-3" />}
                    >
                      Restore
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRejectingCommentId(c.id);
                      setRejectReason('Violates community hate speech / harassment policies');
                    }}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    Reject
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Permanently delete this comment?')) {
                        deleteMutation.mutate(c.id);
                      }
                    }}
                    className="p-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-mono">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingCommentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">Reject Comment</h3>
            </div>

            <p className="text-xs text-slate-300">
              Provide an official policy rejection reason for audit and moderation transparency:
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl p-3 text-xs text-white outline-none"
              placeholder="Reason for policy violation..."
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setRejectingCommentId(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={rejectMutation.isPending}
                onClick={() =>
                  rejectMutation.mutate({ id: rejectingCommentId, reason: rejectReason })
                }
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

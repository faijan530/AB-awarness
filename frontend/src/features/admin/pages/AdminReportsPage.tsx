import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  VerificationService,
  ModerationQueueItem,
  ModerationActionType,
} from '@/services/api/verification-service';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/hooks/useToast';
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  EyeOff,
  Eye,
  FileText,
  MessageSquare,
  ShieldAlert,
  Send,
} from 'lucide-react';

import { useDebounce } from '@/hooks/useDebounce';

export const AdminReportsPage: React.FC = () => {
  useDocumentTitle('Moderation & Flagged Content Desk — Super Admin');

  const toast = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [page, setPage] = useState(1);
  const limit = 8;

  // Selected incident for action modal
  const [selectedItem, setSelectedItem] = useState<ModerationQueueItem | null>(null);
  const [actionType, setActionType] = useState<ModerationActionType>('APPROVE');
  const [resolutionNote, setResolutionNote] = useState<string>('');

  const {
    data: modData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-moderation-queue', statusFilter, debouncedSearch, page],
    queryFn: () =>
      VerificationService.getModerationQueue({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: debouncedSearch.trim() || undefined,
        page,
        limit,
      }),
    placeholderData: (prev) => prev,
  });

  const actionMutation = useMutation({
    mutationFn: (payload: { id: string; action: ModerationActionType; resolutionNote?: string }) =>
      VerificationService.takeModerationAction(payload.id, {
        action: payload.action,
        resolutionNote: payload.resolutionNote,
      }),
    onSuccess: (res) => {
      toast.success(`Moderation action applied: ${res.status}`);
      setSelectedItem(null);
      setResolutionNote('');
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to apply moderation action');
    },
  });

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'FALSE_INFORMATION':
      case 'MISLEADING':
        return <Badge variant="rose">{reason.replace('_', ' ')}</Badge>;
      case 'COPYRIGHT':
        return <Badge variant="indigo">{reason}</Badge>;
      case 'SPAM':
      case 'ABUSE':
        return <Badge variant="amber">{reason}</Badge>;
      default:
        return <Badge variant="slate">{reason}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <Badge variant="emerald"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> Resolved</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="indigo"><Clock className="w-3 h-3 mr-1 inline" /> In Review</Badge>;
      case 'DISMISSED':
        return <Badge variant="slate"><XCircle className="w-3 h-3 mr-1 inline" /> Dismissed</Badge>;
      default:
        return <Badge variant="amber"><AlertTriangle className="w-3 h-3 mr-1 inline" /> Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black font-serif text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-rose-500" />
              Moderation & Incident Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
              Desk
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review citizen flags, false information reports, abuse alerts, and take immediate corrective action
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Queue
        </Button>
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
              placeholder="Search moderation reports by content title or report description..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {[
              { id: 'ALL', label: 'All Incidents' },
              { id: 'PENDING', label: 'Pending' },
              { id: 'UNDER_REVIEW', label: 'In Review' },
              { id: 'RESOLVED', label: 'Resolved' },
              { id: 'DISMISSED', label: 'Dismissed' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setStatusFilter(s.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === s.id
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Incidents Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
            Flagged Content Incidents ({modData?.meta?.total ?? 0})
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Page {modData?.meta?.page ?? 1} of {modData?.meta?.totalPages ?? 1}
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-16 rounded-xl w-full" />
            <Skeleton className="h-16 rounded-xl w-full" />
            <Skeleton className="h-16 rounded-xl w-full" />
          </div>
        ) : modData?.items.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={CheckCircle2}
              title="Moderation Queue Clean"
              description="No content reports or flagged incidents are currently awaiting moderation."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {modData?.items.map((item: ModerationQueueItem) => (
              <div
                key={item.id}
                className="p-5 hover:bg-slate-850/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(item.status)}
                    {getReasonBadge(item.reason)}
                    <span className="text-[11px] font-mono text-slate-400">
                      Target: <strong className="text-slate-300">{item.targetType}</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 font-serif line-clamp-1">
                    {item.targetTitle}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 italic font-serif">
                      "{item.description}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono pt-1">
                    <span>Reported by: <strong className="text-slate-300">{item.reporterName}</strong></span>
                    <span>•</span>
                    <span>Date: {new Date(item.createdAt).toLocaleString()}</span>
                    {item.resolutionNote && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">Resolved: {item.resolutionNote}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedItem(item);
                      setActionType('APPROVE');
                      setResolutionNote('');
                    }}
                  >
                    Moderate Incident ➔
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODERATION ACTION MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" /> Apply Moderation Action
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-200">Incident Target: {selectedItem.targetTitle}</div>
              <div className="text-slate-400">Reason: {selectedItem.reason}</div>
              {selectedItem.description && (
                <div className="text-slate-400 italic">Report details: "{selectedItem.description}"</div>
              )}
            </div>

            {/* Action Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase font-mono">Select Action</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'APPROVE', label: 'Resolve & Dismiss Flag' },
                  { id: 'HIDE', label: 'Hide / Archive Content' },
                  { id: 'REQUEST_REVISION', label: 'Request Revision' },
                  { id: 'ESCALATE', label: 'Escalate to Chief Editor' },
                ].map((act) => (
                  <button
                    key={act.id}
                    onClick={() => setActionType(act.id as any)}
                    className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                      actionType === act.id
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase font-mono">
                Resolution Note / Action Rationale
              </label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Document resolution action taken..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedItem(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={actionMutation.isPending}
                onClick={() =>
                  actionMutation.mutate({
                    id: selectedItem.id,
                    action: actionType,
                    resolutionNote: resolutionNote.trim() || undefined,
                  })
                }
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                {actionMutation.isPending ? 'Applying...' : 'Confirm Action'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContributorService } from '@/services/api/contributor-service';
import { VerificationService } from '@/services/api/verification-service';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Edit3,
  MapPin,
  Tag,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

export const SubmissionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  useDocumentTitle('Submission Status & Timeline — Reporter Desk');
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: article, isLoading } = useQuery({
    queryKey: ['submission-detail', id],
    queryFn: () => ContributorService.getSubmissionById(id!),
    enabled: !!id,
  });

  const resubmitMutation = useMutation({
    mutationFn: () => ContributorService.resubmitForReview(id!),
    onSuccess: () => {
      toast.success('Story Resubmitted!', 'Your updated news story has been returned to editorial review queue.');
      queryClient.invalidateQueries({ queryKey: ['submission-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['my-submissions-dashboard'] });
    },
    onError: (err: any) => {
      toast.error('Resubmission Failed', err.response?.data?.message || err.message);
    },
  });

  // Query verification status for this submission
  const { data: verificationStatus, isLoading: isLoadingVerification } = useQuery({
    queryKey: ['submission-verification-status', id],
    queryFn: () => VerificationService.getVerificationStatus(id!),
    enabled: !!id,
    retry: false,
  });

  const requestVerificationMutation = useMutation({
    mutationFn: () => VerificationService.requestVerification(id!, 'FACT_CHECK'),
    onSuccess: () => {
      toast.success('Verification Analysis Complete!', 'Originality and factual assertions cross-checked against database.');
      queryClient.invalidateQueries({ queryKey: ['submission-verification-status', id] });
      queryClient.invalidateQueries({ queryKey: ['contributor-verification-history'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to trigger verification check');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto pt-10 pb-16">
        <Card variant="glass" className="text-center p-8 space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Submission Not Found</h3>
          <Link to="/contributor/submissions">
            <Button variant="primary">Back to Submissions</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const status = article.status;
  const isRevisionRequired = status === 'REVISION_REQUIRED' || status === 'REJECTED';
  const isPublished = status === 'PUBLISHED';
  const isUnderReview = status === 'UNDER_REVIEW' || status === 'SUBMITTED';

  const actions = (article as any).actions || [];
  const latestAction = actions[0];

  // 5-Stage Status Timeline Definition
  const timelineStages = [
    { label: 'Draft Created', done: true, current: status === 'DRAFT' },
    { label: 'Submitted', done: status !== 'DRAFT', current: status === 'SUBMITTED' },
    { label: 'Under Review', done: status === 'UNDER_REVIEW' || status === 'APPROVED' || status === 'PUBLISHED', current: status === 'UNDER_REVIEW' },
    { label: isRevisionRequired ? 'Revision Requested' : 'Approved', done: status === 'APPROVED' || status === 'PUBLISHED', current: isRevisionRequired || status === 'APPROVED' },
    { label: 'Published Live', done: isPublished, current: isPublished },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="space-y-3">
        <Link
          to="/contributor/submissions"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Submissions
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-500/15 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30">
                WORKFLOW STATUS TIMELINE
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {article.id.substring(0, 8)}...</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              Submission Details & Progress
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {isRevisionRequired && (
              <Link to={`/contributor/news/${article.id}/edit`}>
                <Button variant="emerald" leftIcon={<Edit3 className="w-4 h-4" />}>
                  Edit & Resubmit
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 5-Stage Visual Workflow Status Timeline */}
      <div className="glass-card-user rounded-3xl p-6 sm:p-8 space-y-6">
        <h3 className="font-bold text-white text-sm uppercase tracking-wider text-slate-300">
          5-Stage Editorial Workflow Progress
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
          {timelineStages.map((stage, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all space-y-2 text-center ${
                stage.current
                  ? 'border-rose-500 bg-rose-950/30 shadow-lg shadow-rose-950/50'
                  : stage.done
                  ? 'border-emerald-500/40 bg-emerald-950/20'
                  : 'border-slate-800 bg-slate-900/40 opacity-60'
              }`}
            >
              <div className="w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold font-mono text-xs">
                {stage.done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : stage.current ? (
                  <Clock className="w-5 h-5 text-rose-400 animate-pulse" />
                ) : (
                  <span className="text-slate-500">{idx + 1}</span>
                )}
              </div>
              <p
                className={`text-xs font-bold ${
                  stage.current
                    ? 'text-rose-300'
                    : stage.done
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                {stage.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Module 7: Originality & Fact Verification Card */}
      <div className="glass-card-user rounded-3xl p-6 sm:p-8 space-y-4 border border-emerald-500/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-950">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2 font-serif">
                Originality & Fact Verification Desk
              </h3>
              <p className="text-xs text-slate-400">
                Automated similarity check & claim extraction across platform news registry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              isLoading={requestVerificationMutation.isPending}
              onClick={() => requestVerificationMutation.mutate()}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Run Verification Check
            </Button>
            <Link to="/contributor/verification">
              <Button variant="outline" size="sm">
                View All Audits ➔
              </Button>
            </Link>
          </div>
        </div>

        {verificationStatus ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Verification Status</span>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-4 h-4" /> {verificationStatus.status}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Reliability Index</span>
              <div className="text-xl font-black font-mono text-white mt-1">
                {verificationStatus.overallScore}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Algorithmic Assessment</span>
              <div className="text-sm font-bold text-amber-400 mt-1 font-mono">
                {verificationStatus.assessment.replace('_', ' ')}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic pt-1">
            Click "Run Verification Check" to analyze this article's originality, cross-check claims, and obtain a certified credibility report.
          </p>
        )}
      </div>

      {/* Editor Remarks Notice if Revision Required */}
      {isRevisionRequired && (
        <div className="p-6 rounded-3xl bg-rose-950/40 border border-rose-500/40 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Super Admin Editor Remarks & Requested Corrections</span>
            </div>
            <Badge variant="rose">Action Required</Badge>
          </div>

          <p className="text-xs text-slate-200 bg-slate-950/60 p-4 rounded-2xl border border-rose-500/20 italic leading-relaxed">
            "{latestAction?.remarks || 'Please verify story location context and provide updated source details.'}"
          </p>

          <div className="pt-2 flex justify-end gap-3">
            <Link to={`/contributor/news/${article.id}/edit`}>
              <Button variant="emerald" leftIcon={<Edit3 className="w-4 h-4" />}>
                Edit Story Now
              </Button>
            </Link>
            <Button
              variant="primary"
              leftIcon={<Send className="w-4 h-4" />}
              isLoading={resubmitMutation.isPending}
              onClick={() => resubmitMutation.mutate()}
            >
              Resubmit For Review
            </Button>
          </div>
        </div>
      )}

      {/* Article Content Summary Card */}
      <div className="glass-card-user rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-black bg-rose-500/15 text-rose-300 border border-rose-500/30">
              {article.category?.name || 'GENERAL'}
            </span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> {article.location?.name || 'Jharkhand'}
            </span>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Created: {new Date(article.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-white font-serif leading-snug">
          {article.title}
        </h2>

        {article.summary && (
          <p className="text-xs sm:text-sm text-slate-300 italic border-l-2 border-rose-500 pl-3 py-1 bg-slate-900/50 rounded-r-xl">
            {article.summary}
          </p>
        )}

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {article.content}
        </p>
      </div>
    </div>
  );
};

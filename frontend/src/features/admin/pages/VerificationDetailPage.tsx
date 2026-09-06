import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  VerificationService,
  VerificationDetailResult,
  ClaimStatus,
  EditorialDecisionType,
} from '@/services/api/verification-service';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { useToast } from '@/hooks/useToast';
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  FileText,
  ExternalLink,
  MessageSquare,
  History,
  Send,
  Save,
  Layers,
  Award,
  Link2,
  BookOpen,
} from 'lucide-react';

export const VerificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'originality' | 'claims' | 'sources' | 'decision' | 'notes'>('originality');

  // Form states for Editorial Decision
  const [decision, setDecision] = useState<EditorialDecisionType>('APPROVE');
  const [comments, setComments] = useState<string>('');
  const [requiredChanges, setRequiredChanges] = useState<string>('');

  // Form state for Moderator Notes
  const [noteContent, setNoteContent] = useState<string>('');

  // Query verification report
  const {
    data: verification,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<VerificationDetailResult>({
    queryKey: ['admin-verification-detail', id],
    queryFn: () => VerificationService.getAdminVerificationDetail(id || ''),
    enabled: !!id,
  });

  useDocumentTitle(verification ? `Verify: ${verification.article.title} — Super Admin` : 'Verification Workbench');

  // Mutation: Submit Editorial Decision
  const decisionMutation = useMutation({
    mutationFn: (payload: { decision: EditorialDecisionType; comments?: string; requiredChanges?: string }) =>
      VerificationService.submitEditorialDecision(id || '', payload),
    onSuccess: (updated) => {
      toast.success(
        `Editorial decision "${updated.editorialDecision?.decision}" recorded successfully! Article is now ${updated.article.status}.`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-verification-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-verification-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-verification-metrics'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to record editorial decision');
    },
  });

  // Mutation: Review / Override Claim
  const claimMutation = useMutation({
    mutationFn: (payload: { claimId: string; decision: ClaimStatus; adminNotes?: string }) =>
      VerificationService.reviewClaim(id || '', payload),
    onSuccess: () => {
      toast.success('Claim status updated and fact support score recalculated.');
      queryClient.invalidateQueries({ queryKey: ['admin-verification-detail', id] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update claim');
    },
  });

  // Mutation: Add Moderator Note
  const noteMutation = useMutation({
    mutationFn: (content: string) => VerificationService.addModeratorNote(id || '', content),
    onSuccess: () => {
      toast.success('Internal moderator note added to case file.');
      setNoteContent('');
      queryClient.invalidateQueries({ queryKey: ['admin-verification-detail', id] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to add moderator note');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !verification) {
    return (
      <div className="max-w-xl mx-auto pt-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Verification Case Not Found</h2>
        <p className="text-xs text-slate-400">{(error as any)?.message || 'Unable to locate verification record.'}</p>
        <Link to="/admin/verification">
          <Button variant="primary" size="sm">Back to Queue</Button>
        </Link>
      </div>
    );
  }

  const { article, scores, originality, factCheck, auditTrail, moderatorNotes } = verification;

  const getClaimBadge = (status: ClaimStatus) => {
    switch (status) {
      case 'SUPPORTED':
        return <Badge variant="emerald">Supported</Badge>;
      case 'PARTIALLY_SUPPORTED':
        return <Badge variant="amber">Partially Supported</Badge>;
      case 'CONTRADICTED':
        return <Badge variant="rose">Contradicted / False</Badge>;
      case 'UNVERIFIED':
        return <Badge variant="slate">Unverified</Badge>;
      default:
        return <Badge variant="amber">Needs Review</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <Link
            to="/admin/verification"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 font-bold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Verification Queue
          </Link>
          <h1 className="text-2xl font-black font-serif text-white tracking-tight line-clamp-1">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
            <span>Author: <strong className="text-slate-200">{article.author.fullName}</strong></span>
            <span>•</span>
            <span>Category: <strong className="text-slate-200">{article.category?.name || 'Local'}</strong></span>
            <span>•</span>
            <span>Article Status: <strong className="text-emerald-400">{article.status}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('decision')}
            className="whitespace-nowrap"
          >
            Take Editorial Decision ➔
          </Button>
        </div>
      </div>

      {/* Composite Verification Score Gauge Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Originality Score */}
        <Card variant="glass" className="p-4 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Originality</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              originality.duplicateLevel === 'LOW_SIMILARITY' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
            }`}>
              {originality.duplicateLevel.replace('_', ' ')}
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
            {scores.originality}%
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${scores.originality}%` }}
            />
          </div>
        </Card>

        {/* Fact Support Score */}
        <Card variant="glass" className="p-4 border-indigo-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Fact Support</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300">
              {factCheck.claims.length} Claims
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-indigo-400 mt-2">
            {scores.factSupport}%
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
            <div
              className="bg-indigo-500 h-1.5 rounded-full"
              style={{ width: `${scores.factSupport}%` }}
            />
          </div>
        </Card>

        {/* Source Coverage Score */}
        <Card variant="glass" className="p-4 border-teal-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Sources</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300">
              {factCheck.identifiedSourcesCount} Linked
            </span>
          </div>
          <div className="text-3xl font-black font-mono text-teal-400 mt-2">
            {scores.sourceCoverage}%
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
            <div
              className="bg-teal-500 h-1.5 rounded-full"
              style={{ width: `${scores.sourceCoverage}%` }}
            />
          </div>
        </Card>

        {/* Overall Assessment */}
        <Card variant="glass" className="p-4 border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Overall Assessment</span>
          </div>
          <div className={`text-xl font-black font-mono mt-2 ${
            scores.overallAssessment === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {scores.overallAssessment.replace('_', ' ')}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Weighted composite algorithm: {scores.overallScore}% reliability index
          </p>
        </Card>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'originality', label: '1. Originality Analysis', icon: Sparkles },
          { id: 'claims', label: `2. Claims & Evidence (${factCheck.claims.length})`, icon: ShieldCheck },
          { id: 'sources', label: '3. Sources & References', icon: BookOpen },
          { id: 'decision', label: '4. Editorial Decision', icon: CheckCircle2 },
          { id: 'notes', label: `5. Moderator Notes & Audit (${moderatorNotes.length})`, icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ORIGINALITY & TEXT COMPARISON */}
      {activeTab === 'originality' && (
        <div className="space-y-6">
          <Card variant="glass" className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Originality & Similarity Inspection
                </h2>
                <p className="text-xs text-slate-400">
                  Cross-referenced against platform article database using multi-gram shingles and token distribution.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-300">
                Match Areas: <strong className="text-amber-400">{originality.matchAreas.join(', ') || 'None (100% Unique)'}</strong>
              </span>
            </div>

            {/* Similar Content Detection List */}
            {originality.similarArticles.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-slate-800/80">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-white">No Duplicate or Highly Similar Content Detected</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Article exhibits high linguistic originality across all paragraphs and headline.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Potentially Similar Database Stories ({originality.similarArticles.length})
                </h3>

                <div className="space-y-3">
                  {originality.similarArticles.map((match) => (
                    <div
                      key={match.articleId}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-200">{match.title}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono font-black ${
                            match.similarityScore >= 60 ? 'text-rose-400' : 'text-amber-400'
                          }`}>
                            {match.similarityScore}% Similarity
                          </span>
                          <Badge variant={match.similarityScore >= 60 ? 'rose' : 'amber'}>
                            {match.duplicateLevel.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      {/* Snippet Matching Comparison */}
                      {match.matchedPassages.map((p, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-850">
                          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                              Submitted Passage (Snippet)
                            </span>
                            <p className="text-slate-300 leading-relaxed font-serif italic">"{p.submittedSnippet}"</p>
                          </div>
                          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                            <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">
                              Matched Passage ({p.similarity}% match)
                            </span>
                            <p className="text-slate-300 leading-relaxed font-serif italic">"{p.matchedSnippet}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: CLAIMS & FACT CHECK */}
      {activeTab === 'claims' && (
        <div className="space-y-6">
          <Card variant="glass" className="p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Extracted Claims & Evidence Assessment
              </h2>
              <p className="text-xs text-slate-400">
                Inspect assertions individually. Confirm system assessment or override with admin authority.
              </p>
            </div>

            <div className="space-y-4">
              {factCheck.claims.map((claim, idx) => (
                <div
                  key={claim.id}
                  className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Confidence: {claim.confidenceScore}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">Current Status:</span>
                      {getClaimBadge(claim.status)}
                    </div>
                  </div>

                  {/* Claim Text */}
                  <blockquote className="text-sm font-bold text-slate-100 font-serif border-l-2 border-emerald-500 pl-3 py-1">
                    "{claim.claimText}"
                  </blockquote>

                  {/* Supporting Evidence Card */}
                  {claim.evidence && claim.evidence.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                        Linked Source & Evidence:
                      </span>
                      {claim.evidence.map((ev, evIdx) => (
                        <div
                          key={evIdx}
                          className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between text-xs gap-3"
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-slate-200 flex items-center gap-2">
                              <span>{ev.sourceName}</span>
                              <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 uppercase font-mono">
                                {ev.sourceType}
                              </span>
                              <span className="text-[10px] text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                                {ev.reliability}
                              </span>
                            </div>
                            <p className="text-slate-400 text-xs">{ev.notes}</p>
                          </div>

                          {ev.referenceUrl && (
                            <a
                              href={ev.referenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-white"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Admin Override Controls */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-400 font-mono">Admin Override Decision:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={claimMutation.isPending}
                        onClick={() =>
                          claimMutation.mutate({
                            claimId: claim.id,
                            decision: 'SUPPORTED',
                            adminNotes: 'Super Admin confirmed with official bulletin',
                          })
                        }
                      >
                        Confirm Supported
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={claimMutation.isPending}
                        onClick={() =>
                          claimMutation.mutate({
                            claimId: claim.id,
                            decision: 'NEEDS_REVIEW',
                            adminNotes: 'Requires further field investigation',
                          })
                        }
                      >
                        Mark Needs Review
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={claimMutation.isPending}
                        onClick={() =>
                          claimMutation.mutate({
                            claimId: claim.id,
                            decision: 'CONTRADICTED',
                            adminNotes: 'Contradicts official gazette record',
                          })
                        }
                      >
                        Contradicted
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: SOURCES & REFERENCES */}
      {activeTab === 'sources' && (
        <Card variant="glass" className="p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" /> Platform Sources & Citations
            </h2>
            <p className="text-xs text-slate-400">
              Verified registries, wire services, official state gazettes, and community reporters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {factCheck.claims.flatMap((c) => c.evidence).map((src, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-200">{src.sourceName}</h4>
                  <Badge variant="emerald">{src.reliability}</Badge>
                </div>
                <div className="text-xs text-slate-400 font-mono">Type: {src.sourceType}</div>
                <p className="text-xs text-slate-300">{src.notes}</p>
                {src.referenceUrl && (
                  <a
                    href={src.referenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline pt-1"
                  >
                    <Link2 className="w-3.5 h-3.5" /> View Official Reference
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: EDITORIAL DECISION */}
      {activeTab === 'decision' && (
        <Card variant="glass" className="p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Editorial Review Decision
            </h2>
            <p className="text-xs text-slate-400">
              Take formal editorial action on this verified submission.
            </p>
          </div>

          {/* Decision Radio Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                decision === 'APPROVE'
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/40'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="decision"
                value="APPROVE"
                checked={decision === 'APPROVE'}
                onChange={() => setDecision('APPROVE')}
                className="sr-only"
              />
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" /> Approve & Publish Live
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Article is verified and meets all editorial guidelines. Immediately publishes to public portal.
              </p>
            </label>

            <label
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                decision === 'REQUEST_REVISION'
                  ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/40'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="decision"
                value="REQUEST_REVISION"
                checked={decision === 'REQUEST_REVISION'}
                onChange={() => setDecision('REQUEST_REVISION')}
                className="sr-only"
              />
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" /> Request Revision
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Requires contributor to amend specific factual claims or cite missing references.
              </p>
            </label>

            <label
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                decision === 'REJECT'
                  ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/40'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="decision"
                value="REJECT"
                checked={decision === 'REJECT'}
                onChange={() => setDecision('REJECT')}
                className="sr-only"
              />
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <XCircle className="w-4 h-4" /> Reject Story
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Content is duplicate, unsubstantiated, or violates editorial guidelines.
              </p>
            </label>
          </div>

          {/* Conditional Required Changes field */}
          {decision === 'REQUEST_REVISION' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2">
              <label className="text-xs font-bold text-amber-300 uppercase font-mono">
                Required Changes (Visible to Author) *
              </label>
              <textarea
                rows={3}
                value={requiredChanges}
                onChange={(e) => setRequiredChanges(e.target.value)}
                placeholder="Specify exact claims or sources the author must amend..."
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          )}

          {/* Editorial Comments */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase font-mono">
              Editorial Comments & Audit Remarks
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add internal editorial rationale or approval notes..."
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <Button
              variant="primary"
              disabled={decisionMutation.isPending}
              onClick={() =>
                decisionMutation.mutate({
                  decision,
                  comments: comments.trim() || undefined,
                  requiredChanges: requiredChanges.trim() || undefined,
                })
              }
            >
              <Send className="w-4 h-4 mr-1.5" />
              {decisionMutation.isPending ? 'Submitting...' : 'Submit Final Editorial Decision'}
            </Button>
          </div>
        </Card>
      )}

      {/* TAB 5: MODERATOR NOTES & AUDIT TRAIL */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          {/* Add Moderator Note */}
          <Card variant="glass" className="p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" /> Internal Confidential Moderator Notes
              </h3>
              <p className="text-xs text-slate-400">
                These notes are restricted to editorial staff and will NEVER appear publicly or to the contributor.
              </p>
            </div>

            <div className="space-y-3">
              <textarea
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Record internal investigation notes, contact verification details, or editorial memos..."
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={noteMutation.isPending || !noteContent.trim()}
                  onClick={() => noteMutation.mutate(noteContent.trim())}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Add Note
                </Button>
              </div>
            </div>

            {/* Existing Notes List */}
            {moderatorNotes.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                  Recorded Case Notes ({moderatorNotes.length})
                </span>
                <div className="space-y-2">
                  {moderatorNotes.map((note) => (
                    <div key={note.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                        <span className="font-bold text-slate-200">{note.authorName}</span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-300 font-mono">{note.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Audit Trail Timeline */}
          <Card variant="glass" className="p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" /> Complete Audit Trail
              </h3>
              <p className="text-xs text-slate-400">Chronological history of all algorithmic and editorial actions.</p>
            </div>

            <div className="space-y-3">
              {auditTrail.map((ev, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between font-mono text-slate-400 text-[11px]">
                      <span className="font-bold text-slate-200">{ev.action}</span>
                      <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-400">
                      By <strong className="text-slate-300">{ev.actorName}</strong> {ev.details && `— ${ev.details}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

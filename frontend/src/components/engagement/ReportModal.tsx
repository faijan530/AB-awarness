import React, { useState } from 'react';
import { EngagementService } from '@/services/api/engagement-service';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/common/Button';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'NEWS' | 'COMMENT';
  targetId: string;
  targetTitle?: string;
}

const REPORT_REASONS = [
  { value: 'MISLEADING', label: 'Misleading Headline or Context' },
  { value: 'FALSE_INFORMATION', label: 'Factually Incorrect Information' },
  { value: 'SPAM', label: 'Spam, Bots, or Commercial Promotion' },
  { value: 'ABUSE', label: 'Harassment or Abusive Conduct' },
  { value: 'OFFENSIVE', label: 'Hate Speech or Offensive Content' },
  { value: 'COPYRIGHT', label: 'Copyright / Plagiarism Infringement' },
  { value: 'OTHER', label: 'Other Policy Violation' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const toast = useToast();
  const [reason, setReason] = useState<string>('MISLEADING');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (targetType === 'NEWS') {
        await EngagementService.reportNews(targetId, { reason, description: description.trim() || undefined });
      } else {
        await EngagementService.reportComment(targetId, { reason, description: description.trim() || undefined });
      }

      toast.success(
        'Report Submitted',
        'Thank you for helping keep our journalism community safe and credible. Our editorial desk will investigate.'
      );
      onClose();
      setDescription('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-white text-base">
              Report {targetType === 'NEWS' ? 'Article' : 'Comment'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {targetTitle && (
          <p className="text-xs text-slate-300 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 line-clamp-2">
            "{targetTitle}"
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
              Primary Reason for Report *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl p-3 text-xs text-white outline-none cursor-pointer font-semibold"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
              Additional Context / Proof (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Provide evidence or context for our moderators..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none leading-relaxed"
              maxLength={500}
            />
            <span className="text-[10px] text-slate-500 font-mono block text-right">
              {description.length}/500 chars
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit" isLoading={isSubmitting}>
              Submit Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

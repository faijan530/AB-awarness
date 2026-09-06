import React from 'react';
import { EngagementService, SharePlatform } from '@/services/api/engagement-service';
import { useToast } from '@/hooks/useToast';
import { X, Copy, Check, MessageCircle, Send, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsId: string;
  title: string;
  url?: string;
  onShareRecorded?: (count: number) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  newsId,
  title,
  url = window.location.href,
  onShareRecorded,
}) => {
  const toast = useToast();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleShareAction = async (platform: SharePlatform) => {
    try {
      const res = await EngagementService.recordShare(newsId, platform);
      if (onShareRecorded) {
        onShareRecorded(res.shareCount);
      }
    } catch {
      // Non-blocking analytics record
    }

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    switch (platform) {
      case 'WHATSAPP':
        window.open(`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`, '_blank');
        break;
      case 'FACEBOOK':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        break;
      case 'X':
        window.open(`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`, '_blank');
        break;
      case 'TELEGRAM':
        window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`, '_blank');
        break;
      case 'COPY_LINK':
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link Copied!', 'Article link copied to your clipboard.');
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-white text-base">Share Story</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Article Headline Preview */}
        <p className="text-xs text-slate-300 font-serif line-clamp-2 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          "{title}"
        </p>

        {/* Share Options Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleShareAction('WHATSAPP')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all font-semibold text-xs text-left"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => handleShareAction('X')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition-all font-semibold text-xs text-left"
          >
            <span className="font-mono text-sm font-black">𝕏</span>
            <span>X (Twitter)</span>
          </button>

          <button
            type="button"
            onClick={() => handleShareAction('FACEBOOK')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-all font-semibold text-xs text-left"
          >
            <Share2 className="w-4 h-4" />
            <span>Facebook</span>
          </button>

          <button
            type="button"
            onClick={() => handleShareAction('TELEGRAM')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-all font-semibold text-xs text-left"
          >
            <Send className="w-4 h-4" />
            <span>Telegram</span>
          </button>
        </div>

        {/* Copy Link Input Bar */}
        <div className="pt-2">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2">
            <input
              type="text"
              readOnly
              value={url}
              className="w-full bg-transparent text-xs text-slate-400 outline-none font-mono px-2"
            />
            <button
              type="button"
              onClick={() => handleShareAction('COPY_LINK')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

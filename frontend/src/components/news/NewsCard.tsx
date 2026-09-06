import React from 'react';
import { Link } from 'react-router-dom';
import { NewsArticle } from '@/services/api/news-service';
import { MapPin, Clock, Share2, Bookmark, FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/common/Badge';

interface NewsCardProps {
  article: NewsArticle;
  onShare?: (title: string, slug: string) => void;
  onBookmark?: (title: string, id: string) => void;
  isBookmarked?: boolean;
}

const formatRelativeTime = (dateInput?: string | Date | null): string => {
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

export const NewsCard: React.FC<NewsCardProps> = ({
  article,
  onShare,
  onBookmark,
  isBookmarked = false,
}) => {
  return (
    <article className="group relative bg-[#0a0e1c]/80 border border-indigo-500/15 hover:border-rose-500/40 rounded-2xl p-5 space-y-4 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-xl hover:shadow-rose-950/20 backdrop-blur-sm transform-gpu active:scale-[0.99]">
      <div className="space-y-3">
        {/* Category & Region Metadata Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
              {article.category?.name || 'NEWS'}
            </span>
            {article.isFactChecked && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-400 font-mono font-medium flex items-center gap-1 bg-slate-900/80 px-2.5 py-0.5 rounded-md border border-slate-800">
            <MapPin className="w-3 h-3 text-rose-400" /> {article.location?.name || 'Jharkhand'}
          </span>
        </div>

        {/* Title */}
        <Link to={`/news/${article.slug || article.id}`}>
          <h4 className="font-bold font-serif text-white text-base leading-snug group-hover:text-rose-300 transition-colors line-clamp-2 mt-1">
            {article.title}
          </h4>
        </Link>

        {/* Summary Snippet */}
        <p className="text-xs text-slate-300/80 leading-relaxed line-clamp-3 font-medium">
          {article.summary || article.content?.substring(0, 120) + '...'}
        </p>
      </div>

      {/* Footer Meta Row */}
      <div className="pt-3.5 border-t border-indigo-500/10 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-rose-400" /> {formatRelativeTime(article.publishedAt)}
          </span>
          {article.author?.fullName && (
            <span className="hidden sm:inline-flex items-center gap-1 text-indigo-300 font-semibold">
              <FileText className="w-3 h-3 text-indigo-400" /> {article.author.fullName.split(' ')[0]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onShare && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onShare(article.title, article.slug);
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-indigo-950/60 transition-colors active:scale-90"
              title="Share Story"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onBookmark && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onBookmark(article.title, article.id);
              }}
              className={`p-1.5 rounded-lg transition-colors active:scale-90 ${
                isBookmarked
                  ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-indigo-950/60'
              }`}
              title={isBookmarked ? 'Bookmarked' : 'Bookmark Story'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
            </button>
          )}

          <Link
            to={`/news/${article.slug || article.id}`}
            className="text-xs font-black text-rose-400 hover:text-rose-300 transition-colors pl-1"
          >
            Read →
          </Link>
        </div>
      </div>
    </article>
  );
};

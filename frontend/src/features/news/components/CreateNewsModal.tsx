import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NewsService } from '@/services/api/news-service';
import { CategoryService } from '@/services/api/category-service';
import { LocationService } from '@/services/api/location-service';
import { AdminNewsService } from '@/services/api/admin-news-service';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/useToast';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import {
  Award,
  FileText,
  MapPin,
  Tag,
  Send,
  Eye,
  Edit3,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  Clock
} from 'lucide-react';

interface CreateNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateNewsModal: React.FC<CreateNewsModalProps> = ({ isOpen, onClose }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { hasRole } = useAuthStore();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categorySlug, setCategorySlug] = useState('local-news');
  const [locationSlug, setLocationSlug] = useState('palamu');
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  // Fetch Live Categories & Locations from Backend
  const { data: categories = [] } = useQuery({
    queryKey: ['public-categories'],
    queryFn: () => CategoryService.getCategories(),
    enabled: isOpen,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['public-locations'],
    queryFn: () => LocationService.getLocations(),
    enabled: isOpen,
  });

  const createStoryMutation = useMutation({
    mutationFn: async () => {
      const cat = categories.find((c) => c.slug === categorySlug);
      const loc = locations.find((l) => l.slug === locationSlug);

      // 1. Create News Draft with selected Category and Location
      const res = await NewsService.createNews({
        title: title.trim(),
        shortDescription: summary.trim() || undefined,
        content: content.trim(),
        categoryIds: cat ? [cat.id] : undefined,
        locationIds: loc ? [loc.id] : undefined,
      });
      const article = (res as any).data || res;

      if (!article || !article.id) {
        throw new Error('Failed to obtain created article ID');
      }

      // 2. If current user is SUPER_ADMIN, immediately publish live; otherwise submit for review
      if (hasRole('SUPER_ADMIN')) {
        await AdminNewsService.publishNews(article.id);
      } else {
        await NewsService.submitForReview(article.id);
      }

      return article;
    },
    onSuccess: (article) => {
      const isSuperAdmin = hasRole('SUPER_ADMIN');
      toast.success(
        isSuperAdmin ? 'Story Published Live!' : 'Story Submitted Successfully!',
        isSuperAdmin
          ? `"${article.title.substring(0, 45)}..." is now live on the public dashboard panel.`
          : `"${article.title.substring(0, 45)}..." is now in Super Admin review queue.`
      );
      // Invalidate feeds so it immediately displays on the homepage
      queryClient.invalidateQueries({ queryKey: ['news-feed'] });
      queryClient.invalidateQueries({ queryKey: ['featured-news'] });
      queryClient.invalidateQueries({ queryKey: ['trending-news'] });
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      queryClient.invalidateQueries({ queryKey: ['admin-news-dashboard'] });

      // Reset Form State & Close
      setTitle('');
      setSummary('');
      setContent('');
      setIsPreviewActive(false);
      onClose();
    },
    onError: (err: any) => {
      toast.error('Submission Failed', err.response?.data?.message || err.message || 'An error occurred');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createStoryMutation.mutate();
  };

  const selectedCategory = categories.find((c) => c.slug === categorySlug);
  const selectedLocation = locations.find((l) => l.slug === locationSlug);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Citizen News Report">
      <div className="space-y-5">
        {/* Header Notice Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/30 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Ground Reporter Editorial Desk</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Module 5 & 6 Live
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Report verified local incidents across Jharkhand, Palamu & Garhwa. Submitted reports undergo Super Admin editorial fact-checking before live publishing.
          </p>

          <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Verified Author Status
            </span>
            <button
              type="button"
              onClick={() => setIsPreviewActive(!isPreviewActive)}
              className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
            >
              {isPreviewActive ? (
                <>
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" /> Edit Details
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" /> Live Preview
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Article Preview Card Mode */}
        {isPreviewActive ? (
          <div className="space-y-4 p-5 rounded-2xl bg-[#090d19] border border-emerald-500/20 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-[10px] font-mono font-extrabold uppercase text-emerald-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> LIVE STORY CARD PREVIEW
              </span>
              <Badge variant="emerald">
                <ShieldCheck className="w-3 h-3 inline mr-1" /> Pending Super Admin Review
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {selectedCategory ? selectedCategory.name : 'Local News'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-400" /> {selectedLocation ? selectedLocation.name : 'Jharkhand'}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white font-serif leading-snug">
                {title.trim() || 'Headline title will appear here...'}
              </h3>

              {summary.trim() && (
                <p className="text-xs text-slate-300 italic border-l-2 border-emerald-500 pl-3 py-0.5">
                  {summary.trim()}
                </p>
              )}

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">
                {content.trim() || 'Full article story content text will appear here...'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3 text-emerald-400" /> Just now
              </span>
              <span className="text-slate-400 font-semibold">Author: Citizen Reporter</span>
            </div>
          </div>
        ) : (
          /* Form Input Mode */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Story Headline Title */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                <span>Story Headline Title *</span>
                <span className="text-[10px] text-slate-500 font-mono">{title.length}/150 chars</span>
              </label>
              <Input
                placeholder="e.g., Road repair initiated on Daltonganj bypass corridor..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={150}
              />
            </div>

            {/* Short Summary */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                <span>Short Summary / Excerpt (Optional)</span>
                <span className="text-[10px] text-slate-500 font-mono">{summary.length}/250 chars</span>
              </label>
              <input
                type="text"
                maxLength={250}
                placeholder="Brief 1-line overview for news feeds..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-emerald-500/50 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
              />
            </div>

            {/* Category & Location Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" /> Category Section *
                </label>
                <select
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-xl p-3 text-xs text-white outline-none font-semibold shadow-inner cursor-pointer"
                >
                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="local-news">Local News</option>
                      <option value="jharkhand">Jharkhand Statewide</option>
                      <option value="politics">Politics & Policy</option>
                      <option value="sports">Sports</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> Location Registry *
                </label>
                <select
                  value={locationSlug}
                  onChange={(e) => setLocationSlug(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/50 rounded-xl p-3 text-xs text-white outline-none font-semibold shadow-inner cursor-pointer"
                >
                  {locations.length > 0 ? (
                    locations.map((l) => (
                      <option key={l.id} value={l.slug}>
                        {l.name} ({l.type})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="palamu">Palamu District</option>
                      <option value="garhwa">Garhwa District</option>
                      <option value="latehar">Latehar District</option>
                      <option value="jharkhand">Jharkhand State</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Full Story Content */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                <span>Article Story Content *</span>
                <span className="text-[10px] text-slate-500 font-mono">{content.length} characters</span>
              </label>
              <textarea
                required
                rows={6}
                placeholder="Write full story details, incident location context, eyewitness notes, or official statements here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-emerald-500/50 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 outline-none transition-all resize-none shadow-inner leading-relaxed"
              />
            </div>

            {/* Verification Footer Notice & Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Super Admin fact-check verification required before publishing.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button variant="outline" size="sm" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="emerald"
                  size="sm"
                  type="submit"
                  isLoading={createStoryMutation.isPending}
                  disabled={!title.trim() || !content.trim()}
                  className="shadow-lg shadow-emerald-950/80 px-4 font-black"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Story Report
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

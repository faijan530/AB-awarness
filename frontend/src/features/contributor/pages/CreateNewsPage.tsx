import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContributorService } from '@/services/api/contributor-service';
import { CategoryService } from '@/services/api/category-service';
import { LocationService } from '@/services/api/location-service';
import { AdminNewsService } from '@/services/api/admin-news-service';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Skeleton } from '@/components/common/Skeleton';
import { SourceService, SourceItem } from '@/services/api/source-service';
import {
  FileText,
  ArrowLeft,
  Send,
  Save,
  Eye,
  Edit3,
  MapPin,
  Tag as TagIcon,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Globe,
  Sparkles,
  Check
} from 'lucide-react';

export const CreateNewsPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  useDocumentTitle(isEditMode ? 'Edit Story Draft — Reporter Desk' : 'Write New Story — Reporter Desk');

  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categorySlug, setCategorySlug] = useState('local-news');
  const [locationSlug, setLocationSlug] = useState('palamu');
  const [sourceName, setSourceName] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [sourceReferenceUrl, setSourceReferenceUrl] = useState<string>('');
  const [sourceNote, setSourceNote] = useState<string>('');
  const [tags, setTags] = useState('');
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  // Fetch Categories, Locations & Sources
  const { data: categories = [] } = useQuery({
    queryKey: ['public-categories-workspace'],
    queryFn: () => CategoryService.getCategories(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['public-locations-workspace'],
    queryFn: () => LocationService.getLocations(),
  });

  const { data: sourcesData } = useQuery({
    queryKey: ['public-sources-workspace'],
    queryFn: () => SourceService.listSources(),
  });
  const sourcesList: SourceItem[] = sourcesData?.items || [];

  // Fetch Existing Article if in Edit Mode
  const { data: existingArticle, isLoading: isLoadingArticle } = useQuery({
    queryKey: ['submission-detail', id],
    queryFn: () => ContributorService.getSubmissionById(id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingArticle) {
      setTitle(existingArticle.title);
      setSummary(existingArticle.summary || '');
      setContent(existingArticle.content);
      if (existingArticle.category) setCategorySlug(existingArticle.category.slug);
      if (existingArticle.location) setLocationSlug(existingArticle.location.slug);
    }
  }, [existingArticle]);

  const { hasRole } = useAuthStore();

  // Create / Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (shouldSubmit: boolean) => {
      let articleId = id;
      const cat = categories.find((c) => c.slug === categorySlug);
      const loc = locations.find((l) => l.slug === locationSlug);

      const sourcesPayload = selectedSourceId
        ? [{
            sourceId: selectedSourceId,
            referenceUrl: sourceReferenceUrl.trim() || undefined,
            sourceNote: sourceNote.trim() || undefined,
          }]
        : undefined;

      if (isEditMode && articleId) {
        await ContributorService.updateDraft(articleId, {
          title: title.trim(),
          shortDescription: summary.trim() || undefined,
          content: content.trim(),
          categoryIds: cat ? [cat.id] : undefined,
          locationIds: loc ? [loc.id] : undefined,
          sources: sourcesPayload,
        });
      } else {
        const created = await ContributorService.createDraft({
          title: title.trim(),
          shortDescription: summary.trim() || undefined,
          content: content.trim(),
          categoryIds: cat ? [cat.id] : undefined,
          locationIds: loc ? [loc.id] : undefined,
          sources: sourcesPayload,
        });
        articleId = created.id;
      }

      if (shouldSubmit && articleId) {
        if (hasRole('SUPER_ADMIN')) {
          await AdminNewsService.publishNews(articleId);
        } else {
          await ContributorService.submitForReview(articleId);
        }
      }

      return { articleId, shouldSubmit };
    },
    onSuccess: (res) => {
      const isSuperAdmin = hasRole('SUPER_ADMIN');
      toast.success(
        res.shouldSubmit
          ? isSuperAdmin
            ? 'Story Published Live!'
            : 'Story Submitted for Review!'
          : 'Draft Saved!',
        res.shouldSubmit
          ? isSuperAdmin
            ? 'Your news story is now active on the public news portal.'
            : 'Your news story is now in Super Admin verification queue.'
          : 'Your draft has been saved cleanly in workspace.'
      );
      queryClient.invalidateQueries({ queryKey: ['my-submissions-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['my-submissions-list'] });
      queryClient.invalidateQueries({ queryKey: ['news-feed'] });
      queryClient.invalidateQueries({ queryKey: ['featured-news'] });
      navigate('/contributor/submissions');
    },
    onError: (err: any) => {
      toast.error('Operation Failed', err.response?.data?.message || err.message || 'Failed to save or submit story.');
    },
  });

  const selectedCategory = categories.find((c) => c.slug === categorySlug);
  const selectedLocation = locations.find((l) => l.slug === locationSlug);

  if (isEditMode && isLoadingArticle) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

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
                EDITOR WORKSPACE
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {isEditMode ? 'Edit Existing Draft / Revision' : 'Author & Submit New Story'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              {isEditMode ? 'Edit Story Draft' : 'Write New Journalism Story'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewActive(!isPreviewActive)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              {isPreviewActive ? (
                <>
                  <Edit3 className="w-4 h-4 text-emerald-400" /> Form Edit Mode
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-emerald-400" /> Live Card Preview
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      {isPreviewActive ? (
        /* Live Card Preview Mode */
        <div className="p-6 rounded-3xl bg-[#090d19] border border-emerald-500/30 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-extrabold uppercase text-emerald-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> LIVE ARTICLE CARD PREVIEW
            </span>
            <Badge variant="emerald">
              <ShieldCheck className="w-3.5 h-3.5 inline mr-1" /> Pending Super Admin Review
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-black bg-rose-500/15 text-rose-300 border border-rose-500/30">
                {selectedCategory ? selectedCategory.name : 'Local News'}
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> {selectedLocation ? selectedLocation.name : 'Jharkhand'}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white font-serif leading-snug">
              {title.trim() || 'Headline title will appear here...'}
            </h2>

            {summary.trim() && (
              <p className="text-xs sm:text-sm text-slate-300 italic border-l-2 border-emerald-500 pl-3 py-1 bg-slate-900/50 rounded-r-xl">
                {summary.trim()}
              </p>
            )}

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {content.trim() || 'Full article story content text will appear here...'}
            </p>
          </div>
        </div>
      ) : (
        /* Form Editor Mode */
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(true);
          }}
          className="glass-card-user rounded-3xl p-6 sm:p-8 space-y-6"
        >
          {/* Story Headline Title */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span>Headline Story Title *</span>
              <span className="text-[11px] text-slate-400 font-mono">{title.length}/150 chars</span>
            </label>
            <Input
              placeholder="e.g., Highway bridge repair completed in Garhwa district..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={150}
            />
          </div>

          {/* Short Excerpt Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span>Short Summary / Excerpt (Optional)</span>
              <span className="text-[11px] text-slate-400 font-mono">{summary.length}/250 chars</span>
            </label>
            <input
              type="text"
              maxLength={250}
              placeholder="Brief 1-line overview for news feeds..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-rose-500/50 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
            />
          </div>

          {/* Category & Location Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <TagIcon className="w-4 h-4 text-indigo-400" /> Category Taxonomy Section *
              </label>
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500/50 rounded-xl p-3 text-xs text-white outline-none font-semibold shadow-inner cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-400" /> Geographic Location Registry *
              </label>
              <select
                value={locationSlug}
                onChange={(e) => setLocationSlug(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-rose-500/50 rounded-xl p-3 text-xs text-white outline-none font-semibold shadow-inner cursor-pointer"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.slug}>
                    {l.name} ({l.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Story Content Area */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span>Full Article Story Content *</span>
              <span className="text-[11px] text-slate-400 font-mono">{content.length} characters</span>
            </label>
            <textarea
              required
              rows={8}
              placeholder="Write complete article details, incident location context, eyewitness notes, or official statements here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-rose-500/50 rounded-xl p-4 text-xs text-white placeholder-slate-500 outline-none transition-all resize-none shadow-inner leading-relaxed"
            />
          </div>

          {/* Module 7: Official Sources & Journalism References */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 font-serif">
                <Globe className="w-4 h-4 text-emerald-400" /> Primary Sources & Evidence Citations
              </h4>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">Credibility Registry</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                  Select Verified Platform Source
                </label>
                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white outline-none font-semibold cursor-pointer"
                >
                  <option value="">-- Choose official source or select below --</option>
                  {sourcesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.sourceType}) [{s.credibilityStatus}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                  Official Gazette / Reference URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://palamu.nic.in/notices/order-42.pdf"
                  value={sourceReferenceUrl}
                  onChange={(e) => setSourceReferenceUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                Source Context / Verification Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Confirmed by Deputy Collector in official district press briefing."
                value={sourceNote}
                onChange={(e) => setSourceNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Super Admin fact-check verification required before live publishing.</span>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                type="button"
                leftIcon={<Save className="w-4 h-4" />}
                isLoading={saveMutation.isPending}
                onClick={() => saveMutation.mutate(false)}
              >
                Save Draft
              </Button>
              <Button
                variant="emerald"
                type="submit"
                leftIcon={<Send className="w-4 h-4" />}
                isLoading={saveMutation.isPending}
                disabled={!title.trim() || !content.trim()}
              >
                Submit Story For Review
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

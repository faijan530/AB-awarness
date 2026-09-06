import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MediaService, MediaItem, MediaType } from '@/services/api/media-service';
import { useDebounce } from '@/hooks/useDebounce';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { MediaDetailModal } from '@/components/media/MediaDetailModal';
import { MediaUploader } from '@/components/media/MediaUploader';
import { useToast } from '@/hooks/useToast';
import {
  Image as ImageIcon,
  Video,
  FileText,
  UploadCloud,
  Search,
  RefreshCw,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Eye,
  X,
  Layers,
} from 'lucide-react';

export const AdminMediaPage: React.FC = () => {
  useDocumentTitle('Media Library & CDN Assets — Super Admin');

  const toast = useToast();
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [page, setPage] = useState<number>(1);
  const limit = 12;

  // Modals state
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  const {
    data: mediaData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-media-list', typeFilter, statusFilter, debouncedSearch, page],
    queryFn: () =>
      MediaService.listAdminMedia({
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: debouncedSearch.trim() || undefined,
        page,
        limit,
      }),
    placeholderData: (prev) => prev,
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleUploadBatchComplete = () => {
    toast.success('Media batch uploaded successfully');
    queryClient.invalidateQueries({ queryKey: ['admin-media-list'] });
    setIsUploadModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black font-serif text-white tracking-tight flex items-center gap-2">
              <ImageIcon className="w-7 h-7 text-indigo-400" />
              Media Library & Object Storage
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              CDN Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Store, process, quarantine, and deliver high-resolution images, videos, and multimedia assets
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
            Upload Media
          </Button>
        </div>
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
              placeholder="Search media by filename..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {/* Type Filters */}
            {[
              { label: 'All Types', val: 'ALL' },
              { label: 'Images', val: 'IMAGE' },
              { label: 'Videos', val: 'VIDEO' },
              { label: 'Documents', val: 'DOCUMENT' },
            ].map((t) => (
              <button
                key={t.val}
                onClick={() => {
                  setTypeFilter(t.val);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  typeFilter === t.val
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filters */}
            {[
              { label: 'All', val: 'ALL' },
              { label: 'Ready', val: 'READY' },
              { label: 'Quarantined', val: 'QUARANTINED' },
            ].map((s) => (
              <button
                key={s.val}
                onClick={() => {
                  setStatusFilter(s.val);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-colors ${
                  statusFilter === s.val
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl bg-slate-800" />
          ))}
        </div>
      ) : !mediaData?.items || mediaData.items.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="w-12 h-12 text-slate-600" />}
          title="No Media Assets Found"
          description="Upload image or video files, or adjust your search filters."
          action={
            <Button variant="primary" size="sm" onClick={() => setIsUploadModalOpen(true)}>
              Upload Media
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mediaData.items.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedMedia(item)}
              className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 cursor-pointer flex flex-col shadow-md hover:shadow-xl hover:shadow-indigo-950/20"
            >
              {/* Thumbnail Stage */}
              <div className="aspect-square bg-slate-950 relative overflow-hidden flex items-center justify-center">
                {item.type === 'IMAGE' ? (
                  <img
                    src={item.url}
                    alt={item.originalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : item.type === 'VIDEO' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-indigo-400">
                    <Video className="w-10 h-10 mb-1" />
                    <span className="text-[10px] font-mono text-slate-400">VIDEO</span>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-amber-400">
                    <FileText className="w-10 h-10 mb-1" />
                    <span className="text-[10px] font-mono text-slate-400">DOC</span>
                  </div>
                )}

                {/* Status Pill */}
                {item.status === 'QUARANTINED' && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-500/80 backdrop-blur-xs text-[10px] font-bold text-white shadow-xs">
                    QUARANTINED
                  </div>
                )}

                {/* Hover overlay with eye icon */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs text-white">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                <p className="text-xs font-bold text-slate-200 truncate font-mono" title={item.originalName}>
                  {item.originalName}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{formatBytes(item.sizeBytes)}</span>
                  <span className="uppercase">{item.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {mediaData?.meta && mediaData.meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <span>
            Showing page {page} of {mediaData.meta.totalPages} ({mediaData.meta.total} assets)
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
              disabled={page >= mediaData.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-400" /> Upload Media to CDN
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <MediaUploader onBatchComplete={handleUploadBatchComplete} />
          </div>
        </div>
      )}

      {/* DETAIL & METADATA INSPECT MODAL */}
      <MediaDetailModal
        isOpen={!!selectedMedia}
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        isAdmin={true}
      />
    </div>
  );
};

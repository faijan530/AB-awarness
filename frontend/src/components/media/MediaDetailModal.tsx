import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MediaService, MediaItem } from '@/services/api/media-service';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useToast } from '@/hooks/useToast';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Edit2,
  FileText,
  Clock,
  HardDrive,
  User,
  AlertTriangle,
} from 'lucide-react';

interface MediaDetailModalProps {
  media: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  media,
  isOpen,
  onClose,
  isAdmin = true,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [copied, setCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);

  // Fetch usage
  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['media-usage', media?.id],
    queryFn: () => (media ? MediaService.getMediaUsage(media.id) : null),
    enabled: isOpen && !!media && isAdmin,
  });

  // Edit metadata mutation
  const editMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      MediaService.updateMediaMetadata(id, { originalName: name }),
    onSuccess: (updated) => {
      toast.success('Media name updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-media-list'] });
      setIsEditing(false);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update metadata'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => MediaService.deleteMedia(id, isAdmin),
    onSuccess: () => {
      toast.success('Media deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-media-list'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to delete media'),
  });

  // Quarantine mutation
  const quarantineMutation = useMutation({
    mutationFn: (id: string) => MediaService.quarantineMedia(id),
    onSuccess: () => {
      toast.success('Media quarantined');
      queryClient.invalidateQueries({ queryKey: ['admin-media-list'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to quarantine media'),
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: (id: string) => MediaService.restoreMedia(id),
    onSuccess: () => {
      toast.success('Media restored to Ready status');
      queryClient.invalidateQueries({ queryKey: ['admin-media-list'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to restore media'),
  });

  if (!isOpen || !media) return null;

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.origin + media.url);
    setCopied(true);
    toast.success('Media URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveMetadata = () => {
    if (!editedName.trim()) return;
    editMutation.mutate({ id: media.id, name: editedName });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Badge variant={media.status === 'READY' ? 'emerald' : 'amber'}>
              {media.status}
            </Badge>
            <span className="text-xs font-mono text-neutral-400">{media.type}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Media Preview Window */}
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-neutral-950 flex items-center justify-center border border-neutral-800">
            {media.type === 'IMAGE' ? (
              <img
                src={media.url}
                alt={media.originalName}
                className="max-h-full max-w-full object-contain"
              />
            ) : media.type === 'VIDEO' ? (
              <video src={media.url} controls className="max-h-full max-w-full" />
            ) : (
              <div className="text-neutral-400 flex flex-col items-center">
                <FileText className="w-12 h-12 mb-2 opacity-50" />
                <span className="text-xs font-mono">{media.originalName}</span>
              </div>
            )}
          </div>

          {/* Title / Name Editor */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Asset Title / Filename
            </label>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                />
                <Button size="sm" variant="primary" onClick={handleSaveMetadata}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {media.originalName}
                </h3>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditedName(media.originalName);
                      setIsEditing(true);
                    }}
                    className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
              <span className="text-[11px] text-neutral-500 flex items-center gap-1 mb-1">
                <HardDrive className="w-3 h-3" /> File Size
              </span>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {(media.sizeBytes / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
              <span className="text-[11px] text-neutral-500 flex items-center gap-1 mb-1">
                <FileText className="w-3 h-3" /> MIME Type
              </span>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate block">
                {media.mimeType}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
              <span className="text-[11px] text-neutral-500 flex items-center gap-1 mb-1">
                <User className="w-3 h-3" /> Uploader
              </span>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate block">
                {media.uploader?.fullName || 'Platform'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60">
              <span className="text-[11px] text-neutral-500 flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" /> Created
              </span>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {new Date(media.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Article Usage Section */}
          {isAdmin && (
            <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Article Usage ({usageData?.totalUsage || 0})
                </h4>
              </div>

              {usageLoading ? (
                <div className="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
              ) : !usageData?.articles || usageData.articles.length === 0 ? (
                <p className="text-xs text-neutral-500 italic">
                  Not currently attached to any published stories. Safe to delete.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {usageData.articles.map((art) => (
                    <div
                      key={art.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 text-xs"
                    >
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-sm">
                        {art.title}
                      </span>
                      <Badge variant="neutral">{art.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Direct Public URL */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Asset Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={window.location.origin + media.url}
                className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-300"
              />
              <Button size="sm" variant="outline" onClick={copyUrl}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <a
                href={media.url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
          <div className="flex items-center gap-2">
            {isAdmin && media.status === 'READY' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => quarantineMutation.mutate(media.id)}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Quarantine
              </Button>
            )}
            {isAdmin && media.status === 'QUARANTINED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => restoreMutation.mutate(media.id)}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Restore
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-500 font-semibold">Confirm delete?</span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteMutation.mutate(media.id)}
                >
                  Yes, Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConfirmingDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsConfirmingDelete(true)}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Asset
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

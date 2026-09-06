import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MediaService, MediaItem, MediaType } from '@/services/api/media-service';
import { MediaUploader } from './MediaUploader';
import { Button } from '@/components/common/Button';
import {
  X,
  Search,
  Check,
  Image as ImageIcon,
  Video,
  FileText,
  Upload,
  FolderOpen,
} from 'lucide-react';

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
  allowedTypes?: MediaType[];
  title?: string;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  allowedTypes = ['IMAGE', 'VIDEO'],
  title = 'Select Media',
}) => {
  const [activeTab, setActiveTab] = useState<'LIBRARY' | 'UPLOAD'>('LIBRARY');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: mediaData, isLoading } = useQuery({
    queryKey: ['media-picker-library', typeFilter, searchQuery],
    queryFn: () =>
      MediaService.listMyMedia({
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        limit: 30,
      }),
    enabled: isOpen && activeTab === 'LIBRARY',
  });

  if (!isOpen) return null;

  const items = mediaData?.items || [];
  const selectedMedia = items.find((m) => m.id === selectedId);

  const handleConfirmSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia);
      onClose();
    }
  };

  const handleUploadedSuccess = (uploaded: MediaItem) => {
    onSelect(uploaded);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{title}</h3>
            <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('LIBRARY')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'LIBRARY'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" /> Media Library
              </button>
              <button
                onClick={() => setActiveTab('UPLOAD')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'UPLOAD'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> Upload New
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'UPLOAD' ? (
            <MediaUploader
              onSuccess={handleUploadedSuccess}
              multiple={false}
              acceptedTypes={allowedTypes.map((t) => (t === 'IMAGE' ? 'image/*' : 'video/*'))}
            />
          ) : (
            <div>
              {/* Filter bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search your media..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {['ALL', 'IMAGE', 'VIDEO'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        typeFilter === type
                          ? 'bg-indigo-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of media */}
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl bg-neutral-200 dark:bg-neutral-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No media found</p>
                  <p className="text-xs mt-1">Upload an image or video to use it in your stories</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {items.map((media) => {
                    const isSelected = selectedId === media.id;
                    return (
                      <div
                        key={media.id}
                        onClick={() => setSelectedId(media.id)}
                        className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500/50 scale-[0.98]'
                            : 'border-transparent hover:border-neutral-300 dark:hover:border-neutral-700'
                        } bg-neutral-100 dark:bg-neutral-950`}
                      >
                        {media.type === 'IMAGE' ? (
                          <img
                            src={media.url}
                            alt={media.originalName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-neutral-400 p-2 text-center">
                            <Video className="w-8 h-8 mb-1 text-indigo-400" />
                            <span className="text-[10px] truncate max-w-full font-mono">
                              {media.originalName}
                            </span>
                          </div>
                        )}

                        {/* Selected Checkmark Indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <p className="text-[10px] text-white truncate font-medium">
                            {media.originalName}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'LIBRARY' && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
            <span className="text-xs text-neutral-500">
              {selectedMedia ? `Selected: ${selectedMedia.originalName}` : 'Select a media asset'}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedId}
                onClick={handleConfirmSelect}
              >
                Attach Selected Media
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

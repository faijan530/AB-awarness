import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { MediaService, MediaItem } from '@/services/api/media-service';
import { Button } from '@/components/common/Button';

interface UploadItemStatus {
  file: File;
  progress: number;
  status: 'QUEUED' | 'UPLOADING' | 'SUCCESS' | 'ERROR';
  error?: string;
  result?: MediaItem;
}

interface MediaUploaderProps {
  onSuccess?: (media: MediaItem) => void;
  onBatchComplete?: (mediaList: MediaItem[]) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  multiple?: boolean;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onSuccess,
  onBatchComplete,
  acceptedTypes = ['image/*', 'video/*', 'application/pdf'],
  maxSizeMB = 50,
  multiple = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [queue, setQueue] = useState<UploadItemStatus[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadItemStatus[] = [];
    const maxBytes = maxSizeMB * 1024 * 1024;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxBytes) {
        newItems.push({
          file,
          progress: 0,
          status: 'ERROR',
          error: `File exceeds max size of ${maxSizeMB}MB`,
        });
      } else {
        newItems.push({
          file,
          progress: 0,
          status: 'QUEUED',
        });
      }
      if (!multiple) break;
    }

    setQueue((prev) => [...prev, ...newItems]);
    // Automatically trigger upload
    newItems.forEach((item) => {
      if (item.status === 'QUEUED') {
        uploadFileItem(item.file);
      }
    });
  };

  const uploadFileItem = async (file: File) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.file.name === file.name && item.file.size === file.size
          ? { ...item, status: 'UPLOADING', progress: 30 }
          : item
      )
    );

    try {
      const media = await MediaService.uploadFile(file);

      setQueue((prev) => {
        const updated = prev.map((item) =>
          item.file.name === file.name && item.file.size === file.size
            ? { ...item, status: 'SUCCESS' as const, progress: 100, result: media }
            : item
        );

        if (onSuccess) onSuccess(media);

        const allFinished = updated.every((i) => i.status === 'SUCCESS' || i.status === 'ERROR');
        if (allFinished && onBatchComplete) {
          const successfulMedia = updated.filter((i) => i.result).map((i) => i.result!);
          onBatchComplete(successfulMedia);
        }

        return updated;
      });
    } catch (err: any) {
      setQueue((prev) =>
        prev.map((item) =>
          item.file.name === file.name && item.file.size === file.size
            ? { ...item, status: 'ERROR' as const, progress: 0, error: err?.message || 'Upload failed' }
            : item
        )
      );
    }
  };

  const removeQueueItem = (fileName: string) => {
    setQueue((prev) => prev.filter((i) => i.file.name !== fileName));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01]'
            : 'border-neutral-300 dark:border-neutral-700 hover:border-indigo-400 bg-neutral-50/50 dark:bg-neutral-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h4 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
          Drag & drop media files here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
        </h4>
        <p className="text-xs text-neutral-500 mt-1">
          Supports JPG, PNG, WEBP, MP4, WebM up to {maxSizeMB}MB
        </p>
      </div>

      {/* Upload Queue List */}
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                    {item.file.name}
                  </span>
                  <span className="text-neutral-500 font-mono">
                    {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                {/* Progress bar */}
                {item.status === 'UPLOADING' && (
                  <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300 animate-pulse"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {item.status === 'SUCCESS' && (
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded ready
                  </div>
                )}

                {item.status === 'ERROR' && (
                  <div className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" /> {item.error || 'Failed'}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {item.status === 'ERROR' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      uploadFileItem(item.file);
                    }}
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </Button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeQueueItem(item.file.name);
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

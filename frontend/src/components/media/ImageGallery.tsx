import React, { useState } from 'react';
import { MediaViewer, GalleryItem } from './MediaViewer';
import { Camera, Maximize2 } from 'lucide-react';

interface ImageGalleryProps {
  items: GalleryItem[];
  title?: string;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  items,
  title = 'Photo Gallery',
  className = '',
}) => {
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  if (!items || items.length === 0) return null;

  const openViewer = (index: number) => {
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className={`my-8 ${className}`}>
      {/* Gallery Header */}
      <div className="flex items-center justify-between mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
            {title}
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            {items.length} Photos
          </span>
        </div>
        <span className="text-xs text-neutral-500">Click any image to expand</span>
      </div>

      {/* Grid Display */}
      <div
        className={`grid gap-3 ${
          items.length === 1
            ? 'grid-cols-1'
            : items.length === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-2 sm:grid-cols-3'
        }`}
      >
        {items.map((item, idx) => (
          <div
            key={item.id || idx}
            onClick={() => openViewer(idx)}
            className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
          >
            <img
              src={item.url}
              alt={item.altText || item.caption || `Gallery photo ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {/* Hover Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              {item.caption && (
                <p className="text-xs text-white line-clamp-2 font-medium leading-snug">
                  {item.caption}
                </p>
              )}
              <div className="flex items-center gap-1 mt-1 text-[11px] text-indigo-300 font-semibold">
                <Maximize2 className="w-3 h-3" /> Click to enlarge
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      <MediaViewer
        isOpen={viewerOpen}
        items={items}
        initialIndex={selectedIndex}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
};

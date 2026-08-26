import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/common/Button';

export interface ImageUploaderProps {
  label?: string;
  onFileSelect?: (file: File | null) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ label = 'Upload Image', onFileSelect }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      if (onFileSelect) onFileSelect(file);
    }
  };

  const handleClear = () => {
    setPreview(null);
    if (onFileSelect) onFileSelect(null);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-bold text-slate-300">{label}</label>}
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-800 h-48 bg-slate-900 group">
          <img src={preview} alt="Upload Preview" className="w-full h-full object-cover" />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-44 rounded-xl border-2 border-dashed border-slate-800 hover:border-rose-500/50 bg-slate-900/50 hover:bg-slate-900 transition-all cursor-pointer p-4 text-center group">
          <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-rose-400 mb-2 transition-colors" />
          <span className="text-xs font-bold text-slate-200">Click to select photo</span>
          <span className="text-[11px] text-slate-500 font-mono mt-1">PNG, JPG, WEBP up to 10MB</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
};

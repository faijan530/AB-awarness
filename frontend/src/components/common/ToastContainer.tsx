import React from 'react';
import { useUIStore } from '@/store/ui-store';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <XCircle className="w-5 h-5 text-rose-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    info: <Info className="w-5 h-5 text-sky-400" />,
  };

  const borderColors = {
    success: 'border-emerald-500/30',
    error: 'border-rose-500/30',
    warning: 'border-amber-500/30',
    info: 'border-sky-500/30',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`glass-panel p-4 rounded-xl border ${borderColors[toast.type]} shadow-2xl flex items-start justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200`}
        >
          <div className="flex items-start gap-3">
            {icons[toast.type]}
            <div className="space-y-0.5">
              <h5 className="font-bold text-xs text-slate-100">{toast.title}</h5>
              {toast.message && <p className="text-[11px] text-slate-300">{toast.message}</p>}
            </div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-500 hover:text-slate-200 transition-colors p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

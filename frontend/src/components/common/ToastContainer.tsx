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

  const bgColors = {
    success: 'bg-emerald-950/90 border-emerald-500/40',
    error: 'bg-rose-950/90 border-rose-500/40',
    warning: 'bg-amber-950/90 border-amber-500/40',
    info: 'bg-sky-950/90 border-sky-500/40',
  };

  const progressColors = {
    success: 'bg-emerald-400',
    error: 'bg-rose-400',
    warning: 'bg-amber-400',
    info: 'bg-sky-400',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          onClick={() => removeToast(toast.id)}
          className={`pointer-events-auto relative overflow-hidden backdrop-blur-xl p-4 rounded-2xl border ${bgColors[toast.type]} shadow-2xl shadow-black/60 flex items-start justify-between gap-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] group animate-in slide-in-from-bottom-5 duration-200`}
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
            <div className="space-y-1 flex-1 min-w-0">
              <h5 className="font-bold text-xs text-white leading-tight">{toast.title}</h5>
              {toast.message && <p className="text-[11px] text-slate-300 leading-relaxed break-words">{toast.message}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
            aria-label="Close notification"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Auto-dismiss animated progress line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
            <div
              className={`h-full ${progressColors[toast.type]} animate-shrink`}
              style={{ animationDuration: `${toast.duration || 3500}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

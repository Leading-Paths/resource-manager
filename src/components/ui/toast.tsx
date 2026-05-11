import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';
import { useToasts, type Toast } from './toast-store';

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 4000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  const Icon = toast.tone === 'success' ? CheckCircle2 : toast.tone === 'error' ? AlertCircle : Info;
  const tone =
    toast.tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : toast.tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : 'border-brand-200 bg-brand-50 text-brand-900';
  const iconTone =
    toast.tone === 'success' ? 'text-emerald-600' : toast.tone === 'error' ? 'text-rose-600' : 'text-brand-600';

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 shadow-card ${tone}`}
    >
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconTone}`} />
      <div className="text-sm flex-1">{toast.message}</div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-slate-500 hover:text-slate-900 flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

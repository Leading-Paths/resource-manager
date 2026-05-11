import { useState } from 'react';
import { ListPlus, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  placeholder?: string;
  hint?: string;
  submitLabel?: string;
  onAdd: (names: string[]) => void;
}

function parse(text: string): string[] {
  return text
    .split(/[\r\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function BulkAddPanel({ open, onClose, title, placeholder, hint, submitLabel, onAdd }: Props) {
  const [text, setText] = useState('');

  if (!open) return null;
  const parsed = parse(text);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (parsed.length === 0) return;
    onAdd(parsed);
    setText('');
    onClose();
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      submit(e as unknown as React.FormEvent);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setText('');
      onClose();
    }
  }

  return (
    <section className="card border-brand-200">
      <div className="card-header bg-brand-50/40">
        <div className="flex items-center gap-2">
          <ListPlus className="w-4 h-4 text-brand-600" />
          <h2 className="section-title">{title}</h2>
        </div>
        <button type="button" onClick={onClose} className="icon-btn" title="Close">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={submit} className="card-body-tight space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder ?? 'Paste names — one per line or comma-separated'}
          rows={6}
          className="input w-full font-mono text-xs"
          autoFocus
        />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-slate-500">
            {hint ?? 'Separate by new lines or commas.'}{' '}
            <span className="font-medium text-slate-700">{parsed.length}</span> item{parsed.length === 1 ? '' : 's'} parsed.
            <span className="ml-2 text-slate-400">⌘/Ctrl+Enter to submit</span>
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={parsed.length === 0} className="btn btn-primary btn-sm">
              {submitLabel ?? 'Add'} {parsed.length > 0 ? parsed.length : ''}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

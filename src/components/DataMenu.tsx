import { useEffect, useRef, useState } from 'react';
import { Database, Download, Upload, Sparkles, RotateCcw, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { downloadExport, readImport } from '../store/io';
import { toast } from './ui/toast-store';

export function DataMenu() {
  const state = useStore();
  const replace = useStore((s) => s.replaceAll);
  const reset = useStore((s) => s.reset);
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const next = await readImport(file);
      replace(next);
      toast('success', `Imported ${file.name}`);
    } catch (err) {
      toast('error', `Import failed: ${(err as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
      setOpen(false);
    }
  }

  async function loadSeed() {
    setOpen(false);
    try {
      const base = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${base}seed.example.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const blob = new Blob([text], { type: 'application/json' });
      const file = new File([blob], 'seed.example.json');
      const next = await readImport(file);
      replace(next);
      toast('success', 'Loaded example seed data');
    } catch (err) {
      toast('error', `Seed failed: ${(err as Error).message}`);
    }
  }

  function onReset() {
    setOpen(false);
    if (confirm('Reset all data? This clears the in-app state. Export first if you want a backup.')) {
      reset();
      toast('info', 'All data cleared');
    }
  }

  function onExport() {
    setOpen(false);
    downloadExport(state);
    toast('success', 'Exported JSON');
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-secondary"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Database className="w-4 h-4" />
        Data
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-56 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-40"
        >
          <MenuItem onClick={onExport} icon={Download} label="Export JSON" />
          <MenuItem onClick={() => fileRef.current?.click()} icon={Upload} label="Import JSON…" />
          <MenuItem onClick={loadSeed} icon={Sparkles} label="Load example data" />
          <div className="my-1 border-t border-slate-100" />
          <MenuItem onClick={onReset} icon={RotateCcw} label="Reset all data" danger />
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={onPickFile}
      />
    </div>
  );
}

function MenuItem({
  onClick,
  icon: Icon,
  label,
  danger,
}: {
  onClick: () => void;
  icon: typeof Database;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2
                 ${danger ? 'text-rose-700 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

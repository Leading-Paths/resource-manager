import type { SmeLevel } from '../domain/types';

interface Props {
  value: SmeLevel;
  onChange: (next: SmeLevel) => void;
}

const LEVELS: { level: SmeLevel; label: string; title: string }[] = [
  { level: 0, label: '0', title: 'No knowledge' },
  { level: 1, label: '1', title: 'Some knowledge / can review' },
  { level: 2, label: '2', title: 'Full SME / can BAU + new features' },
];

const ACTIVE: Record<SmeLevel, string> = {
  0: 'bg-slate-200 text-slate-700',
  1: 'bg-amber-200 text-amber-900',
  2: 'bg-emerald-500 text-white shadow-soft',
};

export function LevelCell({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="SME level"
      className="inline-flex rounded-md overflow-hidden border border-slate-200 bg-slate-50"
    >
      {LEVELS.map(({ level, label, title }) => {
        const active = value === level;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            title={title}
            role="radio"
            aria-checked={active}
            className={`px-2.5 py-0.5 text-xs font-semibold tabular transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
              ${active ? ACTIVE[level] : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

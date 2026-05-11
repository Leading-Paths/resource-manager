import { ArrowDown, ArrowUp, CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import type { PriorityGroup } from '../domain/types';
import { memberCapacity } from '../domain/bau';

interface Props {
  weeklyHours: number;
  groups: PriorityGroup[];
  onChange: (groups: PriorityGroup[]) => void;
  onAddGroup: () => void;
  /** When true, ignore weeklyHours and render values as %-of-week instead of hours. */
  templateMode?: boolean;
}

// Cycle of subtle colors for non-BAU groups
const PALETTE = [
  'bg-sky-300',
  'bg-violet-300',
  'bg-amber-300',
  'bg-pink-300',
  'bg-teal-300',
  'bg-orange-300',
  'bg-lime-300',
];

export function PriorityLadder({ weeklyHours, groups, onChange, onAddGroup, templateMode }: Props) {
  // In template mode, treat the week as 100 units so `groupHours` reads naturally as percentages.
  const baseTotal = templateMode ? 100 : weeklyHours;
  const { groupHours, remainingAfter, bauHours } = memberCapacity({
    id: '_',
    name: '_',
    weeklyHours: baseTotal,
    priorityGroups: groups,
    skillsetIds: [],
    profileIds: [],
  });

  const totalHours = baseTotal;
  const unit = templateMode ? '%' : 'h';
  const fmtValue = (v: number) => (templateMode ? `${v.toFixed(1)}%` : `${v.toFixed(2)}h`);
  const fmtCell = (v: number) => (templateMode ? `${v.toFixed(1)}%` : v.toFixed(2));

  function update(idx: number, patch: Partial<PriorityGroup>) {
    onChange(groups.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }
  function move(idx: number, dir: -1 | 1) {
    const next = [...groups];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }
  function setBau(idx: number) {
    onChange(groups.map((g, i) => ({ ...g, isBau: i === idx })));
  }
  function remove(idx: number) {
    onChange(groups.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      {/* Stacked bar visual */}
      {totalHours > 0 && (
        <div>
          <div className="flex h-3 w-full overflow-hidden rounded-full ring-1 ring-slate-200 bg-slate-100">
            {groups.map((g, i) => {
              const h = groupHours[g.id] ?? 0;
              if (h <= 0) return null;
              const pct = (h / totalHours) * 100;
              const color = g.isBau ? 'bg-emerald-500' : PALETTE[i % PALETTE.length];
              return (
                <div
                  key={g.id}
                  className={color}
                  style={{ width: `${pct}%` }}
                  title={`${g.name}: ${fmtValue(h)}`}
                />
              );
            })}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
            {groups.map((g, i) => {
              const h = groupHours[g.id] ?? 0;
              const color = g.isBau ? 'bg-emerald-500' : PALETTE[i % PALETTE.length];
              return (
                <span key={g.id} className="inline-flex items-center gap-1">
                  <span className={`inline-block w-2.5 h-2.5 rounded-sm ${color}`} />
                  {g.name}
                  <span className="tabular text-slate-500">{fmtValue(h)}</span>
                  {g.isBau && <span className="badge badge-success badge-info py-0 px-1.5">BAU</span>}
                </span>
              );
            })}
            {remainingAfter > 0.01 && (
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-300" />
                Unallocated
                <span className="tabular text-slate-500">{fmtValue(remainingAfter)}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Editor table */}
      <div className="overflow-hidden rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <th className="w-8 text-left px-2 py-1.5">#</th>
              <th className="text-left px-2 py-1.5">Group</th>
              <th className="w-32 text-left px-2 py-1.5">% of remaining</th>
              <th className="w-20 text-right px-2 py-1.5">{templateMode ? '% of week' : 'Hours'}</th>
              <th className="w-16 text-center px-2 py-1.5">BAU</th>
              <th className="w-28 px-2 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {groups.map((g, i) => (
              <tr key={g.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-2 py-1 text-slate-400 tabular">{i + 1}</td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    value={g.name}
                    onChange={(e) => update(i, { name: e.target.value })}
                    className="input-inline w-full"
                  />
                </td>
                <td className="px-2 py-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={g.pctOfRemaining}
                      onChange={(e) => update(i, { pctOfRemaining: Number(e.target.value) })}
                      className="input input-sm w-20"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </td>
                <td className="px-2 py-1 tabular text-right text-slate-700">
                  {fmtCell(groupHours[g.id] ?? 0)}
                </td>
                <td className="px-2 py-1 text-center">
                  <button
                    type="button"
                    onClick={() => setBau(i)}
                    className="inline-flex items-center justify-center text-slate-400 hover:text-emerald-700"
                    aria-pressed={g.isBau}
                    title={g.isBau ? 'This is the BAU group' : 'Mark as BAU group'}
                  >
                    {g.isBau ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                </td>
                <td className="px-2 py-1 text-right">
                  <div className="inline-flex gap-0.5">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => move(i, 1)}
                      disabled={i === groups.length - 1}
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      onClick={() => remove(i)}
                      title="Remove group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
              <td colSpan={3} className="px-2 py-1.5 text-right">
                {templateMode ? 'BAU share' : 'BAU capacity'} <span className="font-semibold text-emerald-700 tabular">{templateMode ? `${bauHours.toFixed(1)}${unit}` : `${bauHours.toFixed(2)}${unit}`}</span>
                <span className="mx-2 text-slate-300">·</span>
                Unallocated <span className="tabular">{templateMode ? `${remainingAfter.toFixed(1)}${unit}` : `${remainingAfter.toFixed(2)}${unit}`}</span>
              </td>
              <td colSpan={3} className="px-2 py-1.5 text-right">
                <button type="button" onClick={onAddGroup} className="btn btn-secondary btn-xs">
                  <Plus className="w-3 h-3" /> Group
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

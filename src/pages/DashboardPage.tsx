import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Server,
  Archive,
} from 'lucide-react';
import { useStore, overrideHours } from '../store/useStore';
import {
  deriveSystemRollups,
  deriveMemberRollups,
  deriveOrgRollup,
  MIN_L2_REQUIRED,
  type SystemRollup,
  type MemberRollup,
} from '../domain/derive';
import { computeAllocations } from '../domain/allocation';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import type { AppState } from '../domain/types';

type FilterMode = 'active' | 'all';

function fmt(n: number): string {
  return n.toFixed(2);
}

function deficitClass(d: number): string {
  if (d > 0.0001) return 'text-rose-700 font-semibold';
  if (d < -0.0001) return 'text-emerald-700';
  return 'text-slate-700';
}

export function DashboardPage() {
  const state = useStore();
  const setOverride = useStore((s) => s.setOverride);
  const [filterMode, setFilterMode] = useState<FilterMode>('active');

  const eolCount = state.systems.filter((s) => s.endOfLife).length;
  const hasEol = eolCount > 0;

  const viewState: AppState = useMemo(() => {
    if (filterMode === 'all' || !hasEol) return state;
    return { ...state, systems: state.systems.filter((s) => !s.endOfLife) };
  }, [state, filterMode, hasEol]);

  if (state.members.length === 0 && state.systems.length === 0) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Resource coverage and BAU capacity at a glance."
        />
        <EmptyState
          icon={Server}
          title="Nothing to show yet"
          description="Use the Data menu in the top right to load the example dataset, or start filling in Team, Systems, and the SME matrix."
        />
      </>
    );
  }

  const systems = deriveSystemRollups(viewState);
  const memberRollups = deriveMemberRollups(viewState);
  const org = deriveOrgRollup(viewState);
  const alloc = computeAllocations(viewState);

  const utilization =
    org.totalRequired > 0
      ? Math.min(100, (org.totalAllocated / org.totalRequired) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Resource coverage and BAU capacity at a glance."
        actions={
          hasEol ? (
            <FilterToggle
              mode={filterMode}
              onChange={setFilterMode}
              eolCount={eolCount}
            />
          ) : undefined
        }
      />

      {/* Hero stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          icon={Clock}
          label="Required BAU"
          value={`${fmt(org.totalRequired)} h/wk`}
          sub={`Across ${state.systems.length} system${state.systems.length === 1 ? '' : 's'}`}
        />
        <StatTile
          icon={TrendingUp}
          label="Allocated"
          value={`${fmt(org.totalAllocated)} h/wk`}
          sub={`${utilization.toFixed(0)}% of required`}
          tone={org.totalAllocated >= org.totalRequired ? 'good' : 'warn'}
        />
        <StatTile
          icon={TrendingDown}
          label="Total deficit"
          value={`${fmt(org.totalDeficit)} h/wk`}
          sub={org.totalDeficit > 0 ? 'Needs more capacity' : 'No shortfall'}
          tone={org.totalDeficit > 0 ? 'bad' : 'good'}
        />
        <StatTile
          icon={org.systemsFailingCoverage > 0 ? ShieldAlert : ShieldCheck}
          label="Coverage gaps"
          value={String(org.systemsFailingCoverage)}
          sub={`< ${MIN_L2_REQUIRED} L2 SMEs`}
          tone={org.systemsFailingCoverage > 0 ? 'bad' : 'good'}
        />
      </section>

      {/* Per system */}
      <section>
        <div className="flex items-end justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-900">Per system</h2>
          <p className="text-xs text-slate-500">
            Bar shows allocated vs required. Marker = 100% required.
          </p>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-auto">
            <table className="matrix">
              <thead>
                <tr>
                  <th className="min-w-[160px]">System</th>
                  <th>Status</th>
                  <th className="text-right">Required</th>
                  <th className="text-right">Allocated</th>
                  <th className="text-right">Deficit</th>
                  <th className="min-w-[140px]">Capacity</th>
                  <th>L0</th>
                  <th>L1</th>
                  <th>L2</th>
                  <th>Coverage</th>
                  <th>Required skills</th>
                </tr>
              </thead>
              <tbody>
                {systems.map((r) => (
                  <SystemRow key={r.system.id} rollup={r} />
                ))}
                {systems.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center text-slate-400 py-6">
                      No systems defined yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Per member */}
      <section>
        <div className="flex items-end justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-900">Per member</h2>
          <p className="text-xs text-slate-500">
            BAU capacity ÷ L2 systems = default share each system gets.
          </p>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-auto">
            <table className="matrix">
              <thead>
                <tr>
                  <th className="min-w-[160px]">Member</th>
                  <th className="text-right">Weekly hrs</th>
                  <th className="text-right">BAU capacity</th>
                  <th className="text-right">L2 systems</th>
                  <th className="text-right">Even share h/system</th>
                  <th className="text-right">Allocated</th>
                  <th className="text-right">Slack</th>
                </tr>
              </thead>
              <tbody>
                {memberRollups.map((r) => (
                  <MemberRow key={r.member.id} rollup={r} />
                ))}
                {memberRollups.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-400 py-6">
                      No members defined yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Allocation grid */}
      {viewState.members.length > 0 && viewState.systems.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-2 gap-2 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Allocation breakdown</h2>
              <p className="text-xs text-slate-500">
                L2 cells only. Default: BAU capacity split equally across a member's L2 systems. Enter a number to override — remainder redistributes across the rest.
              </p>
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-auto">
              <table className="matrix">
                <thead>
                  <tr>
                    <th>Member \ System</th>
                    {viewState.systems.map((sys) => (
                      <th key={sys.id}>
                        <span className="inline-flex items-center gap-1">
                          {sys.name}
                          {sys.endOfLife && <Archive className="w-3 h-3 text-slate-400" />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {viewState.members.map((m) => {
                    const a = alloc.byMember[m.id];
                    return (
                      <tr key={m.id}>
                        <th>{m.name}</th>
                        {viewState.systems.map((sys) => {
                          const isL2 = a?.l2SystemIds.includes(sys.id);
                          const hours = a?.perSystemHours[sys.id] ?? 0;
                          const override = overrideHours(viewState, m.id, sys.id);
                          if (!isL2) {
                            return (
                              <td key={sys.id} className="text-center text-slate-300">
                                —
                              </td>
                            );
                          }
                          return (
                            <td key={sys.id}>
                              <div className="flex items-center gap-2">
                                <span className="tabular text-xs w-12 text-slate-700">
                                  {hours.toFixed(2)}h
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  value={override ?? ''}
                                  placeholder="auto"
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setOverride(
                                      m.id,
                                      sys.id,
                                      v === '' ? null : Number(v)
                                    );
                                  }}
                                  className={`input input-sm w-16 ${override != null ? 'border-brand-400 ring-1 ring-brand-200' : ''}`}
                                  title={override != null ? 'Overridden' : 'Auto (even split)'}
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function SystemRow({ rollup: r }: { rollup: SystemRollup }) {
  const isEol = !!r.system.endOfLife;
  return (
    <tr className={r.system.critical && !isEol ? 'bg-rose-50/30' : isEol ? 'bg-slate-50 text-slate-500' : undefined}>
      <th>
        <div className="flex items-center gap-1.5">
          {r.system.critical && !isEol && (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          )}
          {isEol && <Archive className="w-3.5 h-3.5 text-slate-400" />}
          <span className={isEol ? 'line-through decoration-slate-400 decoration-1' : ''}>{r.system.name}</span>
          {isEol && <span className="badge badge-neutral">EOL</span>}
        </div>
      </th>
      <td>
        <StatusBadge
          ok={r.deficit <= 0.0001 && r.coverageOk && r.requiredSkillsCovered}
          warn={r.deficit > 0 && r.deficit < r.requiredBauHours / 2}
        />
      </td>
      <td className="tabular text-right">{fmt(r.requiredBauHours)}</td>
      <td className="tabular text-right">{fmt(r.allocatedHours)}</td>
      <td className={`tabular text-right ${deficitClass(r.deficit)}`}>{fmt(r.deficit)}</td>
      <td>
        <CapacityBar required={r.requiredBauHours} allocated={r.allocatedHours} />
      </td>
      <td className="tabular text-center">{r.l0Count}</td>
      <td className="tabular text-center">{r.l1Count}</td>
      <td className="tabular text-center">
        <span className={r.l2Count >= MIN_L2_REQUIRED ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
          {r.l2Count}
        </span>
      </td>
      <td>
        {r.coverageOk ? (
          <span className="badge badge-success">
            <CheckCircle2 className="w-3 h-3" /> OK
          </span>
        ) : (
          <span className="badge badge-danger">
            <XCircle className="w-3 h-3" /> {r.l2Count}/{MIN_L2_REQUIRED}
          </span>
        )}
      </td>
      <td>
        {r.requiredSkillsCovered ? (
          <span className="badge badge-success">
            <CheckCircle2 className="w-3 h-3" /> Covered
          </span>
        ) : (
          <span className="badge badge-danger" title={`Missing: ${r.missingSkillNames.join(', ')}`}>
            <XCircle className="w-3 h-3" /> Missing {r.missingSkillNames.length}
          </span>
        )}
      </td>
    </tr>
  );
}

function MemberRow({ rollup: r }: { rollup: MemberRollup }) {
  const overloaded = r.slack < -0.0001;
  return (
    <tr>
      <th>{r.member.name}</th>
      <td className="tabular text-right">{fmt(r.member.weeklyHours)}</td>
      <td className="tabular text-right">{fmt(r.bauCapacity)}</td>
      <td className="tabular text-right">{r.l2SystemIds.length}</td>
      <td className="tabular text-right">{fmt(r.hoursPerL2)}</td>
      <td className="tabular text-right">{fmt(r.totalAllocated)}</td>
      <td className={`tabular text-right ${overloaded ? 'text-rose-700 font-semibold' : 'text-slate-600'}`}>
        {fmt(r.slack)}
      </td>
    </tr>
  );
}

function CapacityBar({ required, allocated }: { required: number; allocated: number }) {
  if (required <= 0) {
    return <span className="text-xs text-slate-400 italic">no req</span>;
  }
  const ratio = allocated / required;
  const pct = Math.min(150, ratio * 100); // cap visual at 150%
  const tone = ratio >= 1 ? 'good' : ratio >= 0.5 ? 'warn' : 'bad';
  return (
    <div className="pbar w-full max-w-[140px]" title={`${allocated.toFixed(2)} of ${required.toFixed(2)}h`}>
      <div
        className={`pbar-fill pbar-fill-${tone}`}
        style={{ width: `${(pct / 150) * 100}%` }}
      />
      {/* Marker at the 100%-required position; 100% maps to 100/150 = 66.6% of the bar */}
      <div className="pbar-marker" style={{ left: '66.6%' }} />
    </div>
  );
}

function StatusBadge({ ok, warn }: { ok: boolean; warn?: boolean }) {
  if (ok) {
    return (
      <span className="badge badge-success">
        <CheckCircle2 className="w-3 h-3" /> Healthy
      </span>
    );
  }
  if (warn) {
    return (
      <span className="badge badge-warning">
        <AlertTriangle className="w-3 h-3" /> At risk
      </span>
    );
  }
  return (
    <span className="badge badge-danger">
      <XCircle className="w-3 h-3" /> Gap
    </span>
  );
}

interface StatTileProps {
  icon: typeof Clock;
  label: string;
  value: string;
  sub?: string;
  tone?: 'good' | 'bad' | 'warn';
}
function StatTile({ icon: Icon, label, value, sub, tone }: StatTileProps) {
  const toneClass =
    tone === 'bad'
      ? 'stat-tile-tone-bad'
      : tone === 'good'
      ? 'stat-tile-tone-good'
      : tone === 'warn'
      ? 'stat-tile-tone-warn'
      : '';
  const iconColor =
    tone === 'bad'
      ? 'text-rose-600 bg-rose-50'
      : tone === 'good'
      ? 'text-emerald-600 bg-emerald-50'
      : tone === 'warn'
      ? 'text-amber-600 bg-amber-50'
      : 'text-brand-600 bg-brand-50';
  return (
    <div className={`stat-tile ${toneClass}`}>
      <div className="flex items-center justify-between">
        <div className="stat-label">{label}</div>
        <div className={`w-8 h-8 rounded-md grid place-items-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function FilterToggle({
  mode,
  onChange,
  eolCount,
}: {
  mode: FilterMode;
  onChange: (m: FilterMode) => void;
  eolCount: number;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="System filter"
      className="inline-flex rounded-md border border-slate-300 bg-white shadow-soft overflow-hidden"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'active'}
        onClick={() => onChange('active')}
        className={`px-3 py-1.5 text-sm inline-flex items-center gap-1.5 transition-colors ${
          mode === 'active' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'
        }`}
        title={`Exclude ${eolCount} end-of-life system${eolCount === 1 ? '' : 's'}`}
      >
        Active only
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'all'}
        onClick={() => onChange('all')}
        className={`px-3 py-1.5 text-sm inline-flex items-center gap-1.5 transition-colors border-l border-slate-300 ${
          mode === 'all' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'
        }`}
        title="Include EOL systems"
      >
        <Archive className="w-3.5 h-3.5" />
        All ({eolCount} EOL)
      </button>
    </div>
  );
}

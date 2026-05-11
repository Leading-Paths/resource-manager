import { Plus, Server, Trash2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { EVENT_TYPES, EVENT_LABELS } from '../domain/types';
import type { EventType, System } from '../domain/types';
import { systemWeeklyBau } from '../domain/bau';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../components/ui/toast-store';

export function SystemsPage() {
  const systems = useStore((s) => s.systems);
  const addSystem = useStore((s) => s.addSystem);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Systems"
        description="Each system has a release cadence and an effort-per-event figure. Weekly BAU hours = Σ (freq × effort) / 52."
        actions={
          <button onClick={() => addSystem()} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add system
          </button>
        }
      />

      {systems.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No systems yet"
          description="Add the systems your team supports. Each gets release cadence, required skills, and a critical flag."
          action={
            <button onClick={() => addSystem()} className="btn btn-primary">
              <Plus className="w-4 h-4" /> Add system
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {systems.map((sys) => (
            <SystemCard key={sys.id} system={sys} />
          ))}
        </div>
      )}
    </div>
  );
}

function SystemCard({ system: sys }: { system: System }) {
  const [open, setOpen] = useState(true);
  const skillsets = useStore((s) => s.skillsets);
  const profiles = useStore((s) => s.profiles);
  const updateSystem = useStore((s) => s.updateSystem);
  const deleteSystem = useStore((s) => s.deleteSystem);
  const setCadence = useStore((s) => s.setSystemCadence);
  const setEffort = useStore((s) => s.setSystemEffort);
  const setCritical = useStore((s) => s.setSystemCritical);
  const toggleSk = useStore((s) => s.toggleSystemRequiredSkillset);
  const toggleP = useStore((s) => s.toggleSystemRequiredProfile);
  const weeklyBau = systemWeeklyBau(sys);

  function onDelete() {
    if (confirm(`Delete system "${sys.name}"? This also removes its SME entries and allocation overrides.`)) {
      deleteSystem(sys.id);
      toast('info', `Removed system "${sys.name}"`);
    }
  }

  return (
    <section className={`card overflow-hidden ${sys.critical ? 'ring-1 ring-rose-200' : ''}`}>
      <div className="card-header">
        <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="icon-btn"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <input
            type="text"
            value={sys.name}
            onChange={(e) => updateSystem(sys.id, { name: e.target.value })}
            className="input-inline input-inline-lg flex-1 min-w-[160px] max-w-md"
          />
          <label className="inline-flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={sys.critical}
              onChange={(e) => setCritical(sys.id, e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="inline-flex items-center gap-1">
              <AlertTriangle className={`w-3.5 h-3.5 ${sys.critical ? 'text-rose-600' : 'text-slate-300'}`} />
              Critical
            </span>
          </label>
          <span className="badge badge-info" title="Derived weekly BAU hours">
            BAU <span className="tabular ml-0.5">{weeklyBau.toFixed(2)}h/wk</span>
          </span>
        </div>
        <button onClick={onDelete} className="icon-btn icon-btn-danger" title="Delete system">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {open && (
        <div className="card-body grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Cadence & effort</h3>
            <div className="overflow-hidden rounded-md border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-2.5 py-1.5">Event</th>
                    <th className="text-left px-2.5 py-1.5 w-24">Per year</th>
                    <th className="text-left px-2.5 py-1.5 w-24">Hours/event</th>
                    <th className="text-right px-2.5 py-1.5 w-20">h/wk</th>
                  </tr>
                </thead>
                <tbody>
                  {EVENT_TYPES.map((e: EventType) => {
                    const freq = sys.cadence[e].freqPerYear;
                    const eff = sys.effortPerEvent[e];
                    const wk = ((freq ?? 0) * eff) / 52;
                    return (
                      <tr key={e} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-2.5 py-1.5 text-slate-700">{EVENT_LABELS[e]}</td>
                        <td className="px-2.5 py-1.5">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={freq ?? ''}
                            placeholder="N/A"
                            onChange={(ev) =>
                              setCadence(sys.id, e, ev.target.value === '' ? null : Number(ev.target.value))
                            }
                            className="input input-sm w-20"
                          />
                        </td>
                        <td className="px-2.5 py-1.5">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={eff}
                            onChange={(ev) => setEffort(sys.id, e, Number(ev.target.value))}
                            className="input input-sm w-20"
                          />
                        </td>
                        <td className="px-2.5 py-1.5 tabular text-right text-slate-600">{wk.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t border-slate-200 bg-slate-50 font-semibold">
                    <td className="px-2.5 py-1.5 text-slate-700" colSpan={3}>
                      Total
                    </td>
                    <td className="px-2.5 py-1.5 tabular text-right text-slate-900">{weeklyBau.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Required profiles</h3>
              {profiles.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No profiles defined.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {profiles.map((p) => {
                    const on = sys.requiredProfileIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleP(sys.id, p.id)}
                        className={`chip ${on ? 'chip-on' : 'chip-off'}`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Required individual skillsets</h3>
              {skillsets.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No skillsets defined.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {skillsets.map((sk) => {
                    const on = sys.requiredSkillsetIds.includes(sk.id);
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        onClick={() => toggleSk(sys.id, sk.id)}
                        className={`chip ${on ? 'chip-on' : 'chip-off'}`}
                      >
                        {sk.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

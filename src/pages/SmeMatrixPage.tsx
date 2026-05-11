import { Grid3x3, AlertTriangle, Archive } from 'lucide-react';
import { useStore, smeLevel } from '../store/useStore';
import { LevelCell } from '../components/LevelCell';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';

export function SmeMatrixPage() {
  const state = useStore();
  const setSme = useStore((s) => s.setSme);

  if (state.members.length === 0 || state.systems.length === 0) {
    return (
      <>
        <PageHeader title="SME matrix" description="Set each member's familiarity per system." />
        <EmptyState
          icon={Grid3x3}
          title="Need members and systems first"
          description="Add at least one team member and one system, then come back to set knowledge levels."
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="SME knowledge matrix"
        description="0 = no knowledge · 1 = can review code · 2 = full SME, counts toward BAU coverage."
      />

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <Legend color="bg-slate-200" label="0 — none" />
        <Legend color="bg-amber-200" label="1 — review" />
        <Legend color="bg-emerald-500" label="2 — full SME" />
      </div>

      <section className="card overflow-hidden">
        <div className="overflow-auto">
          <table className="matrix">
            <thead>
              <tr>
                <th>Member \ System</th>
                {state.systems.map((sys) => (
                  <th key={sys.id}>
                    <div className="inline-flex items-center gap-1">
                      <span className={sys.endOfLife ? 'line-through decoration-slate-400 decoration-1 text-slate-500' : ''}>
                        {sys.name}
                      </span>
                      {sys.critical && !sys.endOfLife && (
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                      )}
                      {sys.endOfLife && (
                        <Archive className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.members.map((m) => (
                <tr key={m.id}>
                  <th>{m.name}</th>
                  {state.systems.map((sys) => {
                    const lv = smeLevel(state, m.id, sys.id);
                    return (
                      <td key={sys.id} className="text-center">
                        <LevelCell value={lv} onChange={(next) => setSme(m.id, sys.id, next)} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded-sm ${color}`} />
      {label}
    </span>
  );
}

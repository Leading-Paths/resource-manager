import { GitBranch, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';

export function MemberSkillsPage() {
  const members = useStore((s) => s.members);
  const skillsets = useStore((s) => s.skillsets);
  const profiles = useStore((s) => s.profiles);
  const toggleSk = useStore((s) => s.toggleMemberSkillset);
  const toggleP = useStore((s) => s.toggleMemberProfile);

  if (members.length === 0) {
    return (
      <>
        <PageHeader title="Member skills" description="Assign profiles and individual skillsets to each member." />
        <EmptyState icon={GitBranch} title="Add team members first" description="Then come back here to assign profiles and skills." />
      </>
    );
  }
  if (skillsets.length === 0 && profiles.length === 0) {
    return (
      <>
        <PageHeader title="Member skills" description="Assign profiles and individual skillsets to each member." />
        <EmptyState icon={GitBranch} title="No skillsets or profiles yet" description="Go to Skills to define some, then return here." />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Member skills"
        description="Assign profiles and individual skillsets to each member. A member can have any combination."
      />

      {profiles.length > 0 && (
        <section className="card">
          <div className="card-header">
            <h2 className="section-title">Profiles</h2>
            <span className="section-sub">{profiles.length} profile{profiles.length === 1 ? '' : 's'}</span>
          </div>
          <div className="overflow-auto">
            <table className="matrix">
              <thead>
                <tr>
                  <th>Member</th>
                  {profiles.map((p) => <th key={p.id}>{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <th>{m.name}</th>
                    {profiles.map((p) => {
                      const on = m.profileIds.includes(p.id);
                      return (
                        <td key={p.id} className="text-center p-0">
                          <button
                            type="button"
                            onClick={() => toggleP(m.id, p.id)}
                            className={`w-full h-full px-2 py-1.5 transition-colors
                              ${on ? 'bg-emerald-50 text-emerald-700' : 'text-slate-300 hover:bg-slate-50 hover:text-slate-500'}`}
                            aria-pressed={on}
                          >
                            {on ? <Check className="w-4 h-4 inline" /> : <span className="text-xs">·</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {skillsets.length > 0 && (
        <section className="card">
          <div className="card-header">
            <h2 className="section-title">Individual skillsets</h2>
            <span className="section-sub">{skillsets.length} skillset{skillsets.length === 1 ? '' : 's'}</span>
          </div>
          <div className="overflow-auto">
            <table className="matrix">
              <thead>
                <tr>
                  <th>Member</th>
                  {skillsets.map((sk) => <th key={sk.id}>{sk.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <th>{m.name}</th>
                    {skillsets.map((sk) => {
                      const on = m.skillsetIds.includes(sk.id);
                      return (
                        <td key={sk.id} className="text-center p-0">
                          <button
                            type="button"
                            onClick={() => toggleSk(m.id, sk.id)}
                            className={`w-full h-full px-2 py-1.5 transition-colors
                              ${on ? 'bg-emerald-50 text-emerald-700' : 'text-slate-300 hover:bg-slate-50 hover:text-slate-500'}`}
                            aria-pressed={on}
                          >
                            {on ? <Check className="w-4 h-4 inline" /> : <span className="text-xs">·</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

import { Plus, Tag, Layers, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../components/ui/toast-store';

export function SkillsPage() {
  const skillsets = useStore((s) => s.skillsets);
  const profiles = useStore((s) => s.profiles);
  const addSkillset = useStore((s) => s.addSkillset);
  const updateSkillset = useStore((s) => s.updateSkillset);
  const deleteSkillset = useStore((s) => s.deleteSkillset);
  const addProfile = useStore((s) => s.addProfile);
  const updateProfile = useStore((s) => s.updateProfile);
  const deleteProfile = useStore((s) => s.deleteProfile);
  const toggleProfileSkillset = useStore((s) => s.toggleProfileSkillset);

  function onDeleteSkillset(id: string, name: string) {
    if (confirm(`Delete skillset "${name}"? It will also be removed from any profiles, members, and system requirements that reference it.`)) {
      deleteSkillset(id);
      toast('info', `Removed skillset "${name}"`);
    }
  }

  function onDeleteProfile(id: string, name: string) {
    if (confirm(`Delete profile "${name}"? It will also be removed from members and system requirements.`)) {
      deleteProfile(id);
      toast('info', `Removed profile "${name}"`);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills & profiles"
        description="Define individual skillsets and bundle them into profiles (e.g. a Cloudcase profile groups Cloudcase, Rulebook, Java, JavaScript)."
      />

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="section-title">Skillsets</h2>
            <p className="section-sub">Single named skills. Bundle these into profiles below.</p>
          </div>
          <button onClick={() => addSkillset()} className="btn btn-secondary btn-sm">
            <Plus className="w-3.5 h-3.5" /> Add skillset
          </button>
        </div>
        <div className="card-body">
          {skillsets.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No skillsets yet"
              description="Add skillsets like Java, TypeScript, SQL — then group them into profiles."
              action={
                <button onClick={() => addSkillset()} className="btn btn-primary">
                  <Plus className="w-4 h-4" /> Add skillset
                </button>
              }
            />
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {skillsets.map((sk) => (
                <li key={sk.id} className="flex items-center gap-1 border border-slate-200 rounded-md pl-2 pr-1 bg-white shadow-soft">
                  <Tag className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={sk.name}
                    onChange={(e) => updateSkillset(sk.id, { name: e.target.value })}
                    className="input-inline flex-1 min-w-0"
                  />
                  <button
                    onClick={() => onDeleteSkillset(sk.id, sk.name)}
                    className="icon-btn icon-btn-danger"
                    title="Delete skillset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="section-title">Profiles</h2>
            <p className="section-sub">Reusable bundles of skillsets. Assign to team members or to system requirements.</p>
          </div>
          <button onClick={() => addProfile()} className="btn btn-secondary btn-sm">
            <Plus className="w-3.5 h-3.5" /> Add profile
          </button>
        </div>
        <div className="card-body space-y-3">
          {profiles.length === 0 && (
            <EmptyState
              icon={Layers}
              title="No profiles yet"
              description="Profiles bundle a set of skillsets so you can assign them in one click."
              action={
                <button onClick={() => addProfile()} className="btn btn-primary" disabled={skillsets.length === 0}>
                  <Plus className="w-4 h-4" /> Add profile
                </button>
              }
            />
          )}
          {profiles.map((p) => (
            <div key={p.id} className="rounded-md border border-slate-200 bg-slate-50/40 p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Layers className="w-4 h-4 text-brand-500" />
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updateProfile(p.id, { name: e.target.value })}
                  className="input-inline input-inline-lg flex-1 min-w-[160px]"
                />
                <span className="badge badge-info">{p.skillsetIds.length} skillset{p.skillsetIds.length === 1 ? '' : 's'}</span>
                <button onClick={() => onDeleteProfile(p.id, p.name)} className="icon-btn icon-btn-danger ml-auto" title="Delete profile">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {skillsets.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Add skillsets above to populate this profile.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {skillsets.map((sk) => {
                    const on = p.skillsetIds.includes(sk.id);
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        onClick={() => toggleProfileSkillset(p.id, sk.id)}
                        className={`chip ${on ? 'chip-on' : 'chip-off'}`}
                      >
                        {sk.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

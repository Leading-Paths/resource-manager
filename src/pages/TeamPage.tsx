import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Users, AlertCircle, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { PriorityLadder } from '../components/PriorityLadder';
import { memberCapacity } from '../domain/bau';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../components/ui/toast-store';
import type { Member } from '../domain/types';

export function TeamPage() {
  const members = useStore((s) => s.members);
  const addMember = useStore((s) => s.addMember);

  const customizedCount = members.filter((m) => m.customized).length;
  const uncustomizedCount = members.length - customizedCount;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team"
        description="Define each member's weekly hours and how they split across priority groups. The group flagged as BAU is their weekly BAU capacity."
        actions={
          <button onClick={() => addMember()} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add member
          </button>
        }
      />

      {members.length > 0 && (
        <BulkAddGroup uncustomized={uncustomizedCount} customized={customizedCount} />
      )}

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description="Add a team member to define their weekly hours and how they split time across priority groups."
          action={
            <button onClick={() => addMember()} className="btn btn-primary">
              <Plus className="w-4 h-4" /> Add member
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberCard({ member }: { member: Member }) {
  const [open, setOpen] = useState(true);
  const updateMember = useStore((s) => s.updateMember);
  const deleteMember = useStore((s) => s.deleteMember);
  const setGroups = useStore((s) => s.setMemberPriorityGroups);
  const addGroup = useStore((s) => s.addMemberGroup);
  const resetCustom = useStore((s) => s.resetMemberCustomization);
  const cap = memberCapacity(member);
  const utilPct = member.weeklyHours > 0 ? (cap.bauHours / member.weeklyHours) * 100 : 0;

  function onDelete() {
    if (confirm(`Delete ${member.name}? This also clears their SME entries and allocation overrides.`)) {
      deleteMember(member.id);
      toast('info', `Removed ${member.name}`);
    }
  }

  return (
    <section className="card overflow-hidden">
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
            value={member.name}
            onChange={(e) => updateMember(member.id, { name: e.target.value })}
            className="input-inline input-inline-lg flex-1 min-w-[140px] max-w-xs"
          />
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <label>Weekly</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={member.weeklyHours}
              onChange={(e) => updateMember(member.id, { weeklyHours: Number(e.target.value) })}
              className="input input-sm w-20"
            />
            <span>h</span>
          </div>
          <span className="badge badge-success" title="BAU hours per week">
            BAU <span className="tabular ml-0.5">{cap.bauHours.toFixed(2)}h</span>
            <span className="opacity-60">· {utilPct.toFixed(0)}%</span>
          </span>
          {member.customized && (
            <span className="badge badge-warning" title="This member's ladder has been edited individually. 'Add group to all' will skip this member.">
              <AlertCircle className="w-3 h-3" />
              Customized
              <button
                type="button"
                onClick={() => resetCustom(member.id)}
                className="ml-1 inline-flex items-center hover:text-amber-950"
                title="Restore to template so future bulk additions apply"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
        <button onClick={onDelete} className="icon-btn icon-btn-danger" title="Delete member">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {open && (
        <div className="card-body">
          <PriorityLadder
            weeklyHours={member.weeklyHours}
            groups={member.priorityGroups}
            onChange={(g) => setGroups(member.id, g)}
            onAddGroup={() => addGroup(member.id)}
          />
        </div>
      )}
    </section>
  );
}

function BulkAddGroup({ uncustomized, customized }: { uncustomized: number; customized: number }) {
  const addGroupToAll = useStore((s) => s.addGroupToAll);
  const [name, setName] = useState('');
  const [pct, setPct] = useState<number>(10);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const { affected, skipped } = addGroupToAll({ name: trimmed, pctOfRemaining: pct });
    setName('');
    toast(
      affected > 0 ? 'success' : 'info',
      `Added “${trimmed}” to ${affected} member${affected === 1 ? '' : 's'}${
        skipped > 0 ? `, skipped ${skipped} customized` : ''
      }`
    );
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="section-title">Add a group to everyone</h2>
          <p className="section-sub">Inserts before each member's BAU group. Customized members are skipped.</p>
        </div>
        <div className="text-xs text-slate-500">
          Will apply to <span className="font-semibold text-slate-900">{uncustomized}</span>
          <span className="mx-1.5 text-slate-300">·</span>
          Skip <span className="font-semibold text-slate-900">{customized}</span> customized
        </div>
      </div>
      <form onSubmit={submit} className="card-body-tight flex items-center gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Group name (e.g. On-call)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input flex-1 min-w-[200px]"
        />
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="input w-20"
          />
          <span className="text-xs text-slate-500">% of remaining</span>
        </div>
        <button
          type="submit"
          disabled={uncustomized === 0 || !name.trim()}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" /> Add to all
        </button>
      </form>
    </section>
  );
}

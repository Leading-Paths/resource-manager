import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Users, AlertCircle, RotateCcw, Sparkles } from 'lucide-react';
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
  const inheritingCount = members.length - customizedCount;

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

      <DefaultGroupsCard inheriting={inheritingCount} customized={customizedCount} />

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description="Add a team member to define their weekly hours and how they split time across priority groups. New members start from the default template above."
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

function DefaultGroupsCard({ inheriting, customized }: { inheriting: number; customized: number }) {
  const defaults = useStore((s) => s.defaultPriorityGroups);
  const setDefaults = useStore((s) => s.setDefaultPriorityGroups);
  const addDefaultGroup = useStore((s) => s.addDefaultGroup);
  const [open, setOpen] = useState(true);

  return (
    <section className="card overflow-hidden">
      <div className="card-header">
        <div className="flex items-center gap-2 flex-1">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="icon-btn"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2 text-brand-600">
            <Sparkles className="w-4 h-4" />
            <h2 className="section-title text-slate-900">Default priority groups</h2>
          </div>
        </div>
        <div className="text-xs text-slate-500">
          <span className="font-semibold text-slate-900">{inheriting}</span> follow this template
          <span className="mx-1.5 text-slate-300">·</span>
          <span className="font-semibold text-slate-900">{customized}</span> customized are independent
        </div>
      </div>
      {open && (
        <div className="card-body space-y-2">
          <p className="text-xs text-slate-500">
            New members inherit these groups, and any change here (add, remove, reorder, rename, % or BAU flag) is mirrored to every non-customized member. Customized members keep their own ladder until you click <span className="inline-flex items-center gap-0.5 align-middle"><RotateCcw className="w-3 h-3" /></span> on their card.
          </p>
          <PriorityLadder
            weeklyHours={40}
            groups={defaults}
            onChange={(g) => {
              const { synced } = setDefaults(g);
              // Quiet pass-through edits would spam toasts; we don't toast here. Member reset uses a toast.
              void synced;
            }}
            onAddGroup={addDefaultGroup}
            templateMode
          />
        </div>
      )}
    </section>
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

  function onResetToTemplate() {
    if (confirm(`Reset ${member.name}'s priority ladder to the default template? Their current ladder will be replaced.`)) {
      resetCustom(member.id);
      toast('info', `${member.name} now follows the default template`);
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
            <span className="badge badge-warning" title="This member's ladder has been edited individually. Template changes will not affect them.">
              <AlertCircle className="w-3 h-3" />
              Customized
              <button
                type="button"
                onClick={onResetToTemplate}
                className="ml-1 inline-flex items-center hover:text-amber-950"
                title="Reset to default template"
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

import type { AppState, ID } from './types';
import { memberCapacity } from './bau';

export interface MemberAllocation {
  memberId: ID;
  bauCapacity: number;
  l2SystemIds: ID[];
  perSystemHours: Record<ID, number>;
  overrideHours: Record<ID, number>;
  remainingAfterOverrides: number;
  evenSharePerRemainingL2: number;
}

export function computeAllocations(state: AppState): {
  byMember: Record<ID, MemberAllocation>;
  perSystemAllocated: Record<ID, number>;
} {
  const byMember: Record<ID, MemberAllocation> = {};
  const perSystemAllocated: Record<ID, number> = {};

  for (const sys of state.systems) perSystemAllocated[sys.id] = 0;

  for (const m of state.members) {
    const { bauHours } = memberCapacity(m);
    const l2Ids = state.sme
      .filter((s) => s.memberId === m.id && s.level === 2)
      .map((s) => s.systemId)
      .filter((sid) => state.systems.some((sys) => sys.id === sid));

    const overrides = state.overrides.allocationHours.filter(
      (o) => o.memberId === m.id && l2Ids.includes(o.systemId)
    );
    const overrideMap: Record<ID, number> = {};
    let usedByOverrides = 0;
    for (const o of overrides) {
      overrideMap[o.systemId] = o.hours;
      usedByOverrides += o.hours;
    }

    const overriddenSystems = new Set(overrides.map((o) => o.systemId));
    const remainingL2 = l2Ids.filter((sid) => !overriddenSystems.has(sid));
    const remaining = Math.max(0, bauHours - usedByOverrides);
    const evenShare = remainingL2.length > 0 ? remaining / remainingL2.length : 0;

    const perSystem: Record<ID, number> = { ...overrideMap };
    for (const sid of remainingL2) perSystem[sid] = evenShare;

    for (const [sid, h] of Object.entries(perSystem)) {
      perSystemAllocated[sid] = (perSystemAllocated[sid] ?? 0) + h;
    }

    byMember[m.id] = {
      memberId: m.id,
      bauCapacity: bauHours,
      l2SystemIds: l2Ids,
      perSystemHours: perSystem,
      overrideHours: overrideMap,
      remainingAfterOverrides: remaining,
      evenSharePerRemainingL2: evenShare,
    };
  }

  return { byMember, perSystemAllocated };
}

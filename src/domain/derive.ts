import type { AppState, ID, Member, System } from './types';
import { systemWeeklyBau, memberCapacity } from './bau';
import { computeAllocations } from './allocation';

export const MIN_L2_REQUIRED = 2;

export interface SystemRollup {
  system: System;
  requiredBauHours: number;
  allocatedHours: number;
  deficit: number;
  l0Count: number;
  l1Count: number;
  l2Count: number;
  coverageOk: boolean;
  requiredSkillsCovered: boolean;
  missingSkillNames: string[];
}

export interface MemberRollup {
  member: Member;
  bauCapacity: number;
  l2SystemIds: ID[];
  hoursPerL2: number;
  totalAllocated: number;
  slack: number;
}

export interface OrgRollup {
  totalRequired: number;
  totalAllocated: number;
  totalDeficit: number;
  systemsFailingCoverage: number;
  criticalSystemsWithDeficit: number;
}

function memberEffectiveSkillsetIds(member: Member, state: AppState): Set<ID> {
  const set = new Set<ID>(member.skillsetIds);
  for (const pid of member.profileIds) {
    const profile = state.profiles.find((p) => p.id === pid);
    if (profile) for (const sid of profile.skillsetIds) set.add(sid);
  }
  return set;
}

function profileSkillsetIds(profileId: ID, state: AppState): ID[] {
  return state.profiles.find((p) => p.id === profileId)?.skillsetIds ?? [];
}

export function deriveSystemRollups(state: AppState): SystemRollup[] {
  const { perSystemAllocated, byMember } = computeAllocations(state);

  return state.systems.map((sys) => {
    const reqBau = systemWeeklyBau(sys);
    const allocated = perSystemAllocated[sys.id] ?? 0;
    const smeForSystem = state.sme.filter((s) => s.systemId === sys.id);

    const l0 = smeForSystem.filter((s) => s.level === 0).length;
    const l1 = smeForSystem.filter((s) => s.level === 1).length;
    const l2 = smeForSystem.filter((s) => s.level === 2).length;

    const requiredSkillsetIds = new Set<ID>(sys.requiredSkillsetIds);
    for (const pid of sys.requiredProfileIds) {
      for (const sid of profileSkillsetIds(pid, state)) requiredSkillsetIds.add(sid);
    }

    const contributingMemberIds = Object.entries(byMember)
      .filter(([, alloc]) => (alloc.perSystemHours[sys.id] ?? 0) > 0)
      .map(([memberId]) => memberId);

    const covered = new Set<ID>();
    for (const mid of contributingMemberIds) {
      const m = state.members.find((mm) => mm.id === mid);
      if (!m) continue;
      for (const sid of memberEffectiveSkillsetIds(m, state)) covered.add(sid);
    }
    const missing: string[] = [];
    for (const sid of requiredSkillsetIds) {
      if (!covered.has(sid)) {
        const sk = state.skillsets.find((s) => s.id === sid);
        if (sk) missing.push(sk.name);
      }
    }

    return {
      system: sys,
      requiredBauHours: reqBau,
      allocatedHours: allocated,
      deficit: reqBau - allocated,
      l0Count: l0,
      l1Count: l1,
      l2Count: l2,
      coverageOk: l2 >= MIN_L2_REQUIRED,
      requiredSkillsCovered: missing.length === 0,
      missingSkillNames: missing,
    };
  });
}

export function deriveMemberRollups(state: AppState): MemberRollup[] {
  const { byMember } = computeAllocations(state);
  return state.members.map((m) => {
    const alloc = byMember[m.id];
    const cap = memberCapacity(m).bauHours;
    const l2 = alloc?.l2SystemIds ?? [];
    const totalAllocated = Object.values(alloc?.perSystemHours ?? {}).reduce((a, b) => a + b, 0);
    return {
      member: m,
      bauCapacity: cap,
      l2SystemIds: l2,
      hoursPerL2: l2.length > 0 ? cap / l2.length : 0,
      totalAllocated,
      slack: cap - totalAllocated,
    };
  });
}

export function deriveOrgRollup(state: AppState): OrgRollup {
  const sys = deriveSystemRollups(state);
  return {
    totalRequired: sys.reduce((a, r) => a + r.requiredBauHours, 0),
    totalAllocated: sys.reduce((a, r) => a + r.allocatedHours, 0),
    totalDeficit: sys.reduce((a, r) => a + Math.max(0, r.deficit), 0),
    systemsFailingCoverage: sys.filter((r) => !r.coverageOk).length,
    criticalSystemsWithDeficit: sys.filter((r) => r.system.critical && r.deficit > 0).length,
  };
}

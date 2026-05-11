import type { Member, System } from './types';
import { EVENT_TYPES } from './types';

export function systemWeeklyBau(system: System): number {
  let total = 0;
  for (const e of EVENT_TYPES) {
    const freq = system.cadence[e].freqPerYear ?? 0;
    const eff = system.effortPerEvent[e] ?? 0;
    total += (freq * eff) / 52;
  }
  return total;
}

export interface MemberCapacity {
  bauHours: number;
  groupHours: Record<string, number>;
  remainingAfter: number;
}

export function memberCapacity(member: Member): MemberCapacity {
  let remaining = member.weeklyHours;
  let bauHours = 0;
  const groupHours: Record<string, number> = {};
  for (const g of member.priorityGroups) {
    const hours = (remaining * g.pctOfRemaining) / 100;
    groupHours[g.id] = hours;
    if (g.isBau) bauHours = hours;
    remaining -= hours;
  }
  return { bauHours, groupHours, remainingAfter: remaining };
}

export const SCHEMA_VERSION = 1;

export type ID = string;

export interface PriorityGroup {
  id: ID;
  name: string;
  pctOfRemaining: number;
  isBau: boolean;
}

export interface Member {
  id: ID;
  name: string;
  weeklyHours: number;
  priorityGroups: PriorityGroup[];
  skillsetIds: ID[];
  profileIds: ID[];
  /** Set true when this member's priority ladder has been edited individually. Bulk "add group to all" skips customized members. */
  customized?: boolean;
}

export interface Skillset {
  id: ID;
  name: string;
}

export interface Profile {
  id: ID;
  name: string;
  skillsetIds: ID[];
}

export type EventType = 'team' | 'vendor' | 'lts' | 'patch';

export interface Cadence {
  freqPerYear: number | null;
}

export interface System {
  id: ID;
  name: string;
  critical: boolean;
  /** End-of-life systems are excluded from the dashboard's "Active only" view but kept in state. */
  endOfLife?: boolean;
  requiredSkillsetIds: ID[];
  requiredProfileIds: ID[];
  cadence: Record<EventType, Cadence>;
  effortPerEvent: Record<EventType, number>;
}

export type SmeLevel = 0 | 1 | 2;

export interface SmeEntry {
  memberId: ID;
  systemId: ID;
  level: SmeLevel;
}

export interface AllocationOverride {
  memberId: ID;
  systemId: ID;
  hours: number;
}

export interface AppState {
  schemaVersion: number;
  /** Template ladder. New members and "reset to template" both clone this. Edits propagate to non-customized members. */
  defaultPriorityGroups: PriorityGroup[];
  members: Member[];
  skillsets: Skillset[];
  profiles: Profile[];
  systems: System[];
  sme: SmeEntry[];
  overrides: { allocationHours: AllocationOverride[] };
}

export const EVENT_TYPES: EventType[] = ['team', 'vendor', 'lts', 'patch'];

export const EVENT_LABELS: Record<EventType, string> = {
  team: 'Team release',
  vendor: 'Vendor release',
  lts: 'LTS',
  patch: 'Patch',
};

export const DEFAULT_CADENCE: Record<EventType, Cadence> = {
  team: { freqPerYear: 26 },
  vendor: { freqPerYear: 4 },
  lts: { freqPerYear: 1 },
  patch: { freqPerYear: 12 },
};

export const DEFAULT_EFFORT: Record<EventType, number> = {
  team: 8,
  vendor: 16,
  lts: 24,
  patch: 4,
};

export const DEFAULT_PRIORITY_GROUPS: PriorityGroup[] = [
  { id: 'tpl-leave', name: 'Leave', pctOfRemaining: 10, isBau: false },
  { id: 'tpl-meetings', name: 'Meetings', pctOfRemaining: 15, isBau: false },
  { id: 'tpl-projects', name: 'Projects', pctOfRemaining: 50, isBau: false },
  { id: 'tpl-bau', name: 'BAU', pctOfRemaining: 100, isBau: true },
];

export const EMPTY_STATE: AppState = {
  schemaVersion: SCHEMA_VERSION,
  defaultPriorityGroups: DEFAULT_PRIORITY_GROUPS,
  members: [],
  skillsets: [],
  profiles: [],
  systems: [],
  sme: [],
  overrides: { allocationHours: [] },
};

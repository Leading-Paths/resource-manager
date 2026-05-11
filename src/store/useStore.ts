import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppState, Member, Profile, Skillset, System, SmeEntry, SmeLevel,
  PriorityGroup, AllocationOverride, ID,
} from '../domain/types';
import {
  SCHEMA_VERSION, EMPTY_STATE, DEFAULT_CADENCE, DEFAULT_EFFORT,
} from '../domain/types';

function uid(): ID {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function cloneGroupsWithFreshIds(groups: PriorityGroup[]): PriorityGroup[] {
  return groups.map((g) => ({ ...g, id: uid() }));
}

function normalizeBau(groups: PriorityGroup[]): PriorityGroup[] {
  const bauCount = groups.filter((g) => g.isBau).length;
  if (bauCount === 1) return groups;
  // Fall back to the last group as the BAU residual if zero or multiple are flagged.
  return groups.map((g, i) => ({ ...g, isBau: i === groups.length - 1 }));
}

interface Actions {
  replaceAll: (next: AppState) => void;
  reset: () => void;

  addMember: (name?: string) => void;
  addMembers: (names: string[]) => number;
  updateMember: (id: ID, patch: Partial<Member>) => void;
  deleteMember: (id: ID) => void;
  setMemberPriorityGroups: (id: ID, groups: PriorityGroup[]) => void;
  addMemberGroup: (id: ID) => void;
  /** Replace the default ladder. Non-customized members are re-synced. Returns how many were synced and skipped. */
  setDefaultPriorityGroups: (groups: PriorityGroup[]) => { synced: number; skipped: number };
  /** Append a new placeholder group to the defaults. */
  addDefaultGroup: () => void;
  /** Snap a member's ladder back to the current defaults and clear the customized flag. */
  resetMemberCustomization: (id: ID) => void;
  toggleMemberSkillset: (memberId: ID, skillsetId: ID) => void;
  toggleMemberProfile: (memberId: ID, profileId: ID) => void;

  addSkillset: (name?: string) => void;
  addSkillsets: (names: string[]) => number;
  updateSkillset: (id: ID, patch: Partial<Skillset>) => void;
  deleteSkillset: (id: ID) => void;

  addProfile: (name?: string) => void;
  addProfiles: (names: string[]) => number;
  updateProfile: (id: ID, patch: Partial<Profile>) => void;
  deleteProfile: (id: ID) => void;
  toggleProfileSkillset: (profileId: ID, skillsetId: ID) => void;

  addSystem: (name?: string) => void;
  addSystems: (names: string[]) => number;
  updateSystem: (id: ID, patch: Partial<System>) => void;
  deleteSystem: (id: ID) => void;
  toggleSystemRequiredSkillset: (systemId: ID, skillsetId: ID) => void;
  toggleSystemRequiredProfile: (systemId: ID, profileId: ID) => void;
  setSystemCadence: (systemId: ID, event: keyof System['cadence'], freqPerYear: number | null) => void;
  setSystemEffort: (systemId: ID, event: keyof System['effortPerEvent'], hours: number) => void;
  setSystemCritical: (systemId: ID, critical: boolean) => void;

  setSme: (memberId: ID, systemId: ID, level: SmeLevel) => void;

  setOverride: (memberId: ID, systemId: ID, hours: number | null) => void;
  listOverrides: () => AllocationOverride[];
}

type Store = AppState & Actions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,

      replaceAll: (next) => set({ ...next, schemaVersion: SCHEMA_VERSION }),
      reset: () => set({ ...EMPTY_STATE }),

      addMember: (name) =>
        set((s) => ({
          members: [
            ...s.members,
            {
              id: uid(),
              name: name ?? `Member ${s.members.length + 1}`,
              weeklyHours: 40,
              priorityGroups: cloneGroupsWithFreshIds(s.defaultPriorityGroups),
              skillsetIds: [],
              profileIds: [],
            },
          ],
        })),
      addMembers: (names) => {
        const trimmed = names.map((n) => n.trim()).filter(Boolean);
        if (trimmed.length === 0) return 0;
        set((s) => ({
          members: [
            ...s.members,
            ...trimmed.map((n, i) => ({
              id: uid(),
              name: n || `Member ${s.members.length + i + 1}`,
              weeklyHours: 40,
              priorityGroups: cloneGroupsWithFreshIds(s.defaultPriorityGroups),
              skillsetIds: [],
              profileIds: [],
            })),
          ],
        }));
        return trimmed.length;
      },
      updateMember: (id, patch) =>
        set((s) => ({
          members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      deleteMember: (id) =>
        set((s) => ({
          members: s.members.filter((m) => m.id !== id),
          sme: s.sme.filter((e) => e.memberId !== id),
          overrides: {
            allocationHours: s.overrides.allocationHours.filter((o) => o.memberId !== id),
          },
        })),
      setMemberPriorityGroups: (id, groups) => {
        const normalized = normalizeBau(groups);
        set((s) => ({
          members: s.members.map((m) =>
            m.id === id ? { ...m, priorityGroups: normalized, customized: true } : m
          ),
        }));
      },
      addMemberGroup: (id) =>
        set((s) => ({
          members: s.members.map((m) =>
            m.id === id
              ? {
                  ...m,
                  priorityGroups: [
                    ...m.priorityGroups,
                    { id: uid(), name: 'New group', pctOfRemaining: 0, isBau: false },
                  ],
                  customized: true,
                }
              : m
          ),
        })),
      setDefaultPriorityGroups: (groups) => {
        const normalized = normalizeBau(groups);
        let synced = 0;
        let skipped = 0;
        set((s) => ({
          defaultPriorityGroups: normalized,
          members: s.members.map((m) => {
            if (m.customized) {
              skipped += 1;
              return m;
            }
            synced += 1;
            return { ...m, priorityGroups: cloneGroupsWithFreshIds(normalized) };
          }),
        }));
        return { synced, skipped };
      },
      addDefaultGroup: () =>
        set((s) => {
          const bauIdx = s.defaultPriorityGroups.findIndex((g) => g.isBau);
          const insertAt = bauIdx === -1 ? s.defaultPriorityGroups.length : bauIdx;
          const newGroup: PriorityGroup = {
            id: uid(),
            name: 'New group',
            pctOfRemaining: 0,
            isBau: false,
          };
          const nextDefaults = [...s.defaultPriorityGroups];
          nextDefaults.splice(insertAt, 0, newGroup);
          return {
            defaultPriorityGroups: nextDefaults,
            members: s.members.map((m) =>
              m.customized ? m : { ...m, priorityGroups: cloneGroupsWithFreshIds(nextDefaults) }
            ),
          };
        }),
      resetMemberCustomization: (id) =>
        set((s) => ({
          members: s.members.map((m) =>
            m.id === id
              ? {
                  ...m,
                  customized: false,
                  priorityGroups: cloneGroupsWithFreshIds(s.defaultPriorityGroups),
                }
              : m
          ),
        })),
      toggleMemberSkillset: (memberId, skillsetId) =>
        set((s) => ({
          members: s.members.map((m) => {
            if (m.id !== memberId) return m;
            const has = m.skillsetIds.includes(skillsetId);
            return {
              ...m,
              skillsetIds: has ? m.skillsetIds.filter((x) => x !== skillsetId) : [...m.skillsetIds, skillsetId],
            };
          }),
        })),
      toggleMemberProfile: (memberId, profileId) =>
        set((s) => ({
          members: s.members.map((m) => {
            if (m.id !== memberId) return m;
            const has = m.profileIds.includes(profileId);
            return {
              ...m,
              profileIds: has ? m.profileIds.filter((x) => x !== profileId) : [...m.profileIds, profileId],
            };
          }),
        })),

      addSkillset: (name) =>
        set((s) => ({
          skillsets: [...s.skillsets, { id: uid(), name: name ?? `Skill ${s.skillsets.length + 1}` }],
        })),
      addSkillsets: (names) => {
        const trimmed = names.map((n) => n.trim()).filter(Boolean);
        if (trimmed.length === 0) return 0;
        set((s) => ({
          skillsets: [
            ...s.skillsets,
            ...trimmed.map((n, i) => ({
              id: uid(),
              name: n || `Skill ${s.skillsets.length + i + 1}`,
            })),
          ],
        }));
        return trimmed.length;
      },
      updateSkillset: (id, patch) =>
        set((s) => ({
          skillsets: s.skillsets.map((sk) => (sk.id === id ? { ...sk, ...patch } : sk)),
        })),
      deleteSkillset: (id) =>
        set((s) => ({
          skillsets: s.skillsets.filter((sk) => sk.id !== id),
          profiles: s.profiles.map((p) => ({
            ...p,
            skillsetIds: p.skillsetIds.filter((x) => x !== id),
          })),
          members: s.members.map((m) => ({
            ...m,
            skillsetIds: m.skillsetIds.filter((x) => x !== id),
          })),
          systems: s.systems.map((sys) => ({
            ...sys,
            requiredSkillsetIds: sys.requiredSkillsetIds.filter((x) => x !== id),
          })),
        })),

      addProfile: (name) =>
        set((s) => ({
          profiles: [
            ...s.profiles,
            { id: uid(), name: name ?? `Profile ${s.profiles.length + 1}`, skillsetIds: [] },
          ],
        })),
      addProfiles: (names) => {
        const trimmed = names.map((n) => n.trim()).filter(Boolean);
        if (trimmed.length === 0) return 0;
        set((s) => ({
          profiles: [
            ...s.profiles,
            ...trimmed.map((n, i) => ({
              id: uid(),
              name: n || `Profile ${s.profiles.length + i + 1}`,
              skillsetIds: [],
            })),
          ],
        }));
        return trimmed.length;
      },
      updateProfile: (id, patch) =>
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deleteProfile: (id) =>
        set((s) => ({
          profiles: s.profiles.filter((p) => p.id !== id),
          members: s.members.map((m) => ({
            ...m,
            profileIds: m.profileIds.filter((x) => x !== id),
          })),
          systems: s.systems.map((sys) => ({
            ...sys,
            requiredProfileIds: sys.requiredProfileIds.filter((x) => x !== id),
          })),
        })),
      toggleProfileSkillset: (profileId, skillsetId) =>
        set((s) => ({
          profiles: s.profiles.map((p) => {
            if (p.id !== profileId) return p;
            const has = p.skillsetIds.includes(skillsetId);
            return {
              ...p,
              skillsetIds: has ? p.skillsetIds.filter((x) => x !== skillsetId) : [...p.skillsetIds, skillsetId],
            };
          }),
        })),

      addSystem: (name) =>
        set((s) => ({
          systems: [
            ...s.systems,
            {
              id: uid(),
              name: name ?? `System ${s.systems.length + 1}`,
              critical: false,
              requiredSkillsetIds: [],
              requiredProfileIds: [],
              cadence: structuredClone(DEFAULT_CADENCE),
              effortPerEvent: { ...DEFAULT_EFFORT },
            },
          ],
        })),
      addSystems: (names) => {
        const trimmed = names.map((n) => n.trim()).filter(Boolean);
        if (trimmed.length === 0) return 0;
        set((s) => ({
          systems: [
            ...s.systems,
            ...trimmed.map((n, i) => ({
              id: uid(),
              name: n || `System ${s.systems.length + i + 1}`,
              critical: false,
              requiredSkillsetIds: [],
              requiredProfileIds: [],
              cadence: structuredClone(DEFAULT_CADENCE),
              effortPerEvent: { ...DEFAULT_EFFORT },
            })),
          ],
        }));
        return trimmed.length;
      },
      updateSystem: (id, patch) =>
        set((s) => ({
          systems: s.systems.map((sys) => (sys.id === id ? { ...sys, ...patch } : sys)),
        })),
      deleteSystem: (id) =>
        set((s) => ({
          systems: s.systems.filter((sys) => sys.id !== id),
          sme: s.sme.filter((e) => e.systemId !== id),
          overrides: {
            allocationHours: s.overrides.allocationHours.filter((o) => o.systemId !== id),
          },
        })),
      toggleSystemRequiredSkillset: (systemId, skillsetId) =>
        set((s) => ({
          systems: s.systems.map((sys) => {
            if (sys.id !== systemId) return sys;
            const has = sys.requiredSkillsetIds.includes(skillsetId);
            return {
              ...sys,
              requiredSkillsetIds: has
                ? sys.requiredSkillsetIds.filter((x) => x !== skillsetId)
                : [...sys.requiredSkillsetIds, skillsetId],
            };
          }),
        })),
      toggleSystemRequiredProfile: (systemId, profileId) =>
        set((s) => ({
          systems: s.systems.map((sys) => {
            if (sys.id !== systemId) return sys;
            const has = sys.requiredProfileIds.includes(profileId);
            return {
              ...sys,
              requiredProfileIds: has
                ? sys.requiredProfileIds.filter((x) => x !== profileId)
                : [...sys.requiredProfileIds, profileId],
            };
          }),
        })),
      setSystemCadence: (systemId, event, freqPerYear) =>
        set((s) => ({
          systems: s.systems.map((sys) =>
            sys.id === systemId
              ? { ...sys, cadence: { ...sys.cadence, [event]: { freqPerYear } } }
              : sys
          ),
        })),
      setSystemEffort: (systemId, event, hours) =>
        set((s) => ({
          systems: s.systems.map((sys) =>
            sys.id === systemId
              ? { ...sys, effortPerEvent: { ...sys.effortPerEvent, [event]: hours } }
              : sys
          ),
        })),
      setSystemCritical: (systemId, critical) =>
        set((s) => ({
          systems: s.systems.map((sys) => (sys.id === systemId ? { ...sys, critical } : sys)),
        })),

      setSme: (memberId, systemId, level) =>
        set((s) => {
          const existing = s.sme.find((e) => e.memberId === memberId && e.systemId === systemId);
          let nextSme: SmeEntry[];
          if (level === 0) {
            nextSme = s.sme.filter((e) => !(e.memberId === memberId && e.systemId === systemId));
          } else if (existing) {
            nextSme = s.sme.map((e) =>
              e.memberId === memberId && e.systemId === systemId ? { ...e, level } : e
            );
          } else {
            nextSme = [...s.sme, { memberId, systemId, level }];
          }
          let overrides = s.overrides.allocationHours;
          if (level !== 2) {
            overrides = overrides.filter((o) => !(o.memberId === memberId && o.systemId === systemId));
          }
          return { sme: nextSme, overrides: { allocationHours: overrides } };
        }),

      setOverride: (memberId, systemId, hours) =>
        set((s) => {
          const filtered = s.overrides.allocationHours.filter(
            (o) => !(o.memberId === memberId && o.systemId === systemId)
          );
          const next = hours == null || Number.isNaN(hours) ? filtered : [...filtered, { memberId, systemId, hours }];
          return { overrides: { allocationHours: next } };
        }),
      listOverrides: () => get().overrides.allocationHours,
    }),
    {
      name: 'resource-manager:v1',
      version: SCHEMA_VERSION,
    }
  )
);

export function smeLevel(state: AppState, memberId: ID, systemId: ID): SmeLevel {
  return (state.sme.find((e) => e.memberId === memberId && e.systemId === systemId)?.level ?? 0) as SmeLevel;
}

export function overrideHours(state: AppState, memberId: ID, systemId: ID): number | null {
  return state.overrides.allocationHours.find((o) => o.memberId === memberId && o.systemId === systemId)?.hours ?? null;
}

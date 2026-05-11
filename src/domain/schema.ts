import type { AppState } from './types';
import { SCHEMA_VERSION, EMPTY_STATE, DEFAULT_PRIORITY_GROUPS } from './types';

export class SchemaError extends Error {}

export function validateAppState(raw: unknown): AppState {
  if (!raw || typeof raw !== 'object') throw new SchemaError('Root must be an object');
  const r = raw as Record<string, unknown>;
  if (typeof r.schemaVersion !== 'number') throw new SchemaError('Missing schemaVersion');
  if (r.schemaVersion > SCHEMA_VERSION) {
    throw new SchemaError(
      `File schemaVersion=${r.schemaVersion} is newer than app (${SCHEMA_VERSION}). Upgrade the app.`
    );
  }
  const out: AppState = {
    ...EMPTY_STATE,
    schemaVersion: SCHEMA_VERSION,
    defaultPriorityGroups: Array.isArray(r.defaultPriorityGroups)
      ? (r.defaultPriorityGroups as AppState['defaultPriorityGroups'])
      : DEFAULT_PRIORITY_GROUPS,
    members: Array.isArray(r.members) ? (r.members as AppState['members']) : [],
    skillsets: Array.isArray(r.skillsets) ? (r.skillsets as AppState['skillsets']) : [],
    profiles: Array.isArray(r.profiles) ? (r.profiles as AppState['profiles']) : [],
    systems: Array.isArray(r.systems) ? (r.systems as AppState['systems']) : [],
    sme: Array.isArray(r.sme) ? (r.sme as AppState['sme']) : [],
    overrides: {
      allocationHours: Array.isArray((r.overrides as { allocationHours?: unknown[] } | undefined)?.allocationHours)
        ? ((r.overrides as { allocationHours: AppState['overrides']['allocationHours'] }).allocationHours)
        : [],
    },
  };
  return out;
}

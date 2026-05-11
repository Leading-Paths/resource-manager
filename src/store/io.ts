import type { AppState } from '../domain/types';
import { SCHEMA_VERSION } from '../domain/types';
import { validateAppState, SchemaError } from '../domain/schema';
import { migrate } from '../domain/migrate';

export function buildExport(state: AppState): string {
  const payload = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    members: state.members,
    skillsets: state.skillsets,
    profiles: state.profiles,
    systems: state.systems,
    sme: state.sme,
    overrides: state.overrides,
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadExport(state: AppState) {
  const blob = new Blob([buildExport(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  a.download = `resource-manager-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function readImport(file: File): Promise<AppState> {
  const text = await file.text();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new SchemaError(`File is not valid JSON: ${(e as Error).message}`);
  }
  const validated = validateAppState(raw);
  return migrate(validated);
}

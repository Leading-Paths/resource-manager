import type { AppState } from './types';
import { SCHEMA_VERSION } from './types';

export function migrate(state: AppState): AppState {
  if (state.schemaVersion === SCHEMA_VERSION) return state;
  return { ...state, schemaVersion: SCHEMA_VERSION };
}

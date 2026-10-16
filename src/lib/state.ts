/** Wizard state (answers + scratchpad values), persisted in localStorage. */
import { resolveFlow, type Answers, type Resolved } from '../data/flow';
import { fieldsForPath } from '../data/scratchpad';
import type { Values } from './template';

const KEY = 'certs-guide:v1';

export interface State {
  answers: Answers;
  values: Values;
}

export function loadState(): State {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return {
      answers: raw && typeof raw.answers === 'object' && raw.answers ? raw.answers : {},
      values: raw && typeof raw.values === 'object' && raw.values ? raw.values : {},
    };
  } catch {
    return { answers: {}, values: {} };
  }
}

export function saveState(state: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable (private mode): the session still works, just not persisted */
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Prune later state after an answer changed: stale answers are dropped, and so are
 * scratchpad values for fields that are no longer relevant to the PATH.
 */
export function normalize(state: State): { state: State; resolved: Resolved } {
  const resolved = resolveFlow(state.answers);
  const keep = new Set(fieldsForPath(resolved.path, resolved.answers).map((f) => f.key));
  const values: Values = {};
  for (const [k, v] of Object.entries(state.values)) {
    // Keep unknown-path values untouched until a path is chosen.
    if (!resolved.path || keep.has(k)) values[k] = v;
  }
  return { state: { answers: resolved.answers, values }, resolved };
}

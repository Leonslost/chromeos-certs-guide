/**
 * One shared binding between the page's state and every input/placeholder on it.
 * Scratchpad panel, inline fields and the click-to-edit popover all write through setValue(),
 * so every other input, derived output and snippet updates at once.
 */
import { DERIVED } from '../data/scratchpad';
import { resolveValue, type Values } from './template';

export interface Store {
  /** Current values (the page may replace its state object, so always read through this). */
  getValues: () => Values;
  /** Called after every write: persist and re-fill snippets. */
  changed: () => void;
}

let store: Store | undefined;

export const bindStore = (s: Store) => {
  store = s;
};

export const getValues = (): Values => store?.getValues() ?? {};

/** Update derived read-only outputs (e.g. connector_sa_email). */
export function refreshDerived() {
  const values = getValues();
  document.querySelectorAll<HTMLElement>('[data-derived]').forEach((out) => {
    const key = out.dataset.derived ?? '';
    if (!(key in DERIVED)) return;
    const v = resolveValue(key, values);
    out.textContent = v ?? `<${key.toUpperCase()}>`;
    out.classList.toggle('placeholder', !v);
  });
}

/** Write one scratchpad value. `from` is the input being typed in (left untouched). */
export function setValue(key: string, value: string, from?: HTMLElement) {
  if (!store) return;
  store.getValues()[key] = value;
  document.querySelectorAll<HTMLInputElement>(`input[data-var="${key}"]`).forEach((i) => {
    if (i !== from && i.value !== value) i.value = value;
  });
  refreshDerived();
  store.changed();
}

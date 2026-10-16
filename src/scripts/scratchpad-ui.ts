/** Scratchpad panel: renders only the fields relevant to the current PATH. */
import { PATHS, type PathId } from '../data/flow';
import { FIELDS, fieldsForPath } from '../data/scratchpad';
import { refreshDerived } from '../lib/bind';
import type { State } from '../lib/state';
import { fieldRows } from './fields';

export interface ScratchpadOptions {
  /** Show the PATH-independent fields while PATH is still unknown (troubleshooting pages). */
  commonWhenUnknown?: boolean;
}

export function renderScratchpad(root: HTMLElement, state: State, path: PathId | undefined, opts: ScratchpadOptions = {}) {
  const host = root.querySelector<HTMLElement>('[data-sp-fields]');
  if (!host) return;
  const fields = path
    ? fieldsForPath(path, state.answers)
    : opts.commonWhenUnknown
      ? FIELDS.filter((f) => f.paths.length === PATHS.length)
      : [];

  if (fields.length === 0) {
    host.replaceChildren(
      Object.assign(document.createElement('p'), {
        className: 'sp-empty',
        textContent: 'Answer the questions first. The values your path needs will appear here.',
      }),
    );
    return;
  }
  host.replaceChildren(fieldRows(fields, state.values));
  refreshDerived();
}

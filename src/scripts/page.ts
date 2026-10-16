/** Generic page boot (troubleshooting pages): gate by PATH, enhance, scratchpad. */
import { bindStore } from '../lib/bind';
import { download, enhance, fill, installGlobalHandlers } from '../lib/enhance';
import { exportMarkdown } from '../lib/export';
import { clearState, loadState, normalize, saveState } from '../lib/state';
import { renderScratchpad } from './scratchpad-ui';

installGlobalHandlers();

let { state, resolved } = normalize(loadState());
const main = document.querySelector<HTMLElement>('main')!;
const panel = document.querySelector<HTMLElement>('[data-scratchpad]');

bindStore({
  getValues: () => state.values,
  changed: () => {
    saveState(state);
    fill(main, state.values);
  },
});

// No path chosen yet (fresh visitor, or after "Clear all"): show the full GCCC
// troubleshooting rather than an empty page.
enhance(main, { path: resolved.path ?? 'SCEP', ca: resolved.answers.ca }, state.values);

if (panel) {
  renderScratchpad(panel, state, resolved.path, { commonWhenUnknown: true });
  panel.querySelector('[data-sp-export]')?.addEventListener('click', () => {
    download('certs-guide-answers.md', exportMarkdown(state, resolved, {}), 'text/markdown');
  });
  panel.querySelector('[data-sp-reset]')?.addEventListener('click', () => {
    if (confirm('Clear all answers and scratchpad values stored in this browser?')) {
      clearState();
      location.reload();
    }
  });
}

/** The one-page wizard at `/`: Step 1 → Step 2 → the path's remaining steps. */
import { handoff, type Resolved } from '../data/flow';
import { bindStore, refreshDerived } from '../lib/bind';
import { download, enhance, fill, installGlobalHandlers } from '../lib/enhance';
import { exportMarkdown } from '../lib/export';
import { clearState, loadState, normalize, saveState, type State } from '../lib/state';
import { renderScratchpad } from './scratchpad-ui';

installGlobalHandlers();

const main = document.getElementById('wizard-steps')!;
const navBody = document.querySelector<HTMLElement>('[data-nav-body]')!;
const panel = document.querySelector<HTMLElement>('[data-scratchpad]')!;
const base = document.body.dataset.base ?? '/';

const templates = Array.from(document.querySelectorAll<HTMLTemplateElement>('template[data-step-id]'));
// Step numbers are positions in the user's path (an answer-gated step such as NDES shifts the later ones).
const titleOf = (id: string) => templates.find((x) => x.dataset.stepId === id)?.dataset.title ?? id;

let state: State = loadState();
let resolved: Resolved;

// Scratchpad panel, inline fields and click-to-edit placeholders all write through this store.
bindStore({
  getValues: () => state.values,
  changed: () => {
    saveState(state);
    fill(main, state.values);
  },
});

function el(tag: string, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): HTMLElement {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids);
  return e;
}

function renderQuestions(host: HTMLElement, stepId: string) {
  for (const node of resolved.chain.filter((n) => n.step === stepId)) {
    const fs = el('fieldset', { className: 'question' }, el('legend', { textContent: node.prompt }));
    for (const opt of node.options) {
      const input = el('input', { type: 'radio', name: node.id, value: opt.id, checked: state.answers[node.id] === opt.id }) as HTMLInputElement;
      input.addEventListener('change', () => {
        state.answers[node.id] = opt.id;
        render({ name: node.id, value: opt.id });
      });
      const text = el('span', { className: 'option-text' }, el('span', { className: 'option-label', textContent: opt.label }));
      if (opt.detail) text.append(el('span', { className: 'option-detail', textContent: opt.detail }));
      if (opt.links) {
        for (const l of opt.links) {
          text.append(el('a', { className: 'option-link', href: l.url, textContent: l.label, rel: 'noopener' }));
        }
      }
      fs.append(el('div', { className: 'option' }, el('label', {}, input, text)));
    }
    host.append(fs);
  }
}

function renderNav() {
  const items = resolved.steps.map((id, i) =>
    el('li', {}, el('a', { href: `#step-${id}`, textContent: `${i + 1}. ${titleOf(id)}` })),
  );
  if (resolved.path) {
    const h = handoff[resolved.path];
    items.push(
      el('li', {}, h.href ? el('a', { href: base + h.href, textContent: h.label }) : el('a', { href: h.anchor ?? '#', textContent: h.label })),
    );
  }
  const reset = el('button', { type: 'button', className: 'btn btn-quiet', textContent: 'Start over' });
  reset.addEventListener('click', () => {
    if (confirm('Clear all answers and scratchpad values stored in this browser?')) {
      clearState();
      state = { answers: {}, values: {} };
      render();
    }
  });
  navBody.replaceChildren(el('ol', { className: 'step-list' }, ...items), reset);
}

function renderMain() {
  main.replaceChildren();
  for (const [index, id] of resolved.steps.entries()) {
    const tpl = templates.find((t) => t.dataset.stepId === id);
    if (!tpl) continue;
    const frag = tpl.content.cloneNode(true) as DocumentFragment;
    frag.querySelectorAll('[data-step-num]').forEach((n) => (n.textContent = String(index + 1)));
    const host = frag.querySelector<HTMLElement>('[data-flow-host]');
    if (host) renderQuestions(host, id);
    enhance(frag, { path: resolved.path, ca: resolved.answers.ca, answers: resolved.answers }, state.values);
    main.append(frag);
  }
  refreshDerived();
}

let navObserver: IntersectionObserver | null = null;
function updateNavObserver() {
  if (typeof IntersectionObserver === 'undefined') return;
  if (navObserver) navObserver.disconnect();
  const stepElements = main.querySelectorAll<HTMLElement>('.step');
  const links = navBody.querySelectorAll<HTMLAnchorElement>('.step-list a');
  if (stepElements.length === 0 || links.length === 0) return;

  navObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length > 0) {
        const id = visible[0].target.id;
        links.forEach((l) => {
          const href = l.getAttribute('href');
          if (href === `#${id}`) {
            l.setAttribute('aria-current', 'location');
          } else {
            l.removeAttribute('aria-current');
          }
        });
      }
    },
    { rootMargin: '-10% 0px -65% 0px' },
  );

  stepElements.forEach((el) => navObserver!.observe(el));
}

function render(focus?: { name: string; value: string }) {
  ({ state, resolved } = normalize(state));
  saveState(state);
  renderNav();
  renderMain();
  renderScratchpad(panel, state, resolved.path);
  updateNavObserver();
  if (focus) {
    main.querySelector<HTMLInputElement>(`input[name="${focus.name}"][value="${focus.value}"]`)?.focus({ preventScroll: true });
  }
}

panel.querySelector('[data-sp-export]')?.addEventListener('click', () => {
  const titles = Object.fromEntries(templates.map((t) => [t.dataset.stepId!, t.dataset.title!]));
  download('certs-guide-answers.md', exportMarkdown(state, resolved, titles), 'text/markdown');
});
panel.querySelector('[data-sp-reset]')?.addEventListener('click', () => {
  if (confirm('Clear all answers and scratchpad values stored in this browser?')) {
    clearState();
    state = { answers: {}, values: {} };
    render();
  }
});

render();

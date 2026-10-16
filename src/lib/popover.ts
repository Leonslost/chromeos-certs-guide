/** Click-to-edit popover for `{{variable}}` placeholders and filled values inside snippets. */
import { DEFAULTS, DERIVED, FIELDS } from '../data/scratchpad';
import { getValues, setValue } from './bind';
import { defaultFor } from './template';

let pop: HTMLElement | null = null;
let cleanup: (() => void) | null = null;

export const isVar = (el: Element | null): el is HTMLElement => !!el && el.classList.contains('var');

export function closeEditor(restoreFocus: HTMLElement | null = null) {
  cleanup?.();
  cleanup = null;
  pop?.remove();
  pop = null;
  restoreFocus?.focus();
}

export function openEditor(anchor: HTMLElement) {
  closeEditor();
  const key = anchor.dataset.var ?? '';
  const field = FIELDS.find((f) => f.key === key);
  const host = anchor.closest<HTMLElement>('[data-template]');
  const index = host ? Array.from(host.querySelectorAll('.var')).indexOf(anchor) : -1;

  const box = document.createElement('div');
  box.className = 'var-popover';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', `Set ${key.toUpperCase()}`);

  const row = document.createElement('div');
  row.className = 'sp-field';
  const label = document.createElement('label');
  label.htmlFor = 'var-popover-input';
  label.textContent = field?.label ?? key;
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'var-popover-input';
  input.value = getValues()[key] ?? '';
  input.placeholder = (key in DEFAULTS ? defaultFor(key, getValues()) : undefined) ?? field?.example ?? '';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'off');
  row.append(label, input);
  const hintText = (text: string) => {
    const note = document.createElement('small');
    note.textContent = text;
    row.append(note);
  };
  if (field) hintText(field.hint);
  const via = anchor.dataset.via;
  if (via && DERIVED[via]) hintText(`Part of the derived ${via}. Edit the pieces here; the result follows.`);

  const actions = document.createElement('div');
  actions.className = 'var-popover-actions';
  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'btn btn-primary';
  save.textContent = 'Save';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn btn-quiet';
  cancel.textContent = 'Cancel';
  actions.append(save, cancel);
  box.append(row, actions);
  document.body.append(box);

  // Position under the anchor (above if there is no room), kept inside the viewport.
  const r = anchor.getBoundingClientRect();
  const w = box.offsetWidth;
  const h = box.offsetHeight;
  const below = r.bottom + h + 12 <= window.innerHeight || r.top < h + 12;
  box.style.top = `${(below ? r.bottom + 6 : r.top - h - 6) + window.scrollY}px`;
  box.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + window.scrollX}px`;

  const refocus = () => {
    // fill() re-rendered the snippet, so find the same occurrence again.
    const again = host?.isConnected ? (host.querySelectorAll<HTMLElement>('.var')[index] ?? null) : null;
    return again ?? (anchor.isConnected ? anchor : null);
  };
  const commit = () => {
    setValue(key, input.value.trim());
    closeEditor(refocus());
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeEditor(refocus());
    } else if (e.key === 'Enter' && box.contains(e.target as Node) && (e.target as HTMLElement).tagName === 'INPUT') {
      e.preventDefault();
      commit();
    }
  };
  const onOutside = (e: Event) => {
    if (!box.contains(e.target as Node) && !(e.target as Element).closest?.('.var')) closeEditor();
  };
  save.addEventListener('click', commit);
  cancel.addEventListener('click', () => closeEditor(refocus()));
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('pointerdown', onOutside, true);
  cleanup = () => {
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('pointerdown', onOutside, true);
  };
  pop = box;
  input.focus();
  input.select();
}

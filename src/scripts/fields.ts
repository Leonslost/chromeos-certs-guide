/** Scratchpad input rows, shared by the scratchpad panel and inline fields in step content. */
import { DERIVED, FIELDS, type Field } from '../data/scratchpad';
import { refreshDerived, setValue } from '../lib/bind';
import type { PathId } from '../data/flow';
import type { Values } from '../lib/template';

let uid = 0;

export function fieldRow(f: Field, values: Values, opts: { inline?: boolean }): HTMLElement {
  const row = document.createElement('div');
  row.className = f.wide ? 'sp-field sp-field-wide' : 'sp-field';
  const id = `field-${f.key}-${++uid}`;
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = f.label + (f.optional ? ' (optional)' : '');
  const input = document.createElement('input');
  input.type = 'text';
  input.id = id;
  input.name = f.key;
  input.dataset.var = f.key;
  input.value = values[f.key] ?? '';
  input.placeholder = f.example;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'off');
  input.addEventListener('input', () => setValue(f.key, input.value, input));
  row.append(label, input);
  const hint = document.createElement('small');
  hint.textContent = opts.inline ? f.hint : `${f.hint} (${f.collectedAt})`;
  row.append(hint);
  return row;
}

/** Read-only row for a derived variable; kept current by refreshDerived(). */
export function derivedRow(key: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'sp-field sp-derived';
  const label = document.createElement('span');
  label.className = 'sp-label';
  label.textContent = DERIVED[key].label;
  const out = document.createElement('output');
  out.className = 'sp-output';
  out.dataset.derived = key;
  row.append(label, out);
  return row;
}

export function fieldRows(fields: Field[], values: Values, opts: { inline?: boolean } = {}): DocumentFragment {
  const frag = document.createDocumentFragment();
  for (const f of fields) {
    frag.append(fieldRow(f, values, opts));
    if (f.key === 'connector_sa_name') for (const key of Object.keys(DERIVED)) frag.append(derivedRow(key));
  }
  return frag;
}

/** Fill every `.inline-fields[data-fields="a b c"]` group placed in Markdown by a ```field fence. */
export function mountInlineFields(root: ParentNode, values: Values, path?: PathId) {
  root.querySelectorAll<HTMLElement>('.inline-fields[data-fields]:not([data-ready])').forEach((host) => {
    host.dataset.ready = '';
    const keys = (host.dataset.fields ?? '').split(/\s+/).filter(Boolean);
    const fields = keys.map((k) => FIELDS.find((f) => f.key === k)).filter((f): f is Field => !!f && (!path || f.paths.includes(path)));
    host.replaceChildren(fieldRows(fields, values, { inline: true }));
  });
  refreshDerived();
}

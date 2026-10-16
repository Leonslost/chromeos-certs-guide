/** `{{variable}}` template engine. Unfilled values become visible `<PLACEHOLDER>`s, never empty. */
import { DERIVED } from '../data/scratchpad';

export type Values = Record<string, string>;
/**
 * `key` marks text that came from a scratchpad value, `ph` an unfilled one. `via` names the derived
 * variable (e.g. connector_sa_email) the piece belongs to, so the UI can explain that it is derived.
 */
export type Seg = { text: string; key?: string; via?: string } | { ph: string; via?: string };
export type Format = 'text' | 'json';

const RE = /\{\{\s*(\w+)\s*\}\}/g;

export const placeholderText = (key: string) => `<${key.toUpperCase()}>`;

const escapeFor = (value: string, format: Format) =>
  format === 'json' ? JSON.stringify(value).slice(1, -1) : value;

export function segments(template: string, values: Values, format: Format = 'text', depth = 0, via?: string): Seg[] {
  const out: Seg[] = [];
  let last = 0;
  for (const m of template.matchAll(RE)) {
    if (m.index > last) out.push({ text: template.slice(last, m.index) });
    const key = m[1];
    const derived = DERIVED[key];
    if (derived && depth < 5) {
      out.push(...segments(derived.template, values, format, depth + 1, key));
    } else {
      const v = (values[key] ?? '').trim();
      out.push(v ? { text: escapeFor(v, format), key, via } : { ph: key, via });
    }
    last = m.index + m[0].length;
  }
  if (last < template.length) out.push({ text: template.slice(last) });
  return out;
}

/** Plain-text rendering (placeholders as `<KEY>`), plus how many were unfilled. */
export function renderPlain(template: string, values: Values, format: Format = 'text') {
  const segs = segments(template, values, format);
  return {
    text: segs.map((s) => ('text' in s ? s.text : placeholderText(s.ph))).join(''),
    unfilled: segs.filter((s) => 'ph' in s).length,
  };
}

/** Value of a field or derived variable, or undefined when it cannot be fully resolved. */
export function resolveValue(key: string, values: Values): string | undefined {
  const r = renderPlain(`{{${key}}}`, values);
  return r.unfilled ? undefined : r.text;
}

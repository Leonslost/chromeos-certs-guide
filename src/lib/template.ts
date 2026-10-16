/** `{{variable}}` template engine. Unfilled values become visible `<PLACEHOLDER>`s, never empty. */
import { DEFAULTS, DERIVED } from '../data/scratchpad';

export type Values = Record<string, string>;
/**
 * `key` marks text that came from a scratchpad value, `ph` an unfilled one. `via` names the derived
 * variable (e.g. connector_sa_email) the piece belongs to, so the UI can explain that it is derived.
 */
export type Seg = { text: string; key?: string; via?: string; isDefault?: boolean } | { ph: string; via?: string };
/** `url` percent-encodes each value (for values placed inside a URL template). */
export type Format = 'text' | 'json' | 'url';

const RE = /\{\{\s*(\w+)\s*\}\}/g;

export const placeholderText = (key: string) => `<${key.toUpperCase()}>`;

const escapeFor = (value: string, format: Format) =>
  format === 'json' ? JSON.stringify(value).slice(1, -1) : format === 'url' ? encodeURIComponent(value) : value;

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
      const dflt = v ? undefined : defaultFor(key, values, format, depth + 1);
      if (v) out.push({ text: escapeFor(v, format), key, via });
      // One chip for the whole default, bound to the field itself, so editing it sets an override.
      else if (dflt !== undefined) out.push({ text: dflt, key, via, isDefault: true });
      else out.push({ ph: key, via });
    }
    last = m.index + m[0].length;
  }
  if (last < template.length) out.push({ text: template.slice(last) });
  return out;
}

/** The fallback value of a field the user has not set (see DEFAULTS), or undefined when it has none or cannot be resolved yet. */
export function defaultFor(key: string, values: Values, format: Format = 'text', depth = 0): string | undefined {
  const template = DEFAULTS[key];
  if (!template || depth >= 5) return undefined;
  const segs = segments(template, values, format, depth);
  if (segs.some((s) => 'ph' in s)) return undefined;
  return segs.map((s) => ('text' in s ? s.text : '')).join('');
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

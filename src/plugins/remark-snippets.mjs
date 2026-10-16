// Markdown plugin (Sätteri mdast, the Astro 7 default processor). Three custom fences,
// plus an inline token: `{{variable}}` in normal prose becomes a click-to-edit chip
// (same markup/behaviour as a placeholder in a code block; unknown names fail the build):
//   ```snippet   body = snippet id(s)         -> the rendered snippet block(s) (src/snippets/)
//   ```field     body = scratchpad variables  -> inline inputs bound to the scratchpad state
//   ```choice    (empty body)                 -> where the wizard renders this step's question
import { defineMdastPlugin } from 'satteri';
import { DERIVED, FIELDS } from '../data/scratchpad';
import { BASE } from '../data/deploy.mjs';
import { snippetHtml } from '../lib/snippet-html.mjs';

const KNOWN = new Set([...FIELDS.map((f) => f.key), ...Object.keys(DERIVED)]);
const TOKEN = /\{\{\s*(\w+)\s*\}\}/g;
const esc = (/** @type {string} */ t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const words = (/** @type {unknown} */ v) => String(v).split(/\s+/).filter(Boolean);

export default defineMdastPlugin({
  name: 'custom-fences',
  // Prose only: code fences, inline code and raw HTML are other node types and are untouched
  // (their {{variables}} are filled at runtime by src/lib/enhance.ts).
  text(node, ctx) {
    const value = String(node.value);
    if (!value.includes('{{')) return;
    let html = '';
    let last = 0;
    for (const m of value.matchAll(TOKEN)) {
      if (!KNOWN.has(m[1])) throw new Error(`Unknown scratchpad variable {{${m[1]}}} in Markdown (see src/data/scratchpad.ts)`);
      html += esc(value.slice(last, m.index));
      // Filled at runtime into .var chips; the text is the no-JS fallback.
      html += `<span class="tpl" data-template="{{${m[1]}}}">&lt;${m[1].toUpperCase()}&gt;</span>`;
      last = (m.index ?? 0) + m[0].length;
    }
    ctx.replaceNode(node, { type: 'html', value: html + esc(value.slice(last)) });
  },
  // Root-relative links in Markdown ([x](/troubleshooting/)) get the deploy base prefixed.
  link(node, ctx) {
    const url = String(node.url);
    if (!url.startsWith('/') || url.startsWith('//') || url.startsWith(BASE + '/')) return;
    ctx.replaceNode(node, { type: 'link', url: BASE + url, title: node.title, children: node.children });
  },
  code(node, ctx) {
    if (node.lang === 'snippet') {
      ctx.replaceNode(node, { type: 'html', value: words(node.value).map(snippetHtml).join('\n') });
    } else if (node.lang === 'field') {
      const keys = words(node.value).join(' ');
      ctx.replaceNode(node, {
        type: 'html',
        value: `<div class="inline-fields" role="group" aria-label="Your values" data-fields="${keys}"></div>`,
      });
    } else if (node.lang === 'choice') {
      ctx.replaceNode(node, { type: 'html', value: '<div data-flow-host></div>' });
    }
  },
});

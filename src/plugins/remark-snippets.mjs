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

const attr = (/** @type {string} */ t) => esc(t).replace(/"/g, '&quot;');

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
  // Links:
  //  - root-relative ([x](/troubleshooting/)) get the deploy base prefixed;
  //  - a URL containing {{variables}} is a templated console link. It needs a fallback in the link title,
  //    [text](https://console.cloud.google.com/.../edit/{{subscription_id}} "fallback: https://console.cloud.google.com/.../list"),
  //    and becomes an <a> that src/lib/enhance.ts fills at runtime (the fallback is used while any variable is unset).
  link(node, ctx) {
    const url = String(node.url);
    if (url.includes('{{')) {
      const title = String(node.title ?? '');
      const fallback = /^fallback:\s*(\S+)$/.exec(title)?.[1];
      if (!fallback || fallback.includes('{{')) {
        throw new Error(`Templated link needs a title of the form "fallback: <plain URL>" (no variables): ${url}`);
      }
      for (const m of url.matchAll(TOKEN)) {
        if (!KNOWN.has(m[1])) throw new Error(`Unknown scratchpad variable {{${m[1]}}} in link URL (see src/data/scratchpad.ts): ${url}`);
      }
      const inner = (/** @type {any[]} */ nodes) =>
        nodes
          .map((n) => {
            if (n.type === 'text' || n.type === 'inlineCode') {
              const v = String(n.value);
              if (v.includes('{{')) throw new Error(`Variables are not supported in templated link text: ${v}`);
              return n.type === 'text' ? esc(v) : `<code>${esc(v)}</code>`;
            }
            if (n.type === 'strong') return `<strong>${inner(n.children)}</strong>`;
            if (n.type === 'emphasis') return `<em>${inner(n.children)}</em>`;
            throw new Error(`Unsupported content in templated link text (${n.type}): ${url}`);
          })
          .join('');
      ctx.replaceNode(node, {
        type: 'html',
        value:
          `<a href="${attr(fallback)}" data-console-href="${attr(fallback)}" data-console-template="${attr(url)}"` +
          ` target="_blank" rel="noopener">${inner(node.children)}</a>`,
      });
      return;
    }
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

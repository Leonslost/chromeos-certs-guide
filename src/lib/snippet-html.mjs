// Build-time helper: turns a snippet id (see src/snippets/index.json) into HTML.
// Used by the remark plugin (```snippet fences in Markdown) and by Snippet.astro.
// The template text keeps its {{variables}}; the client fills them live.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'src', 'snippets');
/** @type {Record<string, {file: string, title: string, paths?: string[], download?: string}>} */
let manifest;

const LANG = { sh: ['bash', 'Cloud Shell (bash)'], ps1: ['powershell', 'PowerShell'], json: ['json', 'JSON'] };

/** @param {string} s */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** @param {string} id */
export function snippetHtml(id) {
  manifest ??= JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
  const meta = manifest[id];
  if (!meta) throw new Error(`Unknown snippet id "${id}" (add it to src/snippets/index.json)`);
  const ext = meta.file.split('.').pop() ?? '';
  const [lang, langLabel] = LANG[/** @type {keyof typeof LANG} */ (ext)] ?? ['text', 'Text'];
  const text = readFileSync(join(dir, meta.file), 'utf8').replace(/\n$/, '');
  const paths = meta.paths ? ` data-paths="${meta.paths.join(' ')}"` : '';
  const download = meta.download
    ? `<div class="snippet-actions"><button type="button" class="btn" data-download="${esc(meta.download)}">Download ${esc(meta.download)}</button>` +
      `<span class="snippet-warning" hidden>Some values are still placeholders. Fill them in the scratchpad first.</span></div>`
    : '';
  return (
    `<figure class="snippet" data-snippet="${esc(id)}"${paths}>` +
    `<figcaption><span class="snippet-title">${esc(meta.title)}</span> <span class="snippet-lang">${langLabel}</span></figcaption>` +
    `<pre data-format="${lang === 'json' ? 'json' : 'text'}"><code class="language-${lang}">${esc(text)}</code></pre>` +
    `${download}</figure>`
  );
}

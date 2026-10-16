/**
 * DOM enhancers shared by every page:
 *  - gate:      remove content that does not apply to the user's PATH / CA answer
 *  - code blocks: EVERY <pre> gets a copy button (one implementation, static + generated)
 *  - fill:      live {{variable}} substitution in code blocks and inline code
 *  - tabs, download buttons, click-to-edit placeholders, inline scratchpad fields
 */
import type { PathId } from '../data/flow';
import { mountInlineFields } from '../scripts/fields';
import { isVar, openEditor } from './popover';
import { placeholderText, segments, type Format, type Values } from './template';

export interface GateCtx {
  path?: PathId;
  ca?: string;
  /** Wizard answers, keyed by flow node id (for data-answer). */
  answers?: Record<string, string>;
}

const list = (el: Element, attr: string) => (el.getAttribute(attr) ?? '').split(/\s+/).filter(Boolean);

/**
 * data-paths="SCEP DIY"         keep if PATH is unknown or listed
 * data-paths-strict="VENDOR"    keep only if PATH is known and listed
 * data-ca="A B"                 keep only if the Step 1 answer is listed
 * data-answer="node:option ..."  keep only if any listed answer was given (flow node id : option id)
 */
export function gate(root: ParentNode, ctx: GateCtx) {
  root.querySelectorAll('[data-paths],[data-paths-strict],[data-ca],[data-answer]').forEach((el) => {
    const paths = el.hasAttribute('data-paths') ? list(el, 'data-paths') : undefined;
    const strict = el.hasAttribute('data-paths-strict') ? list(el, 'data-paths-strict') : undefined;
    const cas = el.hasAttribute('data-ca') ? list(el, 'data-ca') : undefined;
    const wanted = el.hasAttribute('data-answer') ? list(el, 'data-answer') : undefined;
    const drop =
      (wanted && !wanted.some((w) => ctx.answers?.[w.split(':')[0]] === w.split(':')[1])) ||
      (paths && ctx.path && !paths.includes(ctx.path)) ||
      (strict && !(ctx.path && strict.includes(ctx.path))) ||
      (cas && !(ctx.ca && cas.includes(ctx.ca)));
    if (drop) el.remove();
  });
  renumberLists(root);
}

/**
 * A gated block inside an ordered list splits it into several <ol start=N>. When the block was dropped, the
 * lists on either side are neighbours: make the later one continue the earlier one's numbering.
 */
function renumberLists(root: ParentNode) {
  root.querySelectorAll<HTMLOListElement>('ol[start]').forEach((ol) => {
    const prev = ol.previousElementSibling;
    if (prev instanceof HTMLOListElement) ol.start = prev.start + prev.children.length;
  });
}

/** Wrap every <pre> in `.codeblock` with a copy button; remember {{templates}}. */
export function prepareCodeBlocks(root: ParentNode) {
  root.querySelectorAll('pre').forEach((pre) => {
    if (pre.parentElement?.classList.contains('codeblock')) return;
    const text = pre.textContent ?? '';
    if (text.includes('{{')) {
      pre.dataset.template = text;
      if (!pre.dataset.format) {
        pre.dataset.format = pre.querySelector('code.language-json') ? 'json' : 'text';
      }
    }
    const wrap = document.createElement('div');
    wrap.className = 'codeblock';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code to clipboard');

    const fig = pre.closest('figure.snippet');
    const cap = fig?.querySelector('figcaption');
    if (cap) {
      let actions = cap.querySelector<HTMLElement>('.snippet-header-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'snippet-header-actions';
        const lang = cap.querySelector('.snippet-lang');
        if (lang) {
          lang.replaceWith(actions);
          actions.append(lang);
        } else {
          cap.append(actions);
        }
      }
      actions.append(btn);
      pre.replaceWith(wrap);
      wrap.append(pre);
    } else {
      const header = document.createElement('div');
      header.className = 'codeblock-header';
      const code = pre.querySelector('code');
      const langMatch = code?.className.match(/language-(\w+)/);
      if (langMatch) {
        const langSpan = document.createElement('span');
        langSpan.className = 'snippet-lang';
        langSpan.textContent = langMatch[1].toUpperCase();
        header.append(langSpan);
      }
      header.append(btn);
      pre.replaceWith(wrap);
      wrap.append(header, pre);
    }
  });
  // Inline code with a {{variable}} is filled too.
  root.querySelectorAll('code').forEach((code) => {
    if (code.closest('pre') || code.dataset.template) return;
    const text = code.textContent ?? '';
    if (text.includes('{{')) code.dataset.template = text;
  });
}

/** A clickable, keyboard-focusable value inside a code block (textContent stays plain). */
function varSpan(kind: 'placeholder' | 'filled', key: string, via: string | undefined, text: string, label: string) {
  const span = document.createElement('span');
  span.className = `${kind} var`;
  span.dataset.var = key;
  if (via) span.dataset.via = via;
  span.setAttribute('role', 'button');
  span.tabIndex = 0;
  span.setAttribute('aria-label', label);
  span.textContent = text;
  return span;
}

const CONSOLE_HOST = 'console.cloud.google.com';

/**
 * Google Cloud console links: any link to console.cloud.google.com (or with data-console-href)
 * opens in a new tab and gets `?project=<project_id>` appended once the scratchpad has one.
 */
export function prepareConsoleLinks(root: ParentNode) {
  root.querySelectorAll<HTMLAnchorElement>('a[href], a[data-console-href]').forEach((a) => {
    if (a.dataset.consoleHref) return;
    const href = a.getAttribute('href') ?? '';
    try {
      if (new URL(href).hostname !== CONSOLE_HOST) return;
    } catch {
      return;
    }
    a.dataset.consoleHref = href;
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

function fillConsoleLinks(root: ParentNode, values: Values) {
  const project = (values.project_id ?? '').trim();
  root.querySelectorAll<HTMLAnchorElement>('a[data-console-href]').forEach((a) => {
    // A templated link ({{vars}} in the URL) is filled from the values; any unset variable selects the fallback.
    const template = a.dataset.consoleTemplate;
    let target = a.dataset.consoleHref ?? '';
    if (template) {
      const segs = segments(template, values, 'url');
      if (!segs.some((s) => 'ph' in s)) target = segs.map((s) => ('text' in s ? s.text : '')).join('');
    }
    const url = new URL(target);
    // Project creation has no project yet; adding one would be meaningless.
    if (project && !url.pathname.startsWith('/projectcreate')) url.searchParams.set('project', project);
    else url.searchParams.delete('project');
    a.href = url.toString();
  });
}

/** Re-render every templated element from the scratchpad values. */
export function fill(root: ParentNode, values: Values) {
  root.querySelectorAll<HTMLElement>('[data-template]').forEach((el) => {
    const format = (el.dataset.format as Format | undefined) ?? 'text';
    const segs = segments(el.dataset.template ?? '', values, format);
    const frag = document.createDocumentFragment();
    let unfilled = 0;
    for (const s of segs) {
      if ('ph' in s) {
        unfilled++;
        frag.append(varSpan('placeholder', s.ph, s.via, placeholderText(s.ph), `Set ${s.ph.toUpperCase()}`));
      } else if (s.key) {
        frag.append(varSpan('filled', s.key, s.via, s.text, `Edit ${s.key.toUpperCase()}`));
      } else {
        frag.append(document.createTextNode(s.text));
      }
    }
    const target = el.tagName === 'PRE' ? (el.querySelector('code') ?? el) : el;
    target.replaceChildren(frag);
    el.closest('figure.snippet')?.querySelector<HTMLElement>('.snippet-warning')?.toggleAttribute('hidden', unfilled === 0);
  });
  fillConsoleLinks(root, values);
}

let tabCounter = 0;

export function initTabs(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-tabs]:not([data-tabs-ready])').forEach((tabs) => {
    tabs.dataset.tabsReady = '';
    const panels = Array.from(tabs.querySelectorAll<HTMLElement>(':scope > [data-tab]'));
    if (panels.length === 0) return;
    const id = `tabs-${++tabCounter}`;
    const bar = document.createElement('div');
    bar.className = 'tab-list';
    bar.setAttribute('role', 'tablist');
    const buttons = panels.map((panel, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tab';
      b.id = `${id}-t${i}`;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', `${id}-p${i}`);
      b.textContent = panel.dataset.tab ?? `Tab ${i + 1}`;
      panel.id = `${id}-p${i}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', b.id);
      bar.append(b);
      return b;
    });
    const select = (n: number) => {
      buttons.forEach((b, i) => {
        b.setAttribute('aria-selected', String(i === n));
        b.tabIndex = i === n ? 0 : -1;
      });
      panels.forEach((p, i) => p.toggleAttribute('hidden', i !== n));
    };
    buttons.forEach((b, i) => b.addEventListener('click', () => select(i)));
    bar.addEventListener('keydown', (e) => {
      const cur = buttons.findIndex((b) => b === document.activeElement);
      if (cur < 0 || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
      const n = (cur + (e.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length;
      select(n);
      buttons[n].focus();
    });
    tabs.prepend(bar);
    select(0);
  });
}

/** Group "How to know it's working" sections into a dedicated callout card for styling. */
export function decorateCheckBlocks(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('h2[id^="how-to-know-its-working"]').forEach((h2) => {
    if (h2.parentElement?.classList.contains('step-check-block')) return;
    const block = document.createElement('section');
    block.className = 'step-check-block';
    block.setAttribute('aria-label', "How to know it's working");
    h2.replaceWith(block);
    block.append(h2);
    let next = block.nextSibling;
    while (next) {
      if (
        next instanceof HTMLElement &&
        (next.tagName === 'H2' || next.id === 'handoff' || next.classList.contains('official-links'))
      ) {
        break;
      }
      const toMove = next;
      next = next.nextSibling;
      block.append(toMove);
    }
  });
}

/** Run once per page build/rebuild of a content region. */
export function enhance(root: ParentNode, ctx: GateCtx, values: Values) {
  gate(root, ctx);
  prepareCodeBlocks(root);
  initTabs(root);
  mountInlineFields(root, values, ctx.path);
  prepareConsoleLinks(root);
  decorateCheckBlocks(root);
  fill(root, values);
}

// ---- Global, delegated handlers (installed once) -------------------------

export function download(filename: string, text: string, mime: string) {
  // new Blob([string]) encodes as UTF-8 and never adds a BOM.
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to the legacy path */
    }
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.append(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

let installed = false;
export function installGlobalHandlers() {
  if (installed) return;
  installed = true;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openHelps = document.querySelectorAll('.sp-help-wrap.is-open');
      if (openHelps.length > 0) {
        openHelps.forEach((w) => w.classList.remove('is-open'));
        return;
      }
    }
    const t = e.target as Element | null;
    if ((e.key === 'Enter' || e.key === ' ') && isVar(t ?? null)) {
      e.preventDefault();
      openEditor(t as HTMLElement);
    }
  });
  document.addEventListener('click', async (e) => {
    const target = e.target as Element | null;
    if (!target) return;

    const helpBtn = target.closest<HTMLButtonElement>('.sp-help-btn');
    if (helpBtn) {
      e.preventDefault();
      e.stopPropagation();
      const wrap = helpBtn.closest<HTMLElement>('.sp-help-wrap');
      wrap?.classList.toggle('is-open');
      document.querySelectorAll('.sp-help-wrap.is-open').forEach((w) => {
        if (w !== wrap) w.classList.remove('is-open');
      });
      return;
    }

    if (!target.closest('.sp-help-wrap')) {
      document.querySelectorAll('.sp-help-wrap.is-open').forEach((w) => w.classList.remove('is-open'));
    }

    const varEl = target.closest('.var');
    if (isVar(varEl)) {
      openEditor(varEl);
      return;
    }

    const copyBtn = target.closest<HTMLButtonElement>('.copy-btn');
    if (copyBtn) {
      const pre =
        copyBtn.closest('figure')?.querySelector('pre') ??
        copyBtn.closest('.codeblock')?.querySelector('pre') ??
        copyBtn.parentElement?.querySelector('pre');
      const ok = await copyText(pre?.textContent ?? '');
      copyBtn.textContent = ok ? 'Copied' : 'Copy failed';
      copyBtn.classList.toggle('copied', ok);
      copyBtn.classList.toggle('failed', !ok);
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.classList.remove('copied', 'failed');
      }, 1500);
      return;
    }

    const dl = target.closest<HTMLElement>('[data-download]');
    if (dl) {
      const pre = dl.closest('figure')?.querySelector('pre');
      download(dl.dataset.download ?? 'download.txt', pre?.textContent ?? '', 'application/json');
      return;
    }
  });
}

// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import snippetFences from './src/plugins/remark-snippets.mjs';
import { BASE, SITE } from './src/data/deploy.mjs';

export default defineConfig({
  output: 'static',
  site: SITE,
  base: BASE,
  // Cards won: the card view lives at /troubleshooting/, the old /cards URL redirects there.
  redirects: {
    '/troubleshooting/cards': `${BASE}/troubleshooting/`,
  },
  markdown: {
    // Code blocks are enhanced client-side (copy button, live {{variable}} fill),
    // so we keep the markup plain instead of pre-highlighting.
    syntaxHighlight: false,
    processor: satteri({ mdastPlugins: [snippetFences] }),
  },
});

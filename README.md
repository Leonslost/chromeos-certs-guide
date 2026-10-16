# ChromeOS client certificates guide

An interactive, step-by-step guide to getting client certificates onto managed ChromeOS devices: choosing a CA →
SCEP / DIY / vendor path → Google Cloud Pub/Sub → Google Admin console → Google Cloud Certificate Connector (GCCC).
You answer a couple of questions and the guide shows only the steps that apply to you, with commands and config
snippets filled in from the values you enter. A troubleshooting section covers failure modes reproduced on the
author's test bench.

> **This is a community guide, not official Google documentation.** Google's documentation is authoritative; each
> step links to the relevant official pages. If this guide and Google's documentation disagree, trust Google's.

**Live site:** <https://leonslost.github.io/chromeos-certs-guide/>

## Found a problem?

Please [open an issue](https://github.com/Leonslost/chromeos-certs-guide/issues/new/choose). Every step and
troubleshooting card also has a "Report a problem" link that pre-fills the form. Do not paste secrets (private keys,
`service_account.json`, passwords, tokens) into issues.

For official support, use [Google's documentation and support channels](https://support.google.com/chrome/a/answer/11053129).

## Development

The site is static (Astro 7, TypeScript, Node 24).

```sh
npm ci           # or npm install
npm run dev      # local dev server
npm run build    # static output in dist/
npm run check    # astro check (types + content schema)
```

The site is served under the `/chromeos-certs-guide` base path (set in `src/data/deploy.mjs`). Use the `withBase()`
helper in `src/lib/url.ts` for internal links; root-relative links in Markdown are prefixed automatically.
Pushes to `main` are built and deployed to GitHub Pages by `.github/workflows/deploy.yml`.

**Stale content in dev?** Astro caches rendered Markdown in `.astro/`, and it does not notice changes to the
Markdown plugin (`src/plugins/remark-snippets.mjs`). After editing the plugin, stop the dev server, run
`rm -rf .astro node_modules/.astro node_modules/.vite`, and start it again. `npm run build` is not affected.

## Architecture

Logic, content and snippets are kept apart. **Flow data** (the Step 1 / Step 2 decision nodes, the `PATH` each
option sets, and which steps each `PATH` sees) lives in `src/data/flow.ts`; the scratchpad fields and derived
values live in `src/data/scratchpad.ts`; troubleshooting decision trees live in `src/data/troubleshooting.ts`
and feed both the flowchart and the card view. **Content** is Markdown with front-matter (`title`, `order`,
`paths`, `officialLinks`): one file per step in `src/content/steps/` and per
troubleshooting card in `src/content/troubleshooting/` (schema in `src/content.config.ts`; the build fails if a
step's `paths` disagree with `flow.ts`). **Snippet templates** (gcloud, PowerShell, `adapter_config.json`)
are plain files in `src/snippets/` registered in `src/snippets/index.json`, with `{{variable}}` placeholders;
Markdown pulls them in with a ` ```snippet ` fence containing the snippet id, and ordinary code fences may use
`{{variable}}` too. Two more fences: ` ```field ` (variable names, renders inline scratchpad inputs) and ` ```choice `
(where the wizard places that step's question, so explanations can come first). Placeholders and filled values in code
blocks are click-to-edit. The footer's "Last updated / Tested with GCCC" line comes from `src/data/site.ts`. Client-side code is vanilla TypeScript with no runtime dependencies: `src/scripts/wizard.ts`
(the one-page flow, state in `localStorage`), `src/scripts/scratchpad-ui.ts`, and `src/lib/enhance.ts` (the single
implementation of copy buttons, live placeholder fill, tabs and downloads for every code block). Steps are
rendered into inert `<template>`s at build time and only the steps in the user's `PATH` are cloned into the page.
Gating attributes in content: `data-paths`, `data-paths-strict`, `data-ca`.

## Licence

[MIT](./LICENSE) © 2026 Leon Pritchard

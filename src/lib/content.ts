/** Build-time content loading + consistency checks (flow data vs. front-matter). */
import { getCollection, render } from 'astro:content';
import { PATHS, pathSteps } from '../data/flow';

export async function loadSteps() {
  const entries = (await getCollection('steps')).sort((a, b) => a.data.order - b.data.order);

  // flow.ts is the source of truth for which steps a PATH sees; front-matter `paths` must agree.
  for (const path of PATHS) {
    const fromFlow = pathSteps[path];
    const fromContent = entries.filter((e) => e.data.paths.includes(path)).map((e) => e.id);
    if (fromFlow.join() !== fromContent.join()) {
      throw new Error(
        `PATH ${path}: flow.ts says [${fromFlow}] but step front-matter says [${fromContent}]. Keep them in sync.`,
      );
    }
  }
  return Promise.all(entries.map(async (entry) => ({ entry, ...(await render(entry)) })));
}

export async function loadCards() {
  const entries = (await getCollection('troubleshooting')).sort((a, b) => a.data.order - b.data.order);
  return Promise.all(entries.map(async (entry) => ({ entry, ...(await render(entry)) })));
}

/** Build-time content loading + consistency checks (flow data vs. front-matter). */
import { getCollection, render } from 'astro:content';
import { PATHS, pathSteps, stepWhen } from '../data/flow';
import issueForm from '../../.github/ISSUE_TEMPLATE/step-problem.yml?raw';
import { reportOptions } from './report';

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

  // Answer-gated steps: flow.ts and the step's `when` front-matter must agree.
  for (const e of entries) {
    if ((stepWhen[e.id] ?? undefined) !== e.data.when) {
      throw new Error(`Step ${e.id}: flow.ts stepWhen is "${stepWhen[e.id]}" but front-matter when is "${e.data.when}". Keep them in sync.`);
    }
  }

  // The "Report a problem" links preselect a dropdown option by label: every step title must be an option.
  const form = issueForm;
  for (const option of reportOptions(entries.map((e) => e.data.title))) {
    if (!form.includes(`- "${option}"`) && !form.includes(`- ${option}\n`)) {
      throw new Error(`Issue form step-problem.yml has no dropdown option "${option}" (needed by the report links).`);
    }
  }
  return Promise.all(entries.map(async (entry) => ({ entry, ...(await render(entry)) })));
}

export async function loadCards() {
  const entries = (await getCollection('troubleshooting')).sort((a, b) => a.data.order - b.data.order);
  return Promise.all(entries.map(async (entry) => ({ entry, ...(await render(entry)) })));
}

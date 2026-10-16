/**
 * Flow data: the decision nodes for Step 1 (CA choice) and Step 2 (SCEP server),
 * the PATH each answer sets, and which steps each PATH sees.
 *
 * This file is the single source of truth for the wizard logic. It contains no
 * prose beyond question/option labels; the explanatory text lives in
 * `src/content/steps/*.md`.
 */

export const PATHS = ['SCEP', 'DIY', 'VENDOR'] as const;
export type PathId = (typeof PATHS)[number];

/** Step ids = content collection ids (file names in src/content/steps). */
export const STEP = {
  ca: '1-ca-choice',
  scep: '2-scep-server',
  ndes: '2b-ndes',
  pubsub: '3-pubsub',
  console: '4-admin-console',
  gccc: '5-gccc',
} as const;

/** Every step a PATH can see, in order (steps listed in `stepWhen` are further limited by an answer). */
export const pathSteps: Record<PathId, string[]> = {
  VENDOR: [STEP.ca, STEP.pubsub],
  SCEP: [STEP.ca, STEP.scep, STEP.ndes, STEP.pubsub, STEP.console, STEP.gccc],
  DIY: [STEP.ca, STEP.scep, STEP.pubsub, STEP.console],
};

/** Steps shown only when an answer was given: step id → "<node id>:<option id>". Mirrored by the step's `when` front-matter. */
export const stepWhen: Record<string, string> = {
  [STEP.ndes]: 'adcs-scep-product:ndes',
};

/** True when `answer` ("<node id>:<option id>") is among the given answers. */
export const hasAnswer = (answers: Record<string, string>, answer: string) => {
  const [node, option] = answer.split(':');
  return answers[node] === option;
};

export const pathInfo: Record<PathId, { label: string; summary: string }> = {
  SCEP: { label: 'SCEP', summary: 'A SCEP server through the Google Cloud Certificate Connector (GCCC)' },
  DIY: { label: 'DIY', summary: 'Your own adapter on the Certificate Provisioning API' },
  VENDOR: { label: 'VENDOR', summary: 'A PKI vendor with native Certificate Provisioning API support' },
};

/** What follows the last step of each PATH (nav entry after the steps). */
export const handoff: Record<PathId, { label: string; anchor?: string; href?: string }> = {
  VENDOR: { label: 'Hand-off: vendor docs', anchor: '#handoff' },
  DIY: { label: 'Hand-off: API docs + example', anchor: '#handoff' },
  SCEP: { label: 'Troubleshooting', href: 'troubleshooting/' },
};

/** Paths for which GCCC-specific troubleshooting is shown. */
export const gcccPaths: PathId[] = ['SCEP'];

export interface FlowOption {
  id: string;
  label: string;
  detail?: string;
  /** Terminal option: sets PATH. */
  setsPath?: PathId;
  /** Non-terminal option: id of the next node. */
  next?: string;
  /** If an earlier answer matches, continue at `next` instead of ending here (the option's `setsPath` still applies otherwise). */
  branch?: { node: string; option: string; next: string };
  links?: { label: string; url: string }[];
}

export interface FlowNode {
  id: string;
  /** Step (content id) this question is rendered in. */
  step: string;
  prompt: string;
  options: FlowOption[];
}

export const entryNode = 'ca';

export const nodes: Record<string, FlowNode> = {
  // ---- Step 1 ----------------------------------------------------------
  // Option ids (A-D) are internal: content gates on them (data-ca) but labels never show them.
  ca: {
    id: 'ca',
    step: STEP.ca,
    prompt: 'Which certificate authority (CA) do you use?',
    options: [
      { id: 'A', label: 'Microsoft AD CS (on-premises)', next: 'scep-adcs' },
      { id: 'B', label: 'Microsoft Intune Cloud PKI', next: 'scep-intune' },
      { id: 'C', label: 'Other PKI or cloud CA', detail: 'No native ChromeOS integration.', next: 'scep-other' },
      {
        id: 'D',
        label: 'PKI with native Certificate Provisioning API support',
        detail: 'Known today: SecureW2.',
        setsPath: 'VENDOR',
      },
    ],
  },

  // ---- Step 2, question 1: one per CA (same pattern, different wording / follow-up) ----
  'scep-adcs': {
    id: 'scep-adcs',
    step: STEP.scep,
    prompt: 'Do you already have a SCEP server?',
    options: [
      { id: 'yes', label: 'Yes, I already have a SCEP server', setsPath: 'SCEP' },
      { id: 'no', label: 'No, I need one', next: 'scep-or-diy' },
    ],
  },
  'scep-intune': {
    id: 'scep-intune',
    step: STEP.scep,
    prompt: "Do you already have a SCEP server other than Intune Cloud PKI's?",
    options: [
      { id: 'yes', label: 'Yes, I already have another SCEP server', setsPath: 'SCEP' },
      { id: 'no', label: 'No', next: 'scep-or-diy' },
    ],
  },
  'scep-other': {
    id: 'scep-other',
    step: STEP.scep,
    prompt: 'Do you already have a SCEP server?',
    options: [
      { id: 'yes', label: 'Yes, I already have a SCEP server', setsPath: 'SCEP' },
      { id: 'no', label: 'No', next: 'scep-or-diy' },
    ],
  },

  // ---- Step 2, question 2: shared by Intune and Other PKI ----
  'scep-or-diy': {
    id: 'scep-or-diy',
    step: STEP.scep,
    prompt: 'Use an existing SCEP product, or build your own adapter?',
    options: [
      // AD CS customers get one more question: NDES (walked through in its own step) or another product.
      { id: 'scep', label: 'A SCEP solution', setsPath: 'SCEP', branch: { node: 'ca', option: 'A', next: 'adcs-scep-product' } },
      { id: 'diy', label: 'Build my own adapter on the Certificate Provisioning API', setsPath: 'DIY' },
    ],
  },

  // ---- Step 2, question 3: AD CS only ----
  'adcs-scep-product': {
    id: 'adcs-scep-product',
    step: STEP.scep,
    prompt: 'Which SCEP server will you use?',
    options: [
      { id: 'ndes', label: 'Set up Microsoft NDES (recommended)', setsPath: 'SCEP' },
      { id: 'other', label: 'Another SCEP product', setsPath: 'SCEP' },
    ],
  },
};

// ---- Resolution --------------------------------------------------------

export type Answers = Record<string, string>;

export interface Resolved {
  /** Questions to show, in order: every answered node plus the first unanswered one. */
  chain: FlowNode[];
  /** Answers that are still valid (stale ones are pruned). */
  answers: Answers;
  /** Known once a terminal option was chosen. */
  path?: PathId;
  /** Step ids visible right now. */
  steps: string[];
}

/** Walk the flow from the entry node; prune answers that no longer belong to the chain. */
export function resolveFlow(raw: Answers): Resolved {
  const chain: FlowNode[] = [];
  const answers: Answers = {};
  let path: PathId | undefined;
  let node: FlowNode | undefined = nodes[entryNode];

  while (node) {
    const current: FlowNode = node;
    chain.push(current);
    const option: FlowOption | undefined = current.options.find((o) => o.id === raw[current.id]);
    if (!option) break; // unanswered (or stale answer): stop here
    answers[current.id] = option.id;
    const b = option.branch;
    if (b && answers[b.node] === b.option) {
      node = nodes[b.next];
      continue;
    }
    if (option.setsPath) {
      path = option.setsPath;
      break;
    }
    node = option.next ? nodes[option.next] : undefined;
  }

  let steps: string[];
  if (path) {
    steps = pathSteps[path].filter((id) => !stepWhen[id] || hasAnswer(answers, stepWhen[id]));
  } else {
    // Path not known yet: Step 1, plus Step 2 once a Step 1 answer led to a Step 2 question.
    const steps2 = chain.some((n) => n.step === STEP.scep);
    steps = steps2 ? [STEP.ca, STEP.scep] : [STEP.ca];
  }
  return { chain, answers, path, steps };
}

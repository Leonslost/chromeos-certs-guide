/**
 * "Report a problem" links. They open the `step-problem.yml` issue form and pre-select its `step`
 * dropdown through the `?step=<option label>` query param. The labels built here MUST match the
 * dropdown options in .github/ISSUE_TEMPLATE/step-problem.yml (otherwise GitHub just ignores the preselection).
 */
import { site } from '../data/site';

export const TROUBLESHOOTING_OPTION = 'Troubleshooting';

export function stepOption(order: number, title: string): string {
  return `Step ${order}: ${title}`;
}

export function reportUrl(opts: { option: string; titlePrefix: string }): string {
  const q = new URLSearchParams({
    template: 'step-problem.yml',
    title: opts.titlePrefix,
    step: opts.option,
    labels: 'content',
  });
  return `${site.repo}/issues/new?${q.toString().replace(/\+/g, '%20')}`;
}

export const stepReportUrl = (order: number, title: string) =>
  reportUrl({ option: stepOption(order, title), titlePrefix: `[Step ${order}] ${title}: ` });

export const cardReportUrl = (title: string) =>
  reportUrl({ option: TROUBLESHOOTING_OPTION, titlePrefix: `[Troubleshooting] ${title}: ` });

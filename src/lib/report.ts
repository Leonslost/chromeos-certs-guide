/**
 * "Report a problem" links. They open the `step-problem.yml` issue form and pre-select its `step`
 * dropdown through the `?step=<option label>` query param. The labels built here MUST match the
 * dropdown options in .github/ISSUE_TEMPLATE/step-problem.yml (otherwise GitHub just ignores the preselection).
 */
import { site } from '../data/site';

export const TROUBLESHOOTING_OPTION = 'Troubleshooting';

/** Step numbers depend on the user's path, so the dropdown options are the plain step titles. */
export const stepOption = (title: string) => title;
export const reportOptions = (stepTitles: string[]) => [...stepTitles.map(stepOption), TROUBLESHOOTING_OPTION];

export function reportUrl(opts: { option: string; titlePrefix: string }): string {
  const q = new URLSearchParams({
    template: 'step-problem.yml',
    title: opts.titlePrefix,
    step: opts.option,
    labels: 'content',
  });
  return `${site.repo}/issues/new?${q.toString().replace(/\+/g, '%20')}`;
}

export const stepReportUrl = (title: string) => reportUrl({ option: stepOption(title), titlePrefix: `[${title}] ` });

export const cardReportUrl = (title: string) =>
  reportUrl({ option: TROUBLESHOOTING_OPTION, titlePrefix: `[Troubleshooting] ${title}: ` });

/** Export the user's answers and scratchpad values as Markdown. Never includes secrets (none are collected). */
import { pathInfo, type Resolved } from '../data/flow';
import { DERIVED, fieldsForPath } from '../data/scratchpad';
import type { State } from './state';
import { defaultFor, resolveValue } from './template';

export function exportMarkdown(state: State, resolved: Resolved, stepTitles: Record<string, string>): string {
  const lines: string[] = ['# ChromeOS client certificate provisioning: my answers', ''];
  lines.push(`Exported ${new Date().toISOString().slice(0, 10)}. Community guide, not official Google documentation.`, '');
  lines.push('## Answers', '');
  for (const node of resolved.chain) {
    const opt = node.options.find((o) => o.id === state.answers[node.id]);
    if (opt) lines.push(`- **${node.prompt}** ${opt.label}`);
  }
  lines.push(`- **PATH:** ${resolved.path ? `${resolved.path} (${pathInfo[resolved.path].summary})` : 'not decided yet'}`, '');
  if (resolved.path) {
    lines.push('## Steps for this path', '');
    resolved.steps.forEach((id, i) => lines.push(`${i + 1}. ${stepTitles[id] ?? id}`));
    lines.push('');
    lines.push('## Values', '', '| Variable | Value |', '| --- | --- |');
    const unset = '_not set_';
    for (const f of fieldsForPath(resolved.path, resolved.answers)) {
      const explicit = state.values[f.key]?.trim();
      const dflt = explicit ? undefined : defaultFor(f.key, state.values);
      lines.push(`| \`${f.key}\` | ${explicit ? `\`${explicit}\`` : dflt ? `\`${dflt}\` (default)` : unset} |`);
      if (f.key === 'connector_sa_name') {
        for (const key of Object.keys(DERIVED)) {
          const v = resolveValue(key, state.values);
          lines.push(`| \`${key}\` | ${v ? `\`${v}\`` : unset} |`);
        }
      }
    }
    lines.push('');
  }
  lines.push('No secrets are stored or exported: the SCEP challenge and service account key stay on the server.', '');
  return lines.join('\n');
}

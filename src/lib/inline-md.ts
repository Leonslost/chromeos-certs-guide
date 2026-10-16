/** Tiny inline formatter for data strings: `code`, **bold**, [text](url), [text](#anchor). Everything else is escaped. */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function inlineMd(src: string): string {
  return esc(src)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>')
    .replace(/\[([^\]]+)\]\((#[\w-]+)\)/g, '<a href="$2">$1</a>');
}

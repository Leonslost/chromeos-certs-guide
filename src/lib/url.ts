/** Prefix a site-internal path with the deploy base. `withBase('troubleshooting/')` and `withBase('/troubleshooting/')` both work. */
const root = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function withBase(path = ''): string {
  const p = path.replace(/^\/+/, '');
  return `${root}/${p}`;
}

// Expands <lim-pic name="LIM-UI-..." alt="..." sizes="..." [eager] /> in page.src.html into
// responsive <picture> markup and writes ../lockedinmissions/index.html.  npm run page
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = await readFile(path.join(here, 'page.src.html'), 'utf8');

const base = 'assets/lockedin/ui';
const set = (name, ext) => `${base}/${name}-360.${ext} 360w, ${base}/${name}-720.${ext} 720w`;

const html = src.replace(/<lim-pic\s+([^>]*?)\/>/g, (_, attrString) => {
  const attrs = {};
  for (const match of attrString.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[match[1]] = match[2] ?? true;
  const { name, alt = '', sizes = '340px', eager } = attrs;
  const loading = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<picture>
  <source type="image/avif" srcset="${set(name, 'avif')}" sizes="${sizes}" />
  <source type="image/webp" srcset="${set(name, 'webp')}" sizes="${sizes}" />
  <img src="${base}/${name}-720.webp" alt="${alt}" width="720" height="1558" ${loading} decoding="async" />
</picture>`;
});

await writeFile(path.join(here, '../lockedinmissions/index.html'), html);
console.log('index.html written,', html.length, 'bytes');

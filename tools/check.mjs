// Lists [[links]] that don't point at any note, and notes nothing links to.
//   node tools/check.mjs
import { loadConfig, readNotes, slug } from './lib.mjs';

loadConfig();
const notes = readNotes({ withGit: false });
const key = new Map();
const add = (k, n) => { const s = slug(k); if (s && !key.has(s)) key.set(s, n); };
for (const n of notes) {
  const body = n.raw.replace(/^\uFEFF?---[\s\S]*?\n---\s*/, '');
  n.title = n.fields.title || (body.match(/^#\s+(.+)$/m) || [])[1] || n.path.split('/').pop().replace(/\.(md|markdown)$/i, '');
  n.body = body; n.inbound = 0;
  if (n.fields.id) key.set(n.fields.id.toLowerCase(), n);
}
for (const n of notes) add(n.title, n);
for (const n of notes) {
  add(n.path.split('/').pop().replace(/\.(md|markdown)$/i, ''), n);
  const al = (n.raw.match(/^aliases?\s*:\s*\[(.*)\]\s*$/mi) || [])[1];
  if (al) al.split(',').map(a => a.trim().replace(/^['"]|['"]$/g, '')).forEach(a => add(a, n));
}
let broken = 0;
for (const n of notes) {
  const text = n.body.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g, '');
  const misses = [];
  for (const m of text.matchAll(/!?\[\[([^\[\]\n]+?)\]\]/g)) {
    const target = m[1].replace(/\\\|/g, '|').split('|')[0].split('#')[0].trim();
    if (!target || /\.(png|jpe?g|gif|svg|webp|avif|bmp|pdf)$/i.test(target)) continue;
    const hit = key.get(target.toLowerCase()) || key.get(slug(target));
    if (hit) { if (hit !== n) hit.inbound++; } else misses.push(target);
  }
  if (misses.length) { broken += misses.length; console.log(`${n.path}\n  not yet written: ${[...new Set(misses)].join(', ')}`); }
}
const orphans = notes.filter(n => !n.inbound);
console.log(`\n${notes.length} notes, ${broken} link${broken === 1 ? '' : 's'} to notes that don't exist yet, ${orphans.length} note${orphans.length === 1 ? '' : 's'} nothing links to.`);
if (orphans.length && orphans.length <= 40) console.log('Not linked from anywhere: ' + orphans.map(n => n.title).join('; '));

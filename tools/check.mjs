// Lists [[links]] that don't point at any note, and notes nothing links to.
// Also reports problems that quietly degrade a note: front matter that isn't valid YAML,
// duplicate addresses, titles shared by two notes (so [[Title]] is ambiguous), notes with
// identical text, and embedded images that aren't in the repository.
//   node tools/check.mjs            report
//   node tools/check.mjs --github   also write the report to the GitHub Actions run summary
import fs from 'node:fs';
import crypto from 'node:crypto';
import { loadConfig, readNotes, slug, walk, ROOT, MEDIA_EXT, rel } from './lib.mjs';
import path from 'node:path';

loadConfig();
const notes = readNotes({ withGit: false });
const key = new Map();
const add = (k, n) => { const s = slug(k); if (s && !key.has(s)) key.set(s, n); };
for (const n of notes) {
  const body = n.raw.replace(/^﻿?---[\s\S]*?\n---\s*/, '');
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
let broken = 0; const brokenList = [];
for (const n of notes) {
  const text = n.body.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g, '');
  const misses = [];
  for (const m of text.matchAll(/!?\[\[([^\[\]\n]+?)\]\]/g)) {
    const target = m[1].replace(/\\\|/g, '|').split('|')[0].split('#')[0].trim();
    if (!target || /\.(png|jpe?g|gif|svg|webp|avif|bmp|pdf)$/i.test(target)) continue;
    const hit = key.get(target.toLowerCase()) || key.get(slug(target));
    if (hit) { if (hit !== n) hit.inbound++; } else misses.push(target);
  }
  if (misses.length) { broken += misses.length; brokenList.push([n.path, [...new Set(misses)]]); console.log(`${n.path}\n  not yet written: ${[...new Set(misses)].join(', ')}`); }
}
const orphans = notes.filter(n => !n.inbound);
console.log(`\n${notes.length} notes, ${broken} link${broken === 1 ? '' : 's'} to notes that don't exist yet, ${orphans.length} note${orphans.length === 1 ? '' : 's'} nothing links to.`);
if (orphans.length && orphans.length <= 40) console.log('Not linked from anywhere: ' + orphans.map(n => n.title).join('; '));

/* ---- problems that make a note display wrongly ---- */
const problems = [];   // [path, message]
for (const n of notes) {
  if (!/^﻿?---[ \t]*\r?\n/.test(n.raw)) continue;
  const fm = n.raw.match(/^﻿?---[ \t]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/);
  if (!fm) { problems.push([n.path, 'front matter starts with --- but is never closed with ---']); continue; }
  const seen = new Set();
  fm[1].split(/\r?\n/).forEach((line, i) => {
    if (/^\t/.test(line)) problems.push([n.path, `front matter line ${i + 2} is indented with a tab; YAML needs spaces`]);
    const k = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/); if (!k) return;
    if (seen.has(k[1].toLowerCase())) problems.push([n.path, `front matter has two "${k[1]}:" lines`]);
    seen.add(k[1].toLowerCase());
    const v = k[2].trim();
    const q = v.match(/^(["'])((?:\\.|(?!\1).)*)\1\s*(.*)$/);
    if (q && q[3] && !q[3].startsWith('#')) problems.push([n.path, `"${k[1]}:" starts with a quote but carries on after it closes; put the whole value in single quotes`]);
  });
}
const group = (items, keyOf) => { const m = new Map(); for (const it of items) { const k = keyOf(it); if (!k) continue; if (!m.has(k)) m.set(k, []); m.get(k).push(it); } return [...m.values()].filter(g => g.length > 1); };
for (const g of group(notes, n => (n.fields.id || '').toUpperCase())) problems.push([g[0].path, `address ${g[0].fields.id} is used by ${g.length} notes: ${g.map(n => n.path).join(', ')}`]);
for (const g of group(notes, n => slug(n.title))) problems.push([g[0].path, `${g.length} notes are titled "${g[0].title}", so [[${g[0].title}]] only reaches one of them: ${g.map(n => n.path).join(', ')}`]);
// compared without their "Related" lists, which for two copies of a note usually point at each other
for (const g of group(notes, n => { const b = n.body.replace(/\n#{2,3}\s+(Related|See also)\s*\n[\s\S]*$/i, '').replace(/\s+/g, ' ').trim(); return b.length > 40 ? crypto.createHash('sha1').update(b).digest('hex') : ''; }))
  problems.push([g[0].path, `${g.length} notes have the same text (apart from their Related lists), so one may be a duplicate: ${g.map(n => `${n.fields.id || ''} ${n.path}`.trim()).join(', ')}`]);
const media = new Set(walk(path.join(ROOT, 'notes')).filter(f => MEDIA_EXT.test(f)).map(f => rel(f).split('/').pop().toLowerCase()));
for (const n of notes) for (const m of n.body.matchAll(/!\[\[([^\]|#]+\.(?:png|jpe?g|gif|svg|webp|avif|bmp|pdf))/gi)) {
  if (!media.has(m[1].trim().split('/').pop().toLowerCase())) problems.push([n.path, `embeds ${m[1].trim()}, which isn't anywhere in notes/`]);
}
if (problems.length) {
  console.log(`\n${problems.length} problem${problems.length === 1 ? '' : 's'} to fix:`);
  for (const [p, msg] of problems) console.log(`  ${p}: ${msg}`);
} else console.log('\nNo front-matter, duplicate or image problems.');

if (process.argv.includes('--github')) {
  for (const [p, msg] of problems) console.log(`::warning file=${p},title=Note problem::${msg.replace(/\r?\n/g, ' ')}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const md = ['## Notebook check', '', `${notes.length} notes · ${broken} link${broken === 1 ? '' : 's'} to notes not yet written · ${orphans.length} not linked from anywhere`, ''];
    if (problems.length) md.push('### Problems to fix', '', ...problems.map(([p, msg]) => `- \`${p}\`: ${msg}`), '');
    if (brokenList.length) md.push('### Links to notes not yet written', '', ...brokenList.map(([p, t]) => `- \`${p}\`: ${t.map(x => `[[${x}]]`).join(', ')}`), '');
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md.join('\n') + '\n');
  }
}

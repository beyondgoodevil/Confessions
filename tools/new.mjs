// Create a note with its front matter filled in and the next free address.
//   node tools/new.mjs book "The Structure of Scientific Revolutions"
//   node tools/new.mjs podcast "Title"     node tools/new.mjs video "Title"
//   node tools/new.mjs lecture "Title"     node tools/new.mjs misc "Title"
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, collectNotes } from './build.mjs';

const [kindArg, ...titleParts] = process.argv.slice(2);
const title = titleParts.join(' ').trim();
if (!kindArg || !title) {
  console.log('Usage: node tools/new.mjs <book|podcast|video|lecture|misc> "Title of the note"');
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const slug = s => String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’`]/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
const k = slug(kindArg);
let sec = null, sub = null;
for (const s of cfg.sections) {
  if ([s.id || slug(s.name), slug(s.name), ...(s.aliases || []).map(slug)].includes(k)) { sec = s; break; }
  for (const u of s.subsections || []) if ([u.id || slug(u.name), slug(u.name), ...(u.aliases || []).map(slug)].includes(k)) { sec = s; sub = u; break; }
  if (sec) break;
}
if (!sec) { console.log(`"${kindArg}" isn't a section. Try one of: ${cfg.sections.flatMap(s => s.subsections?.length ? s.subsections.map(u => u.id) : [s.id]).join(', ')}`); process.exit(1); }
if (!sub && sec.subsections?.length) { console.log(`${sec.name} is split into ${sec.subsections.map(u => u.id).join(' / ')}; use one of those instead.`); process.exit(1); }

// Work out which addresses this section already uses, the same way the site does.
const folder = sec.folder || sec.id;
const idRe = new RegExp(`^id:\\s*${sec.prefix}-(\\d+)\\s*$`, 'mi');
const mine = collectNotes({ withGit: false }).notes.filter(n => n.path.split('/')[1] === folder);
const used = new Set(); let autos = 0;
for (const n of mine) { const m = n.raw.match(idRe); if (m) used.add(+m[1]); else autos++; }
for (let i = 1; autos > 0; i++) if (!used.has(i)) { used.add(i); autos--; }
const next = (used.size ? Math.max(...used) : 0) + 1;
const id = `${sec.prefix}-${String(next).padStart(4, '0')}`;

const today = new Date().toISOString().slice(0, 10);
const kind = (sub && (sub.kind || sub.id)) || sec.kind || sec.id;
const extra = {
  book: 'author: \nyear: \npublisher: \n',
  podcast: 'show: \nepisode: \nhost: \nguest: \nyear: \nurl: \n',
  video: 'creator: \nchannel: \nevent: \nyear: \nurl: \n',
  lecture: 'course: \nlecture: \nlecturer: \ninstitution: \nurl: \n'
}[kind] || '';
const dir = path.join(ROOT, 'notes', folder, ...(sub ? [sub.folder || sub.id] : []));
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, slug(title) + '.md');
if (fs.existsSync(file)) { console.log(`${path.relative(ROOT, file)} already exists.`); process.exit(1); }
fs.writeFileSync(file, `---
id: ${id}
title: ${JSON.stringify(title)}
${extra}date: ${today}
tags: []
summary: 
---

Write here. Link to other notes with [[Their title]] or [[${sec.prefix}-0001]].
`);
console.log(`Created ${path.relative(ROOT, file)} with address ${id}`);

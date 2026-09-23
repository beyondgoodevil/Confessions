// Create a note with its front matter filled in and the next free address.
//   node tools/new.mjs book "The Structure of Scientific Revolutions"
//   node tools/new.mjs podcast "Title"     node tools/new.mjs video "Title"
//   node tools/new.mjs lecture "Title"     node tools/new.mjs misc "Title"
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadConfig, sections, matchType, readNotes, planIds, slug, today } from './lib.mjs';

const [kindArg, ...titleParts] = process.argv.slice(2);
const title = titleParts.join(' ').trim();
if (!kindArg || !title) { console.log('Usage: node tools/new.mjs <book|podcast|video|lecture|misc> "Title of the note"'); process.exit(1); }
const cfg = loadConfig(); const secs = sections(cfg);
const hit = matchType(secs, kindArg);
if (!hit) { console.log(`"${kindArg}" isn't a section. Try one of: ${secs.flatMap(s => s.subsections.length ? s.subsections.map(u => u.id) : [s.id]).join(', ')}`); process.exit(1); }
const { sec, sub = null } = hit;
if (!sub && sec.subsections.length) { console.log(`${sec.name} is split into ${sec.subsections.map(u => u.id).join(' / ')}; use one of those instead.`); process.exit(1); }

const dir = path.join(ROOT, 'notes', sec.folder, ...(sub ? [sub.folder] : []));
const file = path.join(dir, slug(title) + '.md');
if (fs.existsSync(file)) { console.log(`${path.relative(ROOT, file)} already exists.`); process.exit(1); }
const relPath = path.relative(ROOT, file).split(path.sep).join('/');
const { plan } = planIds([...readNotes({ withGit: false }), { path: relPath, fields: { date: '9999-12-31' } }], cfg);
const id = plan.get(relPath);
const kind = (sub && (sub.kind || sub.id)) || sec.kind || sec.id;
const extra = {
  book: 'author: \nyear: \npublisher: \n',
  podcast: 'show: \nepisode: \nhost: \nguest: \nyear: \nurl: \n',
  video: 'creator: \nchannel: \nevent: \nyear: \nurl: \n',
  lecture: 'course: \nlecture: \nlecturer: \ninstitution: \nurl: \n'
}[kind] || '';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(file, `---\nid: ${id}\ntitle: ${JSON.stringify(title)}\n${extra}date: ${today()}\ntags: []\nsummary: \n---\n\nWrite here. Link to other notes with [[Their title]] or [[${sec.prefix}-0001]].\n`);
console.log(`Created ${relPath} with address ${id}`);

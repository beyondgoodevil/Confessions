// Create a note with its front matter filled in and the next free address.
//   node tools/new.mjs book "The Structure of Scientific Revolutions"
//   node tools/new.mjs podcast "Title"     node tools/new.mjs video "Title"
//   node tools/new.mjs lecture "Title"     node tools/new.mjs misc "Title"
//   node tools/new.mjs guide "The Trinity"   (a reading order; the title becomes "Guide: The Trinity")
// The body starts from an outline in templates/ ("Outline - Study.md", "- Comparison", "- Book", "- Lecture"):
//   node tools/new.mjs misc "Title" --outline comparison     (study | comparison | book | lecture | none)
// Without --outline, books get the book outline, lectures the lecture outline and everything else the study outline.
// Any file you add to templates/ as "Outline - Name.md" becomes --outline name.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadConfig, sections, matchType, readNotes, planIds, slug, today } from './lib.mjs';

const argv = process.argv.slice(2);
const oi = argv.indexOf('--outline');
const outlineArg = oi >= 0 ? (argv.splice(oi, 2)[1] || '') : null;
const [kindArg, ...titleParts] = argv;
let title = titleParts.join(' ').trim();
if (!kindArg || !title) { console.log('Usage: node tools/new.mjs <book|podcast|video|lecture|misc|guide> "Title of the note" [--outline study|comparison|book|lecture|none]'); process.exit(1); }
const cfg = loadConfig(); const secs = sections(cfg);
const hit = matchType(secs, kindArg);
if (!hit) { console.log(`"${kindArg}" isn't a section. Try one of: ${secs.flatMap(s => s.subsections.length ? s.subsections.map(u => u.id) : [s.id]).join(', ')}`); process.exit(1); }
const { sec, sub = null } = hit;
if (!sub && sec.subsections.length) { console.log(`${sec.name} is split into ${sec.subsections.map(u => u.id).join(' / ')}; use one of those instead.`); process.exit(1); }

const isGuide = sec.id === 'guides';
if (isGuide && !/^guide:\s/i.test(title)) title = `Guide: ${title}`;
const dir = path.join(ROOT, 'notes', sec.folder, ...(sub ? [sub.folder] : []));
const file = path.join(dir, slug(title.replace(/^guide:\s*/i, '')) + '.md');
if (fs.existsSync(file)) { console.log(`${path.relative(ROOT, file)} already exists.`); process.exit(1); }
const relPath = path.relative(ROOT, file).split(path.sep).join('/');
const kind = (sub && (sub.kind || sub.id)) || sec.kind || sec.id;

// the outline asked for, else the one that fits the section
const outlines = Object.fromEntries(fs.readdirSync(path.join(ROOT, 'templates'))
  .map(f => f.match(/^Outline - (.+)\.md$/i)).filter(Boolean).map(m => [m[1].toLowerCase(), m[0]]));
const wanted = (outlineArg ?? ({ book: 'book', lecture: 'lecture' }[kind] || 'study')).toLowerCase();
if (!isGuide && wanted !== 'none' && !outlines[wanted]) { console.log(`No outline called "${wanted}". Try one of: ${Object.keys(outlines).join(', ')}, none`); process.exit(1); }

const { plan } = planIds([...readNotes({ withGit: false }), { path: relPath, fields: { date: '9999-12-31' } }], cfg);
const id = plan.get(relPath);
const extra = {
  book: 'author: \nyear: \npublisher: \n',
  podcast: 'show: \nepisode: \nhost: \nguest: \nyear: \nurl: \n',
  video: 'creator: \nchannel: \nevent: \nyear: \nurl: \n',
  lecture: 'course: \nlecture: \nlecturer: \ninstitution: \nurl: \n',
  misc: 'source: \n'
}[kind] || '';
fs.mkdirSync(dir, { recursive: true });
const guideBody = 'Where to start, and how the parts follow on from each other.\n\n## First Part\n\nWhat this part covers, in one line.\n\n1. [[]] — What the note shows, in one line.\n\n## Second Part\n\nWhat this part covers, in one line.\n\n1. [[]] — What the note shows, in one line.\n';
const body = isGuide ? guideBody
  : wanted === 'none' ? `Write here. Link to other notes with [[Their title]] or [[${sec.prefix}-0001]].\n`
  : fs.readFileSync(path.join(ROOT, 'templates', outlines[wanted]), 'utf8').replace(/\r\n/g, '\n').replace(/\s*$/, '\n');
fs.writeFileSync(file, `---\nid: ${id}\ntitle: ${JSON.stringify(title)}\n${extra}date: ${today()}\ntags: [${isGuide ? 'guide' : ''}]\nsummary: ${isGuide ? 'A reading order for the notes on …' : ''}\n---\n\n${body}`);
console.log(`Created ${relPath} with address ${id}${isGuide || wanted === 'none' ? '' : ` (${wanted} outline)`}`);

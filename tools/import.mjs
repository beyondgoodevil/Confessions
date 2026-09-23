// Bulk-import Markdown notes you already have (an Obsidian vault, a folder of exports...).
//   node tools/import.mjs <folder>                        sort by front matter / folder names, rest -> Miscellany
//   node tools/import.mjs <folder> --section book         put everything in one section (book|podcast|video|lecture|misc)
//   node tools/import.mjs <folder> --dry-run              show the plan without copying anything
// Images and PDFs found alongside go to notes/images/. Files are copied, never moved or overwritten.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, NOTE_EXT, MEDIA_EXT, loadConfig, sections, matchType, readFrontMatter, walk, slug, readNotes, planIds, addFields, today } from './lib.mjs';

const args = process.argv.slice(2);
const src = args.find(a => !a.startsWith('--'));
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : null; };
if (!src || !fs.existsSync(src)) { console.log('Usage: node tools/import.mjs <folder> [--section book|podcast|video|lecture|misc] [--dry-run]'); process.exit(1); }
const dry = !!opt('dry-run');
const cfg = loadConfig(); const secs = sections(cfg);
const forced = opt('section') && opt('section') !== 'auto' ? matchType(secs, opt('section')) : null;
if (opt('section') && opt('section') !== 'auto' && !forced) { console.log(`Unknown section "${opt('section')}".`); process.exit(1); }
if (forced && !forced.sub && forced.sec.subsections.length) { console.log(`${forced.sec.name} is split; use --section ${forced.sec.subsections.map(u => u.id).join(' or --section ')}`); process.exit(1); }

const files = walk(path.resolve(src), { skipHidden: false }).filter(f => !/[\\/](\.obsidian|\.trash|\.git|node_modules)[\\/]/.test(f));
const notes = files.filter(f => NOTE_EXT.test(f)), media = files.filter(f => MEDIA_EXT.test(f));
const fallback = secs.find(s => s.id === cfg.defaultSection) || secs[secs.length - 1];
const uniq = (dir, base) => { let p = path.join(dir, base), i = 2; const { name, ext } = path.parse(base); while (fs.existsSync(p) || taken.has(p)) p = path.join(dir, `${name}-${i++}${ext}`); taken.add(p); return p; };
const taken = new Set(); const plan = []; const guessed = [];

for (const f of notes) {
  const raw = fs.readFileSync(f, 'utf8'); const fields = readFrontMatter(raw).fields;
  let hit = forced || matchType(secs, fields.section) || matchType(secs, fields.type);
  if (!hit) for (const seg of path.relative(src, f).split(path.sep).slice(0, -1).reverse()) { hit = matchType(secs, seg) || matchType(secs, seg.replace(/s$/, '')); if (hit) break; }
  let how = forced ? 'chosen' : hit ? 'detected' : 'guessed';
  if (!hit) { hit = { sec: fallback }; guessed.push(path.relative(src, f)); }
  let sub = hit.sub || null;
  if (!sub && hit.sec.subsections.length) sub = hit.sec.subsections.find(u => [u.id, ...u.aliases].includes(slug(fields.medium || ''))) || hit.sec.subsections[0];
  const dir = path.join(ROOT, 'notes', hit.sec.folder, ...(sub ? [sub.folder] : []));
  plan.push({ from: f, to: uniq(dir, path.basename(f)), raw, section: sub ? `${hit.sec.name} / ${sub.name}` : hit.sec.name, how });
}
for (const f of media) {
  const dest = path.join(ROOT, 'notes', 'images', path.basename(f));
  if (fs.existsSync(dest) && fs.statSync(dest).size === fs.statSync(f).size) continue;
  plan.push({ from: f, to: uniq(path.dirname(dest), path.basename(f)), media: true });
}

const counts = {};
for (const p of plan) { const key = p.media ? 'Images & files' : p.section; counts[key] = (counts[key] || 0) + 1; }
console.log(`${dry ? 'Plan' : 'Importing'}: ${notes.length} note${notes.length === 1 ? '' : 's'} and ${plan.filter(p => p.media).length} image/file${plan.filter(p => p.media).length === 1 ? '' : 's'} from ${src}\n`);
for (const p of plan) console.log(`  ${p.media ? '[file]' : `[${p.how}]`.padEnd(10)} ${path.relative(src, p.from)}  ->  ${path.relative(ROOT, p.to)}`);
console.log('\n' + Object.entries(counts).map(([k, v]) => `  ${k}: ${v}`).join('\n'));
if (guessed.length) console.log(`\n${guessed.length} note${guessed.length === 1 ? '' : 's'} had no section hint and went to ${fallback.name}. Add "type: book" (or podcast, video, lecture) to their front matter, or move them, if they belong elsewhere.`);
if (dry) { console.log('\nDry run: nothing was copied.'); process.exit(0); }

for (const p of plan) { fs.mkdirSync(path.dirname(p.to), { recursive: true }); fs.copyFileSync(p.from, p.to); }
// Give the imported notes addresses and dates right away.
const all = readNotes({ withGit: false });
const { plan: ids } = planIds(all, cfg);
const importedSet = new Set(plan.filter(p => !p.media).map(p => path.relative(ROOT, p.to).split(path.sep).join('/')));
for (const n of all) {
  if (!importedSet.has(n.path)) continue;
  const mtime = fs.statSync(n.file).mtime.toISOString().slice(0, 10);
  const next = addFields(n.raw, { id: ids.get(n.path), date: n.fields.date || n.fields.created ? '' : mtime || today() });
  if (next !== n.raw) fs.writeFileSync(n.file, next);
}
console.log(`\nDone. Preview with "node tools/serve.mjs", then commit and push.`);

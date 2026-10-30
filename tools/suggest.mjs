// Suggest existing notes to link from (and to) a note, ranked by shared tags and shared uncommon words.
//   node tools/suggest.mjs "Note Title"            top 12
//   node tools/suggest.mjs "Note Title" --n 20
// It prints a ready-made `npm run link` line for the best matches that don't link to the note yet.
import { readNotes, loadConfig } from './lib.mjs';

const args = process.argv.slice(2);
const nAt = args.indexOf('--n'); const N = nAt >= 0 ? +args[nAt + 1] || 12 : 12;
const title = args.filter((a, i) => nAt < 0 || (i !== nAt && i !== nAt + 1)).join(' ').trim();
if (!title) { console.log('Usage: node tools/suggest.mjs "Note Title" [--n 12]'); process.exit(1); }

const cfg = loadConfig();
const broad = new Set(((cfg.browse || {}).fields || []).map(t => t.toLowerCase()));
const STOP = new Set(('about above after again against also although among another because been before being below between both cannot could does doing down during each even every from further have having here herself himself into itself just itself many more most much must myself never only other ought ourselves over same should since some such than that their theirs them themselves then there these they this those through thus under until upon very what when where which while whom whose will with within without would your yours note notes chapter section sections conclusion related primary secondary press university trans edited oxford cambridge').split(' '));

const unq = s => String(s ?? '').replace(/^\[|\]$/g, '');
const tagsOf = n => unq(n.fields.tags).split(',').map(t => t.trim().replace(/^['"]|['"]$/g, '').toLowerCase()).filter(Boolean);
const titleOf = n => String(n.fields.title ?? '').replace(/\\"/g, '"');
const body = n => n.raw.replace(/^﻿?---[\s\S]*?\n---[ \t]*\r?\n/, '').replace(/^## Related[\s\S]*$/m, '');
const words = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().match(/[a-z][a-z'-]{3,}/g) || [];
const linksIn = n => new Set([...n.raw.matchAll(/\[\[([^\]|#]+)/g)].map(m => m[1].trim().toLowerCase()));

const notes = readNotes({ withGit: false }).filter(n => titleOf(n));
const me = notes.find(n => titleOf(n).toLowerCase() === title.toLowerCase());
if (!me) { console.log(`No note titled "${title}".`); process.exit(1); }

// tf-idf over the notes' text (title counted three times, summary twice)
const docs = notes.map(n => { const tf = new Map(); for (const w of [...words(titleOf(n)), ...words(titleOf(n)), ...words(titleOf(n)), ...words(String(n.fields.summary || '')), ...words(String(n.fields.summary || '')), ...words(body(n))]) if (!STOP.has(w)) tf.set(w, (tf.get(w) || 0) + 1); return tf; });
const df = new Map(); for (const tf of docs) for (const w of tf.keys()) df.set(w, (df.get(w) || 0) + 1);
const vec = tf => { const v = new Map(); let norm = 0; for (const [w, c] of tf) { const x = (1 + Math.log(c)) * Math.log(notes.length / df.get(w)); v.set(w, x); norm += x * x; } return { v, norm: Math.sqrt(norm) || 1 }; };
const vecs = docs.map(vec);
const mi = notes.indexOf(me), mv = vecs[mi], myTags = tagsOf(me), myLinks = linksIn(me), myTitle = title.toLowerCase();

const scored = notes.map((n, i) => {
  if (i === mi) return null;
  let dot = 0; for (const [w, x] of mv.v) { const y = vecs[i].v.get(w); if (y) dot += x * y; }
  const cos = dot / (mv.norm * vecs[i].norm);
  const shared = tagsOf(n).filter(t => myTags.includes(t));
  const tagScore = shared.reduce((s, t) => s + (broad.has(t) ? .02 : .08), 0);
  const top = [...vecs[i].v.entries()].filter(([w]) => mv.v.has(w)).sort((a, b) => b[1] * mv.v.get(b[0]) - a[1] * mv.v.get(a[0])).slice(0, 4).map(([w]) => w);
  return { n, score: cos + tagScore, shared, top, from: linksIn(n).has(myTitle), to: myLinks.has(titleOf(n).toLowerCase()) };
}).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, N);

console.log(`Notes most like "${title}":\n`);
for (const [k, s] of scored.entries()) {
  const mark = s.from && s.to ? '↔ linked both ways' : s.from ? '← already links here' : s.to ? '→ this note links to it' : '';
  console.log(`${String(k + 1).padStart(2)}. ${s.score.toFixed(2)}  ${s.n.fields.id || '      '}  ${titleOf(s.n)}${mark ? '   ' + mark : ''}`);
  console.log(`              tags: ${s.shared.join(', ') || '—'}   words: ${s.top.join(', ')}`);
}
const todo = scored.filter(s => !s.from).slice(0, 6).map(s => JSON.stringify(titleOf(s.n)));
if (todo.length) console.log(`\nTo add backlinks from the best that don't link here yet:\n  npm run link -- ${JSON.stringify(title)} ${todo.join(' ')}`);

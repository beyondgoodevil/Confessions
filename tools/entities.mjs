// The knowledge-base layer: works out, from the notes themselves, who and what they draw on.
//   node tools/entities.mjs            print a summary (people, works, quotations found)
//   node tools/entities.mjs --json     print the data the site loads (entities.json)
// The build writes entities.json; the site turns it into the People and Works pages and the
// "People and works in this note" box. Nothing is typed by hand: it reads
//   - each note's source: line ("Author, Title (Publisher, Year); Author, Title …", with or without Primary:/Secondary:)
//   - book notes' author: and year: fields
//   - citations in the text, "(Storing, p. 71)", and the quotation in front of them
// Corrections go in people.json at the top of the repository (optional):
//   { "same": { "Augustine": ["St. Augustine of Hippo", "Saint Augustine"] },   names that are one person
//     "ignore": ["Scripture", "Companion"],                                      things that are not people
//     "about": { "Augustine": "Bishop of Hippo, 354–430." } }                    a line shown under the name
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, readFrontMatter, readNotes, slug } from './lib.mjs';

const NOT_PEOPLE = new Set(['scripture', 'bible', 'kjv', 'nkjv', 'septuagint', 'vulgate', 'companion', 'introduction', 'preface', 'primary', 'secondary', 'ibid', 'see', 'cf', 'trans', 'ed', 'eds', 'vol',
  'chapter', 'book', 'part', 'lecture', 'letter', 'essay', 'the', 'new', 'old', 'holy', 'saint', 'st', 'council', 'canon', 'catechism', 'encyclopedia', 'dictionary', 'oxford', 'cambridge', 'stanford', 'routledge',
  'wikipedia', 'youtube', 'npr', 'anonymous', 'various', 'unknown', 'fed', 'af', 'laf', 'gw', 'pg', 'pl', 'cd']);
const PARTICLES = new Set(['de', 'da', 'di', 'du', 'del', 'della', 'der', 'den', 'van', 'von', 'la', 'le', 'of', 'the', 'al', 'ibn', 'bin', 'ben', 'y', 'e']);
const TITLES = /^(St\.?|Saint|Sir|Dr\.?|Fr\.?|Father|Pope|Bishop|Archbishop|Metropolitan|Abba|Elder|Rabbi|Prof\.?|Sister|Brother|Mother)\s+/i;
const ORG = /(Church|Council|Synod|Press|Society|University|Committee|Fathers|Bible|Testament|Version|Commission|Conference|Assembly|Institute|Catechism|Encyclopedia|Dictionary|Review|Journal|Times|Project)$/;
// words the notes use in ordinary lower-case prose ("human", "beyond", "thus"): a name does not start with one. Filled in by buildEntities.
let commonWords = new Set();
const unquote = v => String(v ?? '').replace(/^(['"])([\s\S]*)\1$/, '$2').replace(/\\(["\\])/g, '$1').replace(/''/g, "'");
const clean = s => String(s || '').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();

// "Herbert J. Storing" is a name; "The Basis of the Social Concept" is not.
function looksLikeName(s) {
  const t = clean(s).replace(TITLES, '');
  if (!t || t.length > 48 || /\d|[:“”"()\[\]]/.test(t)) return false;
  const words = t.split(' ');
  if (words.length > 5) return false;
  if (NOT_PEOPLE.has(words[0].toLowerCase().replace(/\.$/, '')) || ORG.test(t) || commonWords.has(words[0].toLowerCase())) return false;
  let caps = 0;
  for (const w of words) {
    if (PARTICLES.has(w.toLowerCase())) continue;
    if (!/^(\p{Lu}[\p{L}'’.-]*|\p{Lu}\.)$/u.test(w)) return false;
    caps++;
  }
  return caps >= 1 && !/^(A|An|The|On|In|Of|For|To|From)$/.test(words[0]);
}
// "St. Augustine of Hippo" -> "Augustine of Hippo"; a place is only dropped when a family name is left ("Anselm of Canterbury" stays whole,
// so John of Damascus and John of Salisbury remain two people)
const baseName = name => { const t = clean(name).replace(TITLES, ''), cut = t.replace(/\s+(?:of|the)\s+\p{Lu}.*$/u, '').trim(); return cut.split(' ').length > 1 ? cut : t; };
// Bible books are cited like authors, "(John 3:16)": never read those as a person
const BIBLE = new Set('Genesis Exodus Leviticus Numbers Deuteronomy Joshua Judges Ruth Samuel Kings Chronicles Ezra Nehemiah Esther Job Psalm Psalms Proverbs Ecclesiastes Isaiah Jeremiah Lamentations Ezekiel Daniel Hosea Joel Amos Obadiah Jonah Micah Nahum Habakkuk Zephaniah Haggai Zechariah Malachi Matthew Mark Luke John Acts Romans Corinthians Galatians Ephesians Philippians Colossians Thessalonians Timothy Titus Philemon Hebrews James Peter Jude Revelation Wisdom Sirach Tobit Judith Baruch Maccabees'.split(' '));
const surnameOf = name => { const w = clean(name).replace(TITLES, '').replace(/\s+(?:of|the)\s+\p{Lu}.*$/u, '').split(' '); return w[w.length - 1]; };

// split on separators that are not inside brackets or quotes
function splitTop(s, sep) {
  const out = []; let cur = '', depth = 0, q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(' || c === '[') depth++; else if (c === ')' || c === ']') depth = Math.max(0, depth - 1);
    else if (c === '“') q = true; else if (c === '”') q = false;
    if (c === sep && !depth && !q) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur); return out.map(x => x.trim()).filter(Boolean);
}

// One source line -> [{ author, title, year, role }]
export function parseSource(line) {
  const out = []; let role = '';
  const text = clean(unquote(line));
  let last = '';
  for (let seg of splitTop(text.replace(/\.\s+(Primary|Secondary)\s*:/g, '; $1:'), ';')) {
    const r = seg.match(/^(Primary|Secondary)\s*:\s*/i); if (r) { role = r[1].toLowerCase(); seg = seg.slice(r[0].length); }
    seg = seg.replace(/^(and|also|with)\s+/i, '').replace(/\.$/, '');
    const comma = seg.indexOf(',');
    let author = '', rest = seg;
    if (comma > 0 && looksLikeName(seg.slice(0, comma))) { author = clean(seg.slice(0, comma)); rest = seg.slice(comma + 1).trim(); }
    else {                                                   // "A and B, Title" or two authors
      const m = seg.match(/^(.{3,40}?) and (.{3,40}?), (.+)$/);
      if (m && looksLikeName(m[1]) && looksLikeName(m[2])) { author = clean(m[1]); rest = m[3]; out.push({ author: clean(m[2]), title: '', year: '', role, co: true }); }
    }
    if (!author) { last = ''; continue; }
    last = author;
    // the title runs to the first bracket, or to ", trans." / ", ed." / ", ch." / ", in " and the like
    let title = rest.split(/\s\(|\s[—–]\s|\s§|\s(?=\d)|\s[IVXLC]+(?=[–.\d-])|\s[IVXLC]+,|,\s+(?:trans\.|tr\.|ed\.|eds\.|rev\.|vol\.|vols\.|ch\.|chs\.|chapters?|books?|bk\.|pp?\.|§|in |with |especially|esp\.|as quoted|quoted|extract|\d)/i)[0];
    title = clean(title).replace(/^(?:eds?\.|trans\.),?\s*/i, '').replace(/^['‘“"]|['’”"]$/g, '').replace(/[.,:]$/, '');
    if (title.length < 3 || title.length > 140 || /^(trans|ed|ch|chs|pp?)\b/i.test(title)) title = '';
    const y = (rest.match(/\((?:[^()]*?)(\d{4})[^()]*\)/) || [])[1] || '';
    const co = out.length && out[out.length - 1].co && !out[out.length - 1].title ? out[out.length - 1] : null;
    if (co) { co.title = title; co.year = y; delete co.co; }
    out.push({ author, title, year: y, role });
  }
  return out.filter(x => !x.co);
}

export function buildEntities(notes) {
  let fixes = {};
  try { fixes = JSON.parse(fs.readFileSync(path.join(ROOT, 'people.json'), 'utf8')); } catch { /* optional file */ }
  const ignore = new Set((fixes.ignore || []).map(x => x.toLowerCase()));
  const sameAs = new Map(); for (const [k, list] of Object.entries(fixes.same || {})) for (const v of list) sameAs.set(v.toLowerCase(), k);

  const metas = notes.map(n => {
    const { fields } = readFrontMatter(n.raw);
    const body = n.raw.replace(/^\uFEFF?---[\s\S]*?\n---[ \t]*\r?\n/, '');
    const src = (n.raw.match(/^source:[ \t]*(.+)$/m) || [])[1] || '';
    const tags = (String(fields.tags || '').match(/^\[(.*)\]$/) || [, ''])[1].split(',').map(t => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    return { id: (fields.id || '').toUpperCase(), title: clean(unquote(fields.title)), path: n.path, body, src, tags,
      author: unquote(fields.author || ''), year: fields.year || '', isBook: n.path.startsWith('notes/books/') || fields.type === 'book' };
  }).filter(m => /^[A-Z]+-\d+$/.test(m.id));

  // words that occur in ordinary lower-case prose, five times or more
  { const c = new Map(); for (const m of metas) for (const w of m.body.match(/(?<![\p{L}'’-])\p{Ll}{3,}(?![\p{L}'’-])/gu) || []) c.set(w, (c.get(w) || 0) + 1);
    commonWords = new Set([...c].filter(([, n]) => n >= 5).map(([w]) => w)); }
  // 1. people and works named in source lines and book fields
  const people = new Map();          // key -> { name, variants:Set, notes: Map(id -> Set(kind)), works: Map(wkey -> work), quotes: [] }
  const works = new Map();           // key -> { title, author (person key), year, notes:Set }
  const canon = name => { const c = clean(name); return sameAs.get(c.toLowerCase()) || c; };
  const person = name => {
    const nm = canon(name); if (!nm || ignore.has(nm.toLowerCase())) return null;
    const key = slug(baseName(nm)); if (!key) return null;
    if (!people.has(key)) people.set(key, { key, name: nm, variants: new Set(), notes: new Map(), works: new Map(), quotes: [] });
    const p = people.get(key); p.variants.add(nm);
    // shown under the fullest form met: one with "St." if any note writes it so, otherwise the longest
    const best = [...p.variants].sort((a, b) => (TITLES.test(b) - TITLES.test(a)) || baseName(b).length - baseName(a).length || a.length - b.length)[0];
    p.name = best.replace(/^St /, 'St. ');
    return p;
  };
  const link = (p, id, kind) => { if (!p.notes.has(id)) p.notes.set(id, new Set()); p.notes.get(id).add(kind); };
  const work = (p, title, year, id, role) => {
    if (!title) return null;
    const key = slug(`${surnameOf(p.name)} ${title}`).slice(0, 80);
    if (!works.has(key)) works.set(key, { key, title, author: p.key, year: year || '', notes: new Set(), role: role || '' });
    const w = works.get(key); w.notes.add(id); if (!w.year && year) w.year = year; if (role === 'primary') w.role = 'primary';
    p.works.set(key, w); return w;
  };
  const noteWorks = new Map();       // note id -> [work keys]
  for (const m of metas) {
    const mine = [];
    if (m.isBook && m.author) for (const a of m.author.split(/\s*(?:;|\band\b|&)\s*/)) if (looksLikeName(a)) { const p = person(a); if (p) { link(p, m.id, 'author'); const w = work(p, m.title.replace(/^[^:]{0,40}:\s*(?=\S)/, t => t.length < 30 && /^[\p{L} .'’-]+:\s*$/u.test(t) ? '' : t) || m.title, m.year, m.id, ''); if (w) mine.push(w.key); } }
    if (m.src) for (const s of parseSource(m.src)) { const p = person(s.author); if (!p) continue; link(p, m.id, 'source'); const w = work(p, s.title, s.year, m.id, s.role); if (w) mine.push(w.key); }
    noteWorks.set(m.id, [...new Set(mine)]);
  }

  // 2. merge "Storing" into "Herbert J. Storing" when only one person has that surname
  const bySurname = new Map();
  for (const p of people.values()) { const s = surnameOf(p.name).toLowerCase(); if (!bySurname.has(s)) bySurname.set(s, []); bySurname.get(s).push(p); }
  for (const [s, list] of bySurname) {
    const full = list.filter(p => baseName(p.name).split(' ').length > 1).sort((a, b) => b.notes.size - a.notes.size), bare = list.filter(p => baseName(p.name).split(' ').length === 1);
    if (bare.length === 1 && full.length && (full.length === 1 || full[0].notes.size > 2 * (full[1].notes.size))) {
      const a = full[0], b = bare[0];
      for (const [id, kinds] of b.notes) for (const k of kinds) link(a, id, k);
      for (const [k, w] of b.works) { w.author = a.key; a.works.set(k, w); }
      for (const v of b.variants) a.variants.add(v); people.delete(b.key);
    }
  }
  const surnameIndex = new Map();    // surname -> person, only where it is unambiguous
  { const count = new Map(); for (const p of people.values()) { const s = surnameOf(p.name); count.set(s, (count.get(s) || 0) + 1); }
    for (const p of people.values()) { const s = surnameOf(p.name); if (count.get(s) === 1 && s.length > 2 && !NOT_PEOPLE.has(s.toLowerCase()) && !BIBLE.has(s)) surnameIndex.set(s, p); } }

  // 3. citations in the text and the quotation in front of each
  const headAt = (body, at) => { let h = ''; const re = /^#{2,4}[ \t]+(.+?)[ \t#]*$/gm; let m; while ((m = re.exec(body)) && m.index <= at) h = clean(m[1]); return h; };
  const anchorOf = (body, head) => {
    if (!head) return '';
    const seen = new Set(); const re = /^#{2,4}[ \t]+(.+?)[ \t#]*$/gm; let m, out = '';
    let fence = false; for (const line of body.split('\n')) { if (/^\s*(```|~~~)/.test(line)) { fence = !fence; continue; } const h = !fence && line.match(/^#{2,4}[ \t]+(.+?)[ \t#]*$/); if (!h) continue;
      const t = clean(h[1]); let a = slug(t) || 'section', k = a, i = 2; while (seen.has(k)) k = `${a}-${i++}`; seen.add(k); if (t === head && !out) out = k; }
    return out;
  };
  const CITE = /\(((?:\p{Lu}[\p{L}'’-]+)(?:(?: and | & )\p{Lu}[\p{L}'’-]+)?),?\s+(?:(?:pp?|ch|chs|§|n|vol|bk|book|lecture|sec)\.?\s*)?[^()]{0,60}?\)/gu;
  for (const m of metas) {
    const text = m.body.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, x => x.replace(/[^\n]/g, ' '));
    for (const c of text.matchAll(CITE)) {
      if (!/\d|ch\.|§/.test(c[0])) continue;                 // "(Storing, p. 71)" yes, "(Plato)" no
      const p = surnameIndex.get(c[1].split(/ and | & /)[0]); if (!p) continue;
      link(p, m.id, 'cited');
      const before = text.slice(Math.max(0, c.index - 420), c.index);
      const q = [...before.matchAll(/["“]([^"“”]{25,380})["”]/g)].pop();
      if (!q || before.length - (q.index + q[0].length) > 90) continue;      // the quotation must sit right before its citation
      const head = headAt(m.body, c.index);
      p.quotes.push({ text: clean(q[1]), cite: c[0].slice(1, -1), note: m.id, anchor: anchorOf(m.body, head), head });
    }
  }
  // in a book note with one author, "…" (p. 12) is that author's too. (Not in other notes: a bare page number
  // there may belong to any of the sources.)
  for (const m of metas) {
    if (!m.isBook) continue;
    const only = [...people.values()].filter(p => { const k = p.notes.get(m.id); return k && k.has('author'); });
    if (only.length !== 1) continue;
    const p = only[0], text = m.body.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, x => x.replace(/[^\n]/g, ' '));
    for (const c of text.matchAll(/\(((?:pp?\.|ch\.|§)\s*[^()]{1,24})\)/g)) {
      const before = text.slice(Math.max(0, c.index - 420), c.index);
      const q = [...before.matchAll(/["“]([^"“”]{25,380})["”]/g)].pop();
      if (!q || before.length - (q.index + q[0].length) > 40) continue;
      const head = headAt(m.body, c.index);
      p.quotes.push({ text: clean(q[1]), cite: c[1], note: m.id, anchor: anchorOf(m.body, head), head });
    }
  }
  // 4. notes that are about a person: the name in the title, an alias or a tag
  for (const p of people.values()) {
    const sn = surnameOf(p.name), re = new RegExp(`(^|[^\\p{L}])${sn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u');
    if (sn.length < 4 || !surnameIndex.has(sn)) continue;
    for (const m of metas) if (re.test(m.title) || m.tags.includes(sn.toLowerCase())) link(p, m.id, 'about');
  }

  // 5. shape it for the site
  const P = [...people.values()].filter(p => p.notes.size).map(p => {
    const seen = new Set(), quotes = p.quotes.filter(q => { const k = q.text.slice(0, 60); if (seen.has(k)) return false; seen.add(k); return true; });
    return { key: p.key, name: p.name, also: [...p.variants].filter(v => v !== p.name), about: (fixes.about || {})[p.name] || '',
      notes: [...p.notes].map(([id, kinds]) => [id, [...kinds].sort().join(' ')]), works: [...p.works.keys()], quotes };
  });
  const keep = new Set(P.map(p => p.key));
  const W = [...works.values()].filter(w => keep.has(w.author)).map(w => ({ key: w.key, title: w.title, author: w.author, year: w.year, primary: w.role === 'primary', notes: [...w.notes] }));
  // neighbours: people who turn up in the same notes
  const byNote = new Map(); for (const p of P) for (const [id] of p.notes) { if (!byNote.has(id)) byNote.set(id, []); byNote.get(id).push(p.key); }
  for (const p of P) {
    const c = new Map(); for (const [id] of p.notes) for (const k of byNote.get(id) || []) if (k !== p.key) c.set(k, (c.get(k) || 0) + 1);
    p.near = [...c].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => [k, n]);
  }
  P.sort((a, b) => b.notes.length - a.notes.length || a.name.localeCompare(b.name));
  return { people: P, works: W, byNote: Object.fromEntries([...byNote].map(([id, ks]) => [id, { people: ks, works: noteWorks.get(id) || [] }])) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const data = buildEntities(readNotes({ withGit: false }).filter(n => String(n.fields.draft) !== 'true'));
  if (process.argv.includes('--json')) console.log(JSON.stringify(data));
  else {
    const q = data.people.reduce((s, p) => s + p.quotes.length, 0);
    console.log(`${data.people.length} people, ${data.works.length} works, ${q} quotations, across ${Object.keys(data.byNote).length} notes.\n`);
    for (const p of data.people.slice(0, 40)) console.log(`${String(p.notes.length).padStart(3)} notes  ${String(p.works.length).padStart(2)} works  ${String(p.quotes.length).padStart(3)} quotes  ${p.name}${p.also.length ? '  (= ' + p.also.join(', ') + ')' : ''}`);
  }
}

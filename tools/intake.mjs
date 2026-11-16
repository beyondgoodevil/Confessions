// Turn a PDF book into text you can read, search and cite from, before writing a note on it.
//   node tools/intake.mjs "C:\Books\Some Book.pdf"
//   node tools/intake.mjs book.pdf --name storing            folder name to use (default: from the file name)
//   node tools/intake.mjs book.pdf --first-page 15           PDF page 15 is the book's printed page 1 (when the guess is wrong)
//   node tools/intake.mjs book.pdf --chapters "1,35,58,94"   printed pages where chapters start (when the PDF has no bookmarks)
//   node tools/intake.mjs book.pdf --ocr                     force OCR (it runs by itself when the PDF is a scan)   --lang en-US
//   node tools/intake.mjs book.pdf --pages 20-80             only those PDF pages
//   node tools/intake.mjs find storing "ropes and chains of consolidation"     which printed page a phrase is on
//   node tools/intake.mjs list                               the books taken in so far
// It writes to .intake/<name>/ (never published, never committed):
//   book.txt          the whole text, each page headed  === p. 35 ===  with the book's printed page number
//   parts/            the same text cut by chapter, in files small enough to read in one go
//   reading-notes.md  a checklist of the parts with page ranges, and a heading per chapter to take notes under
//   index.json        what was found (pages, numbering, chapters)
// Needs pdftotext on the PATH (it comes with Git for Windows). Chapters come from the PDF's bookmarks when Python
// with pypdf is installed. Scans are read with the OCR built into Windows (tools/ocr.ps1); nothing to install.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { ROOT, slug } from './lib.mjs';

const HOME = path.join(ROOT, '.intake');
const PART = 60000;                       // characters per part file
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf('--' + k); return i < 0 ? null : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const flagsWithValue = ['name', 'first-page', 'chapters', 'lang', 'pages'];
const plain = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && flagsWithValue.includes(args[i - 1].slice(2))));
const norm = s => s.normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

/* ---------- find / list ---------- */
if (plain[0] === 'list') {
  const dirs = fs.existsSync(HOME) ? fs.readdirSync(HOME).filter(d => fs.existsSync(path.join(HOME, d, 'index.json'))) : [];
  if (!dirs.length) console.log('No books taken in yet. Run: node tools/intake.mjs "path\\to\\book.pdf"');
  for (const d of dirs) { const x = JSON.parse(fs.readFileSync(path.join(HOME, d, 'index.json'), 'utf8')); console.log(`${d}  —  ${x.title || x.file}  (${x.pages} pages, ${x.chapters.length} chapters${x.ocr ? ', OCR' : ''})`); }
  process.exit(0);
}
if (plain[0] === 'find') {
  const [, name, ...words] = plain; const phrase = words.join(' ');
  const file = name && path.join(HOME, name, 'book.txt');
  if (!phrase || !fs.existsSync(file)) { console.log('Usage: node tools/intake.mjs find <name> "phrase from the book"   (names: node tools/intake.mjs list)'); process.exit(1); }
  const pages = fs.readFileSync(file, 'utf8').split(/^=== (.+?) ===$/m);   // ['', label, text, label, text…]
  const key = norm(phrase); const labels = [], flat = [];
  for (let i = 1; i < pages.length; i += 2) { labels.push(pages[i]); flat.push(norm(pages[i + 1])); }
  const hits = [];
  for (let i = 0; i < flat.length; i++) {
    if (flat[i].includes(key)) hits.push(labels[i]);
    else if (i + 1 < flat.length) {                                        // a phrase that runs over a page break
      const tail = flat[i].slice(-key.length + 1), join = tail + flat[i + 1].slice(0, key.length - 1);
      if (tail && join.includes(key)) hits.push(`${labels[i]}–${labels[i + 1].replace(/^p\. /, '')}`);
    }
  }
  if (!hits.length) { console.log(`Not found in ${name}. Try a shorter stretch of the phrase: OCR and line breaks can spoil a long one.`); process.exit(1); }
  console.log(hits.join(', '));
  process.exit(0);
}

/* ---------- take a book in ---------- */
const pdf = plain[0] && path.resolve(plain[0]);
if (!pdf || !fs.existsSync(pdf)) { console.log('Usage: node tools/intake.mjs "path\\to\\book.pdf" [--name short-name] [--first-page N] [--chapters "1,35,58"] [--ocr] [--pages 20-80]\n       node tools/intake.mjs find <name> "phrase"      node tools/intake.mjs list'); process.exit(1); }
const name = slug(opt('name') && opt('name') !== true ? opt('name') : path.basename(pdf).replace(/\.pdf$/i, '')).slice(0, 60).replace(/-+$/, '');
const outDir = path.join(HOME, name);
const range = (() => { const m = String(opt('pages') || '').match(/^(\d+)-(\d+)$/); return m ? [+m[1], +m[2]] : null; })();
const step = s => console.log(`== ${s}`);

// 1. text, page by page
step('Reading the text');
let pages, usedOcr = false;
const textArgs = ['-enc', 'UTF-8', ...(range ? ['-f', String(range[0]), '-l', String(range[1])] : []), pdf, '-'];
try { pages = execFileSync('pdftotext', textArgs, { encoding: 'utf8', maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'ignore'] }).split('\f'); }
catch { console.log('pdftotext was not found or could not read the file. It comes with Git for Windows (Git Bash).'); pages = []; }
if (pages.length && !pages[pages.length - 1].trim()) pages.pop();
const thin = pages.filter(p => p.replace(/\s+/g, '').length < 80).length;
if (opt('ocr') || !pages.length || thin > pages.length * 0.5) {
  if (process.platform !== 'win32') { console.log('This PDF is a scan, and OCR here uses the engine built into Windows. Run this on Windows, or OCR the PDF first.'); process.exit(1); }
  step(`${opt('ocr') ? 'OCR asked for' : 'This is a scan'}: reading it with Windows OCR (about a second a page)`);
  const tmp = path.join(os.tmpdir(), `intake-${Date.now()}.txt`);
  const r = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(ROOT, 'tools', 'ocr.ps1'), '-Pdf', pdf, '-Out', tmp,
    ...(range ? ['-First', String(range[0]), '-Last', String(range[1])] : []), ...(opt('lang') && opt('lang') !== true ? ['-Lang', opt('lang')] : [])], { stdio: 'inherit' });
  if (r.status !== 0 || !fs.existsSync(tmp)) { console.log('OCR failed. The message above says why.'); process.exit(1); }
  pages = fs.readFileSync(tmp, 'utf8').split('\f'); fs.rmSync(tmp); usedOcr = true;
}
pages = pages.map(p => p.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim());
const base = range ? range[0] : 1;        // PDF page number of pages[0]
console.log(`${pages.length} pages${usedOcr ? ' (OCR)' : ''}`);

// 2. bookmarks, page labels and title, when Python with pypdf is there
let meta = {};
const py = `
import sys, json
from pypdf import PdfReader
r = PdfReader(sys.argv[1]); out = {"outline": [], "labels": None, "title": None, "author": None}
try:
    m = r.metadata or {}
    out["title"] = (m.get("/Title") or None); out["author"] = (m.get("/Author") or None)
except Exception: pass
def walk(items, depth):
    for it in items:
        if isinstance(it, list): walk(it, depth + 1)
        else:
            try: out["outline"].append([depth, str(it.title).strip(), r.get_destination_page_number(it) + 1])
            except Exception: pass
try: walk(r.outline, 0)
except Exception: pass
try:
    labels = [r.page_labels[i] for i in range(len(r.pages))]
    if any(not l.isdigit() or int(l) != i + 1 for i, l in enumerate(labels)): out["labels"] = labels
except Exception: pass
sys.stdout.reconfigure(encoding="utf-8"); print(json.dumps(out))
`;
for (const exe of ['python', 'python3', 'py']) {
  const r = spawnSync(exe, ['-c', py, pdf], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status === 0 && r.stdout.trim().startsWith('{')) { try { meta = JSON.parse(r.stdout); } catch {} break; }
}

// 3. the book's own page numbers
step('Working out the printed page numbers');
const roman = s => { const v = { i: 1, v: 5, x: 10, l: 50, c: 100 }; let t = 0; s = s.toLowerCase(); for (let i = 0; i < s.length; i++) { const a = v[s[i]], b = v[s[i + 1]] || 0; t += a < b ? -a : a; } return t; };
const toRoman = n => { let s = ''; for (const [v, r] of [[100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']]) while (n >= v) { s += r; n -= v; } return s; };
function printedOn(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean); if (!lines.length) return null;
  const edge = [...lines.slice(0, 2), ...lines.slice(-2)];
  for (const l of edge) {
    let m = l.match(/^(\d{1,4})$/) || l.match(/^(\d{1,4})\s{2,}\S/) || l.match(/\S\s{2,}(\d{1,4})$/) || l.match(/^[-–—]\s*(\d{1,4})\s*[-–—]$/);
    if (m) return { n: +m[1] };
    m = l.match(/^([ivxlc]{1,7})$/i); if (m && roman(m[1]) > 0 && roman(m[1]) < 200) return { r: roman(m[1]) };
  }
  return null;
}
let labels, how;
const firstPage = +opt('first-page') || 0;
if (firstPage) {
  labels = pages.map((_, i) => { const n = base + i - firstPage + 1; return n >= 1 ? String(n) : toRoman(base + i); });
  how = `PDF page ${firstPage} taken as printed page 1 (--first-page)`;
} else if (meta.labels && !range) { labels = meta.labels.slice(0, pages.length); how = "the PDF's own page labels"; }
else {
  // Read the number printed on each page. The gap between a page's place in the PDF and its printed number is not
  // always the same through a book (unnumbered plates, a second volume), so each page follows the numbers printed
  // near it: a reading is trusted when another page within four of it shows the same gap.
  const rvotes = new Map();
  const offs = pages.map((p, i) => { const c = printedOn(p); if (!c) return null; if (c.n != null) return base + i - c.n; const k = base + i - c.r; rvotes.set(k, (rvotes.get(k) || 0) + 1); return null; });
  const trusted = offs.map((o, i) => o != null && offs.slice(Math.max(0, i - 4), i + 5).filter(x => x === o).length >= 2);
  const anchors = trusted.map((t, i) => t ? i : -1).filter(i => i >= 0);
  const rbest = [...rvotes.entries()].sort((a, b) => b[1] - a[1])[0];
  if (anchors.length >= 3) {
    const roff = rbest && rbest[1] >= 2 ? rbest[0] : 0;
    let k = 0;
    labels = pages.map((_, i) => {
      while (k + 1 < anchors.length && anchors[k + 1] <= i) k++;
      const prev = anchors[k] <= i ? anchors[k] : null, next = anchors[k] > i ? anchors[k] : anchors[k + 1] ?? null;
      const use = prev != null && (next == null || i - prev <= next - i) ? prev : next ?? prev;
      const n = base + i - offs[use];
      return n >= 1 ? String(n) : toRoman(Math.max(1, base + i - roff));
    });
    const shifts = anchors.filter((a, j) => j && offs[a] !== offs[anchors[j - 1]]).length;
    how = `printed numbers read from ${anchors.length} pages` + (shifts ? `; the numbering shifts ${shifts} time${shifts === 1 ? '' : 's'} (unnumbered plates and the like), and each page follows the numbers printed near it` : ` (PDF page ${offs[anchors[0]] + 1} is printed page 1)`);
  } else { labels = pages.map((_, i) => `pdf ${base + i}`); how = 'no printed numbers found, so PDF page numbers are used (pass --first-page N to set them)'; }
}
console.log(how);

// 4. chapters
step('Finding the chapters');
let chapters = [], chapHow;                // [{ title, start }]  start = index into pages
if (opt('chapters') && opt('chapters') !== true) {
  const want = String(opt('chapters')).split(/[,\s]+/).filter(Boolean);
  chapters = want.map((w, k) => ({ title: `Chapter ${k + 1}`, start: labels.indexOf(w) })).filter(c => c.start >= 0);
  chapHow = `${chapters.length} from --chapters`; if (chapters.length < want.length) chapHow += ` (${want.length - chapters.length} page numbers not found)`;
} else if (meta.outline && meta.outline.length && !range) {
  const top = Math.min(...meta.outline.map(o => o[0]));
  let pick = meta.outline.filter(o => o[0] === top);
  if (pick.length < 3 && meta.outline.some(o => o[0] === top + 1)) pick = meta.outline.filter(o => o[0] <= top + 1);   // one wrapper bookmark around the real chapters
  chapters = pick.map(o => ({ title: o[1], start: o[2] - 1 })).filter(c => c.start >= 0 && c.start < pages.length).sort((a, b) => a.start - b.start);
  chapters = chapters.filter((c, i) => i === 0 || c.start !== chapters[i - 1].start);
  chapHow = `${chapters.length} from the PDF's bookmarks`;
}
if (!chapters.length) chapHow = "none marked in the PDF, so the text is cut into equal parts (pass --chapters \"1,35,58\" with the printed pages where chapters start)";
if (chapters.length && chapters[0].start > 0) chapters.unshift({ title: 'Front matter', start: 0 });
if (!chapters.length) chapters = [{ title: '', start: 0 }];
chapters.forEach((c, i) => { c.end = (chapters[i + 1] ? chapters[i + 1].start : pages.length) - 1; });
console.log(chapHow);

// 5. write everything
step('Writing');
fs.rmSync(path.join(outDir, 'parts'), { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, 'parts'), { recursive: true });
const pageText = i => `=== p. ${labels[i].replace(/^pdf /, 'pdf ')} ===\n${pages[i]}\n`;
fs.writeFileSync(path.join(outDir, 'book.txt'), pages.map((_, i) => pageText(i)).join('\n'));
const span = (a, b) => labels[a] === labels[b] ? `p. ${labels[a]}` : `pp. ${labels[a]}–${labels[b]}`;
const parts = [];                          // { file, chapter, from, to }
const two = n => String(n).padStart(2, '0');
chapters.forEach((c, ci) => {
  const groups = []; let cur = [], size = 0;
  for (let i = c.start; i <= c.end; i++) { const len = pages[i].length + 20; if (cur.length && size + len > PART) { groups.push(cur); cur = []; size = 0; } cur.push(i); size += len; }
  if (cur.length) groups.push(cur);
  groups.forEach((g, gi) => {
    const stem = c.title ? `${two(ci + (chapters[0].title === 'Front matter' ? 0 : 1))}${groups.length > 1 ? String.fromCharCode(97 + gi) : ''}-${slug(c.title).slice(0, 40).replace(/-+$/, '') || 'chapter'}` : `part-${two(parts.length + 1)}`;
    const file = `parts/${stem}.txt`;
    fs.writeFileSync(path.join(outDir, file), g.map(pageText).join('\n'));
    parts.push({ file, chapter: ci, from: g[0], to: g[g.length - 1] });
  });
});
const title = (meta.title && String(meta.title).trim().length > 3 ? String(meta.title).trim() : path.basename(pdf).replace(/\.pdf$/i, ''));
const notesFile = path.join(outDir, 'reading-notes.md');
if (!fs.existsSync(notesFile)) {
  const lines = [`# Reading notes: ${title}`, '', `Source file: ${pdf}`, meta.author ? `Author (from the PDF): ${meta.author}` : null, `Pages: ${pages.length}${usedOcr ? ' (OCR, so check quotations against the page image)' : ''}. Numbering: ${how}.`, '',
    'Tick a part when it has been read in full. Quote with the printed page, e.g. "…" (p. 35).', '', '## Progress', ''].filter(l => l !== null);
  for (const p of parts) lines.push(`- [ ] ${p.file}  (${span(p.from, p.to)})${chapters[p.chapter].title ? `  ${chapters[p.chapter].title}` : ''}`);
  lines.push('');
  chapters.forEach(c => { lines.push(`## ${c.title || 'Notes'}${c.title ? ` (${span(c.start, c.end)})` : ''}`, '', '- ', ''); });
  fs.writeFileSync(notesFile, lines.join('\n'));
} else console.log('reading-notes.md already exists and was left as it is.');
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify({ file: pdf, title, author: meta.author || null, pages: pages.length, ocr: usedOcr, numbering: how,
  chapters: chapters.map(c => ({ title: c.title, from: labels[c.start], to: labels[c.end] })), parts: parts.map(p => ({ file: p.file, from: labels[p.from], to: labels[p.to] })) }, null, 2));

// keep the working folder out of git
const gi = path.join(ROOT, '.gitignore');
const ignore = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8') : '';
if (!/^\.intake\/?$/m.test(ignore)) fs.writeFileSync(gi, ignore.replace(/\s*$/, '\n') + '.intake/\n');

console.log(`\n.intake/${name}/  —  book.txt, ${parts.length} part${parts.length === 1 ? '' : 's'} in parts/, reading-notes.md`);
console.log(`Find a quotation's page:  node tools/intake.mjs find ${name} "a few words of it"`);

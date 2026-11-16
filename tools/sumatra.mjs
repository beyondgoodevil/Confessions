// Quoting from the PDF you are reading in SumatraPDF.
//   node tools/sumatra.mjs open                      which book Sumatra has in front
//   node tools/sumatra.mjs quote "pasted text"       the text tidied, with its page:  "…" (Storing, p. 9)
//   node tools/sumatra.mjs highlights                every highlight saved in that PDF, each with its page
//   node tools/sumatra.mjs goto "Storing, p. 9"      open that page in Sumatra
// The Obsidian plugin calls these through tools/obsidian.mjs (Paste as quotation, Import highlights, Open citation).
// How it works: Sumatra's window title names the open file; its settings file gives the full path; the page comes
// from looking the passage up in the book's text (tools/intake.mjs, run by itself the first time a book is used).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync, spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT, slug } from './lib.mjs';
import { parseSource } from './entities.mjs';

const HOME = path.join(ROOT, '.intake');
const norm = s => String(s).normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
const settingsFile = () => [path.join(process.env.LOCALAPPDATA || '', 'SumatraPDF', 'SumatraPDF-settings.txt'), path.join(process.env.APPDATA || '', 'SumatraPDF', 'SumatraPDF-settings.txt')].find(f => f && fs.existsSync(f));
const recentFiles = () => { const f = settingsFile(); return f ? [...fs.readFileSync(f, 'utf8').matchAll(/^\s*FilePath = (.+?)\s*$/gm)].map(m => m[1]) : []; };

// The PDF in Sumatra's front tab: { name, path, exe } or { error }.
export function sumatraOpen() {
  if (process.platform !== 'win32') return { error: 'This works with SumatraPDF on Windows.' };
  let rows = [];
  try {
    const out = execFileSync('powershell', ['-NoProfile', '-Command', "Get-Process SumatraPDF -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle } | ForEach-Object { $_.MainWindowTitle + \"`t\" + $_.Path }"], { encoding: 'utf8' });
    rows = out.split(/\r?\n/).filter(Boolean).map(l => l.split('\t'));
  } catch { /* not running */ }
  if (!rows.length) return { error: 'SumatraPDF is not open. Open the book there first.' };
  const [title, exe] = rows[0];
  const m = title.match(/^(.+?\.(?:pdf|epub|djvu|mobi|cbz|xps))(?: - \[.*\])? - SumatraPDF$/i);
  if (!m) return { error: 'SumatraPDF has no book open.', exe };
  const name = m[1].replace(/^\[.*?\]\s*/, '');
  const hit = recentFiles().find(f => path.basename(f).toLowerCase() === name.toLowerCase() && fs.existsSync(f));
  if (!hit) return { error: `Could not find where “${name}” is saved. Close and reopen it in SumatraPDF, then try again.`, exe };
  return { name, path: hit, exe };
}
const sumatraExe = () => [sumatraOpen().exe, path.join(process.env.LOCALAPPDATA || '', 'SumatraPDF', 'SumatraPDF.exe'), 'C:\\Program Files\\SumatraPDF\\SumatraPDF.exe'].find(f => f && fs.existsSync(f));

// The folder under .intake/ for a PDF, taking the book in first if it has not been read yet.
export function bookFor(pdf, say = () => {}) {
  const dirs = fs.existsSync(HOME) ? fs.readdirSync(HOME) : [];
  for (const d of dirs) { try { const x = JSON.parse(fs.readFileSync(path.join(HOME, d, 'index.json'), 'utf8')); if (path.resolve(x.file).toLowerCase() === path.resolve(pdf).toLowerCase()) return { name: d, index: x }; } catch {} }
  say('Reading the book for the first time (a scan takes about a second a page)');
  let name = slug(path.basename(pdf).replace(/\.pdf$/i, '')).slice(0, 60).replace(/-+$/, ''); while (dirs.includes(name)) name += '-2';
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'intake.mjs'), pdf, '--name', name], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
  const idx = path.join(HOME, name, 'index.json');
  if (r.status !== 0 || !fs.existsSync(idx)) throw new Error('Could not read the book: ' + String(r.stdout || r.stderr || '').trim().split('\n').slice(-2).join(' '));
  return { name, index: JSON.parse(fs.readFileSync(idx, 'utf8')) };
}
// The book's pages in order: [{ label, text (normalised) }]. Position in the list = PDF page - 1.
function pagesOf(name) {
  const parts = fs.readFileSync(path.join(HOME, name, 'book.txt'), 'utf8').split(/^=== p\. (.+?) ===$/m), out = [];
  for (let i = 1; i < parts.length; i += 2) out.push({ label: parts[i], text: norm(parts[i + 1]) });
  return out;
}

// Copied PDF text -> one clean line: line breaks joined, split words mended, ligatures and odd spaces fixed.
export function cleanQuote(text) {
  let t = String(text).replace(/\r\n?/g, '\n')
    .replace(/[\uFB00-\uFB06]/g, c => ({ '\uFB00': 'ff', '\uFB01': 'fi', '\uFB02': 'fl', '\uFB03': 'ffi', '\uFB04': 'ffl', '\uFB05': 'st', '\uFB06': 'st' }[c]))
    .replace(/[\u00AD\u200B\uFEFF]/g, '').replace(/\u00A0/g, ' ')
    .replace(/(\p{Ll})[-\u2010\u2011]\n\s*(\p{Ll})/gu, '$1$2')       // a word split at the end of a line
    .replace(/\s*\n\s*/g, ' ').replace(/[ \t]{2,}/g, ' ').trim();
  t = t.replace(/^["“”'‘’]+|["“”'‘’]+$/g, '').trim();
  return t.replace(/["“”]/g, "'");                                   // quotation marks inside become single, since the whole is wrapped in double
}

// Which page(s) a passage is on: { from, to (labels), sure }.
export function findPage(name, text) {
  const pages = pagesOf(name), key = norm(text);
  if (key.length < 8) return null;
  const hit = k => { for (let i = 0; i < pages.length; i++) { if (pages[i].text.includes(k)) return [i, i]; if (i + 1 < pages.length && (pages[i].text.slice(-k.length) + pages[i + 1].text.slice(0, k.length)).includes(k)) return [i, i + 1]; } return null; };
  const whole = hit(key);
  if (whole) return { from: pages[whole[0]].label, to: pages[whole[1]].label, sure: true };
  // OCR or a hyphen got in the way: look for shorter stretches and take the page most of them agree on
  const votes = new Map(), size = Math.min(48, Math.max(24, Math.floor(key.length / 3))), step = Math.max(8, Math.floor((key.length - size) / 6));
  let tried = 0, first = null, last = null;
  for (let at = 0; at + size <= key.length; at += step) { tried++; const h = hit(key.slice(at, at + size)); if (!h) continue; votes.set(h[0], (votes.get(h[0]) || 0) + 1); if (first == null) first = h[0]; last = h[1]; }
  if (!votes.size) return null;
  const best = [...votes].sort((a, b) => b[1] - a[1])[0];
  const to = last != null && last > best[0] && last - best[0] === 1 ? last : best[0], from = first != null && first === best[0] - 1 ? first : best[0];
  return { from: pages[from].label, to: pages[to].label, sure: best[1] >= Math.max(2, tried / 3) };
}

// Whose book it is, as written in a citation: the note's own source line knows best.
export function surnameFor(pdf, index, noteRaw) {
  const fileWords = new Set(norm2(path.basename(pdf).replace(/\.pdf$/i, '') + ' ' + (index.title || '')));
  const last = n => String(n).replace(/\s+(?:of|the)\s+\p{Lu}.*$/u, '').trim().split(/\s+/).pop();
  if (noteRaw) {
    const fm = (noteRaw.match(/^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---/) || [])[1] || '';
    const src = (fm.match(/^source:[ \t]*(.+)$/m) || [])[1], author = (fm.match(/^author:[ \t]*(.+)$/m) || [])[1];
    if (src) {
      let best = null, score = 0;
      for (const s of parseSource(src)) { const w = norm2(s.title).filter(x => fileWords.has(x)).length + (fileWords.has(norm(last(s.author))) ? 2 : 0); if (w > score) { score = w; best = s; } }
      if (best && score >= 1) return last(best.author);
    }
    if (author && !/;| and /.test(author)) return last(author.replace(/^["']|["']$/g, ''));
  }
  const m = path.basename(pdf).match(/^(.+?)\s+-\s+.+\.pdf$/i);
  if (m && m[1].split(' ').length <= 4) return last(m[1]);
  if (index.author && /^\p{Lu}[\p{L}.'’ -]{2,40}$/u.test(index.author) && index.author.split(' ').length <= 4) return last(index.author);
  return '';
}
const norm2 = s => String(s || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 3);
const citation = (who, p) => { const pdfPage = /^pdf /.test(p.from), a = p.from.replace(/^pdf /, ''), b = p.to.replace(/^pdf /, ''); return `${who ? who + ', ' : ''}${pdfPage ? 'PDF ' : ''}${a === b ? 'p. ' + a : 'pp. ' + a + '–' + b}`; };

// "pasted text" -> { text: '"…" (Storing, p. 9)', quote, cite, sure, book }
export function quote(raw, noteRaw, say) {
  const open = sumatraOpen(); if (open.error) return { ok: false, error: open.error };
  const q = cleanQuote(raw); if (!q) return { ok: false, error: 'There is no text on the clipboard. Select the passage in SumatraPDF and press Ctrl+C first.' };
  const book = bookFor(open.path, say), who = surnameFor(open.path, book.index, noteRaw), page = findPage(book.name, q);
  if (!page) return { ok: true, text: `"${q}"${who ? ` (${who})` : ''}`, quote: q, cite: who, sure: false, found: false, book: open.name };
  const cite = citation(who, page);
  return { ok: true, text: `"${q}" (${cite})`, quote: q, cite, sure: page.sure, found: true, book: open.name };
}

// Every highlight in the open PDF: { items: [{ text: '"…" (Storing, p. 9)' , note }], book }
export function highlights(noteRaw, say) {
  const open = sumatraOpen(); if (open.error) return { ok: false, error: open.error };
  let list = null, err = '';
  for (const exe of ['python', 'python3', 'py']) {
    const r = spawnSync(exe, [path.join(ROOT, 'tools', 'highlights.py'), open.path], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (r.status === 0 && r.stdout.trim()) { try { list = JSON.parse(r.stdout); break; } catch { err = r.stdout.slice(0, 200); } } else err = String(r.stderr || '').trim().split('\n').pop() || 'Python was not found.';
  }
  if (!list) return { ok: false, error: 'Could not read the highlights: ' + err };
  if (list.error) return { ok: false, error: list.error };
  if (!list.length) return { ok: false, error: `No highlights are saved in “${open.name}”. In SumatraPDF, select text and press “a” to highlight it, then save with Ctrl+S.` };
  const book = bookFor(open.path, say), who = surnameFor(open.path, book.index, noteRaw), pages = pagesOf(book.name);
  const items = list.map(h => {
    const label = (pages[h.page - 1] || {}).label || `pdf ${h.page}`, q = cleanQuote(h.text);
    const cite = citation(who, { from: label, to: label });
    return { text: q ? `"${q}" (${cite})` : `(${cite}: the highlight is on a scanned page, so its words could not be read)`, note: h.note || '', empty: !q };
  });
  return { ok: true, items, book: open.name, unread: items.filter(i => i.empty).length };
}

// Open "Storing, p. 9" in Sumatra. Looks among the books already taken in, then among Sumatra's recent files.
export function goTo(cite, noteRaw, say) {
  const m = String(cite).match(/^(?:(.+?),\s*)?(PDF\s+)?pp?\.\s*([0-9ivxlcdm]+)/i);
  if (!m) return { ok: false, error: 'That does not look like a citation with a page, such as (Storing, p. 9).' };
  const who = (m[1] || '').replace(/^(?:see|cf\.?)\s+/i, '').split(/ and | & /)[0].trim(), label = m[3], isPdfPage = !!m[2];
  const books = (fs.existsSync(HOME) ? fs.readdirSync(HOME) : []).map(d => { try { return { name: d, index: JSON.parse(fs.readFileSync(path.join(HOME, d, 'index.json'), 'utf8')) }; } catch { return null; } }).filter(b => b && fs.existsSync(b.index.file));
  const key = norm(who);
  let pick = null;
  if (key) pick = books.find(b => surnameFor(b.index.file, b.index, noteRaw).toLowerCase() === who.toLowerCase()) || books.find(b => norm(path.basename(b.index.file) + ' ' + (b.index.author || '')).includes(key));
  if (!pick && key) { const f = recentFiles().find(f => norm(path.basename(f)).includes(key) && fs.existsSync(f)); if (f) pick = bookFor(f, say); }
  if (!pick && !key) { const open = sumatraOpen(); if (!open.error) pick = bookFor(open.path, say); }
  if (!pick) return { ok: false, error: who ? `No book by “${who}” has been used for quoting yet, and none of SumatraPDF's recent files has that name in it. Open the PDF in SumatraPDF once and paste a quotation from it.` : 'Open the book in SumatraPDF first.' };
  const pages = pagesOf(pick.name);
  let at = isPdfPage ? +label - 1 : pages.findIndex(p => p.label.toLowerCase() === label.toLowerCase());
  if (at < 0) return { ok: false, error: `“${path.basename(pick.index.file)}” has no page numbered ${label}.` };
  const exe = sumatraExe(); if (!exe) return { ok: false, error: 'SumatraPDF.exe was not found.' };
  if (process.env.SUMATRA_DRY !== '1') spawn(exe, ['-reuse-instance', '-page', String(at + 1), pick.index.file], { detached: true, stdio: 'ignore' }).unref();
  return { ok: true, book: path.basename(pick.index.file), page: at + 1 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, ...rest] = process.argv.slice(2), say = s => console.error(s);
  const out = cmd === 'open' ? sumatraOpen() : cmd === 'quote' ? quote(rest.join(' '), '', say) : cmd === 'highlights' ? highlights('', say) : cmd === 'goto' ? goTo(rest.join(' '), '', say)
    : { error: 'Usage: node tools/sumatra.mjs open | quote "text" | highlights | goto "Author, p. 9"' };
  console.log(JSON.stringify(out, null, 2));
}

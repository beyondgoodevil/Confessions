// Tidy Markdown tables, or start a new one.
//   node tools/table.mjs "Note Title"            line up every table in that note (pipes, dashes, missing cells)
//   node tools/table.mjs "Note Title" --check    only say what would change
//   node tools/table.mjs --all [--check]         every note
//   node tools/table.mjs --new "Question" "Plato" "Aristotle" --rows "Soul" "City" "Virtue"
//                                                print an empty table with those columns and row labels (--rows 4 for blank rows)
//   node tools/table.mjs --csv data.csv          print a table from a CSV or tab-separated file (first line = headings)
// Columns whose cells run past 48 characters are left unpadded, so long quotations don't make mile-wide lines.
// Pipes inside [[links|like this]], `code` and $maths$ are not treated as column breaks.
import fs from 'node:fs';
import { readNotes } from './lib.mjs';

const args = process.argv.slice(2);
const has = f => args.includes(f);
const WIDE = 48;
const len = s => [...s].length;

// split a table row into cells, respecting \| and pipes inside [[ ]], ` ` and $ $
function cells(line) {
  const out = []; let cur = '', i = 0; const s = line.trim();
  while (i < s.length) {
    const c = s[i];
    if (c === '\\' && i + 1 < s.length) { cur += c + s[i + 1]; i += 2; continue; }
    if (s.startsWith('[[', i)) { const e = s.indexOf(']]', i); if (e > 0) { cur += s.slice(i, e + 2); i = e + 2; continue; } }
    if (c === '`' || c === '$') { const e = s.indexOf(c, i + 1); if (e > 0) { cur += s.slice(i, e + 1); i = e + 1; continue; } }
    if (c === '|') { out.push(cur); cur = ''; i++; continue; }
    cur += c; i++;
  }
  out.push(cur);
  if (s.startsWith('|')) out.shift();
  if (/(^|[^\\])\|$/.test(s)) out.pop();
  return out.map(x => x.trim());
}
const isSep = line => { const c = cells(line); return c.length > 0 && c.every(x => /^:?-{1,}:?$/.test(x)); };

function render(rows, aligns) {
  const n = Math.max(...rows.map(r => r.length), aligns.length);
  rows = rows.map(r => [...r, ...Array(n - r.length).fill('')]);
  aligns = [...aligns]; while (aligns.length < n) aligns.push('---');
  const w = Array.from({ length: n }, (_, j) => { const m = Math.max(3, ...rows.map(r => len(r[j]))); return m > WIDE ? 0 : m; });
  const pad = (s, j) => w[j] ? s + ' '.repeat(Math.max(0, w[j] - len(s))) : s;
  const line = r => { const s = r.map(pad).join(' | '); return '| ' + (w[n - 1] ? s : s.replace(/\s+$/, '')) + ' |'; };
  const sep = '| ' + aligns.map((a, j) => {
    const l = a.startsWith(':'), r = a.endsWith(':') && a.length > 1;
    const k = Math.max(3, w[j] || 3) - (l ? 1 : 0) - (r ? 1 : 0);
    return (l ? ':' : '') + '-'.repeat(Math.max(1, k)) + (r ? ':' : '');
  }).join(' | ') + ' |';
  return [line(rows[0]), sep, ...rows.slice(1).map(line)];
}

function tidy(raw) {
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/); const out = []; let fence = null, tables = 0, changed = 0, skipped = 0;
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    const f = L.match(/^\s*(```+|~~~+)/);
    if (f) { if (!fence) fence = f[1][0]; else if (f[1][0] === fence) fence = null; out.push(L); continue; }
    if (!fence && L.includes('|') && i + 1 < lines.length && lines[i + 1].includes('-') && isSep(lines[i + 1]) && cells(L).length === cells(lines[i + 1]).length) {
      let j = i + 2; while (j < lines.length && lines[j].trim() && lines[j].includes('|')) j++;
      const block = lines.slice(i, j);
      const indent = L.match(/^[\s>]*/)[0];
      const strip = x => x.slice(x.match(/^[\s>]*/)[0].length);
      const made = render([cells(strip(block[0])), ...block.slice(2).map(x => cells(strip(x)))], cells(strip(block[1]))).map(x => indent + x);
      // Safety: tidying may only move spaces. If the cells read back differently (a stray $ or ` swallowed a pipe), leave the table as it was.
      const naive = x => { const p = strip(x).trim().split(/(?<!\\)\|/).map(c => c.trim()); if (!p[0]) p.shift(); if (p.length && !p[p.length - 1]) p.pop(); return p.join('\u0001'); };
      const same = made.length === block.length && made.every((x, k) => k === 1 ? cells(strip(x)).map(a => a.replace(/-+/g, '-')).join('|') === cells(strip(block[1])).map(a => a.replace(/-+/g, '-')).join('|') : naive(x) === naive(block[k]));
      tables++;
      if (!same) { skipped++; out.push(...block); i = j - 1; continue; }
      if (made.join('\n') !== block.join('\n')) changed++;
      out.push(...made); i = j - 1; continue;
    }
    out.push(L);
  }
  return { text: out.join(nl), tables, changed, skipped };
}

function csvRows(text) {
  const d = text.split(/\r?\n/)[0].includes('\t') ? '\t' : ',';
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === d) { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim())).map(r => r.map(x => x.trim().replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|')));
}

if (has('--new')) {
  const rest = args.slice(args.indexOf('--new') + 1);
  const ri = rest.indexOf('--rows');
  const cols = (ri >= 0 ? rest.slice(0, ri) : rest).filter(a => !a.startsWith('--'));
  let labels = ri >= 0 ? rest.slice(ri + 1).filter(a => !a.startsWith('--')) : [];
  if (cols.length < 2) { console.log('Give at least two column headings: node tools/table.mjs --new "Question" "A" "B" --rows "First" "Second"'); process.exit(1); }
  if (labels.length === 1 && /^\d+$/.test(labels[0])) labels = Array(+labels[0]).fill('');
  if (!labels.length) labels = ['', '', ''];
  console.log(render([cols, ...labels.map(l => [l])], cols.map(() => '---')).join('\n'));
} else if (has('--csv')) {
  const file = args[args.indexOf('--csv') + 1];
  if (!file || !fs.existsSync(file)) { console.log('Usage: node tools/table.mjs --csv <file.csv or file.tsv>'); process.exit(1); }
  const rows = csvRows(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  if (!rows.length) { console.log('That file has no rows.'); process.exit(1); }
  console.log(render(rows, rows[0].map(() => '---')).join('\n'));
} else {
  const check = has('--check'); const all = has('--all');
  const title = args.filter(a => !a.startsWith('--')).join(' ').trim();
  if (!all && !title) { console.log('Usage: node tools/table.mjs "Note Title" [--check]   |   --all [--check]   |   --new "Col" "Col" --rows "Row" …   |   --csv file'); process.exit(1); }
  const notes = readNotes({ withGit: false });
  const pick = all ? notes : notes.filter(n => String(n.fields.title ?? '').toLowerCase() === title.toLowerCase() || (n.fields.id || '').toLowerCase() === title.toLowerCase());
  if (!pick.length) { console.log(`No note titled "${title}".`); process.exit(1); }
  let total = 0, left = 0;
  for (const n of pick) {
    const r = tidy(n.raw);
    if (r.skipped) { left += r.skipped; console.log(`left ${r.skipped} table${r.skipped === 1 ? '' : 's'} alone in ${n.path} (a cell has an unusual $ or \` in it; tidy it by hand)`); }
    if (!all && !r.tables) console.log(`${n.path}: no tables.`);
    if (!r.changed) { if (!all && r.tables) console.log(`${n.path}: ${r.tables} table${r.tables === 1 ? '' : 's'}, already tidy.`); continue; }
    total += r.changed;
    if (!check) fs.writeFileSync(n.file, r.text);
    console.log(`${check ? 'would tidy' : 'tidied'} ${r.changed} of ${r.tables} table${r.tables === 1 ? '' : 's'} in ${n.path}`);
  }
  if (all) console.log(total ? `\n${total} table${total === 1 ? '' : 's'} ${check ? 'need tidying' : 'tidied'}.` : 'Every table is already tidy.');
}

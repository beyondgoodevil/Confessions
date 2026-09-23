// Shared helpers for the tools. Section placement and address numbering here
// deliberately match assets/app.js, so the tools and the site always agree.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const NOTE_EXT = /\.(md|markdown)$/i;
export const MEDIA_EXT = /\.(png|jpe?g|gif|svg|webp|avif|bmp|pdf)$/i;
export const today = () => new Date().toISOString().slice(0, 10);
export const slug = s => String(s ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/['’`]/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
export const rel = p => path.relative(ROOT, p).split(path.sep).join('/');

export function loadConfig() {
  const file = path.join(ROOT, 'config.json');
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { throw new Error(`config.json is not valid JSON: ${e.message}`); }
}

export function walk(dir, { skipHidden = true } = {}) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (e.name.startsWith('.') || (skipHidden && e.name.startsWith('_'))) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p, { skipHidden }) : [p];
  });
}

export function gitDates(file) {
  try {
    const out = execFileSync('git', ['log', '--follow', '--format=%cs', '--', file], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .trim().split('\n').filter(Boolean);
    return out.length ? { updated: out[0], created: out[out.length - 1] } : {};
  } catch { return {}; }
}

// Minimal front-matter reader: enough for id / type / date / section / medium.
export function readFrontMatter(raw) {
  const m = raw.match(/^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!m) return { has: false, fields: {}, inner: '' };
  const fields = {};
  for (const line of m[1].split(/\r?\n/)) {
    const k = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (k) fields[k[1].toLowerCase()] = k[2].replace(/\s+#.*$/, '').trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return { has: true, fields, inner: m[1] };
}

// Add fields that are missing or empty; never touches anything else in the file.
export function addFields(raw, add) {
  const fm = readFrontMatter(raw);
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const todo = Object.entries(add).filter(([k, v]) => v && !fm.fields[k]);
  if (!todo.length) return raw;
  if (!fm.has) return `---${eol}${todo.map(([k, v]) => `${k}: ${v}`).join(eol)}${eol}---${eol}${eol}` + raw.replace(/^\uFEFF/, '');
  let inner = fm.inner; const prepend = [];
  for (const [k, v] of todo) {
    const re = new RegExp(`^${k}[ \\t]*:[ \\t]*$`, 'mi');
    if (re.test(inner)) inner = inner.replace(re, `${k}: ${v}`); else prepend.push(`${k}: ${v}`);
  }
  if (prepend.length) inner = prepend.join(eol) + eol + inner;
  const start = raw.indexOf(fm.inner);
  return raw.slice(0, start) + inner + raw.slice(start + fm.inner.length);
}

export function sections(cfg) {
  return (cfg.sections || []).map(s => ({
    ...s, id: s.id || slug(s.name), folder: s.folder || s.id, aliases: (s.aliases || []).map(slug),
    subsections: (s.subsections || []).map(u => ({ ...u, id: u.id || slug(u.name), folder: u.folder || u.id, aliases: (u.aliases || []).map(slug) }))
  }));
}
export function matchType(secs, t) {
  const k = slug(t); if (!k) return null;
  for (const sec of secs) {
    if ([sec.id, slug(sec.name), slug(sec.folder), ...sec.aliases].includes(k)) return { sec };
    for (const sub of sec.subsections) if ([sub.id, slug(sub.name), slug(sub.folder), ...sub.aliases].includes(k)) return { sec, sub };
  }
  return null;
}
// relPath is relative to notes/, e.g. "media/podcasts/x.md"
export function placeNote(secs, cfg, relPath, fields) {
  const parts = relPath.split('/');
  let sec = null, sub = null;
  const typed = matchType(secs, fields.section) || matchType(secs, fields.type);
  if (typed) ({ sec, sub = null } = typed);
  if (!sec) sec = secs.find(s => slug(s.folder) === slug(parts[0])) || null;
  if (!sec) sec = secs.find(s => s.id === cfg.defaultSection) || secs[secs.length - 1];
  const want = fields.medium || fields.subsection || fields.format;
  if (want) sub = sec.subsections.find(u => [u.id, slug(u.name), ...u.aliases].includes(slug(want))) || sub;
  if (!sub && parts.length > 2) sub = sec.subsections.find(u => slug(u.folder) === slug(parts[1])) || null;
  if (!sub && sec.subsections.length) sub = sec.subsections[sec.subsections.length - 1];
  return { sec, sub };
}

// Every note in notes/, with what the numbering needs.
export function readNotes({ withGit = true } = {}) {
  return walk(path.join(ROOT, 'notes')).filter(f => NOTE_EXT.test(f)).sort().map(f => {
    const raw = fs.readFileSync(f, 'utf8');
    const r = rel(f);
    return { file: f, path: r, raw, fields: readFrontMatter(raw).fields, ...(withGit ? gitDates(r) : {}) };
  });
}

// Addresses for notes that lack one: same rule as the site (after the highest in use, oldest first).
export function planIds(notes, cfg) {
  const secs = sections(cfg);
  const idOk = v => /^[A-Za-z]+-\d+$/.test(v || '');
  const time = n => Date.parse(n.fields.date || n.fields.created || n.created || '') || 0;
  const plan = new Map(); const seen = new Set(); const warnings = [];
  for (const sec of secs) {
    const mine = notes.filter(n => placeNote(secs, cfg, n.path.replace(/^notes\//, ''), n.fields).sec === sec);
    const used = new Set(); const autos = [];
    for (const n of mine) {
      const id = (n.fields.id || '').toUpperCase();
      if (idOk(id) && !seen.has(id)) { seen.add(id); if (id.startsWith(sec.prefix + '-')) used.add(+id.split('-')[1]); }
      else { if (idOk(id)) warnings.push(`${n.path}: address ${id} is already used by another note`); else autos.push(n); }
    }
    autos.sort((a, b) => time(a) - time(b) || a.path.localeCompare(b.path));
    let k = used.size ? Math.max(...used) : 0;   // always after the highest address in use; deleted addresses are never reused
    for (const n of autos) { k++; plan.set(n.path, `${sec.prefix}-${String(k).padStart(4, '0')}`); }
  }
  return { plan, warnings };
}

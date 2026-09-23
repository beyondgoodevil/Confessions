// Collects every Markdown file under notes/ into notes.json and assembles the
// finished site in _site/. Run: node tools/build.mjs   (GitHub Actions runs it for you.)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOTE_EXT = /\.(md|markdown)$/i;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (e.name.startsWith('.') || e.name.startsWith('_')) return [];   // _drafts, _templates etc. are skipped
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

function gitDates(file) {
  try {
    const out = execFileSync('git', ['log', '--follow', '--format=%cs', '--', file], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .trim().split('\n').filter(Boolean);
    return out.length ? { updated: out[0], created: out[out.length - 1] } : {};
  } catch { return {}; }
}

const isDraft = raw => {
  const fm = raw.match(/^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---/);
  return !!fm && /^draft:\s*true\s*$/m.test(fm[1]);
};

export function collectNotes({ withGit = true } = {}) {
  const files = walk(path.join(ROOT, 'notes')).filter(f => NOTE_EXT.test(f)).sort();
  const notes = [];
  let drafts = 0;
  for (const f of files) {
    const raw = fs.readFileSync(f, 'utf8');
    if (isDraft(raw)) { drafts++; continue; }
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    const stat = fs.statSync(f);
    const git = withGit ? gitDates(rel) : {};
    notes.push({ path: rel, raw, created: git.created || null, updated: git.updated || stat.mtime.toISOString().slice(0, 10) });
  }
  return { notes, drafts };
}

function copy(src) {
  const s = path.join(ROOT, src);
  if (!fs.existsSync(s)) return;
  fs.cpSync(s, path.join(ROOT, '_site', src), { recursive: true, filter: p => !path.basename(p).startsWith('.') });
}

export function build() {
  JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));   // fail early on a broken config
  const out = path.join(ROOT, '_site');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  for (const f of ['index.html', 'config.json', 'assets', 'notes']) copy(f);
  const { notes, drafts } = collectNotes();
  fs.writeFileSync(path.join(out, 'notes.json'), JSON.stringify({ generated: new Date().toISOString(), notes }));
  fs.writeFileSync(path.join(out, '.nojekyll'), '');
  console.log(`Built ${notes.length} note${notes.length === 1 ? '' : 's'} into _site/${drafts ? ` (${drafts} draft${drafts === 1 ? '' : 's'} skipped)` : ''}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { build(); } catch (e) { console.error('Build failed:', e.message); process.exit(1); }
}

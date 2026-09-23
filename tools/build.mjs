// Collects every Markdown file under notes/ into notes.json and assembles the
// finished site in _site/. Run: node tools/build.mjs   (GitHub Actions runs it for you.)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, NOTE_EXT, MEDIA_EXT, walk, gitDates, rel, loadConfig } from './lib.mjs';
export { ROOT };

const isDraft = raw => {
  const fm = raw.match(/^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---/);
  return !!fm && /^draft:\s*true\s*$/m.test(fm[1]);
};

export function collectNotes({ withGit = true } = {}) {
  const all = walk(path.join(ROOT, 'notes'));
  const notes = []; let drafts = 0;
  for (const f of all.filter(f => NOTE_EXT.test(f)).sort()) {
    const raw = fs.readFileSync(f, 'utf8');
    if (isDraft(raw)) { drafts++; continue; }
    const r = rel(f);
    const git = withGit ? gitDates(r) : {};
    notes.push({ path: r, raw, created: git.created || null, updated: git.updated || fs.statSync(f).mtime.toISOString().slice(0, 10) });
  }
  const files = all.filter(f => MEDIA_EXT.test(f)).map(rel).sort();
  return { notes, files, drafts };
}

function copy(src) {
  const s = path.join(ROOT, src);
  if (!fs.existsSync(s)) return;
  fs.cpSync(s, path.join(ROOT, '_site', src), { recursive: true, filter: p => !path.basename(p).startsWith('.') });
}

export function build() {
  loadConfig();   // fail early on a broken config
  const out = path.join(ROOT, '_site');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  for (const f of ['index.html', 'write.html', 'config.json', 'assets', 'notes']) copy(f);
  const { notes, files, drafts } = collectNotes();
  fs.writeFileSync(path.join(out, 'notes.json'), JSON.stringify({ generated: new Date().toISOString(), notes, files }));
  fs.writeFileSync(path.join(out, '.nojekyll'), '');
  console.log(`Built ${notes.length} note${notes.length === 1 ? '' : 's'} into _site/${drafts ? ` (${drafts} draft${drafts === 1 ? '' : 's'} skipped)` : ''}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { build(); } catch (e) { console.error('Build failed:', e.message); process.exit(1); }
}

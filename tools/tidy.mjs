// Clean up after deleted notes: take them out of every Related list and guide (renumbering the lists),
// and turn links to them inside sentences into plain text, so nothing points at a note that is gone.
//   node tools/tidy.mjs                 notes deleted since the last commit (deleted in Obsidian, not yet published)
//   node tools/tidy.mjs --since <rev>   notes deleted between <rev> and now (what the deploy uses)
//   node tools/tidy.mjs --dry           say what would change, touch nothing
// It runs by itself when you publish (Obsidian plugin, npm run publish) and on every deploy, and the Writer
// page does the same clean-up in the commit that deletes the note. The rules live in assets/tidy-core.js.
// A deleted note's address is never reused, so links people saved elsewhere simply stop at "not found".
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { ROOT, readNotes, readFrontMatter, NOTE_EXT } from './lib.mjs';

await import(pathToFileURL(path.join(ROOT, 'assets', 'tidy-core.js')).href);
const { unlink } = globalThis.CommonplaceTidy;
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 28 });

// The notes that existed at `rev` and are gone now: [{ path, title, id, aliases }]
export function deletedSince(rev) {
  let names = '';
  try { names = rev ? git('diff', '--name-status', '--diff-filter=D', '-z', rev, 'HEAD', '--', 'notes') : ''; } catch { return []; }
  const gone = new Set();
  const parse = out => { const p = out.split('\0').filter(Boolean); for (let i = 0; i + 1 < p.length; i += 2) if (p[i].startsWith('D')) gone.add(p[i + 1]); };
  parse(names);
  try { parse(git('diff', '--name-status', '--diff-filter=D', '-z', 'HEAD', '--', 'notes')); } catch {}          // deleted on disk, not committed
  try { parse(git('diff', '--cached', '--name-status', '--diff-filter=D', '-z', 'HEAD', '--', 'notes')); } catch {}
  const out = [];
  for (const p of gone) {
    if (!NOTE_EXT.test(p) || fs.existsSync(path.join(ROOT, p))) continue;       // renamed-back or recreated files are not deletions
    let raw = '';
    for (const from of [rev, 'HEAD'].filter(Boolean)) { try { raw = git('show', `${from}:${p}`); if (raw) break; } catch {} }
    const f = readFrontMatter(raw).fields;
    const al = (raw.match(/^aliases?\s*:\s*\[(.*)\]\s*$/mi) || [])[1];
    out.push({ path: p, title: String(f.title ?? '').replace(/\\"/g, '"'), id: f.id || '', aliases: al ? al.split(',').map(a => a.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean) : [] });
  }
  return out;
}

// Applies the clean-up for `targets`. Returns { files: [{ path, removed, unlinked }], targets }.
export function tidy(targets, { dry = false } = {}) {
  const notes = readNotes({ withGit: false });
  // a title, alias or file name that a surviving note also answers to must be left alone
  const alive = new Set(); for (const n of notes) { for (const k of [n.fields.title, n.fields.id, n.path.split('/').pop().replace(NOTE_EXT, '')]) if (k) alive.add(String(k).toLowerCase()); }
  const safe = targets.map(t => ({ ...t, title: alive.has(String(t.title).toLowerCase()) ? '' : t.title, id: alive.has(String(t.id).toLowerCase()) ? '' : t.id,
    aliases: (t.aliases || []).filter(a => !alive.has(a.toLowerCase())), path: alive.has(t.path.split('/').pop().replace(NOTE_EXT, '').toLowerCase()) ? '' : t.path }));
  const files = [];
  if (!safe.length) return { files, targets };
  for (const n of notes) {
    const r = unlink(n.raw, safe);
    if (!r.changed) continue;
    if (!dry) fs.writeFileSync(n.file, r.text);
    files.push({ path: n.path, removed: r.removed, unlinked: r.unlinked });
  }
  return { files, targets };
}

export function report({ files, targets }, dry) {
  if (!targets.length) return 'No deleted notes to clean up after.';
  const names = targets.map(t => `${t.id ? t.id + ' ' : ''}${t.title || t.path}`).join('; ');
  if (!files.length) return `Deleted: ${names}. Nothing linked to ${targets.length === 1 ? 'it' : 'them'}.`;
  const rem = files.reduce((s, f) => s + f.removed, 0), unl = files.reduce((s, f) => s + f.unlinked, 0);
  return `Deleted: ${names}.\n${dry ? 'Would take' : 'Took'} ${rem} list entr${rem === 1 ? 'y' : 'ies'} out of Related lists and guides and turn${dry ? '' : 'ed'} ${unl} link${unl === 1 ? '' : 's'} in sentences into plain text, in ${files.length} note${files.length === 1 ? '' : 's'}:\n`
    + files.map(f => `  ${f.path}${f.unlinked ? `  (${f.unlinked} in the text: reread the sentence)` : ''}`).join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2), dry = args.includes('--dry');
  const si = args.indexOf('--since'); let since = si >= 0 ? args[si + 1] : '';
  if (since && /^0+$/.test(since)) since = '';                       // a brand-new branch has no "before"
  if (since) { try { git('cat-file', '-e', since + '^{commit}'); } catch { since = ''; } }
  const result = tidy(deletedSince(since), { dry });
  console.log(report(result, dry));
}

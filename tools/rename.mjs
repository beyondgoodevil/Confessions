// Retitle a note and fix every [[link]] to it, in one go.
//   node tools/rename.mjs "Old Title" "New Title"
//   node tools/rename.mjs M-0416 "New Title"            (the address works in place of the old title)
//   node tools/rename.mjs "Old Title" "New Title" --dry         show what would change, touch nothing
//   node tools/rename.mjs "Old Title" "New Title" --keep-file   change the title and links but leave the file name alone
// What it does: sets title: in the note, keeps the old title as an alias (so anything you type from memory still
// resolves), rewrites [[Old Title]], [[Old Title|shown text]] and [[Old Title#Heading]] in every note, and renames the
// file to match (with git mv, so the note keeps its history). The address (M-0416) never changes, so shared links
// keep working. Nothing is committed: look at the result, then publish with  npm run publish "Rename …".
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, readNotes, slug, rel } from './lib.mjs';

const args = process.argv.slice(2);
const dry = args.includes('--dry'), keepFile = args.includes('--keep-file');
const [oldArg, newTitle] = args.filter(a => !a.startsWith('--')).map(s => s.trim());
if (!oldArg || !newTitle) { console.log('Usage: node tools/rename.mjs "Old Title" "New Title" [--dry] [--keep-file]'); process.exit(1); }

const notes = readNotes({ withGit: false });
const titleOf = n => String(n.fields.title ?? '');
const base = n => n.path.split('/').pop().replace(/\.(md|markdown)$/i, '');
const aliasesOf = n => { const m = n.raw.match(/^aliases?\s*:\s*\[(.*)\]\s*$/mi); return m ? m[1].split(',').map(a => a.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean) : []; };
const note = notes.find(n => titleOf(n).toLowerCase() === oldArg.toLowerCase()) || notes.find(n => (n.fields.id || '').toLowerCase() === oldArg.toLowerCase());
if (!note) { console.log(`No note titled "${oldArg}".`); process.exit(1); }
const oldTitle = titleOf(note) || base(note);
if (oldTitle === newTitle) { console.log('That is already its title.'); process.exit(0); }

// the new title must not belong to another note (as title, alias or file name), or [[New Title]] would be ambiguous
const clash = notes.find(n => n !== note && (slug(titleOf(n)) === slug(newTitle) || slug(base(n)) === slug(newTitle) || aliasesOf(n).some(a => slug(a) === slug(newTitle))));
if (clash) { console.log(`"${newTitle}" already points at ${clash.path} (its title, an alias or its file name). Pick another title.`); process.exit(1); }

const isGuide = /^guide:\s/i.test(newTitle);
const newBase = slug(newTitle.replace(/^guide:\s*/i, ''));
const newFile = path.join(path.dirname(note.file), newBase + path.extname(note.file));
const moveFile = !keepFile && path.resolve(newFile) !== path.resolve(note.file);
if (moveFile && fs.existsSync(newFile) && newFile.toLowerCase() !== note.file.toLowerCase()) { console.log(`${rel(newFile)} already exists. Use --keep-file, or pick another title.`); process.exit(1); }

// which link targets mean this note: its old title, its old file name, or anything that slugs to either
const oldKeys = new Set([slug(oldTitle), slug(base(note))]);
const points = t => { const k = t.trim(); return k.toLowerCase() === oldTitle.toLowerCase() || oldKeys.has(slug(k)); };
function relink(text) {
  let count = 0;
  const parts = text.split(/(^[ \t]*(?:```|~~~)[\s\S]*?^[ \t]*(?:```|~~~)[ \t]*$)/m);   // leave fenced code alone
  const out = parts.map((p, i) => i % 2 ? p : p.replace(/(!?\[\[)([^\[\]\n|#]+?)((?:#[^\[\]\n|]*)?(?:\\?\|[^\[\]\n]*)?\]\])/g, (m, a, target, b) => {
    if (!points(target) || /\.(png|jpe?g|gif|svg|webp|avif|bmp|pdf)$/i.test(target.trim())) return m;
    count++; return a + newTitle + b;
  }));
  return { text: out.join(''), count };
}

const plan = [];   // [note, newRaw, linkCount]
for (const n of notes) {
  let raw = n.raw, links = 0;
  const fmEnd = raw.match(/^﻿?---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/);
  const head = fmEnd ? fmEnd[0] : '', bodyText = raw.slice(head.length);
  const r = relink(bodyText); links = r.count;
  let newHead = head;
  if (n === note) {
    const nl = raw.includes('\r\n') ? '\r\n' : '\n';
    const titleLine = `title: ${JSON.stringify(newTitle)}`;
    if (/^title[ \t]*:.*$/m.test(newHead)) newHead = newHead.replace(/^title[ \t]*:.*$/m, () => titleLine);
    else if (newHead) newHead = newHead.replace(/^(﻿?---[ \t]*\r?\n)/, (m, a) => a + titleLine + nl);
    else newHead = `---${nl}${titleLine}${nl}---${nl}${nl}`;
    // keep the old title as an alias, when it can sit in an inline list (no comma or bracket in it)
    const have = aliasesOf(n).some(a => a.toLowerCase() === oldTitle.toLowerCase());
    if (!have && !/[,\[\]"]/.test(oldTitle)) {
      const oldAlias = /^[\p{L}\p{N}][\p{L}\p{N} .'’()-]*$/u.test(oldTitle) ? oldTitle : JSON.stringify(oldTitle);   // quote it if YAML could misread it (a colon, say)
      if (/^aliases?[ \t]*:[ \t]*\[.*\][ \t]*$/m.test(newHead)) newHead = newHead.replace(/^(aliases?[ \t]*:[ \t]*\[)(.*)(\][ \t]*)$/m, (m, a, inner, c) => a + (inner.trim() ? inner.trim() + ', ' : '') + oldAlias + c);
      else if (!/^aliases?[ \t]*:/m.test(newHead)) newHead = newHead.replace(/(\r?\n)---[ \t]*(\r?\n|$)$/, (m, a, b) => `${a}aliases: [${oldAlias}]${a}---${b}`);
    }
  }
  const next = newHead + r.text;
  if (next !== raw) plan.push([n, next, links]);
}

const linkTotal = plan.reduce((s, p) => s + p[2], 0);
console.log(`${dry ? 'Would rename' : 'Renaming'} ${note.fields.id || note.path}`);
console.log(`  from: ${oldTitle}\n  to:   ${newTitle}`);
if (/[,\[\]"]/.test(oldTitle)) console.log('  (the old title has a comma, bracket or quote in it, so it is not kept as an alias)');
for (const [n, , links] of plan) if (n !== note || links) console.log(`  ${links} link${links === 1 ? '' : 's'} in ${n.path}`);
console.log(`  ${linkTotal} link${linkTotal === 1 ? '' : 's'} in ${plan.filter(p => p[2]).length} note${plan.filter(p => p[2]).length === 1 ? '' : 's'}`);
if (moveFile) console.log(`  file: ${note.path} → ${rel(newFile)}`);
if (isGuide !== /^guide:\s/i.test(oldTitle)) console.log('  note: guide titles start with "Guide: "; check this is what you meant.');
if (dry) { console.log('\n(dry run: nothing changed)'); process.exit(0); }

for (const [n, next] of plan) fs.writeFileSync(n.file, next);
if (moveFile) {
  const tracked = (() => { try { return execFileSync('git', ['ls-files', '--', note.path], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return ''; } })();
  if (tracked) execFileSync('git', ['mv', '-f', note.path, rel(newFile)], { cwd: ROOT, stdio: 'inherit' });
  else fs.renameSync(note.file, newFile);
}
console.log(`\nDone. Check it with  npm run check , then publish with  npm run publish "Rename ${oldTitle.replace(/"/g, "'")}"`);

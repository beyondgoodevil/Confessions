// Publish one note, the whole routine: pull, stamp its address, add backlinks, build, check,
// make sure it will get a contents box, then commit and push.
//   node tools/publish-note.mjs "New Note Title" "Related Note A" "Related Note B" ...
//   node tools/publish-note.mjs "New Note Title" --dry                (everything except commit and push)
//   node tools/publish-note.mjs "New Note Title" ... --trailer "Co-Authored-By: Name <email>"
// The commit message is "Add note: <title>" (or "Update note: …" if the note was already published),
// with "; backlink related notes" when related notes were given. Only files under notes/ are committed.
import { execSync, execFileSync } from 'node:child_process';
import { ROOT, readNotes } from './lib.mjs';

const argv = process.argv.slice(2), dry = argv.includes('--dry');
const tAt = argv.indexOf('--trailer'), trailer = tAt >= 0 ? argv[tAt + 1] : '';
const [title, ...related] = argv.filter((a, i) => a !== '--dry' && (tAt < 0 || (i !== tAt && i !== tAt + 1)));
if (!title) { console.log('Usage: node tools/publish-note.mjs "Note Title" ["Related Note" ...] [--dry] [--trailer "Co-Authored-By: …"]'); process.exit(1); }

const run = (cmd, quiet = false) => execSync(cmd, { cwd: ROOT, stdio: quiet ? 'ignore' : 'inherit', maxBuffer: 1 << 30 });
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' });
const step = s => console.log(`\n== ${s}`);
const find = () => readNotes({ withGit: false }).find(n => String(n.fields.title ?? '').replace(/\\"/g, '"').toLowerCase() === title.toLowerCase());

try {
  step('Getting the latest version from GitHub'); run('git pull -q --rebase --autostash');
  let note = find();
  if (!note) { console.error(`No note titled "${title}". Check the title: field.`); process.exit(1); }
  const isNew = !git('ls-files', '--', note.path).trim();

  step('Giving new notes their addresses'); run('node tools/stamp.mjs');
  note = find();
  console.log(`${note.path} → ${note.fields.id || '(no address)'}`);

  if (related.length) { step('Adding backlinks'); execFileSync('node', ['tools/link.mjs', title, ...related], { cwd: ROOT, stdio: 'inherit' }); }

  step('Checking the note itself');
  const body = note.raw.replace(/^﻿?---[\s\S]*?\n---[ \t]*\r?\n/, '');
  const heads = [...body.matchAll(/^(#{2,3})[ \t]+(.+?)\s*$/gm)].map(m => ({ level: m[1].length, text: m[2] }));
  const count = l => heads.filter(h => h.level === l && !/^(related|conclusion)$/i.test(h.text)).length;
  const problems = [], warnings = [];
  // the site draws a contents box from whichever heading level has two or more sections (assets/app.js, viewNote)
  if (count(2) < 2 && count(3) < 2) problems.push('no contents box: it needs at least two "### N. …" (or "## …") sections');
  if (!heads.some(h => /^conclusion$/i.test(h.text))) warnings.push('no "### Conclusion" section');
  if (!heads.some(h => h.level === 2 && /^related$/i.test(h.text))) warnings.push('no "## Related" list');
  for (const k of ['summary', 'tags', 'date']) if (!note.fields[k]) warnings.push(`no ${k}: in the front matter`);
  if (note.path.startsWith('notes/misc/') && !note.fields.source) warnings.push('no source: line (Miscellany notes cite their sources there)');
  console.log(`${count(3) || count(2)} sections${heads.some(h => /^conclusion$/i.test(h.text)) ? ' + Conclusion' : ''}`);
  for (const w of warnings) console.log(`  warning: ${w}`);
  for (const p of problems) console.log(`  PROBLEM: ${p}`);

  step('Building the site'); run('node tools/build.mjs', true); console.log('built.');
  step('Checking links and front matter'); run('node tools/check.mjs');
  if (problems.length) { console.error('\nStopped before committing: fix the problem above and run this again.'); process.exit(1); }
  if (dry) { console.log('\n(dry run: nothing committed)'); process.exit(0); }

  step('Saving and uploading');
  run('git add -A notes');
  if (!git('diff', '--cached', '--name-only').trim()) { console.log('Nothing to publish.'); process.exit(0); }
  const msg = `${isNew ? 'Add' : 'Update'} note: ${title}${related.length ? '; backlink related notes' : ''}`;
  execFileSync('git', ['commit', '-q', '-m', msg, ...(trailer ? ['-m', trailer] : [])], { cwd: ROOT, stdio: 'inherit' });
  run('git pull -q --rebase --autostash'); run('git push -q');
  console.log(`\nPublished: ${git('log', '--oneline', '-1').trim()}\nThe website updates in a minute or two.`);
} catch (e) {
  console.error('\nStopped: the step above failed. Fix the message shown and run this again.'); process.exit(1);
}

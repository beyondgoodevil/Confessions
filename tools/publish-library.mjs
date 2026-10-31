// Publish the PDF library: pull, check the files, build, then commit library/ and push.
//   node tools/publish-library.mjs                 (commit and push everything new or changed under library/)
//   node tools/publish-library.mjs --dry           (check and build only)
//   node tools/publish-library.mjs --trailer "Co-Authored-By: Name <email>"
// GitHub refuses any single file over 100 MB and warns above 50 MB; this stops before either happens.
import fs from 'node:fs';
import path from 'node:path';
import { execSync, execFileSync } from 'node:child_process';
import { ROOT, walk, rel } from './lib.mjs';
import { build, collectLibrary } from './build.mjs';

const argv = process.argv.slice(2), dry = argv.includes('--dry');
const tAt = argv.indexOf('--trailer'), trailer = tAt >= 0 ? argv[tAt + 1] : '';
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' });
const MB = 1024 * 1024;

try {
  console.log('== Getting the latest version from GitHub'); execSync('git pull -q --rebase --autostash', { cwd: ROOT, stdio: 'inherit' });
  console.log('\n== Checking the library');
  const files = walk(path.join(ROOT, 'library'));
  const big = files.filter(f => fs.statSync(f).size > 100 * MB), large = files.filter(f => fs.statSync(f).size > 50 * MB && !big.includes(f));
  for (const f of large) console.log(`  warning: ${rel(f)} is ${(fs.statSync(f).size / MB).toFixed(0)} MB (GitHub accepts it, but it makes the site slow to deploy)`);
  if (big.length) {
    for (const f of big) console.error(`  too large: ${rel(f)} is ${(fs.statSync(f).size / MB).toFixed(0)} MB; GitHub's limit is 100 MB per file. Compress it or split it.`);
    process.exit(1);
  }
  const lib = collectLibrary({ withGit: false });   // also checks that library/library.json parses
  console.log(`  ${lib.items.length} PDF(s) in ${lib.channels.length} channel(s)`);
  console.log('\n== Building the site'); build();
  if (dry) { console.log('\n(dry run: nothing committed)'); process.exit(0); }
  git('add', '--', 'library');
  const staged = git('diff', '--cached', '--name-status', '--', 'library').trim();
  if (!staged) { console.log('\nNothing to publish.'); process.exit(0); }
  const added = staged.split('\n').filter(l => /^A\s.*\.pdf$/i.test(l)).length;
  const msg = `Update library${added ? `: add ${added} PDF${added === 1 ? '' : 's'}` : ''}${trailer ? `\n\n${trailer}` : ''}`;
  git('commit', '-q', '-m', msg, '--', 'library');
  console.log('\n== Saving and uploading'); execSync('git push -q', { cwd: ROOT, stdio: 'inherit' });
  console.log(`\nPublished: ${git('log', '-1', '--format=%h %s').trim()}\nThe website updates in a minute or two.`);
} catch (e) { console.error(e.message); process.exit(1); }

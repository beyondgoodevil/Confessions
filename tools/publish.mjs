// One command to publish your changes: pull, stamp addresses, build, check, commit and push.
//   node tools/publish.mjs "What you changed"
//   node tools/publish.mjs --dry      (everything except commit and push)
import { execSync } from 'node:child_process';
import { ROOT } from './lib.mjs';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const msg = args.filter(a => a !== '--dry').join(' ').trim() || 'Update notes';
const run = (cmd, quiet = false) => execSync(cmd, { cwd: ROOT, stdio: quiet ? 'ignore' : 'inherit', maxBuffer: 1 << 30 });
const step = s => console.log(`\n== ${s}`);
try {
  step('Getting the latest version from GitHub'); run('git pull --rebase --autostash');
  step('Giving new notes their addresses');      run('node tools/stamp.mjs');
  step('Building the site');                     run('node tools/build.mjs', true); console.log('built.');
  step('Checking links and front matter');       run('node tools/check.mjs');
  if (dry) { console.log('\n(dry run: nothing committed)'); process.exit(0); }
  const changes = execSync('git status --porcelain', { cwd: ROOT }).toString().trim();
  if (!changes) { console.log('\nNothing to publish.'); process.exit(0); }
  step('Saving and uploading'); run('git add -A'); run(`git commit -q -m ${JSON.stringify(msg)}`); run('git push -q');
  console.log('\nPublished. The website updates in a minute or two.');
} catch (e) {
  console.error('\nStopped: the step above failed. Fix the message shown and run this again.'); process.exit(1);
}

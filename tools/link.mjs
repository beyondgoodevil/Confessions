// Add a backlink to a note under the "## Related" heading of other notes.
//   node tools/link.mjs "New Note Title" "Existing Note A" "Existing Note B" ...
// Each existing note gets "- [[New Note Title]]" added at the top of its Related list
// (a "## Related" heading is created at the end if the note has none). Already-present links are skipped.
import fs from 'node:fs';
import { readNotes } from './lib.mjs';

const [target, ...others] = process.argv.slice(2);
if (!target || !others.length) { console.log('Usage: node tools/link.mjs "New Note Title" "Existing Note" ["Another"...]'); process.exit(1); }
const notes = readNotes({ withGit: false });
const byTitle = new Map(notes.map(n => [String(n.fields.title ?? '').toLowerCase(), n]));
if (!byTitle.has(target.toLowerCase())) console.warn(`Note: no note titled "${target}" yet (links are added anyway).`);
let bad = 0;
for (const t of others) {
  const n = byTitle.get(t.toLowerCase());
  if (!n) { console.log(`✗ no note titled "${t}"`); bad++; continue; }
  const raw = fs.readFileSync(n.file, 'utf8');
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  const line = `- [[${target}]]`;
  if (raw.includes(`[[${target}]]`)) { console.log(`= ${n.path} already links to it`); continue; }
  const m = raw.match(/^## Related[ \t]*\r?\n(\r?\n)?/m);
  const next = m ? raw.slice(0, m.index + m[0].length) + (m[1] ? '' : nl) + line + nl + raw.slice(m.index + m[0].length)
                 : raw.replace(/\s*$/, '') + nl + nl + '## Related' + nl + nl + line + nl;
  fs.writeFileSync(n.file, next);
  console.log(`✓ ${n.path}`);
}
process.exit(bad ? 1 : 0);

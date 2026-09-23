// Gives every note without an address its permanent `id:` (and a `date:` if missing).
// GitHub runs this on every push and commits the result, so you never have to.
//   node tools/stamp.mjs            write the changes
//   node tools/stamp.mjs --check    only list what would change
import fs from 'node:fs';
import { loadConfig, readNotes, planIds, addFields, today } from './lib.mjs';

const check = process.argv.includes('--check');
const cfg = loadConfig();
const notes = readNotes();
const { plan, warnings } = planIds(notes, cfg);
let changed = 0;
for (const n of notes) {
  const add = { id: plan.get(n.path), date: n.fields.date || n.fields.created ? '' : (n.created || today()) };
  const next = addFields(n.raw, add);
  if (next === n.raw) continue;
  changed++;
  console.log(`${check ? 'Would stamp' : 'Stamped'} ${n.path}${add.id ? ` -> ${add.id}` : ''}${add.date ? ` (date ${add.date})` : ''}`);
  if (!check) fs.writeFileSync(n.file, next);
}
warnings.forEach(w => console.warn('Warning: ' + w));
console.log(changed ? `${changed} note${changed === 1 ? '' : 's'} ${check ? 'need' : 'got'} an address or date.` : 'Every note already has an address.');

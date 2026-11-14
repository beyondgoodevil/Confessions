// What the Obsidian plugin (.obsidian/plugins/publish-confessions) runs. Every command prints one line of JSON
// starting with "RESULT " at the end; lines before it are progress messages. You can run it by hand too.
//   node tools/obsidian.mjs inspect notes/misc/my-note.md         what's wrong with the note, and notes worth linking
//   node tools/obsidian.mjs publish notes/misc/my-note.md [--related '["Title A","Title B"]'] [--force]
//        pull, give the note its address, add it to the ticked notes' Related lists (and them to its own),
//        commit everything under notes/ and push. Stops on a PROBLEM unless --force. No local site build:
//        GitHub builds the site when the push arrives, which is what makes this quick.
//   node tools/obsidian.mjs publish-all ["message"]                same, for every changed file in the vault
//   node tools/obsidian.mjs fix notes/misc/my-note.md quote-summary   apply a named fix
//   node tools/obsidian.mjs status                                 changed notes not yet published
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, loadConfig, readNotes, planIds, addFields, today, slug } from './lib.mjs';
import { rank } from './suggest.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const flag = k => { const i = rest.indexOf('--' + k); return i < 0 ? null : (rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[i + 1] : true); };
const positional = rest.filter((a, i) => !a.startsWith('--') && !(i > 0 && rest[i - 1] === '--related'));
const say = s => console.log(s);
const done = o => { console.log('RESULT ' + JSON.stringify(o)); process.exit(o.ok === false ? 1 : 0); };
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const gitErr = e => String((e.stderr || '') + (e.stdout || '') || e.message).trim().split('\n').slice(-6).join('\n');

const baseName = p => p.split('/').pop().replace(/\.(md|markdown)$/i, '');
const titleOf = n => String(n.fields.title ?? '').replace(/\\"/g, '"') || baseName(n.path);
const bodyOf = raw => raw.replace(/^﻿?---[\s\S]*?\n---[ \t]*\r?\n/, '');
const headLines = raw => { const m = raw.match(/^﻿?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/); return m ? m[0].split(/\r?\n/).length - 1 : 0; };
const aliasesOf = n => { const m = n.raw.match(/^aliases?\s*:\s*\[(.*)\]\s*$/mi); return m ? m[1].split(',').map(a => a.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean) : []; };
const lineOf = (raw, re) => { const m = raw.match(re); return m ? raw.slice(0, m.index).split('\n').length : 1; };

function load(relPath) {
  const notes = readNotes({ withGit: false });
  const want = String(relPath || '').split(path.sep).join('/').replace(/^\.\//, '');
  const note = notes.find(n => n.path.toLowerCase() === want.toLowerCase());
  return { notes, note };
}

// a plain YAML value that will not parse: "key: text with: a colon", or one starting with a character YAML reserves
const needsQuotes = v => !!v && !/^(["']).*\1$/.test(v) && !/^[\[{]/.test(v) && (/:\s/.test(v) || /:$/.test(v) || /\s#/.test(v) || /^[&*!|>%@`]/.test(v));

function inspect(note, notes) {
  const raw = note.raw, problems = [], warnings = [];
  const fm = raw.match(/^﻿?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!fm) problems.push({ text: 'No front matter. Start the note with ---, then title:, date:, tags:, summary:, then ---.', line: 1 });
  else fm[1].split(/\r?\n/).forEach((l, i) => {
    const k = l.match(/^([A-Za-z_][\w-]*)[ \t]*:[ \t]*(.*)$/); if (!k) return;
    if (['title', 'summary', 'source', 'author', 'show', 'course'].includes(k[1].toLowerCase()) && needsQuotes(k[2].trim()))
      problems.push({ text: `"${k[1]}:" has a colon (or another character YAML reserves) and is not in quotes, so the front matter will not read.`, line: i + 2, fix: 'quote-' + k[1].toLowerCase(), fixLabel: 'Put it in quotes' });
  });
  const off = headLines(raw);
  const body = bodyOf(raw);
  const heads = [...body.matchAll(/^(#{2,3})[ \t]+(.+?)\s*$/gm)].map(m => ({ level: m[1].length, text: m[2] }));
  const count = l => heads.filter(h => h.level === l && !/^(related|conclusion)$/i.test(h.text)).length;
  if (count(2) < 2 && count(3) < 2) problems.push({ text: 'No contents box: the note needs at least two "### 1. …" sections.', line: off + 1 });
  if (!heads.some(h => /^conclusion$/i.test(h.text))) warnings.push({ text: 'No "### Conclusion" section.', line: raw.split('\n').length });
  if (!heads.some(h => h.level === 2 && /^related$/i.test(h.text))) warnings.push({ text: 'No "## Related" list (ticking a note below adds one).', line: raw.split('\n').length });
  if (!note.fields.title) warnings.push({ text: `No title: line, so the note is called "${baseName(note.path)}" after its file.`, line: 2 });
  for (const k of ['summary', 'tags']) if (!note.fields[k] || note.fields[k] === '[]') warnings.push({ text: `No ${k}: in the front matter.`, line: lineOf(raw, new RegExp(`^${k}[ \\t]*:`, 'm')) });
  if (note.path.startsWith('notes/misc/') && !note.fields.source) warnings.push({ text: 'No source: line (Miscellany notes cite their sources there).', line: lineOf(raw, /^source[ \t]*:/m) });
  if (/^draft[ \t]*:[ \t]*true[ \t]*$/mi.test(fm ? fm[1] : '')) warnings.push({ text: 'draft: true is set, so the note will be saved to GitHub but not shown on the site.', line: lineOf(raw, /^draft[ \t]*:/m) });
  if (/\[\[\]\]/.test(body)) warnings.push({ text: 'An empty [[ ]] link is left over from the outline.', line: lineOf(raw, /\[\[\]\]/) });

  // links that point at nothing
  const key = new Map(); const add = (k, n) => { const s = slug(k); if (s && !key.has(s)) key.set(s, n); };
  for (const n of notes) { if (n.fields.id) key.set(n.fields.id.toLowerCase(), n); add(titleOf(n), n); }
  for (const n of notes) { add(baseName(n.path), n); aliasesOf(n).forEach(a => add(a, n)); }
  const text = body.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g, m => m.replace(/[^\n]/g, ' '));
  const missing = new Map();
  for (const m of text.matchAll(/!?\[\[([^\[\]\n]+?)\]\]/g)) {
    const target = m[1].replace(/\\\|/g, '|').split('|')[0].split('#')[0].trim();
    if (!target || /\.(png|jpe?g|gif|svg|webp|avif|bmp|pdf)$/i.test(target)) continue;
    if (!(key.get(target.toLowerCase()) || key.get(slug(target))) && !missing.has(target)) missing.set(target, off + text.slice(0, m.index).split('\n').length);
  }
  for (const [t, line] of missing) warnings.push({ text: `[[${t}]] points at a note that does not exist yet.`, line });
  const clash = notes.find(n => n !== note && slug(titleOf(n)) === slug(titleOf(note)));
  if (clash) problems.push({ text: `Another note has the same title (${clash.path}), so links to it are ambiguous.`, line: 2 });

  // notes worth linking
  const relBlock = (body.match(/^## Related[ \t]*\r?\n([\s\S]*?)(?=^## |\s*$(?![\s\S]))/m) || [, ''])[1];
  const inRelated = new Set([...relBlock.matchAll(/\[\[([^\]|#]+)/g)].map(m => m[1].trim().toLowerCase()));
  let suggestions = [];
  try {
    const me = { ...note, fields: { ...note.fields, title: titleOf(note) } };
    suggestions = rank(me, notes.map(n => n === note ? me : n), 8).filter(s => s.score > 0.05).map(s => ({
      title: titleOf(s.n), id: s.n.fields.id || '', score: +s.score.toFixed(2), tags: s.shared, from: s.from, to: s.to || inRelated.has(titleOf(s.n).toLowerCase())
    }));
  } catch { /* a note too short to compare */ }
  // notes already listed under Related that do not link back yet come first, ticked
  for (const t of inRelated) {
    const n = key.get(t) || key.get(slug(t)); if (!n || n === note) continue;
    if (suggestions.some(s => s.title.toLowerCase() === titleOf(n).toLowerCase())) continue;
    const from = new RegExp(`\\[\\[${titleOf(note).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\]|#]`, 'i').test(n.raw);
    suggestions.unshift({ title: titleOf(n), id: n.fields.id || '', score: 1, tags: [], from, to: true });
  }
  const tracked = (() => { try { return !!git('ls-files', '--', note.path).trim(); } catch { return false; } })();
  return { title: titleOf(note), id: note.fields.id || '', path: note.path, isNew: !tracked, problems, warnings, suggestions };
}

// add "- [[title]]" under "## Related" (created at the end if missing); returns the new text
function addRelated(raw, title) {
  if (new RegExp(`\\[\\[${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\]|#]`, 'i').test(raw)) return raw;
  const nl = raw.includes('\r\n') ? '\r\n' : '\n', line = `- [[${title}]]`;
  const m = raw.match(/^## Related[ \t]*\r?\n(\r?\n)?/m);
  if (!m) return raw.replace(/\s*$/, '') + nl + nl + '## Related' + nl + nl + line + nl;
  // after the last list item of the Related block
  const start = m.index + m[0].length, restText = raw.slice(start);
  const end = restText.search(/^## /m); const block = end < 0 ? restText : restText.slice(0, end);
  const trimmed = block.replace(/\s*$/, '');
  return raw.slice(0, start) + (m[1] ? '' : nl) + (trimmed ? trimmed + nl : '') + line + nl + (end < 0 ? '' : nl + restText.slice(end));
}

function stampAll() {
  const cfg = loadConfig(); const notes = readNotes({ withGit: false });
  const { plan } = planIds(notes, cfg); const out = [];
  for (const n of notes) {
    const next = addFields(n.raw, { id: plan.get(n.path), date: n.fields.date || n.fields.created ? '' : today() });
    if (next !== n.raw) { fs.writeFileSync(n.file, next); out.push(n.path); }
  }
  return out;
}

function pull() {
  try { git('pull', '-q', '--rebase', '--autostash'); return null; }
  catch (e) {
    try { git('rebase', '--abort'); } catch {}
    return /could not resolve host|unable to access|timed out|network/i.test(gitErr(e)) ? 'offline' : gitErr(e);
  }
}
function push() { try { git('push', '-q'); return null; } catch (e) { return gitErr(e); } }
const siteUrl = () => { try { const m = git('remote', 'get-url', 'origin').trim().match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/); return m ? `https://${m[1].toLowerCase()}.github.io/${m[2]}/` : ''; } catch { return ''; } };

try {
  if (cmd === 'status') {
    const lines = git('status', '--porcelain', '--', 'notes').split('\n').filter(Boolean);
    let ahead = 0; try { ahead = +git('rev-list', '--count', '@{u}..HEAD').trim() || 0; } catch {}
    done({ ok: true, changed: lines.map(l => l.slice(3).replace(/^"|"$/g, '')), ahead, site: siteUrl() });
  }

  if (cmd === 'inspect') {
    const { notes, note } = load(positional[0]);
    if (!note) done({ ok: false, error: `${positional[0]} is not a note under notes/. Only files in the notes folder are published.` });
    done({ ok: true, ...inspect(note, notes), site: siteUrl() });
  }

  if (cmd === 'fix') {
    const { note } = load(positional[0]); const what = positional[1] || '';
    if (!note) done({ ok: false, error: 'No such note.' });
    const k = what.replace(/^quote-/, '');
    if (!what.startsWith('quote-')) done({ ok: false, error: `Unknown fix "${what}".` });
    const fm = note.raw.match(/^﻿?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
    if (!fm) done({ ok: false, error: 'The note has no front matter.' });
    const inner = fm[1].replace(new RegExp(`^(${k}[ \\t]*:[ \\t]*)(.*?)[ \\t]*$`, 'mi'), (m, a, v) => a + JSON.stringify(v));
    fs.writeFileSync(note.file, note.raw.replace(fm[1], () => inner));
    done({ ok: true });
  }

  if (cmd === 'publish') {
    let { notes, note } = load(positional[0]);
    if (!note) done({ ok: false, error: `${positional[0]} is not a note under notes/. Only files in the notes folder are published.` });
    const first = inspect(note, notes);
    if (first.problems.length && !flag('force')) done({ ok: false, error: 'The note has a problem that would show on the site.', problems: first.problems });
    let related = []; try { related = JSON.parse(flag('related') && flag('related') !== true ? flag('related') : '[]'); } catch { related = []; }

    say('Getting the latest version');
    const pulled = pull();
    if (pulled && pulled !== 'offline') done({ ok: false, error: 'Could not get the latest version from GitHub:\n' + pulled });

    say('Giving the note its address');
    stampAll();
    ({ notes, note } = load(positional[0]));
    const title = titleOf(note);

    if (related.length) {
      say(`Linking ${related.length} related note${related.length === 1 ? '' : 's'}`);
      let mine = note.raw;
      for (const t of related) {
        const other = notes.find(n => titleOf(n).toLowerCase() === String(t).toLowerCase()); if (!other || other === note) continue;
        mine = addRelated(mine, titleOf(other));
        const theirs = addRelated(other.raw, title);
        if (theirs !== other.raw) fs.writeFileSync(other.file, theirs);
      }
      if (mine !== note.raw) mine = mine.replace(/^- \[\[\]\][ \t]*\r?\n/m, '');   // the outline's empty placeholder
      if (mine !== note.raw) fs.writeFileSync(note.file, mine);
    }

    say('Saving');
    git('add', '-A', '--', 'notes');
    const staged = git('diff', '--cached', '--name-only').trim();
    let committed = false;
    if (staged) {
      const msg = `${first.isNew ? 'Add' : 'Update'} note: ${title}${related.length ? '; backlink related notes' : ''}`;
      git('commit', '-q', '-m', msg); committed = true;
    }
    if (pulled === 'offline') done({ ok: true, offline: true, committed, title, id: load(positional[0]).note.fields.id || '', site: siteUrl(), message: 'Saved, but you are offline. It will go up the next time you publish.' });
    say('Uploading');
    let err = push();
    if (err) { const again = pull(); if (!again) err = push(); }
    if (err) done({ ok: false, error: 'Saved on this computer, but the upload failed:\n' + err, committed });
    done({ ok: true, committed, nothing: !committed && !staged, title, id: load(positional[0]).note.fields.id || '', site: siteUrl(), warnings: first.warnings.length });
  }

  if (cmd === 'publish-all') {
    say('Getting the latest version');
    const pulled = pull();
    if (pulled && pulled !== 'offline') done({ ok: false, error: 'Could not get the latest version from GitHub:\n' + pulled });
    say('Giving new notes their addresses');
    stampAll();
    say('Saving');
    git('add', '-A');
    const files = git('diff', '--cached', '--name-only').trim().split('\n').filter(Boolean);
    const noteFiles = files.filter(f => f.startsWith('notes/'));
    if (files.length) git('commit', '-q', '-m', positional.join(' ').trim() || (noteFiles.length === 1 ? `Update ${baseName(noteFiles[0])}` : `Update ${noteFiles.length || files.length} ${noteFiles.length ? 'notes' : 'files'}`));
    if (pulled === 'offline') done({ ok: true, offline: true, count: files.length, site: siteUrl(), message: 'Saved, but you are offline. It will go up the next time you publish.' });
    let ahead = 0; try { ahead = +git('rev-list', '--count', '@{u}..HEAD').trim() || 0; } catch { ahead = 1; }
    if (!files.length && !ahead) done({ ok: true, nothing: true, count: 0, site: siteUrl() });
    say('Uploading');
    let err = push();
    if (err) { const again = pull(); if (!again) err = push(); }
    if (err) done({ ok: false, error: 'Saved on this computer, but the upload failed:\n' + err });
    done({ ok: true, count: files.length, notes: noteFiles.length, site: siteUrl() });
  }

  done({ ok: false, error: 'Usage: node tools/obsidian.mjs inspect|publish|publish-all|fix|status …' });
} catch (e) {
  done({ ok: false, error: gitErr(e) });
}

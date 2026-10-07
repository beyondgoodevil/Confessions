// Collects every Markdown file under notes/ into notes.json and assembles the
// finished site in _site/. Run: node tools/build.mjs   (GitHub Actions runs it for you.)
// Besides the site itself it writes:
//   <ID>/index.html  a shareable address for each entry (e.g. /M-0052/) whose link preview shows
//                    the entry's title and summary, and which then opens the entry
//   feed.xml         an Atom feed of the newest entries
// Set SITE_URL (the workflow does) to give the feed and previews absolute addresses.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { ROOT, NOTE_EXT, MEDIA_EXT, walk, gitDates, rel, loadConfig, readFrontMatter } from './lib.mjs';
export { ROOT };

const isDraft = raw => {
  const fm = raw.match(/^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---/);
  return !!fm && /^draft:\s*true\s*$/m.test(fm[1]);
};

export function collectNotes({ withGit = true } = {}) {
  const all = walk(path.join(ROOT, 'notes'));
  const notes = []; let drafts = 0;
  // edits before config.editsCountFrom (YYYY-MM-DD) don't count as updates: such a note shows its own date instead
  let from = ''; try { from = String(loadConfig().editsCountFrom || ''); } catch { /* the build reports a broken config itself */ }
  const counted = d => d && (!from || d >= from) ? d : null;
  for (const f of all.filter(f => NOTE_EXT.test(f)).sort()) {
    const raw = fs.readFileSync(f, 'utf8');
    if (isDraft(raw)) { drafts++; continue; }
    const r = rel(f);
    const git = withGit ? gitDates(r) : {};
    notes.push({ path: r, raw, created: git.created || null, updated: counted(withGit ? git.updated : fs.statSync(f).mtime.toISOString().slice(0, 10)) });
  }
  const files = all.filter(f => MEDIA_EXT.test(f)).map(rel).sort();
  return { notes, files, drafts };
}

function copy(src) {
  const s = path.join(ROOT, src);
  if (!fs.existsSync(s)) return;
  fs.cpSync(s, path.join(ROOT, '_site', src), { recursive: true, filter: p => !path.basename(p).startsWith('.') });
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plain = md => String(md ?? '').replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
const unquote = v => String(v ?? '').replace(/\\(["\\])/g, '$1').replace(/''/g, "'");

// title, summary and dates the way the site shows them (front matter, else first heading, else file name)
function describe(n) {
  const { fields } = readFrontMatter(n.raw);
  const body = n.raw.replace(/^\uFEFF?---[\s\S]*?\n---[ \t]*\r?\n/, '');
  const base = n.path.split('/').pop().replace(/\.(md|markdown)$/i, '');
  const title = plain(unquote(fields.title)) || plain((body.match(/^\s*#[ \t]+(.+?)[ \t#]*$/m) || [])[1]) || (base.charAt(0).toUpperCase() + base.slice(1)).replace(/[-_]+/g, ' ');
  const tags = (String(fields.tags || '').match(/^\[(.*)\]$/) || [, ''])[1].split(',').map(t => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(fields.date || '') ? fields.date : n.created || n.updated;
  return { id: (fields.id || '').toUpperCase(), title, summary: plain(unquote(fields.summary)), tags, date, updated: n.updated && n.updated > date ? n.updated : date };
}

// a link preview and a forward into the site, for each entry
function sharePage(e, site, base) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(e.title)} — ${esc(site)}</title>
${e.summary ? `<meta name="description" content="${esc(e.summary)}">\n` : ''}<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(site)}">
<meta property="og:title" content="${esc(e.title)}">
${e.summary ? `<meta property="og:description" content="${esc(e.summary)}">\n` : ''}${base ? `<meta property="og:url" content="${esc(base + e.id)}/">\n<link rel="canonical" href="${esc(base + e.id)}/">\n` : ''}<meta name="twitter:card" content="summary">
<script>location.replace('../#/${e.id}' + (location.hash.length > 1 ? '/' + location.hash.slice(1) : ''));</script>
</head>
<body><p><a href="../#/${e.id}">${esc(e.title)}</a></p></body>
</html>
`;
}

function feed(entries, cfg, base) {
  const site = cfg.title || 'Notes';
  const idOf = e => base ? `${base}#/${e.id}` : `urn:notebook:${e.id}`;
  const newest = entries.reduce((a, e) => e.updated > a ? e.updated : a, '1970-01-01');
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(site)}</title>
${cfg.subtitle ? `  <subtitle>${esc(cfg.subtitle)}</subtitle>\n` : ''}  <id>${esc(base || 'urn:notebook')}</id>
  <updated>${newest}T00:00:00Z</updated>
  <author><name>${esc(cfg.author || site)}</name></author>
${base ? `  <link rel="alternate" href="${esc(base)}"/>\n  <link rel="self" href="${esc(base)}feed.xml"/>\n` : ''}${entries.map(e => `  <entry>
    <title>${esc(e.id)} · ${esc(e.title)}</title>
    <id>${esc(idOf(e))}</id>
    <link rel="alternate" href="${esc((base || '') + e.id)}/"/>
    <published>${e.date}T00:00:00Z</published>
    <updated>${e.updated}T00:00:00Z</updated>
${e.summary ? `    <summary>${esc(e.summary)}</summary>\n` : ''}${e.tags.map(t => `    <category term="${esc(t)}"/>\n`).join('')}  </entry>`).join('\n')}
</feed>
`;
}

// page head: the site's own title and description for link previews, the feed, and asset fingerprints
function finishPage(file, { cfg, base, isHome }) {
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/(src|href)="(assets\/[^"?#]+\.(?:js|css))"/g, (all, attr, asset) => {
    const p = path.join(ROOT, asset);
    if (!fs.existsSync(p)) return all;
    return `${attr}="${asset}?v=${crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 10)}"`;
  });
  if (isHome) {
    const site = cfg.title || 'Notes', desc = plain(cfg.description || cfg.subtitle || cfg.welcome || cfg.intro);
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(site)}</title>`);
    if (desc) html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`);
    html = html.replace('</head>', [
      `<meta property="og:type" content="website">`, `<meta property="og:site_name" content="${esc(site)}">`, `<meta property="og:title" content="${esc(site)}">`,
      desc && `<meta property="og:description" content="${esc(desc)}">`, base && `<meta property="og:url" content="${esc(base)}">`, `<meta name="twitter:card" content="summary">`,
      `<link rel="alternate" type="application/atom+xml" title="${esc(site)}: newest entries" href="feed.xml">`
    ].filter(Boolean).join('\n') + '\n</head>');
  }
  fs.writeFileSync(file, html);
}

export function build() {
  const cfg = loadConfig();   // fail early on a broken config
  const base = (process.env.SITE_URL || '').trim().replace(/\/*$/, '/').replace(/^\/$/, '');
  const out = path.join(ROOT, '_site');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  for (const f of ['index.html', 'write.html', 'config.json', 'assets', 'notes']) copy(f);
  const { notes, files, drafts } = collectNotes();
  fs.writeFileSync(path.join(out, 'notes.json'), JSON.stringify({ generated: new Date().toISOString(), notes, files }));
  fs.writeFileSync(path.join(out, '.nojekyll'), '');
  finishPage(path.join(out, 'index.html'), { cfg, base, isHome: true });
  finishPage(path.join(out, 'write.html'), { cfg, base, isHome: false });
  const entries = notes.map(describe).filter(e => /^[A-Z]+-\d+$/.test(e.id));
  const site = cfg.title || 'Notes';
  for (const e of entries) {
    const dir = path.join(out, e.id);
    if (fs.existsSync(dir)) continue;   // never shadow a real folder of the site
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), sharePage(e, site, base));
  }
  const num = e => +e.id.split('-')[1] || 0;
  const newest = [...entries].sort((a, b) => b.date.localeCompare(a.date) || num(b) - num(a)).slice(0, 30);
  fs.writeFileSync(path.join(out, 'feed.xml'), feed(newest, cfg, base));
  console.log(`Built ${notes.length} note${notes.length === 1 ? '' : 's'} into _site/${drafts ? ` (${drafts} draft${drafts === 1 ? '' : 's'} skipped)` : ''}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { build(); } catch (e) { console.error('Build failed:', e.message); process.exit(1); }
}

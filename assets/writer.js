/* Confessions Writer — write, edit and bulk-upload notes, published straight to GitHub.
   Uses the site's own renderer (app.js in library mode) for the preview. */
(() => {
'use strict';
const C = window.Commonplace;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = C.esc, slug = C.slug;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/* ---------------- state ---------------- */
const W = { cfg: null, secs: [], notes: [], files: [], kinds: [], images: new Map(), editing: null, tab: 'write' };
const store = {
  get(k, d) { try { const v = localStorage.getItem('cp-' + k) ?? sessionStorage.getItem('cp-' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v, remember = true) { try { (remember ? localStorage : sessionStorage).setItem('cp-' + k, JSON.stringify(v)); (remember ? sessionStorage : localStorage).removeItem('cp-' + k); } catch {} },
  del(k) { try { localStorage.removeItem('cp-' + k); sessionStorage.removeItem('cp-' + k); } catch {} }
};

/* ---------------- GitHub ---------------- */
const conn = () => store.get('conn', null);
function guessRepo() {
  const h = location.hostname;
  if (!h.endsWith('.github.io')) return { owner: '', repo: '' };
  const owner = h.split('.')[0]; const first = location.pathname.split('/').filter(Boolean)[0];
  return { owner, repo: first && !first.endsWith('.html') ? first : `${owner}.github.io` };
}
async function gh(path, opts = {}) {
  const c = conn(); if (!c || !c.token) throw new Error('Not connected. Open Settings and add your token.');
  const r = await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}${path}`, {
    cache: 'no-store', ...opts, headers: { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) }
  });
  if (!r.ok) {
    let msg = `${r.status}`; try { msg = (await r.json()).message || msg; } catch {}
    const e = new Error(r.status === 401 ? 'GitHub rejected the token (expired or mistyped).' : r.status === 403 || r.status === 404 ? `GitHub says “${msg}”. Check the repository name and that the token has Contents: read and write for it.` : msg);
    e.status = r.status; throw e;
  }
  return r.status === 204 ? null : r.json();
}
const b64utf8 = s => btoa(unescape(encodeURIComponent(s)));
const utf8b64 = s => decodeURIComponent(escape(atob(s.replace(/\n/g, ''))));
// One commit containing every file: [{path, content} | {path, base64} | {path, remove:true}]
async function commitFiles(files, message, attempt = 0) {
  const branch = conn().branch || 'main';
  try {
    const ref = await gh(`/git/ref/heads/${branch}`);
    const base = await gh(`/git/commits/${ref.object.sha}`);
    const tree = [];
    for (const f of files) {
      if (f.remove) tree.push({ path: f.path, mode: '100644', type: 'blob', sha: null });
      else if (f.base64) { const blob = await gh('/git/blobs', { method: 'POST', body: JSON.stringify({ content: f.base64, encoding: 'base64' }) }); tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha }); }
      else tree.push({ path: f.path, mode: '100644', type: 'blob', content: f.content });
    }
    const t = await gh('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: base.tree.sha, tree }) });
    const c = await gh('/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: t.sha, parents: [ref.object.sha] }) });
    await gh(`/git/refs/heads/${branch}`, { method: 'PATCH', body: JSON.stringify({ sha: c.sha }) });
    return c;
  } catch (e) {
    if (e.status === 422 && attempt < 4) { await new Promise(r => setTimeout(r, 1500 * (attempt + 1))); return commitFiles(files, message, attempt + 1); }   // branch moved (e.g. the address-stamping commit); retry on top of it
    throw e;
  }
}
async function readFile(path) {
  const r = await gh(`/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(conn().branch || 'main')}`);
  return utf8b64(r.content);
}

/* ---------------- sections & paths ---------------- */
function buildKinds() {
  W.kinds = W.secs.flatMap(sec => sec.subsections.length
    ? sec.subsections.map(sub => ({ key: sub.id, label: `${sub.name.replace(/s$/, '')}`, sec, sub, kind: sub.kind || sub.id }))
    : [{ key: sec.id, label: (sec.label || sec.name).replace(/ notes$/i, '').replace(/^Notes$/, sec.name), sec, sub: null, kind: sec.kind || sec.id }]);
}
const folderOf = k => ['notes', k.sec.folder, ...(k.sub ? [k.sub.folder] : [])].join('/');
function uniquePath(dir, name, except) {
  const taken = new Set(W.notes.map(n => n.path.toLowerCase()));
  let p = `${dir}/${name}.md`, i = 2;
  while (taken.has(p.toLowerCase()) && p !== except) p = `${dir}/${name}-${i++}.md`;
  return p;
}
const FIELDS = {
  book: [['author', 'Author'], ['year', 'Year'], ['publisher', 'Publisher']],
  podcast: [['show', 'Show'], ['episode', 'Episode'], ['host', 'Host'], ['guest', 'Guest'], ['year', 'Year'], ['url', 'Link']],
  video: [['creator', 'Creator / speaker'], ['channel', 'Channel'], ['event', 'Event'], ['year', 'Year'], ['url', 'Link']],
  lecture: [['course', 'Course'], ['lecture', 'Lecture no.'], ['lecturer', 'Lecturer'], ['institution', 'Institution'], ['url', 'Link']],
  misc: [['source', 'Source (optional)']]
};
const yamlVal = v => /^[\w .,'()&/-]*$/.test(v) && !/^(true|false|null|yes|no|\d+[-:])/i.test(v) && !/^[-?!&*#|>@`%'"]/.test(v) ? v : JSON.stringify(v);

/* ---------------- preview ---------------- */
function previewRaw(raw, path) {
  // the Write and Edit tabs each have a preview box: draw in the one that is showing
  const panel = $('#tab-' + W.tab) || document, box = $('#preview', panel);
  if (!box) return;
  const entries = W.notes.filter(n => n.path !== path).concat([{ path, raw, created: today(), updated: today() }]);
  for (const [name, url] of W.images) { C.S.files.set(name.toLowerCase(), url); }
  try {
    C.index(W.cfg, entries);
    const n = C.S.notes.find(x => x.path === path);
    box.innerHTML = C.viewNote(n);
    const addr = $('#addr', panel); if (addr) addr.textContent = n.explicitId ? n.id : `${n.id} (provisional)`;
    C.enhance(box);
  } catch (e) { box.innerHTML = `<p class="w-error">Preview failed: ${esc(e.message)}</p>`; }
}

/* ---------------- editor (shared by Write and Edit) ---------------- */
function toolbar() {
  return `<div class="w-tools" role="toolbar" aria-label="Formatting">
    <button type="button" data-ins="bold" title="Bold (Ctrl+B)"><b>B</b></button>
    <button type="button" data-ins="italic" title="Italic (Ctrl+I)"><i>I</i></button>
    <button type="button" data-ins="hl" title="Highlight">==</button>
    <button type="button" data-ins="h2" title="Section heading">H2</button>
    <button type="button" data-ins="h3" title="Sub-heading">H3</button>
    <button type="button" data-ins="ul" title="Bulleted list">• List</button>
    <button type="button" data-ins="ol" title="Numbered list">1. List</button>
    <button type="button" data-ins="quote" title="Quotation">“ ”</button>
    <button type="button" data-ins="table" title="Insert a table, or edit the one the cursor is in as a grid">Table</button>
    <button type="button" data-ins="hr" title="Dividing line">—</button>
    <button type="button" data-ins="link" title="Link to a note (or type [[)">[[ ]]</button>
    <button type="button" data-ins="math" title="Inline maths">$x$</button>
    <button type="button" data-ins="mathd" title="Display equation">$$</button>
    <button type="button" data-ins="fn" title="Footnote">fn</button>
    <select data-callout aria-label="Insert a block"><option value="">Block…</option>
      <option>definition</option><option>theorem</option><option>lemma</option><option>proof</option><option>example</option>
      <option>note</option><option>quote</option><option>question</option><option>idea</option></select>
    <label class="w-img" title="Insert an image">Image<input type="file" accept="image/*" hidden data-img></label>
    <select data-sec aria-label="Section tools"><option value="">Sections…</option>
      <option value="number">Number the sections</option><option value="strip">Remove section numbers</option>
      <option value="related">Build the Related list…</option><option value="guidelist">Insert notes as a list…</option></select>
  </div>`;
}
// Shown under the editor: a live outline of the headings and a list of things to check before publishing.
const sidePanels = () => `<div class="w-side"><details class="w-checks" open><summary>Before you publish</summary><ul></ul></details>
  <details class="w-outline"><summary>Outline</summary><ol></ol></details></div>`;

/* ---- structure helpers ---- */
// Headings, section numbers, the checks and their fixes live in assets/checks-core.js, shared with the Obsidian plugin.
const Core = window.CommonplaceChecks;
const { UNNUMBERED, NUM_PREFIX, headings, sectionLevel, numberSections, numbering, wikiLinks, splitRelated, titleCase, firstParagraph } = Core;
// Replace the whole text but keep the caret on the same line, at the same distance from the end of that line.
function replaceBody(ta, next) {
  if (next === ta.value) return false;
  const before = ta.value.slice(0, ta.selectionStart), line = before.split('\n').length - 1;
  const oldLine = ta.value.split('\n')[line] || '', fromEnd = oldLine.length - (before.length - (before.lastIndexOf('\n') + 1));
  const top = ta.scrollTop; ta.value = next;
  const lines = next.split('\n'), l = Math.min(line, lines.length - 1);
  const pos = lines.slice(0, l).join('\n').length + (l ? 1 : 0) + Math.max(0, lines[l].length - Math.max(0, fromEnd));
  ta.selectionStart = ta.selectionEnd = pos; ta.scrollTop = top;
  return true;
}
function jumpToLine(ta, line, len) {
  const lines = ta.value.split('\n'), l = Math.max(0, Math.min(line, lines.length - 1)), pos = lines.slice(0, l).join('\n').length + (l ? 1 : 0);
  ta.focus(); ta.selectionStart = pos; ta.selectionEnd = pos + (len == null ? lines[l].length : len);
  ta.scrollTop = Math.max(0, (l / Math.max(1, lines.length)) * ta.scrollHeight - 80);
  ta.scrollIntoView({ block: 'nearest' });
}
function noteIndex() {
  const m = new Map();
  for (const x of W.notes.map(n => n._meta).filter(Boolean)) { for (const k of [x.title, x.id, ...x.aliases]) m.set(String(k).toLowerCase(), x); }
  return m;
}
function relatedCandidates(meta) {
  const idx = noteIndex(), mine = new Set(meta.tags), { before, listed } = splitRelated(meta.body);
  const freq = new Map(); for (const n of W.notes) for (const t of (n._meta ? n._meta.tags : [])) freq.set(t, (freq.get(t) || 0) + 1);
  const picked = new Map();
  const add = (x, why, on) => { if (!x || x.path === meta.path) return; const p = picked.get(x.path); if (p) { p.on = p.on || on; if (!p.why.includes(why)) p.why.push(why); } else picked.set(x.path, { x, why: [why], on, score: 0 }); };
  listed.forEach(t => add(idx.get(t.toLowerCase()), 'already listed', true));
  wikiLinks(before).forEach(t => add(idx.get(t.toLowerCase()), 'linked in the text', true));
  const title = (meta.title || '').toLowerCase();
  for (const n of W.notes) { const x = n._meta; if (!x || x.path === meta.path) continue;
    if (title && wikiLinks(String(n.raw || '')).some(t => t.toLowerCase() === title)) add(x, 'links here', false);
    const shared = x.tags.filter(t => mine.has(t) && t !== 'guide'); if (!shared.length) continue;
    const score = shared.reduce((s, t) => s + 1 / Math.log(2 + (freq.get(t) || 1)), 0);
    if (score > 0.42 || picked.has(x.path)) { add(x, 'shares ' + shared.slice(0, 3).join(', '), false); picked.get(x.path).score = score; }
  }
  return [...picked.values()].sort((a, b) => b.on - a.on || b.score - a.score || a.x.title.localeCompare(b.x.title)).slice(0, 60);
}
// A small modal. Buttons are handled directly instead of waiting for the dialog's own close event.
function modal(cls, html, onOk, after) {
  const dlg = document.createElement('dialog'); dlg.className = 'w-dialog ' + cls;
  dlg.innerHTML = `<form onsubmit="return false">${html}</form>`; document.body.append(dlg);
  const finish = ok => { if (ok) onOk(dlg); if (dlg.open) dlg.close(); dlg.remove(); if (after) after(); };
  dlg.addEventListener('click', e => { const b = e.target.closest('button[value]'); if (b) finish(b.value === 'ok'); });
  dlg.addEventListener('cancel', e => { e.preventDefault(); finish(false); });
  $('form', dlg).addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'search' && e.target.type !== 'checkbox') { e.preventDefault(); finish(true); } });
  dlg.showModal(); return dlg;
}
function relatedDialog(ta, getMeta) {
  const meta = getMeta(); let cands = relatedCandidates(meta);
  const row = c => `<li><label><input type="checkbox" value="${esc(c.x.title)}"${c.on ? ' checked' : ''}> <span class="w-mono">${esc(c.x.id)}</span> ${esc(c.x.title)} <small>${esc(c.why.join(' · '))}</small></label></li>`;
  const dlg = modal('', `<h2>Related notes</h2>
    <p class="w-muted">Ticked notes go into the <code>## Related</code> list at the end of the note. Suggestions come from links in your text, notes that link here, and shared tags.</p>
    <input type="search" placeholder="Find any other note to add" aria-label="Find a note">
    <ul class="w-rel">${cands.map(row).join('') || '<li class="w-empty">No suggestions yet. Add tags or links, or search above.</li>'}</ul>
    <div class="w-actions"><button type="button" class="w-btn" value="cancel">Cancel</button><button type="button" class="w-btn w-primary" value="ok">Update the list</button></div>`,
    d => {
      const titles = $$('input[type=checkbox]:checked', d).map(i => i.value);
      const { before, after } = splitRelated(ta.value);
      ta.value = before + (titles.length ? '\n\n## Related\n\n' + titles.map(t => `- [[${t}]]`).join('\n') : '') + (after ? '\n\n' + after : '') + '\n';
      ta.dispatchEvent(new Event('input'));
    }, () => ta.focus());
  const ul = $('.w-rel', dlg), q = $('input[type=search]', dlg);
  q.addEventListener('input', () => {
    const s = q.value.trim().toLowerCase(); $$('li[data-found]', ul).forEach(li => { if (!$('input', li).checked) li.remove(); });
    if (s.length < 2) return;
    const have = new Set($$('input', ul).map(i => i.value));
    W.notes.map(n => n._meta).filter(x => x && x.path !== meta.path && !have.has(x.title) && (x.title.toLowerCase().includes(s) || x.id.toLowerCase() === s)).slice(0, 8)
      .forEach(x => { const li = document.createElement('li'); li.dataset.found = '1'; li.innerHTML = `<label><input type="checkbox" value="${esc(x.title)}"> <span class="w-mono">${esc(x.id)}</span> ${esc(x.title)} <small>search</small></label>`; ul.prepend(li); });
  });
}
/* ---- guides: reading orders made of "## Part" headings, each with a list of "N. [[Note]] — summary" ---- */
const isGuide = n => !!n._meta && (n._meta.tags.includes('guide') || /^notes\/guides\//.test(n.path));
const guideNotes = () => W.notes.filter(isGuide).sort((a, b) => a._meta.title.localeCompare(b._meta.title));
const bodyOf = raw => String(raw || '').replace(/^﻿?---[\s\S]*?\n---[ \t]*(\n|$)/, '');
// A guide's parts: its ## headings, or the ### sub-parts under them, named "Part › Sub-part"
function partList(body) {
  const out = []; let top = '';
  for (const h of headings(body)) {
    if (h.level === 2) { top = UNNUMBERED.test(h.text.replace(NUM_PREFIX, '')) ? null : h.text; if (top) out.push({ name: top, level: 2, line: h.line }); }
    else if (h.level === 3 && top) { out.push({ name: `${top} › ${h.text}`, level: 3, line: h.line }); const p = out.find(x => x.name === top && x.level === 2); if (p) p.hasSubs = true; }
  }
  return out;
}
const guideParts = raw => partList(bodyOf(raw)).filter(p => !p.hasSubs).map(p => p.name);
const lists = (raw, title) => wikiLinks(String(raw || '')).some(t => t.toLowerCase() === String(title).toLowerCase());
// Adds "N. [[title]] — summary" to the end of a part's list (or of the guide), numbering on from the
// list it joins; a bulleted list gets a bullet. Returns null when the guide already lists the note.
function addToGuide(raw, part, title, summary) {
  if (!title || lists(raw, title)) return null;
  const lines = String(raw).replace(/\s+$/, '').split('\n');
  const fmEnd = /^﻿?---[ \t]*$/.test(lines[0]) ? lines.findIndex((l, i) => i > 0 && /^---[ \t]*$/.test(l)) : -1;
  const hs = []; let fence = false;
  lines.forEach((l, i) => { if (i <= fmEnd) return; if (/^\s*(```|~~~)/.test(l)) fence = !fence; else { const m = !fence && l.match(/^(#{2,3})[ \t]+(.+?)[ \t#]*$/); if (m) hs.push({ i, level: m[1].length, text: m[2] }); } });
  const parts = []; let top = null;
  for (const h of hs) {
    if (h.level === 2) { top = UNNUMBERED.test(h.text.replace(NUM_PREFIX, '')) ? null : h.text; if (top) parts.push({ ...h, name: top }); }
    else if (top) parts.push({ ...h, name: `${top} › ${h.text}` });
  }
  const leaves = parts.filter(p => !parts.some(q => q.level === 3 && p.level === 2 && q.name.startsWith(p.name + ' › ')));
  const at = leaves.find(h => h.name === part) || leaves[leaves.length - 1];
  const start = at ? at.i : fmEnd, next = hs.find(h => h.i > start && h.level <= (at ? at.level : 2)), end = next ? next.i : lines.length;
  let last = -1, num = 0, bullet = false;
  for (let i = start + 1; i < end; i++) {
    const m = lines[i].match(/^(\d+)[.)]\s/), b = /^[-*+]\s/.test(lines[i]);
    if (m) { last = i; num = +m[1]; bullet = false; } else if (b) { last = i; bullet = true; }
    else if (last >= 0 && i === last + 1 && /^\s+\S/.test(lines[i])) last = i;   // the item's own indented lines
  }
  const entry = `${bullet ? '-' : (num + 1) + '.'} [[${title}]]${summary ? ' — ' + summary : ''}`;
  if (last >= 0) lines.splice(last + 1, 0, entry);
  else { let j = end; while (j > start + 1 && !lines[j - 1].trim()) j--; lines.splice(j, 0, '', entry, ...(j < lines.length ? [''] : [])); }
  return lines.join('\n') + '\n';
}
// Which guides suit a note, and which part of each: shared topic tags, weighted so rare tags count more
function guideSuggestions(meta) {
  const broad = new Set([...(C.list((W.cfg.browse || {}).fields)), 'guide']), mine = meta.tags.filter(t => !broad.has(t));
  const idx = noteIndex(), freq = new Map(); for (const n of W.notes) for (const t of (n._meta ? n._meta.tags : [])) freq.set(t, (freq.get(t) || 0) + 1);
  const weight = ts => ts.filter(t => mine.includes(t)).reduce((s, t) => s + 1 / Math.log(2 + (freq.get(t) || 1)), 0);
  return guideNotes().filter(g => g.path !== meta.path).map(g => {
    const raw = String(g.raw || ''), body = bodyOf(raw).split('\n'), all = partList(bodyOf(raw)), hs = headings(bodyOf(raw));
    let best = '', bestScore = 0;
    for (const h of all.filter(p => !p.hasSubs)) {
      const p = h.name, nx = hs.find(x => x.line > h.line && x.level <= h.level), chunk = body.slice(h.line, nx ? nx.line : body.length).join('\n');
      const s = wikiLinks(chunk).map(t => idx.get(t.toLowerCase())).filter(Boolean).reduce((a, x) => a + weight(x.tags), 0);
      if (s > bestScore) { bestScore = s; best = p; }
    }
    return { g, parts: guideParts(raw), listed: lists(raw, meta.title), part: best, score: weight(g._meta.tags) * 3 + bestScore / 4 };
  }).sort((a, b) => b.listed - a.listed || b.score - a.score || a.g._meta.title.localeCompare(b.g._meta.title));
}
const guideName = t => String(t).replace(/^guide:\s*/i, '');
// The "Guides" field on the Write and Edit forms: picks are added to the guides when the note is published.
function guidesField(picks) {
  return `<div class="w-field w-guides"><span>Guides <small>reading orders this note should appear in; added when you publish</small></span>
    <p class="w-guide-picks">${picks.map((p, i) => `<span class="w-pick">${esc(guideName(p.title))}${p.part ? ` <small>→ ${esc(p.part)}</small>` : ''} <button type="button" data-unpick="${i}" aria-label="Remove">×</button></span>`).join('')}
    <button type="button" class="w-btn w-btn-small" data-guides>Add to a guide…</button></p></div>`;
}
function guidesDialog(picks, getMeta, onDone) {
  const meta = getMeta(), sugg = guideSuggestions(meta), chosen = new Map(picks.map(p => [p.path, p.part]));
  if (!sugg.length) { toast('There are no guides yet. Write one with the “Guide” template.'); return; }
  const row = s => {
    const on = chosen.has(s.g.path), part = on ? chosen.get(s.g.path) : s.part;
    return `<li><label><input type="checkbox" value="${esc(s.g.path)}"${on || s.listed ? ' checked' : ''}${s.listed ? ' disabled' : ''}> ${esc(guideName(s.g._meta.title))}
      <small>${s.listed ? 'already lists this note' : s.score > 0.3 ? 'suggested' : ''}</small></label>
      ${s.listed || !s.parts.length ? '' : `<select data-part aria-label="Part of the guide">${s.parts.map(p => `<option${p === part ? ' selected' : ''}>${esc(p)}</option>`).join('')}</select>`}</li>`;
  };
  modal('', `<h2>Add to a guide</h2>
    <p class="w-muted">Tick the guides this note belongs in and pick the part. When you publish, it is added to the end of that part as <code>N. [[${esc(meta.title || 'Title')}]] — summary</code>.${meta.title ? '' : ' Give the note a title first.'}</p>
    <ul class="w-rel w-guide-list">${sugg.map(row).join('')}</ul>
    <div class="w-actions"><button type="button" class="w-btn" value="cancel">Cancel</button><button type="button" class="w-btn w-primary" value="ok">Done</button></div>`,
    d => onDone($$('li', d).map(li => ({ box: $('input', li), sel: $('select', li) })).filter(x => x.box.checked && !x.box.disabled)
      .map(x => ({ path: x.box.value, title: W.notes.find(n => n.path === x.box.value)._meta.title, part: x.sel ? x.sel.value : '' }))));
}
// For the publish step: the guide files to commit alongside the note (fresh copies from GitHub).
async function guideCommits(picks, title, summary) {
  const out = [];
  for (const p of picks) {
    const latest = await readFile(p.path), next = addToGuide(latest, p.part, title, summary.replace(/\s+/g, ' '));
    if (next) { out.push({ path: p.path, content: next }); const g = W.notes.find(n => n.path === p.path); if (g) g.raw = next; }
  }
  return out;
}
// Sections… → Insert notes as a list: picks notes and writes them as guide lines at the cursor.
function guideListDialog(ta, getMeta) {
  const meta = getMeta(), here = new Set(wikiLinks(ta.value).map(t => t.toLowerCase()));
  const cands = relatedCandidates({ ...meta, body: '' }).filter(c => !here.has(c.x.title.toLowerCase()));
  const sum = x => { const n = C.S.notes.find(m => m.path === x.path); return n ? n.summary : ''; };
  const row = (x, why) => `<li><label><input type="checkbox" value="${esc(x.path)}"> <span class="w-mono">${esc(x.id)}</span> ${esc(x.title)} <small>${esc(why)}</small></label></li>`;
  const dlg = modal('', `<h2>Insert notes as a list</h2>
    <p class="w-muted">Ticked notes are inserted at the cursor as <code>N. [[Title]] — summary</code>, numbered on from the list you are in. Suggestions share this guide's tags; search for anything else.</p>
    <input type="search" placeholder="Find a note by title or address" aria-label="Find a note">
    <ul class="w-rel">${cands.map(c => row(c.x, c.why.join(' · '))).join('') || '<li class="w-empty">No suggestions yet. Add the guide\'s topic tag, or search above.</li>'}</ul>
    <div class="w-actions"><button type="button" class="w-btn" value="cancel">Cancel</button><button type="button" class="w-btn w-primary" value="ok">Insert</button></div>`,
    d => {
      const picked = $$('input[type=checkbox]:checked', d).map(i => W.notes.find(n => n.path === i.value)).filter(n => n && n._meta);
      if (!picked.length) return;
      const pos = ta.selectionStart, before = ta.value.slice(0, pos), lineStart = before.lastIndexOf('\n') + 1;
      const prev = before.slice(0, lineStart).replace(/\n+$/, '').split('\n').pop() || '', m = prev.match(/^(\d+)[.)]\s/);
      let k = m ? +m[1] : 0;
      const text = picked.map(n => `${++k}. [[${n._meta.title}]]${sum(n._meta) ? ' — ' + sum(n._meta) : ''}`).join('\n');
      const lead = pos > lineStart && before.slice(lineStart).trim() ? '\n' : '';
      ta.setRangeText(lead + text + '\n', pos, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input'));
    }, () => ta.focus());
  const ul = $('.w-rel', dlg), q = $('input[type=search]', dlg);
  q.addEventListener('input', () => {
    const s = q.value.trim().toLowerCase(); $$('li[data-found]', ul).forEach(li => { if (!$('input', li).checked) li.remove(); });
    if (s.length < 2) return;
    const have = new Set($$('input', ul).map(i => i.value));
    W.notes.map(n => n._meta).filter(x => x && x.path !== meta.path && !have.has(x.path) && !here.has(x.title.toLowerCase()) && (x.title.toLowerCase().includes(s) || x.id.toLowerCase() === s)).slice(0, 10)
      .forEach(x => { const li = document.createElement('li'); li.dataset.found = '1'; li.innerHTML = row(x, 'search').replace(/^<li>|<\/li>$/g, ''); ul.prepend(li); });
  });
}
function tableDialog(ta) {
  modal('w-small', `<h2>Insert a table</h2>
    <div class="w-grid"><label class="w-field"><span>Columns</span><input name="c" type="number" min="1" max="8" value="3"></label>
    <label class="w-field"><span>Rows</span><input name="r" type="number" min="1" max="30" value="3"></label></div>
    <label class="w-field"><span>Column headings <small>comma-separated, optional</small></span><input name="h" placeholder="View, Says, Problem"></label>
    <div class="w-actions"><button type="button" class="w-btn" value="cancel">Cancel</button><button type="button" class="w-btn w-primary" value="ok">Insert</button></div>`,
    d => {
      const f = $('form', d), heads = f.h.value.split(',').map(s => s.trim()).filter(Boolean);
      const c = Math.max(1, Math.min(8, heads.length || +f.c.value || 3)), r = Math.max(1, Math.min(30, +f.r.value || 3));
      const cells = a => '| ' + a.join(' | ') + ' |';
      insertLine(ta, [cells(Array.from({ length: c }, (_, i) => heads[i] || `Column ${i + 1}`)), cells(Array(c).fill('---')), ...Array.from({ length: r }, () => cells(Array(c).fill(' ')))].join('\n') + '\n');
    }, () => ta.focus());
}
// Prefix every selected line (lists, quotations).
function prefixLines(ta, make) {
  const v = ta.value, a = v.lastIndexOf('\n', ta.selectionStart - 1) + 1; let b = v.indexOf('\n', ta.selectionEnd); if (b < 0) b = v.length;
  const out = v.slice(a, b).split('\n').map((l, i) => make(i) + l).join('\n');
  ta.setRangeText(out, a, b, 'end'); ta.focus(); ta.dispatchEvent(new Event('input'));
}
// Enter continues a list or quotation; on an empty item it ends it. Tab / Shift+Tab indent list items.
function smartKey(e, ta) {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  const v = ta.value, s = ta.selectionStart, en = ta.selectionEnd, ls = v.lastIndexOf('\n', s - 1) + 1;
  if (e.key === 'Enter' && !e.shiftKey && s === en) {
    const line = v.slice(ls, s), m = line.match(/^(\s*)(?:([-*+])|(\d+)([.)])|(>))(\s+)(.*)$/);
    const hm = !m && s === (v.indexOf('\n', s) < 0 ? v.length : v.indexOf('\n', s)) && line.match(/^(#{2,3})[ \t]+(\S.*)$/);
    if (hm) {      // a heading just typed: give it its number if the other sections have theirs
      const nb = numbering(v);
      if (hm[1].length === nb.lvl && !NUM_PREFIX.test(hm[2]) && !UNNUMBERED.test(hm[2].trim()) && nb.real.length >= 2 && nb.numbered === nb.real.length - 1) {
        replaceBody(ta, numberSections(v, false));
        const at = ta.selectionStart; ta.setRangeText('\n\n', at, at, 'end'); ta.dispatchEvent(new Event('input')); return true;
      }
    }
    if (!m) return false;
    if (!m[7].trim()) { ta.setRangeText('', ls, s, 'end'); ta.dispatchEvent(new Event('input')); return true; }
    const marker = m[2] || (m[3] ? (+m[3] + 1) + m[4] : m[5]);
    ta.setRangeText('\n' + m[1] + marker + m[6], s, en, 'end'); ta.dispatchEvent(new Event('input')); return true;
  }
  if (e.key === 'Tab') {
    let le = v.indexOf('\n', en); if (le < 0) le = v.length;
    const block = v.slice(ls, le);
    if (s === en && !/^\s*([-*+]|\d+[.)])\s/.test(block)) return false;       // leave Tab alone outside lists so the keyboard can still move on
    const out = block.split('\n').map(l => e.shiftKey ? l.replace(/^( {1,4}|\t)/, '') : '    ' + l).join('\n');
    const d0 = e.shiftKey ? -Math.min(4, (block.match(/^ */) || [''])[0].length) : 4;
    ta.setRangeText(out, ls, le, 'preserve');
    if (s === en) ta.selectionStart = ta.selectionEnd = Math.max(ls, s + d0); else { ta.selectionStart = ls; ta.selectionEnd = ls + out.length; }
    ta.dispatchEvent(new Event('input')); return true;
  }
  return false;
}
function drawOutline(root, ta) {
  const ol = $('.w-outline ol', root); if (!ol) return;
  const hs = headings(ta.value); let prev = 1;
  ol.innerHTML = hs.map(h => { const skip = h.level > prev + 1; prev = h.level;
    return `<li class="lvl-${h.level}"><button type="button" data-line="${h.line}">${esc(h.text)}</button>${h.level === 1 ? ' <small>use ## — the title is already the top heading</small>' : skip ? ' <small>skips a level</small>' : ''}</li>`; }).join('')
    || '<li class="w-empty">No headings yet. Start a section with <code>## </code>.</li>';
}
// The list under the editor. The checks themselves are CommonplaceChecks.check(); here each gets its fix wired
// to the form: api = { ta, setField, focusField, getMeta }.
function runFix(fix, a) {
  if (fix.ui) return relatedDialog(a.ta, a.getMeta);
  const m = a.getMeta(), u = Core.applyFix(fix.id, { title: m.title, summary: m.summary, body: a.ta.value });
  if (u.title != null && a.setField) a.setField('title', u.title);
  if (u.summary != null && a.setField) { a.setField('summary', u.summary); a.focusField('summary'); }
  if (u.body != null) { replaceBody(a.ta, u.body); if (u.caret) jumpToLine(a.ta, a.ta.value.split('\n').indexOf(u.caret) + 2, 0); }
}
function checkNote(meta) {
  const idx = noteIndex();
  return Core.check(meta, {
    linkExists: t => idx.has(t.toLowerCase()),
    titleTaken: t => W.notes.some(n => n._meta && n._meta.path !== meta.path && n._meta.title.toLowerCase() === t.toLowerCase())
  }).map(i => ({ ...i, fix: i.fix ? { label: i.fix.label, run: a => runFix(i.fix, a) } : null }));
}
function drawChecks(root, api) {
  const ul = $('.w-checks ul', root); if (!ul || !api) return;
  const issues = root._issues = checkNote(api.getMeta());
  ul.innerHTML = issues.map((i, k) => { const where = i.field && api.focusField ? 'field' : i.line != null ? 'line' : '';
    return `<li${i.level === 'problem' ? ' class="is-problem"' : ''}>${where ? `<button type="button" class="w-check-go" data-check="${k}" title="${where === 'field' ? 'Go to the field' : 'Go to the line'}">${esc(i.text)}</button>` : `<span>${esc(i.text)}</span>`}${i.fix && (!i.field || api.setField) ? ` <button type="button" class="w-check-fix" data-fix="${k}">${esc(i.fix.label)}</button>` : ''}</li>`; }).join('') || '<li class="w-ok">Nothing to fix.</li>';
  $('.w-checks summary', root).textContent = issues.length ? `Before you publish (${issues.length})` : 'Before you publish';
  const pane = root.closest('.w-pane'), badge = pane && $('.w-bar-checks', pane);
  if (badge) { badge.textContent = issues.length ? `${issues.length} to check` : '✓ ready'; badge.classList.toggle('is-ok', !issues.length); }
  const wc = pane && $('.w-bar-words', pane);
  if (wc) { const n = $('textarea.w-body', root).value.trim().split(/\s+/).filter(Boolean).length; wc.textContent = `${n.toLocaleString()} word${n === 1 ? '' : 's'}`; }
}
function confirmChecks(meta) {
  const issues = checkNote(meta).map(i => i.text);
  return !issues.length || confirm(`${issues.length === 1 ? 'One thing' : issues.length + ' things'} to check:\n\n• ${issues.join('\n• ')}\n\nPublish anyway?`);
}
function wrapSel(ta, before, after = before, placeholder = '') {
  const { selectionStart: a, selectionEnd: b, value } = ta;
  const sel = value.slice(a, b) || placeholder;
  ta.setRangeText(before + sel + after, a, b, 'end');
  if (!value.slice(a, b) && placeholder) { ta.selectionStart = a + before.length; ta.selectionEnd = a + before.length + sel.length; }
  ta.focus(); ta.dispatchEvent(new Event('input'));
}
function insertLine(ta, text) {
  const a = ta.selectionStart, v = ta.value, lead = a > 0 && v[a - 1] !== '\n' ? '\n\n' : (a > 1 && v[a - 2] !== '\n' ? '\n' : '');
  ta.setRangeText(lead + text, a, ta.selectionEnd, 'end'); ta.focus(); ta.dispatchEvent(new Event('input'));
}
/* ---- styling as you type ----
   The text box stays an ordinary text box (so the keyboard, spell-check and undo behave as usual); a layer
   underneath it draws the same text with headings, bold, links, quotations and code picked out. Only colour and
   weight change, never the width of a character, so the two stay exactly in step. */
function paint(text) {
  const e = t => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const inline = t => e(t)
    .replace(/(`+)([^`\n]+?)\1/g, '<span class="hl-code">$1$2$1</span>')
    .replace(/(!?\[\[)([^\]\n]*)(\]\])/g, '<span class="hl-link">$1$2$3</span>')
    .replace(/(\[)([^\]\n]+)(\]\([^)\n]*\))/g, '<span class="hl-link">$1$2$3</span>')
    .replace(/(\*\*)(?=\S)([^*\n]+?)(\*\*)/g, '<span class="hl-b">$1$2$3</span>')
    .replace(/(^|[^*\w])(\*)(?=\S)([^*\n]+?)(\*)(?!\*)/g, '$1<span class="hl-i">$2$3$4</span>')
    .replace(/(==)([^=\n]+?)(==)/g, '<span class="hl-mark">$1$2$3</span>')
    .replace(/(\$)([^$\n]+?)(\$)/g, '<span class="hl-math">$1$2$3</span>')
    .replace(/(\[\^[^\]\n]+\])/g, '<span class="hl-fn">$1</span>');
  let fence = false, front = false; const out = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (i === 0 && /^---\s*$/.test(l)) { front = true; out.push(`<span class="hl-dim">${e(l)}</span>`); continue; }
    if (front) { if (/^---\s*$/.test(l)) front = false; out.push(`<span class="hl-dim">${e(l)}</span>`); continue; }
    if (/^\s*(```|~~~)/.test(l)) { fence = !fence; out.push(`<span class="hl-code">${e(l)}</span>`); continue; }
    if (fence) { out.push(`<span class="hl-code">${e(l)}</span>`); continue; }
    let m;
    if ((m = l.match(/^(#{1,6})([ \t]+.*)$/))) out.push(`<span class="hl-h hl-h${m[1].length}"><span class="hl-dim">${m[1]}</span>${inline(m[2])}</span>`);
    else if ((m = l.match(/^(\s*&gt;|\s*>)(.*)$/))) out.push(`<span class="hl-quote"><span class="hl-dim">${e(m[1])}</span>${inline(m[2])}</span>`);
    else if ((m = l.match(/^(\s*(?:[-*+]|\d+[.)])\s)(.*)$/))) out.push(`<span class="hl-dim">${e(m[1])}</span>${inline(m[2])}`);
    else if (/^\s*\|.*\|\s*$/.test(l)) out.push(inline(l).replace(/\|/g, '<span class="hl-dim">|</span>'));
    else if (/^\s*(---|\*\*\*)\s*$/.test(l)) out.push(`<span class="hl-dim">${e(l)}</span>`);
    else out.push(inline(l));
  }
  return out.join('\n') + '\n';
}
function styleEditor(ta) {
  if (ta._painted) return ta._painted;
  const wrap = document.createElement('div'); wrap.className = 'w-edwrap';
  const layer = document.createElement('pre'); layer.className = ta.className.replace('w-body', 'w-body w-hl'); layer.setAttribute('aria-hidden', 'true');
  ta.before(wrap); wrap.append(layer, ta); ta.classList.add('w-over');
  let frame = 0;
  const draw = () => { frame = 0; layer.innerHTML = paint(ta.value); layer.scrollTop = ta.scrollTop; };
  const soon = () => { if (!frame) frame = setTimeout(draw, 16); };   // a timer, not an animation frame: those stop while the window is in the background
  ta.addEventListener('input', soon);
  ta.addEventListener('scroll', () => { layer.scrollTop = ta.scrollTop; layer.scrollLeft = ta.scrollLeft; }, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(() => { layer.style.height = ta.offsetHeight + 'px'; }).observe(ta);
  draw();
  return (ta._painted = soon);
}

/* ---- tables you edit as a grid ---- */
// split a table row into cells; a pipe inside [[a|b]], `code`, $maths$ or after a backslash is not a column break
function tableCells(line) {
  const out = []; let cur = '', i = 0; const t = line.trim();
  while (i < t.length) {
    const c = t[i];
    if (c === '\\' && i + 1 < t.length) { cur += c + t[i + 1]; i += 2; continue; }
    if (t.startsWith('[[', i)) { const e = t.indexOf(']]', i); if (e > 0) { cur += t.slice(i, e + 2); i = e + 2; continue; } }
    if (c === '`' || c === '$') { const e = t.indexOf(c, i + 1); if (e > 0) { cur += t.slice(i, e + 1); i = e + 1; continue; } }
    if (c === '|') { out.push(cur); cur = ''; i++; continue; }
    cur += c; i++;
  }
  out.push(cur);
  if (t.startsWith('|')) out.shift();
  if (/(^|[^\\])\|$/.test(t)) out.pop();
  return out.map(x => x.trim());
}
const isTableRule = line => { const c = tableCells(line); return c.length > 0 && c.every(x => /^:?-+:?$/.test(x)); };
// The table the caret is in: { start, end (line numbers), head, rows, align } or null.
function tableAt(ta) {
  const lines = ta.value.split('\n'), at = ta.value.slice(0, ta.selectionStart).split('\n').length - 1;
  const isRow = i => i >= 0 && i < lines.length && lines[i].includes('|') && lines[i].trim() !== '';
  if (!isRow(at)) return null;
  let a = at; while (isRow(a - 1)) a--;
  let b = at; while (isRow(b + 1)) b++;
  if (b - a < 1 || !isTableRule(lines[a + 1])) return null;
  const head = tableCells(lines[a]), align = tableCells(lines[a + 1]).map(x => x.startsWith(':') && x.endsWith(':') ? 'c' : x.endsWith(':') ? 'r' : 'l');
  return { start: a, end: b, head, align, rows: lines.slice(a + 2, b + 1).map(tableCells) };
}
function tableMarkdown(head, rows, align) {
  const n = Math.max(head.length, ...rows.map(r => r.length), 1), len = x => [...x].length;
  const safe = x => { const parts = tableCells('|' + x + '|'); return parts.length > 1 ? parts.join(' \\| ') : x; };   // a | typed into a cell must not start a new column
  const all = [head, ...rows].map(r => Array.from({ length: n }, (_, j) => safe((r[j] || '').replace(/\s*\n\s*/g, ' ').trim())));
  const w = Array.from({ length: n }, (_, j) => { const m = Math.max(3, ...all.map(r => len(r[j]))); return m > 48 ? 0 : m; });   // very wide columns are left unpadded
  const line = r => '| ' + r.map((x, j) => w[j] ? x + ' '.repeat(w[j] - len(x)) : x).join(' | ') + ' |';
  const rule = '| ' + Array.from({ length: n }, (_, j) => { const k = Math.max(3, w[j] || 3), a = align[j] || 'l'; return a === 'c' ? ':' + '-'.repeat(k - 2) + ':' : a === 'r' ? '-'.repeat(k - 1) + ':' : '-'.repeat(k); }).join(' | ') + ' |';
  return [line(all[0]), rule, ...all.slice(1).map(line)].join('\n');
}
function tableEditor(ta, t) {
  let head = [...t.head], rows = t.rows.map(r => [...r]), align = [...t.align];
  const cols = () => Math.max(head.length, ...rows.map(r => r.length), 1);
  const grid = () => { const n = cols();
    return `<table class="w-grid-table"><thead><tr><th></th>${Array.from({ length: n }, (_, j) => `<th><button type="button" class="w-gt-al" data-al="${j}" title="Alignment: click to change">${{ l: 'Left', c: 'Centre', r: 'Right' }[align[j] || 'l']}</button><button type="button" class="w-gt-x" data-delc="${j}" title="Delete this column" aria-label="Delete column ${j + 1}">×</button></th>`).join('')}</tr>
      <tr><th class="w-gt-lab">Head</th>${Array.from({ length: n }, (_, j) => `<td><input data-r="-1" data-c="${j}" value="${esc(head[j] || '')}" aria-label="Heading ${j + 1}"></td>`).join('')}</tr></thead>
      <tbody>${rows.map((r, i) => `<tr><th><button type="button" class="w-gt-x" data-delr="${i}" title="Delete this row" aria-label="Delete row ${i + 1}">×</button></th>${Array.from({ length: n }, (_, j) => `<td><input data-r="${i}" data-c="${j}" value="${esc(r[j] || '')}" aria-label="Row ${i + 1}, column ${j + 1}"></td>`).join('')}</tr>`).join('')}</tbody></table>`; };
  const dlg = modal('w-wide', `<h2>Edit the table</h2>
    <p class="w-muted">Type in the cells. Tab moves to the next one; Enter in the last row adds a row. The Markdown is rewritten and lined up when you press Done.</p>
    <div class="w-gt-wrap">${grid()}</div>
    <p class="w-gt-add"><button type="button" class="w-btn w-btn-small" data-addr>Add a row</button> <button type="button" class="w-btn w-btn-small" data-addc>Add a column</button></p>
    <div class="w-actions"><button type="button" class="w-btn" value="cancel">Cancel</button><button type="button" class="w-btn w-primary" value="ok">Done</button></div>`,
    () => {
      const lines = ta.value.split('\n'), top = ta.scrollTop;
      const made = tableMarkdown(head, rows.filter(r => r.some(x => (x || '').trim()) || rows.length === 1), align).split('\n');
      lines.splice(t.start, t.end - t.start + 1, ...made);
      ta.value = lines.join('\n'); const pos = lines.slice(0, t.start).join('\n').length + (t.start ? 1 : 0); ta.selectionStart = ta.selectionEnd = pos; ta.scrollTop = top;
      ta.dispatchEvent(new Event('input'));
    }, () => ta.focus());
  const wrap = $('.w-gt-wrap', dlg);
  const redraw = focus => { wrap.innerHTML = grid(); if (focus) { const el = $(`input[data-r="${focus[0]}"][data-c="${focus[1]}"]`, wrap); if (el) el.focus(); } };
  wrap.addEventListener('input', e => { const i = e.target.closest('input[data-r]'); if (!i) return; const r = +i.dataset.r, c = +i.dataset.c; if (r < 0) head[c] = i.value; else rows[r][c] = i.value; });
  wrap.addEventListener('keydown', e => {
    const i = e.target.closest('input[data-r]'); if (!i || e.key !== 'Enter') return;
    e.preventDefault(); e.stopPropagation(); const r = +i.dataset.r, c = +i.dataset.c;
    if (r === rows.length - 1) { rows.push(Array(cols()).fill('')); redraw([r + 1, c]); } else { const el = $(`input[data-r="${r + 1}"][data-c="${c}"]`, wrap); if (el) el.focus(); }
  });
  dlg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.value) return;
    if (b.dataset.addr != null) { rows.push(Array(cols()).fill('')); redraw([rows.length - 1, 0]); }
    else if (b.dataset.addc != null) { const n = cols(); head[n] = ''; rows.forEach(r => { r[n] = ''; }); align[n] = 'l'; redraw([-1, n]); }
    else if (b.dataset.delr != null) { if (rows.length > 1) rows.splice(+b.dataset.delr, 1); else rows[0] = Array(cols()).fill(''); redraw(); }
    else if (b.dataset.delc != null) { const j = +b.dataset.delc; if (cols() > 1) { head.splice(j, 1); rows.forEach(r => r.splice(j, 1)); align.splice(j, 1); redraw(); } }
    else if (b.dataset.al != null) { const j = +b.dataset.al; align[j] = { l: 'c', c: 'r', r: 'l' }[align[j] || 'l']; redraw(); }
  });
  const first = $('input[data-r="0"]', wrap) || $('input', wrap); if (first) first.focus();
}

/* ---- what has changed since the published version ---- */
// Line-by-line comparison (longest common subsequence). Returns [{ op: ' ' | '-' | '+', text }].
function diffLines(a, b) {
  const A = a.split('\n'), B = b.split('\n'), n = A.length, m = B.length;
  if (n * m > 4000000) return null;
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < n && j < m) { if (A[i] === B[j]) { out.push({ op: ' ', text: A[i] }); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) out.push({ op: '-', text: A[i++] }); else out.push({ op: '+', text: B[j++] }); }
  while (i < n) out.push({ op: '-', text: A[i++] }); while (j < m) out.push({ op: '+', text: B[j++] });
  return out;
}
function diffHTML(before, after) {
  const d = diffLines(before.replace(/\r\n?/g, '\n').replace(/\s+$/, ''), after.replace(/\r\n?/g, '\n').replace(/\s+$/, ''));
  if (!d) return '<p class="w-muted w-diff-none">This note is too long to compare line by line here.</p>';
  const add = d.filter(x => x.op === '+').length, del = d.filter(x => x.op === '-').length;
  if (!add && !del) return '<p class="w-muted w-diff-none">No changes yet: this is the published version.</p>';
  // keep two lines of context round each change, and fold the rest
  const keep = new Uint8Array(d.length); d.forEach((x, i) => { if (x.op !== ' ') for (let k = Math.max(0, i - 2); k <= Math.min(d.length - 1, i + 2); k++) keep[k] = 1; });
  let html = '', skipped = 0;
  d.forEach((x, i) => {
    if (!keep[i]) { skipped++; return; }
    if (skipped) { html += `<div class="w-diff-skip">${skipped} unchanged line${skipped === 1 ? '' : 's'}</div>`; skipped = 0; }
    html += `<div class="w-diff-line ${x.op === '+' ? 'is-add' : x.op === '-' ? 'is-del' : ''}"><span class="w-diff-op">${x.op === ' ' ? '' : x.op}</span><span>${esc(x.text) || ' '}</span></div>`;
  });
  if (skipped) html += `<div class="w-diff-skip">${skipped} unchanged line${skipped === 1 ? '' : 's'}</div>`;
  return `<p class="w-diff-sum">${add} line${add === 1 ? '' : 's'} added, ${del} removed, compared with what is on the site now.</p><div class="w-diff">${html}</div>`;
}

function bindEditor(root, onChange, getMeta, fields) {
  const ta = $('textarea.w-body', root);
  const repaint = styleEditor(ta);
  const api = { ta, getMeta: getMeta || (() => ({ title: '', tags: [], summary: '', body: ta.value, path: '' })), ...(fields || {}) };
  const redraw = () => { drawOutline(root, ta); drawChecks(root, getMeta ? api : null); repaint(); };
  // "### " with the next number when the note's sections are numbered
  const heading = lvl => { const nb = numbering(ta.value); return '#'.repeat(lvl) + ' ' + (nb.lvl === lvl && nb.numbered && nb.numbered === nb.real.length ? `${nb.real.length + 1}. ` : ''); };
  root.addEventListener('click', e => {
    const j = e.target.closest('[data-line]');
    if (j) { jumpToLine(ta, +j.dataset.line); return; }      // jump to a heading from the outline
    const go = e.target.closest('[data-check]');
    if (go) { const i = (root._issues || [])[+go.dataset.check]; if (!i) return; if (i.field && api.focusField) api.focusField(i.field); else if (i.line != null) jumpToLine(ta, i.line); return; }
    const fx = e.target.closest('[data-fix]');
    if (fx) { const i = (root._issues || [])[+fx.dataset.fix]; if (i && i.fix) { i.fix.run(api); ta.dispatchEvent(new Event('input')); onChange(); redraw(); } return; }
    const b = e.target.closest('[data-ins]'); if (!b) return;
    const k = b.dataset.ins;
    if (k === 'bold') wrapSel(ta, '**', '**', 'bold text');
    if (k === 'italic') wrapSel(ta, '*', '*', 'italic text');
    if (k === 'hl') wrapSel(ta, '==', '==', 'highlighted');
    if (k === 'h3') insertLine(ta, heading(3));
    if (k === 'ul') prefixLines(ta, () => '- ');
    if (k === 'ol') prefixLines(ta, i => `${i + 1}. `);
    if (k === 'quote') prefixLines(ta, () => '> ');
    if (k === 'hr') insertLine(ta, '---\n\n');
    if (k === 'table') { const t = tableAt(ta); if (t) tableEditor(ta, t); else tableDialog(ta); }
    if (k === 'h2') insertLine(ta, heading(2));
    if (k === 'link') { wrapSel(ta, '[[', ']]', ''); openSuggest(ta); }
    if (k === 'math') wrapSel(ta, '$', '$', 'x^2');
    if (k === 'mathd') insertLine(ta, '$$\n\n$$\n');
    if (k === 'fn') {
      const n = (ta.value.match(/\[\^(\d+)\]:/g) || []).length + 1;
      wrapSel(ta, '', `[^${n}]`); ta.value = ta.value.replace(/\s*$/, '') + `\n\n[^${n}]: `; ta.selectionStart = ta.selectionEnd = ta.value.length; ta.dispatchEvent(new Event('input'));
    }
  });
  $('[data-callout]', root).addEventListener('change', e => { const t = e.target.value; if (!t) return; insertLine(ta, `> [!${t}]${t === 'proof' ? '' : ' Title'}\n> `); e.target.value = ''; });
  $('[data-sec]', root).addEventListener('change', e => {
    const t = e.target.value; e.target.value = ''; if (!t) return;
    if (t === 'related') return relatedDialog(ta, getMeta || (() => ({ title: '', tags: [], body: ta.value, path: '' })));
    if (t === 'guidelist') return guideListDialog(ta, getMeta || (() => ({ title: '', tags: [], body: ta.value, path: '' })));
    const next = numberSections(ta.value, t === 'strip');
    if (next !== ta.value) { const p = ta.selectionStart; ta.value = next; ta.selectionStart = ta.selectionEnd = Math.min(p, next.length); ta.dispatchEvent(new Event('input')); }
    else toast(t === 'strip' ? 'No section numbers to remove.' : 'The sections are already numbered in order.');
  });
  $('[data-img]', root).addEventListener('change', e => { [...e.target.files].forEach(f => addImage(f, ta)); e.target.value = ''; });
  // Text that looks copied from a PDF page (several long lines, no blank line, no Markdown) as one paragraph; '' for anything else.
  function pdfText(t) {
    const lines = t.replace(/\r/g, '').replace(/\s+$/, '').split('\n').map(l => l.trim());
    if (lines.length < 2 || lines.some(l => !l || /^(#{1,6}\s|[-*+>]\s|\d+[.)]\s|\||```|~~~)/.test(l))) return '';
    const head = lines.slice(0, -1);
    if (head.some(l => l.length < 30) || head.filter(l => /[.?!:;”"]$/.test(l)).length > head.length / 2) return '';
    return lines.join('\n').replace(/([A-Za-z])[-­]\n(?=[a-z])/g, '$1').replace(/\n/g, ' ')
      .replace(/ﬀ/g, 'ff').replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl').replace(/ﬃ/g, 'ffi').replace(/ﬄ/g, 'ffl').replace(/[ \s]+/g, ' ');
  }
  ta.addEventListener('paste', e => {
    const f = [...(e.clipboardData?.files || [])].find(f => f.type.startsWith('image/')); if (f) { e.preventDefault(); addImage(f, ta); return; }
    // a web address pasted over selected words turns them into a link
    const url = (e.clipboardData?.getData('text/plain') || '').trim(), sel = ta.value.slice(ta.selectionStart, ta.selectionEnd);
    if (sel.trim() && !/\n/.test(sel) && /^https?:\/\/\S+$/.test(url) && !/^https?:\/\//.test(sel.trim())) { e.preventDefault(); ta.setRangeText(`[${sel}](${url})`, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); return; }
    // a passage copied from a PDF arrives broken into the book's lines: join them and mend the words split by a hyphen
    const mended = pdfText(e.clipboardData?.getData('text/plain') || '');
    if (mended) { e.preventDefault(); ta.setRangeText(mended, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); }
  });
  ta.addEventListener('drop', e => { const fs = [...(e.dataTransfer?.files || [])].filter(f => f.type.startsWith('image/')); if (fs.length) { e.preventDefault(); fs.forEach(f => addImage(f, ta)); } });
  ta.addEventListener('keydown', e => {
    if (suggest.open && ['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) { e.preventDefault(); suggestKey(e.key, ta); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); wrapSel(ta, '**', '**', 'bold text'); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') { e.preventDefault(); wrapSel(ta, '*', '*', 'italic text'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); $('[data-publish]', root.closest('.w-pane'))?.click(); return; }
    if (smartKey(e, ta)) e.preventDefault();
  });
  let t = null, t2 = null;
  ta.addEventListener('input', () => {
    openSuggest(ta); clearTimeout(t); t = setTimeout(() => { onChange(); redraw(); }, 250);
    // sections moved or deleted: once you pause, put the numbers back in order (only when every section already has one)
    clearTimeout(t2); t2 = setTimeout(() => { const nb = numbering(ta.value); if (nb.real.length >= 2 && nb.numbered === nb.real.length && !nb.inOrder && replaceBody(ta, numberSections(ta.value, false))) { onChange(); redraw(); } }, 1200);
  });
  root._redraw = redraw; redraw();
  ta.addEventListener('blur', () => setTimeout(closeSuggest, 150));
}
function addImage(file, ta) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace('jpeg', 'jpg');
  const base = slug(file.name.replace(/\.[^.]+$/, '')) || 'image';
  let name = `${base}.${ext}`, i = 2;
  while (W.images.has(name) || W.files.some(f => f.toLowerCase().endsWith('/' + name))) name = `${base}-${i++}.${ext}`;
  W.images.set(name, URL.createObjectURL(file)); W.imageFiles = W.imageFiles || new Map(); W.imageFiles.set(name, file);
  insertLine(ta, `![[${name}]]\n`);
}
const fileB64 = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(f); });
async function imageCommits(raw) {
  const out = [];
  for (const [name, file] of (W.imageFiles || new Map())) if (raw.includes(name)) out.push({ path: `notes/images/${name}`, base64: await fileB64(file) });
  return out;
}

/* ---- [[ link suggestions ---- */
const suggest = { open: false, items: [], sel: 0, el: null };
function openSuggest(ta) {
  const before = ta.value.slice(0, ta.selectionStart);
  const m = before.match(/\[\[([^\]\n|#]*)$/);
  if (!m) return closeSuggest();
  const q = m[1].toLowerCase();
  suggest.items = W.notes.map(n => n._meta).filter(Boolean)
    .filter(x => !q || x.title.toLowerCase().includes(q) || x.id.toLowerCase().startsWith(q) || x.source.toLowerCase().includes(q) || x.aliases.some(a => a.toLowerCase().includes(q)))
    .sort((a, b) => (b.title.toLowerCase().startsWith(q)) - (a.title.toLowerCase().startsWith(q)) || a.title.localeCompare(b.title)).slice(0, 8);
  if (!suggest.items.length) return closeSuggest();
  suggest.sel = 0; suggest.open = true;
  if (!suggest.el) { suggest.el = document.createElement('ul'); suggest.el.className = 'w-suggest'; suggest.el.setAttribute('role', 'listbox'); document.body.append(suggest.el);
    suggest.el.addEventListener('mousedown', e => { const li = e.target.closest('li'); if (li) { e.preventDefault(); suggest.sel = +li.dataset.i; suggestKey('Enter', suggest.ta); } }); }
  suggest.ta = ta;
  suggest.el.innerHTML = suggest.items.map((x, i) => `<li data-i="${i}" role="option" aria-selected="${i === 0}"><span>${esc(x.id)}</span> ${esc(x.title)}${x.source ? `<small>${esc(x.source)}</small>` : ''}</li>`).join('');
  const p = caretXY(ta); suggest.el.style.left = Math.min(p.x, innerWidth - 330) + 'px'; suggest.el.style.top = p.y + 'px'; suggest.el.hidden = false;
}
function closeSuggest() { suggest.open = false; if (suggest.el) suggest.el.hidden = true; }
function suggestKey(k, ta) {
  if (k === 'Escape') return closeSuggest();
  if (k === 'ArrowDown' || k === 'ArrowUp') { suggest.sel = (suggest.sel + (k === 'ArrowDown' ? 1 : -1) + suggest.items.length) % suggest.items.length; $$('li', suggest.el).forEach((li, i) => li.setAttribute('aria-selected', i === suggest.sel)); return; }
  const x = suggest.items[suggest.sel]; if (!x) return;
  const a = ta.selectionStart, before = ta.value.slice(0, a), start = before.lastIndexOf('[[') + 2;
  const afterClose = ta.value.slice(a).startsWith(']]');
  ta.setRangeText(x.title + (afterClose ? '' : ']]'), start, a, 'end');
  if (afterClose) ta.selectionStart = ta.selectionEnd = ta.selectionEnd + 2;
  closeSuggest(); ta.focus(); ta.dispatchEvent(new Event('input'));
}
function caretXY(ta) {
  const m = document.createElement('div'), cs = getComputedStyle(ta);
  for (const p of ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'padding', 'border', 'boxSizing', 'whiteSpace', 'wordWrap', 'width', 'tabSize']) m.style[p] = cs[p];
  m.style.position = 'absolute'; m.style.visibility = 'hidden'; m.style.whiteSpace = 'pre-wrap'; m.style.overflow = 'hidden';
  m.textContent = ta.value.slice(0, ta.selectionStart); const s = document.createElement('span'); s.textContent = '\u200b'; m.append(s); document.body.append(m);
  const r = ta.getBoundingClientRect(), sr = s.offsetTop, sl = s.offsetLeft; m.remove();
  return { x: r.left + sl, y: r.top + sr - ta.scrollTop + parseFloat(cs.lineHeight || 20) + 4 };
}

/* ---------------- form pieces shared by Write and Edit ---------------- */
// How often each tag is used across the notebook, most used first.
function tagCounts() {
  const m = new Map(); for (const n of W.notes) for (const t of (n._meta ? n._meta.tags : [])) m.set(t, (m.get(t) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
// The Tags box: suggestions appear as you type; the ten most used tags sit underneath as one-click chips.
function tagsField(value) {
  const top = tagCounts().filter(([t]) => t !== 'guide').slice(0, 10);
  return `<div class="w-field w-tagfield"><span>Tags <small>start typing to find one; separate with commas</small></span>
    <div class="w-tagwrap"><input name="tags" value="${esc(value || '')}" placeholder="philosophy, plato" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false">
    <ul class="w-suggest w-tagsuggest" role="listbox" hidden></ul></div>
    ${top.length ? `<p class="w-chips" aria-label="Most used tags"><small>Most used:</small> ${top.map(([t]) => `<button type="button" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</p>` : ''}</div>`;
}
function bindTags(form) {
  const input = form.tags, box = input && $('.w-tagsuggest', form); if (!input || !box) return;
  const all = tagCounts(); let items = [], sel = 0;
  const token = () => { const before = input.value.slice(0, input.selectionStart ?? input.value.length); return { start: before.lastIndexOf(',') + 1, text: before.slice(before.lastIndexOf(',') + 1).trim().toLowerCase() }; };
  const close = () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); items = []; };
  const draw = () => {
    const { text } = token(), have = new Set(input.value.split(',').map(t => slug(t)).filter(Boolean));
    if (!text) return close();
    const q = slug(text);
    items = all.filter(([t]) => t.includes(q) && (!have.has(t) || t === q) && t !== q)
      .sort((a, b) => (b[0].startsWith(q)) - (a[0].startsWith(q)) || b[1] - a[1]).slice(0, 8);
    if (!items.length) return close();
    sel = 0; box.hidden = false; input.setAttribute('aria-expanded', 'true');
    box.innerHTML = items.map(([t, c], i) => `<li data-i="${i}" role="option" aria-selected="${i === 0}">${esc(t)} <span>${c} note${c === 1 ? '' : 's'}</span></li>`).join('');
  };
  const pick = i => {
    const it = items[i]; if (!it) return;
    const { start } = token(), end = input.selectionStart ?? input.value.length;
    const head = input.value.slice(0, start), rest = input.value.slice(end).replace(/^[^,]*/, '').replace(/^,\s*/, '');
    input.value = (head.trim() ? head.replace(/\s*$/, ' ') : '') + it[0] + ', ' + rest;
    const pos = input.value.length - rest.length; input.setSelectionRange(pos, pos);
    close(); input.dispatchEvent(new Event('input', { bubbles: true })); close(); input.focus();
  };
  input.addEventListener('input', draw);
  input.addEventListener('keydown', e => {
    if (box.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; $$('li', box).forEach((li, i) => li.setAttribute('aria-selected', i === sel)); }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(sel); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  });
  box.addEventListener('mousedown', e => { const li = e.target.closest('li'); if (li) { e.preventDefault(); pick(+li.dataset.i); } });
  input.addEventListener('blur', () => setTimeout(close, 150));
}
// Everything that isn't the title or the text lives in one fold-away panel under the editor.
const detailsPanel = inner => `<details class="w-details"${store.get('details-open', false) ? ' open' : ''}><summary>Details <small class="w-details-state"></small></summary><div class="w-details-body">${inner}</div></details>`;
function bindDetails(form) {
  const d = $('.w-details', form); if (!d) return;
  d.addEventListener('toggle', () => store.set('details-open', d.open));
}
function detailsState(form, meta) {
  const el = $('.w-details-state', form); if (!el) return;
  const bits = [meta.tags.length ? `${meta.tags.length} tag${meta.tags.length === 1 ? '' : 's'}` : 'no tags', meta.summary ? 'summary ✓' : 'no summary'];
  el.textContent = bits.join(' · '); el.classList.toggle('is-missing', !meta.tags.length || !meta.summary);
}
// The bar pinned to the bottom of the form: what's left to check, the word count, the save state, and Publish.
const bottomBar = (left, publish) => `<div class="w-bar"><button type="button" class="w-bar-checks" data-to-checks title="Show what's left to check"></button><span class="w-bar-words"></span><span class="w-bar-saved"></span>
  <span class="w-status" role="status"></span><span class="w-bar-btns">${left}<button type="button" class="w-btn w-primary" data-publish title="Ctrl+Enter">${publish}</button></span></div>`;
function bindBar(form) {
  const b = $('[data-to-checks]', form); if (!b) return;
  b.addEventListener('click', () => { const c = $('.w-checks', form); if (c) { c.open = true; c.scrollIntoView({ block: 'center', behavior: 'smooth' }); } });
}
// field helpers the checks use to jump to a field or fill it in
const fieldApi = (form, refresh) => ({
  setField(name, v) { const el = form[name]; if (!el) return; el.value = v; refresh(); },
  focusField(name) { const el = form[name] || form['f_' + name]; if (!el) return; const d = el.closest('details'); if (d) d.open = true; el.focus(); el.scrollIntoView({ block: 'center' }); }
});
const ago = at => { const s = Math.round((Date.now() - at) / 1000); return s < 15 ? 'just now' : s < 90 ? 'a minute ago' : s < 3600 ? `${Math.round(s / 60)} minutes ago` : 'over an hour ago'; };
setInterval(() => $$('.w-bar-saved[data-at]').forEach(el => { el.textContent = `Draft saved ${ago(+el.dataset.at)}`; }), 20000);

/* ---------------- templates ---------------- */
// Skeletons modelled on the notes already in the notebook. `kind` picks the section when it exists.
const TEMPLATES = [
  { name: 'Guide (reading order)', kind: 'guides', tags: 'guide', hint: 'A reading order for the notes on … (one sentence; shown on the Guides page).',
    body: 'Where to start, and how the parts follow on from each other.\n\n## First Part\n\nWhat this part covers, in one line.\n\n1. [[]] — What the note shows, in one line.\n2. [[]] — What the note shows, in one line.\n\n## Second Part\n\nWhat this part covers, in one line.\n\n1. [[]] — What the note shows, in one line.\n2. [[]] — What the note shows, in one line.\n' },
  { name: 'Scripture theme', tags: 'theology, scripture', hint: 'Verses that connect one theme, grouped, with a line on each.',
    body: 'One or two sentences on the theme and how the passages hang together. Quotations from the KJV.\n\n## 1. First Group\n\n**Book 1:1**  \n"Verse text."\n\n- What this verse shows.\n\n**Book 2:2**  \n"Verse text."\n\n- What this verse shows.\n\n## 2. Second Group\n\n**Book 3:3**  \n"Verse text."\n\n- What this verse shows.\n\n## 3. How to Read These\n\n- What the passages establish together.\n- What they do not establish.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book or reading notes', kind: 'book', tags: 'philosophy', hint: 'What the chapter argues, in order, with my questions.',
    body: 'What the text is, and which parts were read closely and which skimmed.\n\n## 1. The Question\n\n- What the author is trying to settle.\n- The usual view he is arguing against.\n\n## 2. The Argument\n\n1. First step.\n2. Second step.\n3. Conclusion.\n\n## 3. Key Terms\n\n| Term | Meaning |\n|---|---|\n|  |  |\n\n## 4. Objections and Replies\n\n- *Objection.* Reply.\n\n## 5. What I Make of It\n\n- What convinces me.\n- What does not.\n\n## 6. To Do\n\n- What to read next.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: whole-book overview', kind: 'book', tags: 'philosophy', hint: 'The book in one page: its thesis, how it is built, the main ideas and my verdict.',
    body: 'What kind of book this is, who it is for, and how much of it I read.\n\n## 1. The Thesis\n\n- The one claim the book is making.\n- What it is arguing against.\n\n## 2. How the Book Is Built\n\n| Ch. | About |\n|---|---|\n| 1 |  |\n| 2 |  |\n| 3 |  |\n\n## 3. Main Ideas\n\n1. **First idea.** What it means.\n2. **Second idea.** What it means.\n3. **Third idea.** What it means.\n\n## 4. Best Passages\n\n> "Short quotation." (p. 00)\n\n- Why it matters.\n\n## 5. Strengths and Weaknesses\n\n- **Strong:** point.\n- **Weak:** point.\n\n## 6. Verdict\n\n- Who should read it, and which chapters.\n\n## 7. To Read Next\n\n- Book or chapter.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: primary text or patristic work', kind: 'book', tags: 'theology, patristics', hint: 'A classic or patristic work: when and why it was written, its argument in order, and the lines worth keeping.',
    body: 'The work, its author and date, and the one question it answers.\n\n## 1. Background\n\n- When and why it was written.\n- Who it is written against or for.\n\n## 2. Layout\n\n| Ch. | About |\n|---|---|\n|  |  |\n|  |  |\n|  |  |\n\n## 3. The Argument\n\n### First Part\n\n- Point.\n- His image or example.\n\n### Second Part\n\n- Point.\n- His image or example.\n\n## 4. Lines Worth Keeping\n\n> "Short quotation." (ch. 0)\n\n- What it means.\n\n## 5. Scripture He Uses\n\n- **Book 1:1** and how he reads it.\n\n## 6. Why It Matters\n\n- What it settles.\n- Who it answers.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: analytical reading (Adler)', kind: 'book', tags: 'philosophy', hint: 'Adler\'s four questions: what the book is about, what it says in detail, whether it is true, and what of it.',
    body: 'Title, author, edition, and the kind of book it is (theoretical or practical; history, science, philosophy).\n\n## 1. What Is the Book About as a Whole\n\n- **In one sentence:** the unity of the book.\n- **The problems the author is trying to solve:**\n    1. Problem.\n    2. Problem.\n\n## 2. The Main Parts\n\n1. First part, and what it contributes.\n2. Second part, and what it contributes.\n3. Third part, and what it contributes.\n\n## 3. Coming to Terms\n\n| The author\'s word | What he means by it |\n|---|---|\n|  |  |\n|  |  |\n\n## 4. The Leading Propositions\n\n1. Proposition, in my own words.\n2. Proposition, in my own words.\n\n## 5. The Arguments\n\n- For proposition 1: the reasons given.\n- For proposition 2: the reasons given.\n\n## 6. Which Problems Are Solved\n\n- Solved.\n- Not solved, and whether the author knows it.\n\n## 7. Is It True\n\nOnly after I can say "I understand".\n\n- Where the author is **uninformed**.\n- Where the author is **misinformed**.\n- Where the reasoning is **illogical**.\n- Where the account is **incomplete**.\n\n## 8. What of It\n\n- What follows if he is right.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: book club, reading by book or chapter', kind: 'book', tags: 'literature', hint: 'Running notes on a long work, one section per book or chapter: the theme first, then observations with line references and what echoes what.',
    body: 'Which work and translation, which books or chapters these notes cover, and the commentary used.\n\n## Book 1\n\n- Theme: what this book is about, in one line.\n    - How it follows from the last book.\n    - What it sets up.\n\n- Opening scene: what happens and why it is placed here.\n    - Detail worth noting (1.00).\n\n- A character\'s speech: what he says, and what the way he says it shows.\n    - What he wants.\n    - What he does not admit.\n    - Echoes an earlier speech, cf. 0.00.\n\n- Simile or image:\n    - This part = that part of the story.\n    - This part = that part of the story.\n\n- Name or epithet = who or what it refers to.\n- Custom, myth or term explained: what the first audience would have known.\n- Foreshadowing: what this points forward to, and where it is fulfilled.\n- Parallel: this scene mirrors or reverses 0.00.\n- Question for the group: something I did not understand or want to argue about.\n\n## Book 2\n\n- Theme: what this book is about, in one line.\n    - How it follows from the last book.\n\n- Observation (2.00).\n    - Why it matters.\n\n- Parallel with Book 1: what is repeated and what has changed.\n\n## Threads Across the Books\n\n- **Character:** how he changes from book to book.\n- **Image or motif:** where it recurs and what it gathers.\n- **Structure:** which books answer each other.\n\n## Related\n\n- [[]]\n' },
  { name: 'Argument', tags: 'philosophy, apologetics', hint: 'The argument in numbered steps, the objections, and where it stands.',
    body: 'What the argument is meant to show, in one or two sentences.\n\n## 1. The Argument\n\n1. First premise.\n2. Second premise.\n3. Therefore, conclusion.\n\n## 2. Why Accept the Premises\n\n- **Premise 1:** reason.\n- **Premise 2:** reason.\n\n## 3. Objections and Replies\n\n| Objection | Reply |\n|---|---|\n|  |  |\n|  |  |\n\n## 4. The Orthodox View\n\n- What the Fathers accept here.\n- Where they would qualify it.\n\n## 5. Where It Stands\n\n- Strongest point.\n- Weakest point.\n\n## Related\n\n- [[]]\n' },
  { name: 'Fallacy', tags: 'philosophy, logic, fallacies', hint: 'What the fallacy is, its form, an example and how to answer it.',
    body: 'A one-sentence definition of the fallacy.\n\n## 1. The Form\n\n1. Premise.\n2. Premise.\n3. Therefore, conclusion (which does not follow).\n\n## 2. Why It Fails\n\n- What the conclusion would actually need.\n\n## 3. Examples\n\n- **Everyday:** example.\n- **In debate:** example.\n\n## 4. How to Answer It\n\n- Name the step that fails.\n- Ask the question that exposes it.\n\n## 5. Not to Be Confused With\n\n- A legitimate move that looks similar.\n\n## Related\n\n- [[]]\n' },
  { name: 'Comparison of positions', tags: 'theology', hint: 'The positions side by side, what each says and what each costs.',
    body: 'The question the positions disagree about.\n\n## 1. The Positions\n\n| Position | Says | Problem |\n|---|---|---|\n|  |  |  |\n|  |  |  |\n|  |  |  |\n\n## 2. First Position\n\n- Main claim.\n- Who holds it.\n- Strongest argument for it.\n\n## 3. Second Position\n\n- Main claim.\n- Who holds it.\n- Strongest argument for it.\n\n## 4. What Is at Stake\n\n- Why the difference matters.\n\n## 5. The Orthodox View\n\n- Where the Church stands and why.\n\n## Related\n\n- [[]]\n' },
  { name: 'Council or history', tags: 'theology, church-history', hint: 'Background, what happened, what was decided and why it matters.',
    body: 'What happened, when and where, in one or two sentences.\n\n## 1. Background\n\n- The question in dispute.\n- The people involved.\n\n## 2. Timeline\n\n| Year | Event |\n|---|---|\n|  |  |\n|  |  |\n|  |  |\n\n## 3. What Was Decided\n\n1. First decision.\n2. Second decision.\n\n## 4. Key Terms\n\n- **Term:** meaning.\n\n## 5. Aftermath\n\n- What followed.\n\n## 6. Why It Matters\n\n- What it settles for theology.\n\n## Related\n\n- [[]]\n' },
  { name: 'Doctrine or concept', tags: 'theology', hint: 'What the teaching is, where it comes from in Scripture and the Fathers, and what it rules out.',
    body: 'A plain definition of the teaching.\n\n## 1. The Teaching\n\n- First point.\n- Second point.\n\n## 2. Scripture\n\n**Book 1:1**  \n"Verse text."\n\n- What it shows.\n\n## 3. The Fathers\n\n- **St. Name:** what he says.\n\n## 4. What It Rules Out\n\n- The error on one side.\n- The error on the other.\n\n## 5. Why It Matters\n\n- What depends on it.\n\n## Related\n\n- [[]]\n' },
  { name: 'Lecture', kind: 'lecture', tags: 'philosophy', hint: 'What the lecture argued, in the order it was given, with the terms defined and what to follow up.',
    body: 'Course, lecturer, lecture number and date, and what was assigned for it.\n\n## 1. The Question for Today\n\n- What the lecture set out to answer.\n- How it follows from the last one.\n\n## 2. Outline\n\n1. First part.\n2. Second part.\n3. Third part.\n\n## 3. Notes\n\n### First Part\n\n- Point.\n    - Example or evidence.\n- Point.\n\n### Second Part\n\n- Point.\n    - Example or evidence.\n- Point.\n\n## 4. Terms and Definitions\n\n| Term | Definition |\n|---|---|\n|  |  |\n|  |  |\n\n## 5. On the Board\n\n- Diagram, formula, date or quotation worth copying exactly.\n\n## 6. The Main Point in My Own Words\n\n- Two or three sentences, written after the lecture without looking at the notes.\n\n## 7. Questions\n\n- What I did not follow.\n- What to ask or look up.\n\n## 8. To Do\n\n- Reading for next time.\n- Passages or sources the lecturer mentioned.\n\n## Related\n\n- [[]]\n' },
  { name: 'Video or podcast', kind: 'video', tags: 'philosophy', hint: 'Who is speaking and on what, the main claims with timestamps, what was convincing, and what to check.',
    body: 'Who is speaking, where it was published, how long it is, and why I watched or listened. Change the Section above to Podcast if that fits better.\n\n## 1. In Brief\n\n- The one thing the speaker wants you to come away with.\n\n## 2. Main Points\n\n- **00:00** Point.\n    - Supporting detail or example.\n- **00:00** Point.\n    - Supporting detail or example.\n- **00:00** Point.\n    - Supporting detail or example.\n\n## 3. Arguments Made\n\n1. Claim, and the reason given for it.\n2. Claim, and the reason given for it.\n\n## 4. Quotations\n\n> "Short quotation." (00:00)\n\n- Why I kept it.\n\n## 5. Sources Mentioned\n\n- Book, article or person named, to look up.\n\n## 6. What I Make of It\n\n- What convinced me.\n- What I doubt, or what was asserted without support.\n\n## 7. To Check\n\n- A claim to verify before repeating it.\n\n## Related\n\n- [[]]\n' }
];

/* ---------------- Write tab ---------------- */
function writeForm() {
  const draft = store.get('draft', {});
  const kind = W.kinds.find(k => k.key === draft.kind) || W.kinds.find(k => k.sec.id === W.cfg.defaultSection) || W.kinds[0];
  const courses = [...new Set(W.notes.map(n => n._meta && n._meta.course).filter(Boolean))].sort();
  $('#tab-write').innerHTML = `<div class="w-pane w-split">
    <form class="w-form" autocomplete="off" onsubmit="return false">
      <label class="w-field w-title"><span class="w-sr">Title</span><input name="title" required value="${esc(draft.title || '')}" placeholder="Title"></label>
      <div class="w-meta">
        <label>Section <select name="kind">${W.kinds.map(k => `<option value="${k.key}"${k === kind ? ' selected' : ''}>${esc(k.label)}</option>`).join('')}</select></label>
        <label>Template <select name="tpl"><option value="">Blank note</option>${TEMPLATES.map((t, i) => `<option value="${i}">${esc(t.name)}</option>`).join('')}</select></label>
        <span class="w-addr">Address <strong id="addr">…</strong></span>
      </div>
      <div class="w-field w-editor"><span class="w-sr">Note</span>${toolbar()}<textarea class="w-body" name="body" rows="18" placeholder="Write in Markdown. Type [[ to link another note.">${esc(draft.body || '')}</textarea>${sidePanels()}</div>
      ${detailsPanel(`<div class="w-kind-fields"></div>
        ${tagsField(draft.tags)}
        <label class="w-field"><span>Summary <small>one or two sentences; shown as the abstract</small></span><textarea name="summary" rows="2">${esc(draft.summary || '')}</textarea></label>
        <div class="w-guides-slot"></div>`)}
      <datalist id="courses">${courses.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
      ${bottomBar('<button type="button" class="w-btn" data-clear>Clear</button>', 'Publish')}
    </form>
    <section class="w-preview-wrap" aria-label="Preview"><p class="w-preview-label">Preview</p><div id="preview" class="w-preview"></div></section>
  </div>`;
  const form = $('#tab-write form');
  let picks = Array.isArray(draft.guides) ? draft.guides.filter(p => W.notes.some(n => n.path === p.path)) : [];
  const drawGuides = () => { $('.w-guides-slot', form).innerHTML = guidesField(picks); };
  const kindFields = () => {
    const k = W.kinds.find(k => k.key === form.kind.value); const f = FIELDS[k.kind] || [];
    $('.w-kind-fields', form).innerHTML = f.length ? `<div class="w-grid">${f.map(([name, label]) => `<label class="w-field"><span>${label}</span><input name="f_${name}" value="${esc((draft.f || {})[name] || '')}"${name === 'course' ? ' list="courses"' : ''}${name === 'year' || name === 'lecture' || name === 'episode' ? ' inputmode="numeric"' : ''}></label>`).join('')}</div>` : '';
  };
  const collect = () => {
    const k = W.kinds.find(k => k.key === form.kind.value);
    const f = {}; $$('[name^="f_"]', form).forEach(i => { if (i.value.trim()) f[i.name.slice(2)] = i.value.trim(); });
    return { kind: k.key, title: form.title.value.trim(), tags: form.tags.value, summary: form.summary.value.trim(), body: form.body.value, f, k, guides: picks };
  };
  const toRaw = d => {
    const lines = ['---', `title: ${yamlVal(d.title || 'Untitled')}`];
    for (const [key] of FIELDS[d.k.kind] || []) if (d.f[key]) lines.push(`${key}: ${yamlVal(d.f[key])}`);
    lines.push(`date: ${today()}`);
    const tags = d.tags.split(',').map(t => slug(t)).filter(Boolean);
    if (tags.length) lines.push(`tags: [${tags.join(', ')}]`);
    if (d.summary) lines.push(`summary: ${JSON.stringify(d.summary)}`);
    lines.push('---', '', d.body.replace(/\s+$/, ''), '');
    return lines.join('\n');
  };
  const pathFor = d => uniquePath(folderOf(d.k), slug(d.title) || 'untitled');
  const tagList = s => [...new Set(s.split(',').map(t => slug(t)).filter(Boolean))];
  const getMeta = () => { const d = collect(); return { title: d.title, tags: tagList(d.tags), summary: d.summary, body: d.body, path: pathFor(d), kind: d.k.kind, source: d.f.source || '' }; };
  const refresh = () => {
    const d = collect(); const { k, ...save } = d; store.set('draft', save); previewRaw(toRaw(d), pathFor(d)); const ed = $('.w-editor', form); if (ed._redraw) ed._redraw();
    detailsState(form, getMeta());
    const sv = $('.w-bar-saved', form); if (sv) { const any = d.title || d.body.trim(); if (any) { sv.dataset.at = Date.now(); sv.textContent = 'Draft saved just now'; } else { delete sv.dataset.at; sv.textContent = ''; } }
  };
  form.addEventListener('input', e => { if (!e.target.classList.contains('w-body')) { clearTimeout(form._t); form._t = setTimeout(refresh, 250); } });
  form.kind.addEventListener('change', () => { draft.f = collect().f; kindFields(); refresh(); });
  form.tpl.addEventListener('change', () => {
    const t = TEMPLATES[form.tpl.value]; form.tpl.value = ''; if (!t) return;
    if (form.body.value.trim() && !confirm(`Replace what you've written with the “${t.name}” template?`)) return;
    form.body.value = t.body;
    form.tags.value = [...new Set([...tagList(form.tags.value), ...tagList(t.tags)])].join(', ');
    form.summary.placeholder = t.hint;
    const k = t.kind && W.kinds.find(k => k.kind === t.kind); if (k && form.kind.value !== k.key) { form.kind.value = k.key; draft.f = collect().f; kindFields(); }
    refresh(); (form.title.value ? form.body : form.title).focus();
  });
  form.addEventListener('click', e => {
    const t = e.target.closest('[data-tag]');
    if (t) { const cur = form.tags.value.split(',').map(s => s.trim()).filter(Boolean); if (!cur.includes(t.dataset.tag)) cur.push(t.dataset.tag); form.tags.value = cur.join(', '); refresh(); }
    if (e.target.closest('[data-guides]')) guidesDialog(picks, getMeta, p => { picks = p; drawGuides(); refresh(); });
    const un = e.target.closest('[data-unpick]'); if (un) { picks.splice(+un.dataset.unpick, 1); drawGuides(); refresh(); }
    if (e.target.closest('[data-clear]') && confirm('Clear this draft?')) { store.del('draft'); W.images.clear(); writeForm(); }
  });
  $('[data-publish]', form).addEventListener('click', async () => {
    const d = collect(); const status = $('.w-status', form);
    if (!d.title) { status.textContent = 'Give the note a title first.'; form.title.focus(); return; }
    if (!conn()) { status.textContent = 'Connect to GitHub in Settings first.'; return; }
    if (!confirmChecks(getMeta())) return;
    const raw = toRaw(d), path = pathFor(d);
    busy(true, 'Publishing…');
    try {
      const guides = await guideCommits(picks, d.title, d.summary);
      await commitFiles([{ path, content: raw }, ...await imageCommits(raw), ...guides], `Add ${d.k.label.toLowerCase()} note: ${d.title}${guides.length ? ` (and list it in ${guides.length === 1 ? 'a guide' : guides.length + ' guides'})` : ''}`);
      store.del('draft'); W.images.clear(); W.imageFiles = new Map();
      W.notes.push({ path, raw }); annotate();
      done(`Published <strong>${esc(d.title)}</strong> to <code>${esc(path)}</code>. The site updates in about a minute.`);
      writeForm();
    } catch (e) { status.textContent = e.message; }
    finally { busy(false); }
  });
  kindFields(); drawGuides(); bindTags(form); bindDetails(form); bindBar(form);
  bindEditor($('.w-editor', form), refresh, getMeta, fieldApi(form, refresh)); refresh();
  if (!draft.title && !draft.body) form.title.focus();
}

/* ---------------- front matter for the Edit tab ---------------- */
// Splits a file into its front-matter entries (kept verbatim, in order) and the body, so that
// only the fields you change are rewritten. Returns null when there is no readable front matter.
function splitFront(raw) {
  const text = raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = text.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/); if (!m) return null;
  let data; try { data = window.jsyaml.load(m[1]); } catch { return null; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const blocks = [];
  for (const line of m[1].split('\n')) {
    const k = line.match(/^([A-Za-z_][\w-]*):(\s|$)/);
    if (k) blocks.push({ key: k[1], text: line }); else if (blocks.length) blocks[blocks.length - 1].text += '\n' + line; else blocks.push({ key: '', text: line });
  }
  return { blocks, data, body: text.slice(m[0].length).replace(/^\n+/, '') };
}
function joinFront(blocks, body) { return '---\n' + blocks.map(b => b.text).filter(t => t.trim()).join('\n') + '\n---\n\n' + body.replace(/\s+$/, '') + '\n'; }

/* ---------------- deleting a note ---------------- */
// Shows what deleting will touch, then removes the note and, in the same commit, takes it out of every Related
// list and guide and turns links to it inside sentences into plain text (assets/tidy-core.js; tools/tidy.mjs
// does the same for notes deleted in Obsidian or on github.com).
function deleteFlow(path, after) {
  if (!conn() || !conn().token) { toast('Connect to GitHub in Settings first.'); showTab('settings'); return; }
  const n = W.notes.find(x => x.path === path);
  if (!n || !n._meta) { toast('That note is not in the notebook any more.'); return; }
  const m = n._meta, T = window.CommonplaceTidy;
  // a title or alias that another note also answers to is left alone
  const others = new Set(W.notes.filter(x => x !== n && x._meta).flatMap(x => [x._meta.title, x._meta.id]).map(k => String(k).toLowerCase()));
  const target = { title: others.has(m.title.toLowerCase()) ? '' : m.title, id: m.id, aliases: m.aliases.filter(a => !others.has(a.toLowerCase())), path };
  const hit = W.notes.filter(x => x !== n && x.raw).map(x => ({ x, r: T.unlink(x.raw, [target]) })).filter(a => a.r.changed);
  const lists = hit.reduce((s, a) => s + a.r.removed, 0), prose = hit.reduce((s, a) => s + a.r.unlinked, 0);
  // pictures only this note uses
  const embeds = [...String(n.raw).matchAll(/!\[\[([^\]|#\n]+)|!\[[^\]]*\]\(([^)\s]+)/g)].map(x => (x[1] || x[2]).trim().split('/').pop().toLowerCase()).filter(f => /\.(png|jpe?g|gif|svg|webp|avif|bmp|pdf)$/.test(f));
  const restText = W.notes.filter(x => x !== n).map(x => String(x.raw || '').toLowerCase()).join('\n');
  const pics = [...new Set(embeds)].map(f => W.files.find(p => p.toLowerCase().endsWith('/' + f))).filter(Boolean).filter(p => !restText.includes(p.split('/').pop().toLowerCase()));
  const row = a => `<li><span class="w-mono">${esc(a.x._meta ? a.x._meta.id : '')}</span> ${esc(a.x._meta ? a.x._meta.title : a.x.path)} <small>${[a.r.removed ? `${a.r.removed} list entr${a.r.removed === 1 ? 'y' : 'ies'} removed` : '', a.r.unlinked ? `${a.r.unlinked} link${a.r.unlinked === 1 ? '' : 's'} in the text made plain` : ''].filter(Boolean).join(' · ')}</small></li>`;
  modal('', `<h2>Delete “${esc(m.title)}”?</h2>
    <p class="w-muted"><span class="w-mono">${esc(m.id)}</span> · ${esc(path)}. Its address is retired and will not be given to another note.</p>
    ${hit.length ? `<p>${hit.length} other note${hit.length === 1 ? ' points' : 's point'} at it. They are cleaned up in the same step${lists ? `: ${lists} entr${lists === 1 ? 'y' : 'ies'} come out of Related lists and guides (numbered lists are renumbered)` : ''}${prose ? `${lists ? ', and ' : ': '}${prose} link${prose === 1 ? '' : 's'} inside sentences become${prose === 1 ? 's' : ''} plain text` : ''}.</p>
      <ul class="w-rel w-del-list">${hit.map(row).join('')}</ul>` : '<p>No other note links to it.</p>'}
    ${pics.length ? `<label class="w-check"><input type="checkbox" name="pics" checked> Also delete ${pics.length} picture${pics.length === 1 ? '' : 's'} only this note uses <small>(${esc(pics.map(p => p.split('/').pop()).join(', '))})</small></label>` : ''}
    <p class="w-muted">You can bring it back from the repository's history on GitHub if you change your mind.</p>
    <div class="w-actions"><button type="button" class="w-btn" value="cancel">Cancel</button><button type="button" class="w-btn w-danger-solid" value="ok">Delete the note</button></div>`,
    async d => {
      const withPics = pics.length && $('[name=pics]', d) && $('[name=pics]', d).checked;
      busy(true, 'Deleting and cleaning up…');
      try {
        const files = [{ path, remove: true }], fresh = [];
        for (const a of hit) {                    // work on the newest copy of each note, not the one loaded with the page
          let latest = a.x.raw; try { latest = await readFile(a.x.path); } catch {}
          const r = T.unlink(latest, [target]);
          if (r.changed) { files.push({ path: a.x.path, content: r.text }); fresh.push([a.x, r.text]); }
        }
        if (withPics) pics.forEach(p => files.push({ path: p, remove: true }));
        await commitFiles(files, `Delete ${m.id ? m.id + ' ' : ''}${m.title}${fresh.length ? `; remove it from ${fresh.length} note${fresh.length === 1 ? '' : 's'}` : ''}`);
        fresh.forEach(([x, text]) => { x.raw = text; });
        W.notes = W.notes.filter(x => x.path !== path); if (withPics) W.files = W.files.filter(p => !pics.includes(p));
        store.set('recent-edits', store.get('recent-edits', []).filter(p => p !== path));
        annotate();
        done(`Deleted <strong>${esc(m.title)}</strong>${fresh.length ? ` and cleaned up ${fresh.length} note${fresh.length === 1 ? '' : 's'} that pointed at it` : ''}.`);
        if (after) after();
      } catch (e) { toast(esc(e.message), 9000); } finally { busy(false); }
    });
}

/* ---------------- Edit tab ---------------- */
const editState = { q: '', sec: '', sort: 'recent', limit: 60 };
const day = t => t ? new Date(t).toISOString().slice(0, 10) : '';
function editRows() {
  const terms = editState.q.toLowerCase().split(/\s+/).filter(Boolean);
  const rows = W.notes.filter(n => n._meta).map(n => n._meta)
    .filter(m => !editState.sec || m.section === editState.sec)
    .filter(m => { if (!terms.length) return true; const hay = (m.id + ' ' + m.title + ' ' + m.section + ' ' + m.tags.join(' ') + ' ' + m.aliases.join(' ')).toLowerCase(); return terms.every(t => hay.includes(t)); });
  const by = { recent: (a, b) => b.updated - a.updated || a.title.localeCompare(b.title), id: (a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }), title: (a, b) => a.title.localeCompare(b.title) };
  return rows.sort(by[editState.sort] || by.recent);
}
function editList() {
  const row = m => `<li class="w-row"><button type="button" data-open="${esc(m.path)}"><span class="w-mono">${esc(m.id)}</span> ${esc(m.title)}
    <small>${esc(m.section)}${m.tags.length ? ' · ' + esc(m.tags.slice(0, 4).join(', ')) : ''}${m.updated ? ' · ' + day(m.updated) : ''}</small></button>
    <button type="button" class="w-row-del" data-del="${esc(m.path)}" title="Delete this note" aria-label="Delete ${esc(m.title)}">Delete</button></li>`;
  const rows = editRows(), shown = rows.slice(0, editState.limit);
  const byPath = new Map(W.notes.filter(n => n._meta).map(n => [n.path, n._meta]));
  const recent = !editState.q && !editState.sec ? store.get('recent-edits', []).map(p => byPath.get(p)).filter(Boolean).slice(0, 5) : [];
  const count = $('#tab-edit .w-edit-count'); if (count) count.textContent = `${rows.length} note${rows.length === 1 ? '' : 's'}${editState.q || editState.sec ? ' found' : ''}`;
  return (recent.length ? `<li class="w-list-head">Opened recently</li>${recent.map(row).join('')}<li class="w-list-head">${{ recent: 'Latest changes first', id: 'By address', title: 'By title' }[editState.sort]}</li>` : '')
    + (shown.map(row).join('') || '<li class="w-empty">No matching notes. Try fewer words, or a tag.</li>')
    + (rows.length > shown.length ? `<li><button type="button" class="w-more-rows" data-more>Show ${Math.min(100, rows.length - shown.length)} more</button></li>` : '');
}
function editTab() {
  const secs = [...new Set(W.notes.filter(n => n._meta).map(n => n._meta.section))].sort();
  $('#tab-edit').innerHTML = `<div class="w-pane"><div class="w-edit-pick">
    <div class="w-edit-find"><input id="edit-q" type="search" placeholder="Find by title, tag or address" aria-label="Find a note" value="${esc(editState.q)}">
      <select id="edit-sec" aria-label="Section"><option value="">All sections</option>${secs.map(x => `<option${x === editState.sec ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select>
      <select id="edit-sort" aria-label="Order">${[['recent', 'Latest changes first'], ['id', 'By address'], ['title', 'By title']].map(([v, l]) => `<option value="${v}"${v === editState.sort ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
    <p class="w-muted w-edit-count"></p><ul class="w-list"></ul></div></div>`;
  const draw = () => { $('#tab-edit .w-list').innerHTML = editList(); };
  $('#edit-q').addEventListener('input', e => { editState.q = e.target.value.trim(); editState.limit = 60; draw(); });
  $('#edit-sec').addEventListener('change', e => { editState.sec = e.target.value; editState.limit = 60; draw(); });
  $('#edit-sort').addEventListener('change', e => { editState.sort = e.target.value; draw(); });
  $('#tab-edit .w-list').addEventListener('click', e => {
    if (e.target.closest('[data-more]')) { editState.limit += 100; draw(); }
    const del = e.target.closest('[data-del]'); if (del) deleteFlow(del.dataset.del, draw);
  });
  $('#edit-q').addEventListener('keydown', e => { if (e.key === 'Enter') { const first = $('#tab-edit .w-list [data-open]'); if (first) first.click(); } });
  draw(); $('#edit-q').focus();
}
async function openEditor(path, rawMode = false) {
  if (!conn()) { toast('Connect to GitHub in Settings first.'); showTab('settings'); return; }
  busy(true, 'Loading the latest version…');
  let raw; try { raw = await readFile(path); } catch (e) { busy(false); toast(e.message); return; } busy(false);
  W.editing = { path, original: raw };
  store.set('recent-edits', [path, ...store.get('recent-edits', []).filter(p => p !== path)].slice(0, 8));
  // With readable front matter the note opens as fields; otherwise (or on request) as the raw file.
  const fmx = rawMode ? null : splitFront(raw);
  const C0 = fmx ? { title: C.str(fmx.data.title), tags: C.list(fmx.data.tags).join(', '), summary: C.str(fmx.data.summary) } : null;
  const others = fmx ? fmx.blocks.filter(b => !['title', 'tags', 'summary'].includes(b.key)).map(b => b.text).join('\n') : '';
  $('#tab-edit').innerHTML = `<div class="w-pane w-split">
    <form class="w-form" autocomplete="off" onsubmit="return false">
      <p class="w-back"><button type="button" class="w-link" data-back>← All notes</button> <button type="button" class="w-link w-right" data-mode>${fmx ? 'Edit the raw file' : (splitFront(raw) ? 'Edit with fields' : '')}</button></p>
      ${fmx ? `<label class="w-field w-title"><span class="w-sr">Title</span><input name="title" value="${esc(C0.title)}" placeholder="Title"></label>` : ''}
      <div class="w-field w-editor"><span class="w-sr">${fmx ? 'Note' : 'Note, including its front matter'}</span>${toolbar()}<textarea class="w-body${fmx ? '' : ' w-raw'}" rows="${fmx ? 22 : 26}" spellcheck="true">${esc(fmx ? fmx.body : raw)}</textarea>${sidePanels()}</div>
      ${detailsPanel(`${fmx ? `${tagsField(C0.tags)}
        <label class="w-field"><span>Summary <small>one or two sentences; shown in lists and guides</small></span><textarea name="summary" rows="2">${esc(C0.summary)}</textarea></label>
        <div class="w-guides-slot"></div>` : ''}
        <label class="w-field"><span>File <small>change it to rename or move the note</small></span><input name="path" value="${esc(path)}" spellcheck="false" class="w-mono"></label>
        ${fmx ? `<details class="w-more"><summary>Other fields <small>address, date, author, source…</small></summary><textarea name="others" rows="${Math.min(8, others.split('\n').length + 1)}" class="w-mono" spellcheck="false">${esc(others)}</textarea></details>` : ''}`)}
      ${bottomBar('<button type="button" class="w-btn w-danger" data-delete>Delete</button>', 'Publish changes')}
    </form>
    <section class="w-preview-wrap" aria-label="Preview"><p class="w-preview-label w-preview-tabs"><button type="button" data-pv="preview" aria-pressed="true">Preview</button><button type="button" data-pv="diff" aria-pressed="false">Changes</button></p>
      <div id="preview" class="w-preview"></div><div id="changes" class="w-changes" hidden></div></section>
  </div>`;
  const form = $('#tab-edit form'), ta = $('.w-body', form);
  let picks = [];
  const drawGuides = () => { const slot = $('.w-guides-slot', form); if (slot) slot.innerHTML = guidesField(picks); };
  const tagList = s => [...new Set(s.split(',').map(t => slug(t)).filter(Boolean))];
  // Rebuild the file: untouched entries stay byte-for-byte as they were.
  const build = () => {
    if (!fmx) return ta.value;
    const now = { title: form.title.value.trim(), tags: tagList(form.tags.value).join(', '), summary: form.summary.value.trim() };
    const line = { title: v => `title: ${yamlVal(v)}`, tags: v => `tags: [${v}]`, summary: v => `summary: ${yamlVal(v)}` };
    const kept = new Map(fmx.blocks.map(b => [b.key, b.text]));
    const extra = form.others.value.replace(/\r/g, '').split('\n').filter(l => l.trim());
    const out = []; let placedOthers = false;
    const field = k => { if (!now[k]) return; out.push({ text: now[k] === (k === 'tags' ? tagList(C0.tags).join(', ') : C0[k]) && kept.has(k) ? kept.get(k) : line[k](now[k]) }); };
    const done = new Set();
    for (const b of fmx.blocks) {
      if (['title', 'tags', 'summary'].includes(b.key)) { field(b.key); done.add(b.key); }
      else if (!placedOthers) { extra.forEach(l => out.push({ text: l })); placedOthers = true; }
    }
    if (!placedOthers) extra.forEach(l => out.push({ text: l }));
    ['title', 'tags', 'summary'].filter(k => !done.has(k)).forEach(field);
    return joinFront(out, ta.value);
  };
  const getMeta = () => {
    if (fmx) return { title: form.title.value.trim(), tags: tagList(form.tags.value), summary: form.summary.value.trim(), body: ta.value, path };
    const s = splitFront(ta.value); return s ? { title: C.str(s.data.title), tags: C.list(s.data.tags), summary: C.str(s.data.summary), body: s.body, path } : { title: '', tags: [], summary: '', body: ta.value, path };
  };
  const original = build();
  const refresh = () => {
    const now = build(); const ed = $('.w-editor', form); if (ed._redraw) ed._redraw();
    if (pvMode === 'diff') $('#changes', $('#tab-edit')).innerHTML = diffHTML(original, now);   // against the note as it opened, so only your edits show
    else previewRaw(now, form.path.value.trim());
    detailsState(form, getMeta());
    const sv = $('.w-bar-saved', form); if (sv) { const changed = now !== original || form.path.value.trim() !== path; sv.textContent = changed ? 'Changes not published' : 'No changes'; sv.classList.toggle('is-changed', changed); }
  };
  let pvMode = 'preview';
  $('.w-preview-tabs', $('#tab-edit')).addEventListener('click', e => {
    const b = e.target.closest('[data-pv]'); if (!b) return;
    pvMode = b.dataset.pv; $$('[data-pv]', $('#tab-edit')).forEach(x => x.setAttribute('aria-pressed', x === b));
    $('#preview', $('#tab-edit')).hidden = pvMode === 'diff'; $('#changes', $('#tab-edit')).hidden = pvMode !== 'diff'; refresh();
  });
  bindTags(form); bindDetails(form); bindBar(form);
  bindEditor($('.w-editor', form), refresh, getMeta, fmx ? fieldApi(form, () => refresh()) : null); refresh();
  form.path.addEventListener('change', refresh);
  form.addEventListener('input', e => { if (!e.target.classList.contains('w-body')) { clearTimeout(form._t); form._t = setTimeout(refresh, 250); } });
  form.addEventListener('click', e => {
    const t = e.target.closest('[data-tag]');
    if (t && form.tags) { const cur = form.tags.value.split(',').map(s => s.trim()).filter(Boolean); if (!cur.includes(t.dataset.tag)) cur.push(t.dataset.tag); form.tags.value = cur.join(', '); refresh(); }
    if (e.target.closest('[data-guides]')) guidesDialog(picks, getMeta, p => { picks = p; drawGuides(); });
    const un = e.target.closest('[data-unpick]'); if (un) { picks.splice(+un.dataset.unpick, 1); drawGuides(); }
  });
  drawGuides();
  $('[data-mode]', form).onclick = () => {
    if (build() !== original && !confirm('Switching views discards the changes you have not published. Continue?')) return;
    openEditor(path, !!fmx);
  };
  $('[data-back]', form).onclick = () => { if (build() === original || confirm('Discard your changes?')) editTab(); };
  $('[data-publish]', form).onclick = async () => {
    const np = form.path.value.trim().replace(/^\/+/, ''); const status = $('.w-status', form);
    if (!/^notes\/.+\.(md|markdown)$/i.test(np)) { status.textContent = 'The file must stay inside notes/ and end in .md.'; return; }
    if (np !== path && W.notes.some(n => n.path.toLowerCase() === np.toLowerCase())) { status.textContent = 'Another note already uses that file name.'; return; }
    if (fmx && !form.title.value.trim()) { status.textContent = 'Give the note a title first.'; form.title.focus(); return; }
    const content = build();
    if (fmx) { try { window.jsyaml.load(content.match(/^---\n([\s\S]*?)\n---/)[1]); } catch (e) { status.textContent = `“Other fields” isn't valid: ${e.reason || e.message}`; return; } }
    if (!confirmChecks(getMeta())) return;
    busy(true, 'Publishing…');
    try {
      const meta = getMeta(), guides = await guideCommits(picks, meta.title, meta.summary || '');
      const files = [{ path: np, content }, ...await imageCommits(content), ...guides];
      if (np !== path) files.push({ path, remove: true });
      await commitFiles(files, (np !== path ? `Move ${path} to ${np}` : `Edit ${np}`) + (guides.length ? ` (and list it in ${guides.length === 1 ? 'a guide' : guides.length + ' guides'})` : ''));
      const n = W.notes.find(n => n.path === path); if (n) { n.path = np; n.raw = content; } annotate();
      done(`Published your changes to <code>${esc(np)}</code>. The site updates in about a minute.`); editTab();
    } catch (e) { status.textContent = e.message; } finally { busy(false); }
  };
  $('[data-delete]', form).onclick = () => deleteFlow(path, editTab);
}

/* ---------------- Bulk upload tab ---------------- */
function bulkTab() {
  W.bulk = [];
  $('#tab-bulk').innerHTML = `<div class="w-pane w-narrow">
    <p class="w-lede">Drop Markdown files (or a whole folder, such as part of an Obsidian vault). Each one goes into the section its front matter or folder name suggests; change any you like, then publish them all in one go. Images dropped with them are uploaded to <code>notes/images/</code>, so <code>![[image.png]]</code> embeds keep working. Addresses are added automatically when GitHub builds the site.</p>
    <div class="w-drop" tabindex="0"><p>Drop .md files or a folder here</p>
      <p><label class="w-btn">Choose files<input type="file" multiple accept=".md,.markdown,.txt,image/*" hidden data-files></label> <label class="w-btn">Choose a folder<input type="file" webkitdirectory hidden data-files></label></p></div>
    <div class="w-bulk-list"></div>
  </div>`;
  const drop = $('#tab-bulk .w-drop');
  ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('is-over')));
  drop.addEventListener('drop', async e => { e.preventDefault(); addBulk(await filesFromDrop(e.dataTransfer)); });
  $$('#tab-bulk [data-files]').forEach(i => i.addEventListener('change', () => { addBulk([...i.files].map(f => ({ file: f, rel: f.webkitRelativePath || f.name }))); i.value = ''; }));
}
async function filesFromDrop(dt) {
  const out = [];
  const walk = async (entry, prefix) => {
    if (entry.isFile) await new Promise(r => entry.file(f => { out.push({ file: f, rel: prefix + f.name }); r(); }, r));
    else if (entry.isDirectory && !/^\.(obsidian|trash|git)$/.test(entry.name)) {
      const reader = entry.createReader(); let batch;
      do { batch = await new Promise(r => reader.readEntries(r, () => r([]))); for (const e of batch) await walk(e, prefix + entry.name + '/'); } while (batch.length);
    }
  };
  const entries = [...dt.items].map(i => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
  if (entries.length) for (const e of entries) await walk(e, ''); else [...dt.files].forEach(f => out.push({ file: f, rel: f.name }));
  return out;
}
async function addBulk(items) {
  for (const { file, rel } of items) {
    if (/\.(md|markdown|txt)$/i.test(file.name)) {
      const raw = await file.text();
      const fm = (raw.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || '';
      const field = k => ((fm.match(new RegExp(`^${k}\\s*:\\s*(.+)$`, 'mi')) || [])[1] || '').trim().replace(/^['"]|['"]$/g, '');
      let kind = null;
      for (const hint of [field('section'), field('type'), field('medium'), ...rel.split('/').slice(0, -1).reverse()]) {
        const h = slug(hint).replace(/s$/, ''); if (!h) continue;
        kind = W.kinds.find(k => [k.key, slug(k.label), slug(k.sec.name), slug(k.sec.folder), ...(k.sub ? [slug(k.sub.folder), slug(k.sub.name)] : []), ...k.sec.aliases, ...(k.sub ? k.sub.aliases : [])].map(x => x.replace(/s$/, '')).includes(h));
        if (kind) break;
      }
      const title = field('title') || (raw.replace(/^---[\s\S]*?\n---\s*/, '').match(/^#\s+(.+)$/m) || [])[1] || file.name.replace(/\.(md|markdown|txt)$/i, '');
      W.bulk.push({ type: 'note', file, raw, title, kind: (kind || W.kinds.find(k => k.sec.id === W.cfg.defaultSection) || W.kinds[W.kinds.length - 1]).key, detected: !!kind, name: file.name.replace(/\.txt$/i, '.md') });
    } else if (/\.(png|jpe?g|gif|svg|webp|avif|bmp|pdf)$/i.test(file.name)) {
      W.bulk.push({ type: 'image', file, name: file.name });
    }
  }
  drawBulk();
}
function drawBulk() {
  const notes = W.bulk.filter(b => b.type === 'note'), imgs = W.bulk.filter(b => b.type === 'image');
  const box = $('#tab-bulk .w-bulk-list');
  if (!W.bulk.length) { box.innerHTML = ''; return; }
  const existing = new Set(W.notes.map(n => n.path.toLowerCase()));
  box.innerHTML = `<table class="w-table"><thead><tr><th>Note</th><th>Section</th><th></th></tr></thead><tbody>
    ${notes.map((b, i) => { const k = W.kinds.find(k => k.key === b.kind); const p = `${folderOf(k)}/${b.name}`; b.path = p;
      return `<tr><td><strong>${esc(b.title)}</strong><small class="w-mono">${esc(p)}${existing.has(p.toLowerCase()) ? ' · replaces the existing file' : ''}</small></td>
      <td><select data-kind="${i}">${W.kinds.map(x => `<option value="${x.key}"${x.key === b.kind ? ' selected' : ''}>${esc(x.label)}</option>`).join('')}</select>${b.detected ? '' : '<small class="w-guess">no hint found</small>'}</td>
      <td><button type="button" class="w-link" data-drop="${i}" aria-label="Remove">Remove</button></td></tr>`; }).join('')}
    </tbody></table>
    ${imgs.length ? `<p class="w-muted">${imgs.length} image${imgs.length === 1 ? '' : 's'} will go to <code>notes/images/</code>.</p>` : ''}
    <div class="w-actions"><button type="button" class="w-btn" data-bulk-clear>Clear</button><button type="button" class="w-btn w-primary" data-bulk-go>Publish ${notes.length} note${notes.length === 1 ? '' : 's'}</button></div>
    <p class="w-status" role="status"></p>`;
  box.onchange = e => { const s = e.target.closest('[data-kind]'); if (s) { notes[+s.dataset.kind].kind = s.value; drawBulk(); } };
  box.onclick = async e => {
    const d = e.target.closest('[data-drop]'); if (d) { W.bulk.splice(W.bulk.indexOf(notes[+d.dataset.drop]), 1); drawBulk(); return; }
    if (e.target.closest('[data-bulk-clear]')) { W.bulk = []; drawBulk(); return; }
    if (!e.target.closest('[data-bulk-go]')) return;
    if (!conn()) { $('.w-status', box).textContent = 'Connect to GitHub in Settings first.'; return; }
    const paths = notes.map(b => b.path.toLowerCase()); if (new Set(paths).size !== paths.length) { $('.w-status', box).textContent = 'Two files would land on the same name; rename one before uploading.'; return; }
    busy(true, `Publishing ${notes.length} notes…`);
    try {
      const files = notes.map(b => ({ path: b.path, content: b.raw }));
      for (const im of imgs) files.push({ path: `notes/images/${im.name}`, base64: await fileB64(im.file) });
      await commitFiles(files, `Import ${notes.length} note${notes.length === 1 ? '' : 's'}`);
      notes.forEach(b => { const n = W.notes.find(n => n.path === b.path); if (n) n.raw = b.raw; else W.notes.push({ path: b.path, raw: b.raw }); }); annotate();
      done(`Published ${notes.length} note${notes.length === 1 ? '' : 's'} in one commit. Addresses are added and the site updates in about a minute.`);
      bulkTab();
    } catch (err) { $('.w-status', box).textContent = err.message; } finally { busy(false); }
  };
}

/* ---------------- Settings tab ---------------- */
function settingsTab() {
  const c = conn() || { ...guessRepo(), branch: 'main', token: '', remember: true };
  $('#tab-settings').innerHTML = `<div class="w-pane w-narrow"><form class="w-form" onsubmit="return false">
    <p class="w-lede">The writer publishes by committing to your repository, exactly as if you'd edited the files on github.com. It needs a <em>fine-grained personal access token</em> that can only touch this one repository.</p>
    <ol class="w-steps"><li>Open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com → Settings → Developer settings → Fine-grained tokens → Generate new token</a>.</li>
      <li>Name it “Confessions writer” and pick an expiry.</li><li>Under <strong>Repository access</strong>, choose <strong>Only select repositories</strong> and pick your notebook repository.</li>
      <li>Under <strong>Permissions → Repository permissions</strong>, set <strong>Contents</strong> to <strong>Read and write</strong>. Nothing else.</li><li>Generate, copy the token, and paste it below.</li></ol>
    <div class="w-grid"><label class="w-field"><span>GitHub user name</span><input name="owner" value="${esc(c.owner)}" spellcheck="false"></label>
      <label class="w-field"><span>Repository</span><input name="repo" value="${esc(c.repo)}" spellcheck="false"></label>
      <label class="w-field"><span>Branch</span><input name="branch" value="${esc(c.branch || 'main')}" spellcheck="false"></label></div>
    <label class="w-field"><span>Token</span><input name="token" type="password" value="${esc(c.token)}" spellcheck="false" autocomplete="off" placeholder="github_pat_…"></label>
    <label class="w-check"><input type="checkbox" name="remember"${c.remember !== false ? ' checked' : ''}> Remember on this device <small>(otherwise it's forgotten when you close the tab)</small></label>
    <div class="w-actions"><button type="button" class="w-btn" data-forget>Forget token</button><button type="button" class="w-btn w-primary" data-save>Save and test</button></div>
    <p class="w-status" role="status"></p>
    <p class="w-muted">The token stays in this browser and is only ever sent to api.github.com. Anyone who can use this browser profile could publish with it, so don't tick “Remember” on a shared computer.</p>
  </form></div>`;
  const f = $('#tab-settings form');
  $('[data-save]', f).onclick = async () => {
    const v = { owner: f.owner.value.trim(), repo: f.repo.value.trim(), branch: f.branch.value.trim() || 'main', token: f.token.value.trim(), remember: f.remember.checked };
    store.set('conn', v, v.remember);
    const st = $('.w-status', f); st.textContent = 'Checking…';
    try {
      const r = await gh(''); if (!r.permissions || !r.permissions.push) throw new Error('The token can read this repository but not write to it. Set Contents to “Read and write”.');
      await gh(`/git/ref/heads/${v.branch}`);
      st.textContent = `Connected to ${r.full_name}. You're ready to publish.`; updateConn();
    } catch (e) { st.textContent = e.message; }
  };
  $('[data-forget]', f).onclick = () => { const c = conn(); if (c) store.set('conn', { ...c, token: '' }, c.remember); f.token.value = ''; updateConn(); $('.w-status', f).textContent = 'Token forgotten.'; };
}

/* ---------------- shell ---------------- */
function annotate() {
  C.index(W.cfg, W.notes);
  const byPath = new Map(C.S.notes.map(n => [n.path, n]));
  for (const n of W.notes) {
    const p = byPath.get(n.path);
    n._meta = p ? { path: n.path, id: p.id, title: p.title, aliases: p.aliases, tags: p.tags, course: C.str(p.fm.course), source: C.sourceLine(p), section: p.sub ? p.sub.name : p.section.name, updated: p.updated instanceof Date ? +p.updated : (Date.parse(p.updated) || 0) } : null;
  }
}
function updateConn() { const c = conn(); $('#conn').innerHTML = c && c.token ? `Publishing to <strong>${esc(c.owner)}/${esc(c.repo)}</strong>` : `<button type="button" class="w-link" data-tab="settings">Connect to GitHub</button> to publish`; }
function showTab(t) {
  W.tab = t; closeSuggest();
  $$('.w-tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t));
  $$('.w-panel').forEach(p => p.hidden = p.id !== 'tab-' + t);
  if (t === 'write') writeForm(); if (t === 'edit') editTab(); if (t === 'bulk') bulkTab(); if (t === 'settings') settingsTab();
}
function busy(on, msg) { const b = $('#busy'); b.hidden = !on; if (msg) $('#busy-msg').textContent = msg; }
function done(html) { const c = conn(); toast(`${html} <a href="https://github.com/${esc(c.owner)}/${esc(c.repo)}/actions" target="_blank" rel="noopener">Watch the build</a>`, 9000); }
let toastT; function toast(html, ms = 5000) { const t = $('#toast'); t.innerHTML = html; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, ms); }

async function boot() {
  await Promise.all([C.loadLib('marked'), C.loadLib('yaml'), C.loadLib('purify')]);
  try {
    const [cfg, data] = await Promise.all([C.getJSON('config.json'), C.getJSON('notes.json')]);
    W.cfg = cfg; W.notes = data.notes || []; W.files = data.files || [];
    C.S.files = new Map(W.files.flatMap(f => [[f.toLowerCase(), f], [f.split('/').pop().toLowerCase(), f]]));
  } catch (e) { $('#app').innerHTML = `<p class="w-error">Couldn't load the notebook (${esc(e.message)}). Open this page from your published site, or from <code>node tools/serve.mjs</code>.</p>`; return; }
  W.secs = C.prepareSections(W.cfg); C.S.sections = W.secs; buildKinds(); annotate();
  document.title = `Write — ${W.cfg.title || 'Notes'}`; $('#brand').textContent = W.cfg.title || 'Notes';
  $('#tab-edit').addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openEditor(b.dataset.open); });
  $('.w-tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });
  document.addEventListener('click', e => { const b = e.target.closest('#conn [data-tab]'); if (b) showTab('settings'); });
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') $('#local-note').hidden = false;
  updateConn();
  const ask = new URLSearchParams(location.search), want = ask.get('edit') || ask.get('delete');
  if (want && conn() && conn().token && W.notes.some(n => n.path === want)) {
    history.replaceState(null, '', location.pathname);
    showTab('edit');
    if (ask.get('delete')) deleteFlow(want, () => { const m = $('#tab-edit .w-list'); if (m) m.innerHTML = editList(); }); else openEditor(want);
  } else showTab(conn() && conn().token ? 'write' : 'settings');
}
boot();
})();

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
  const box = $('#preview');
  const entries = W.notes.filter(n => n.path !== path).concat([{ path, raw, created: today(), updated: today() }]);
  for (const [name, url] of W.images) { C.S.files.set(name.toLowerCase(), url); }
  try {
    C.index(W.cfg, entries);
    const n = C.S.notes.find(x => x.path === path);
    box.innerHTML = C.viewNote(n);
    const addr = $('#addr'); if (addr) addr.textContent = n.explicitId ? n.id : `${n.id} (provisional)`;
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
    <button type="button" data-ins="table" title="Insert a table">Table</button>
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
      <option value="related">Build the Related list…</option></select>
  </div>`;
}
// Shown under the editor: a live outline of the headings and a list of things to check before publishing.
const sidePanels = () => `<div class="w-side"><details class="w-outline" open><summary>Outline</summary><ol></ol></details>
  <details class="w-checks" open><summary>Before you publish</summary><ul></ul></details></div>`;

/* ---- structure helpers ---- */
const UNNUMBERED = /^(related|references|footnotes|see also|sources|further reading)$/i;
const NUM_PREFIX = /^(\d+|[IVXLC]+)[.)]\s+/;
// Every heading in the body with its line number, skipping fenced code.
function headings(body) {
  const out = []; let fence = false;
  body.split('\n').forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; return; }
    const m = !fence && line.match(/^(#{1,6})[ \t]+(.+?)[ \t#]*$/);
    if (m) out.push({ level: m[1].length, text: m[2], line: i });
  });
  return out;
}
function numberSections(body, strip) {
  const lines = body.split('\n'); let n = 0;
  for (const h of headings(body)) {
    if (h.level !== 2) continue;
    const bare = h.text.replace(NUM_PREFIX, '');
    lines[h.line] = '## ' + (strip || UNNUMBERED.test(bare) ? bare : `${++n}. ${bare}`);
  }
  return lines.join('\n');
}
const wikiLinks = body => [...body.matchAll(/(!?)\[\[([^\]\n|#]+)(?:#[^\]\n|]*)?(?:\|[^\]\n]*)?\]\]/g)].filter(m => !m[1]).map(m => m[2].trim());
function noteIndex() {
  const m = new Map();
  for (const x of W.notes.map(n => n._meta).filter(Boolean)) { for (const k of [x.title, x.id, ...x.aliases]) m.set(String(k).toLowerCase(), x); }
  return m;
}
// Splits the body into what comes before "## Related" and the titles already listed there.
function splitRelated(body) {
  const hs = headings(body), lines = body.split('\n');
  const i = hs.findIndex(h => h.level === 2 && /^related$/i.test(h.text.replace(NUM_PREFIX, '')));
  if (i < 0) return { before: body.replace(/\s+$/, ''), listed: [], after: '' };
  const start = hs[i].line, next = hs.slice(i + 1).find(h => h.level <= 2), end = next ? next.line : lines.length;
  return { before: lines.slice(0, start).join('\n').replace(/\s+$/, ''), listed: wikiLinks(lines.slice(start, end).join('\n')), after: lines.slice(end).join('\n').replace(/\s+$/, '') };
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
const SMALL_WORDS = /^(a|an|and|as|at|but|by|for|from|if|in|into|is|nor|of|on|or|so|the|to|up|via|vs|with|yet)$/i;
// Returns a list of plain-language warnings. Nothing here blocks publishing.
function checkNote(meta) {
  const out = [], body = meta.body || '', hs = headings(body), idx = noteIndex(), words = body.trim().split(/\s+/).filter(Boolean).length;
  if (!meta.title) out.push('The note has no title.');
  else {
    const w = meta.title.split(/\s+/), bad = w.filter((x, i) => /^[a-z]/.test(x) && (i === 0 || !SMALL_WORDS.test(x)));
    if (bad.length) out.push(`Title isn't in title case (“${bad[0]}”).`);
    if (W.notes.some(n => n._meta && n._meta.path !== meta.path && n._meta.title.toLowerCase() === meta.title.toLowerCase())) out.push('Another note already has this title, so links to it will be ambiguous.');
  }
  if (!meta.tags.length) out.push('No tags.');
  if (!meta.summary) out.push('No summary. It is what shows under the title in lists and guides.');
  const missing = [...new Set(wikiLinks(body).filter(t => !idx.has(t.toLowerCase())))];
  if (missing.length) out.push(`Links to notes that don't exist: ${missing.slice(0, 4).map(t => `“${t}”`).join(', ')}${missing.length > 4 ? ` and ${missing.length - 4} more` : ''}.`);
  if (/\[\[\s*\]\]/.test(body)) out.push('An empty [[ ]] link is left in the note.');
  if (hs.some(h => h.level === 1)) out.push('A single # heading repeats the title. Use ## for sections.');
  if (words > 250 && hs.filter(h => h.level === 2).length < 2) out.push('A long note with no sections. Two or more ## headings give it a table of contents.');
  const nums = hs.filter(h => h.level === 2).map(h => (h.text.match(/^(\d+)[.)]\s/) || [])[1]).filter(Boolean).map(Number);
  const h2 = hs.filter(h => h.level === 2 && !UNNUMBERED.test(h.text.replace(NUM_PREFIX, '')));
  if (nums.some((n, i) => n !== i + 1) || (nums.length && nums.length < h2.length)) out.push('Section numbers are out of order. “Sections… → Number the sections” fixes them.');
  if (words > 80 && !hs.some(h => /^related$/i.test(h.text.replace(NUM_PREFIX, '')))) out.push('No Related list. “Sections… → Build the Related list” suggests one.');
  return out;
}
function drawChecks(root, getMeta) {
  const ul = $('.w-checks ul', root); if (!ul || !getMeta) return;
  const issues = checkNote(getMeta());
  ul.innerHTML = issues.map(i => `<li>${esc(i)}</li>`).join('') || '<li class="w-ok">Nothing to fix.</li>';
  $('.w-checks summary', root).textContent = issues.length ? `Before you publish (${issues.length})` : 'Before you publish';
}
function confirmChecks(meta) {
  const issues = checkNote(meta);
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
function bindEditor(root, onChange, getMeta) {
  const ta = $('textarea.w-body', root);
  const redraw = () => { drawOutline(root, ta); drawChecks(root, getMeta); };
  root.addEventListener('click', e => {
    const j = e.target.closest('[data-line]');
    if (j) {      // jump to a heading from the outline
      const lines = ta.value.split('\n'), pos = lines.slice(0, +j.dataset.line).join('\n').length + (+j.dataset.line ? 1 : 0);
      ta.focus(); ta.selectionStart = pos; ta.selectionEnd = pos + lines[+j.dataset.line].length;
      ta.scrollTop = Math.max(0, (+j.dataset.line / Math.max(1, lines.length)) * ta.scrollHeight - 60); return;
    }
    const b = e.target.closest('[data-ins]'); if (!b) return;
    const k = b.dataset.ins;
    if (k === 'bold') wrapSel(ta, '**', '**', 'bold text');
    if (k === 'italic') wrapSel(ta, '*', '*', 'italic text');
    if (k === 'hl') wrapSel(ta, '==', '==', 'highlighted');
    if (k === 'h3') insertLine(ta, '### ');
    if (k === 'ul') prefixLines(ta, () => '- ');
    if (k === 'ol') prefixLines(ta, i => `${i + 1}. `);
    if (k === 'quote') prefixLines(ta, () => '> ');
    if (k === 'hr') insertLine(ta, '---\n\n');
    if (k === 'table') tableDialog(ta);
    if (k === 'h2') insertLine(ta, '## ');
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
    const next = numberSections(ta.value, t === 'strip');
    if (next !== ta.value) { const p = ta.selectionStart; ta.value = next; ta.selectionStart = ta.selectionEnd = Math.min(p, next.length); ta.dispatchEvent(new Event('input')); }
    else toast(t === 'strip' ? 'No section numbers to remove.' : 'The sections are already numbered in order.');
  });
  $('[data-img]', root).addEventListener('change', e => { [...e.target.files].forEach(f => addImage(f, ta)); e.target.value = ''; });
  ta.addEventListener('paste', e => { const f = [...(e.clipboardData?.files || [])].find(f => f.type.startsWith('image/')); if (f) { e.preventDefault(); addImage(f, ta); } });
  ta.addEventListener('drop', e => { const fs = [...(e.dataTransfer?.files || [])].filter(f => f.type.startsWith('image/')); if (fs.length) { e.preventDefault(); fs.forEach(f => addImage(f, ta)); } });
  ta.addEventListener('keydown', e => {
    if (suggest.open && ['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) { e.preventDefault(); suggestKey(e.key, ta); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); wrapSel(ta, '**', '**', 'bold text'); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') { e.preventDefault(); wrapSel(ta, '*', '*', 'italic text'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); $('[data-publish]', root.closest('.w-pane'))?.click(); return; }
    if (smartKey(e, ta)) e.preventDefault();
  });
  let t = null;
  ta.addEventListener('input', () => { openSuggest(ta); clearTimeout(t); t = setTimeout(() => { onChange(); redraw(); }, 250); });
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

/* ---------------- templates ---------------- */
// Skeletons modelled on the notes already in the notebook. `kind` picks the section when it exists.
const TEMPLATES = [
  { name: 'Scripture theme', tags: 'theology, scripture', hint: 'Verses that connect one theme, grouped, with a line on each.',
    body: 'One or two sentences on the theme and how the passages hang together. Quotations from the KJV.\n\n## 1. First Group\n\n**Book 1:1**  \n"Verse text."\n\n- What this verse shows.\n\n**Book 2:2**  \n"Verse text."\n\n- What this verse shows.\n\n## 2. Second Group\n\n**Book 3:3**  \n"Verse text."\n\n- What this verse shows.\n\n## 3. How to Read These\n\n- What the passages establish together.\n- What they do not establish.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book or reading notes', kind: 'book', tags: 'philosophy', hint: 'What the chapter argues, in order, with my questions.',
    body: 'What the text is, and which parts were read closely and which skimmed.\n\n## 1. The Question\n\n- What the author is trying to settle.\n- The usual view he is arguing against.\n\n## 2. The Argument\n\n1. First step.\n2. Second step.\n3. Conclusion.\n\n## 3. Key Terms\n\n| Term | Meaning |\n|---|---|\n|  |  |\n\n## 4. Objections and Replies\n\n- *Objection.* Reply.\n\n## 5. What I Make of It\n\n- What convinces me.\n- What does not.\n\n## 6. To Do\n\n- What to read next.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: whole-book overview', kind: 'book', tags: 'philosophy', hint: 'The book in one page: its thesis, how it is built, the main ideas and my verdict.',
    body: 'What kind of book this is, who it is for, and how much of it I read.\n\n## 1. The Thesis\n\n- The one claim the book is making.\n- What it is arguing against.\n\n## 2. How the Book Is Built\n\n| Ch. | About |\n|---|---|\n| 1 |  |\n| 2 |  |\n| 3 |  |\n\n## 3. Main Ideas\n\n1. **First idea.** What it means.\n2. **Second idea.** What it means.\n3. **Third idea.** What it means.\n\n## 4. Best Passages\n\n> "Short quotation." (p. 00)\n\n- Why it matters.\n\n## 5. Strengths and Weaknesses\n\n- **Strong:** point.\n- **Weak:** point.\n\n## 6. Verdict\n\n- Who should read it, and which chapters.\n\n## 7. To Read Next\n\n- Book or chapter.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: single chapter', kind: 'book', tags: 'philosophy', hint: 'One chapter, section by section, with the terms it introduces and my questions.',
    body: 'Which chapter, of which book, and where it sits in the book as a whole.\n\n## 1. What the Chapter Does\n\n- Its job in one or two lines.\n\n## 2. Section by Section\n\n### First Section\n\n- Point.\n- Point.\n\n### Second Section\n\n- Point.\n- Point.\n\n## 3. Terms Introduced\n\n| Term | Meaning |\n|---|---|\n|  |  |\n|  |  |\n\n## 4. The Key Move\n\n- The step the whole chapter depends on.\n\n## 5. Questions\n\n- What I did not follow.\n- What I would push back on.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: primary text or patristic work', kind: 'book', tags: 'theology, patristics', hint: 'A classic or patristic work: when and why it was written, its argument in order, and the lines worth keeping.',
    body: 'The work, its author and date, and the one question it answers.\n\n## 1. Background\n\n- When and why it was written.\n- Who it is written against or for.\n\n## 2. Layout\n\n| Ch. | About |\n|---|---|\n|  |  |\n|  |  |\n|  |  |\n\n## 3. The Argument\n\n### First Part\n\n- Point.\n- His image or example.\n\n### Second Part\n\n- Point.\n- His image or example.\n\n## 4. Lines Worth Keeping\n\n> "Short quotation." (ch. 0)\n\n- What it means.\n\n## 5. Scripture He Uses\n\n- **Book 1:1** and how he reads it.\n\n## 6. Why It Matters\n\n- What it settles.\n- Who it answers.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: several authors on one topic', kind: 'book', tags: 'philosophy', hint: 'Two or three chapters or authors on the same question, set against each other.',
    body: 'The question, and the chapters or authors being compared.\n\n## 1. The Readings at a Glance\n\n| Author | Reads it as | Main evidence |\n|---|---|---|\n|  |  |  |\n|  |  |  |\n|  |  |  |\n\n## 2. First Author\n\n- Central claim.\n- How he argues for it.\n- What he has to explain away.\n\n## 3. Second Author\n\n- Central claim.\n- How he argues for it.\n- What he has to explain away.\n\n## 4. Where They Disagree\n\n- The exact point of difference.\n- Which texts each relies on.\n\n## 5. Where I Have Got To\n\n- Which reading I find stronger, and why.\n- What is still open.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: dialogue', kind: 'book', tags: 'philosophy, plato', hint: 'A dialogue: who is speaking, the question, each attempt at an answer and why it fails.',
    body: 'The dialogue, its setting, and the question it asks.\n\n## 1. Speakers\n\n- **Name:** who he is and what he stands for.\n- **Name:** who he is and what he stands for.\n\n## 2. The Question\n\n- What is being asked, and why it comes up.\n\n## 3. The Attempts\n\n| # | Answer proposed | Why it fails |\n|---|---|---|\n| 1 |  |  |\n| 2 |  |  |\n| 3 |  |  |\n\n## 4. The Turning Point\n\n- The step where the discussion changes direction.\n\n## 5. How It Ends\n\n- Whether an answer is reached, or what is left open.\n\n## 6. What the Dialogue Is Really About\n\n- The point beneath the stated question.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: quotations and extracts', kind: 'book', tags: 'philosophy', hint: 'Passages worth keeping from one book, grouped by theme, each with a page and a line on why.',
    body: 'The book and edition the page numbers refer to. Keep each quotation short.\n\n## 1. First Theme\n\n> "Short quotation." (p. 00)\n\n- Why I kept it.\n\n> "Short quotation." (p. 00)\n\n- Why I kept it.\n\n## 2. Second Theme\n\n> "Short quotation." (p. 00)\n\n- Why I kept it.\n\n## 3. Ideas to Use Elsewhere\n\n- Idea, and the note it belongs in: [[]]\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: analytical reading (Adler)', kind: 'book', tags: 'philosophy', hint: 'Adler\'s four questions: what the book is about, what it says in detail, whether it is true, and what of it.',
    body: 'Title, author, edition, and the kind of book it is (theoretical or practical; history, science, philosophy).\n\n## 1. What Is the Book About as a Whole\n\n- **In one sentence:** the unity of the book.\n- **The problems the author is trying to solve:**\n    1. Problem.\n    2. Problem.\n\n## 2. The Main Parts\n\n1. First part, and what it contributes.\n2. Second part, and what it contributes.\n3. Third part, and what it contributes.\n\n## 3. Coming to Terms\n\n| The author\'s word | What he means by it |\n|---|---|\n|  |  |\n|  |  |\n\n## 4. The Leading Propositions\n\n1. Proposition, in my own words.\n2. Proposition, in my own words.\n\n## 5. The Arguments\n\n- For proposition 1: the reasons given.\n- For proposition 2: the reasons given.\n\n## 6. Which Problems Are Solved\n\n- Solved.\n- Not solved, and whether the author knows it.\n\n## 7. Is It True\n\nOnly after I can say "I understand".\n\n- Where the author is **uninformed**.\n- Where the author is **misinformed**.\n- Where the reasoning is **illogical**.\n- Where the account is **incomplete**.\n\n## 8. What of It\n\n- What follows if he is right.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: summary and lessons', kind: 'book', tags: 'philosophy', hint: 'The book in three sentences, the lessons I took, and what I will do differently.',
    body: 'Why I picked this book up and how I read it.\n\n## 1. The Book in Three Sentences\n\n1. Sentence.\n2. Sentence.\n3. Sentence.\n\n## 2. Who Should Read It\n\n- The reader it suits, and the reader it does not.\n\n## 3. What I Took From It\n\n1. **Lesson.** A line or two.\n2. **Lesson.** A line or two.\n3. **Lesson.** A line or two.\n\n## 4. How It Changed My Mind\n\n- What I thought before.\n- What I think now.\n\n## 5. What I Will Do With It\n\n- One concrete thing.\n\n## 6. Three Quotations\n\n> "Short quotation." (p. 00)\n\n> "Short quotation." (p. 00)\n\n> "Short quotation." (p. 00)\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: question, evidence, conclusion', kind: 'book', tags: 'philosophy', hint: 'Each main question the book raises, the evidence it gives, and the conclusion it draws.',
    body: 'The book and the part of it these notes cover.\n\n## 1. First Question\n\n**Question:** what is being asked.\n\n**Evidence:**\n\n- Fact, example or argument. (p. 00)\n- Fact, example or argument. (p. 00)\n\n**Conclusion:** what the author concludes.\n\n**My note:** whether the evidence carries the conclusion.\n\n## 2. Second Question\n\n**Question:** what is being asked.\n\n**Evidence:**\n\n- Fact, example or argument. (p. 00)\n\n**Conclusion:** what the author concludes.\n\n**My note:** whether the evidence carries the conclusion.\n\n## 3. The Overall Conclusion\n\n- How the separate conclusions add up.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: history', kind: 'book', tags: 'history', hint: 'A history book: its thesis, the sources it rests on, the story in order, and how it differs from other accounts.',
    body: 'The book, the period and place it covers, and the author\'s standpoint.\n\n## 1. The Thesis\n\n- What the author says happened, and why.\n\n## 2. Sources and Method\n\n- What the account rests on (archives, chronicles, letters, archaeology).\n- What is missing or disputed.\n\n## 3. Chronology\n\n| Date | Event | Why it matters |\n|---|---|---|\n|  |  |  |\n|  |  |  |\n|  |  |  |\n\n## 4. People\n\n- **Name:** role.\n- **Name:** role.\n\n## 5. Causes and Consequences\n\n- **Causes:** long-term and immediate.\n- **Consequences:** what changed.\n\n## 6. Other Accounts\n\n- How other historians tell it, and where this author departs from them.\n\n## 7. Assessment\n\n- Where the evidence is strong.\n- Where the author is guessing or taking a side.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: novel or literature', kind: 'book', tags: 'literature', hint: 'A novel, play or poem: what happens, who the people are, what it is about, and how it is made.',
    body: 'The work, its author and date, and the edition or translation read.\n\n## 1. In Brief\n\n- What happens, in three or four lines. No more.\n\n## 2. Characters\n\n- **Name:** who they are and what they want.\n- **Name:** who they are and what they want.\n\n## 3. Structure\n\n- How the work is divided, and where it turns.\n\n## 4. Themes\n\n1. **Theme.** Where it shows.\n2. **Theme.** Where it shows.\n\n## 5. Images and Motifs\n\n- A recurring image, and what it gathers as it recurs.\n\n## 6. Passages\n\n> "Short quotation." (p. 00)\n\n- What is going on in it.\n\n## 7. What It Is Finally About\n\n- My reading, and what a different reading would say.\n\n## Related\n\n- [[]]\n' },
  { name: 'Book: literature note (in my own words)', kind: 'book', tags: 'note-taking', hint: 'One idea per bullet, in my own words, each with a page number, then the ideas worth a note of their own.',
    body: 'Full reference for the book. Write nothing here that is copied; every line is in my own words.\n\n## 1. Notes in Order\n\n- p. 00: idea.\n- p. 00: idea.\n- p. 00: idea.\n- p. 00: idea.\n\n## 2. What Surprised Me\n\n- p. 00: what, and why it cuts against what I thought.\n\n## 3. What I Disagree With\n\n- p. 00: what, and my reason.\n\n## 4. Ideas Worth a Note of Their Own\n\n- Idea → [[]]\n- Idea → [[]]\n\n## 5. Follow the References\n\n- Works the author cites that I should read.\n\n## Related\n\n- [[]]\n' },
  { name: 'Argument', tags: 'philosophy, apologetics', hint: 'The argument in numbered steps, the objections, and where it stands.',
    body: 'What the argument is meant to show, in one or two sentences.\n\n## 1. The Argument\n\n1. First premise.\n2. Second premise.\n3. Therefore, conclusion.\n\n## 2. Why Accept the Premises\n\n- **Premise 1:** reason.\n- **Premise 2:** reason.\n\n## 3. Objections and Replies\n\n| Objection | Reply |\n|---|---|\n|  |  |\n|  |  |\n\n## 4. The Orthodox View\n\n- What the Fathers accept here.\n- Where they would qualify it.\n\n## 5. Where It Stands\n\n- Strongest point.\n- Weakest point.\n\n## Related\n\n- [[]]\n' },
  { name: 'Fallacy', tags: 'philosophy, logic, fallacies', hint: 'What the fallacy is, its form, an example and how to answer it.',
    body: 'A one-sentence definition of the fallacy.\n\n## 1. The Form\n\n1. Premise.\n2. Premise.\n3. Therefore, conclusion (which does not follow).\n\n## 2. Why It Fails\n\n- What the conclusion would actually need.\n\n## 3. Examples\n\n- **Everyday:** example.\n- **In debate:** example.\n\n## 4. How to Answer It\n\n- Name the step that fails.\n- Ask the question that exposes it.\n\n## 5. Not to Be Confused With\n\n- A legitimate move that looks similar.\n\n## Related\n\n- [[]]\n' },
  { name: 'Comparison of positions', tags: 'theology', hint: 'The positions side by side, what each says and what each costs.',
    body: 'The question the positions disagree about.\n\n## 1. The Positions\n\n| Position | Says | Problem |\n|---|---|---|\n|  |  |  |\n|  |  |  |\n|  |  |  |\n\n## 2. First Position\n\n- Main claim.\n- Who holds it.\n- Strongest argument for it.\n\n## 3. Second Position\n\n- Main claim.\n- Who holds it.\n- Strongest argument for it.\n\n## 4. What Is at Stake\n\n- Why the difference matters.\n\n## 5. The Orthodox View\n\n- Where the Church stands and why.\n\n## Related\n\n- [[]]\n' },
  { name: 'Council or history', tags: 'theology, church-history', hint: 'Background, what happened, what was decided and why it matters.',
    body: 'What happened, when and where, in one or two sentences.\n\n## 1. Background\n\n- The question in dispute.\n- The people involved.\n\n## 2. Timeline\n\n| Year | Event |\n|---|---|\n|  |  |\n|  |  |\n|  |  |\n\n## 3. What Was Decided\n\n1. First decision.\n2. Second decision.\n\n## 4. Key Terms\n\n- **Term:** meaning.\n\n## 5. Aftermath\n\n- What followed.\n\n## 6. Why It Matters\n\n- What it settles for theology.\n\n## Related\n\n- [[]]\n' },
  { name: 'Doctrine or concept', tags: 'theology', hint: 'What the teaching is, where it comes from in Scripture and the Fathers, and what it rules out.',
    body: 'A plain definition of the teaching.\n\n## 1. The Teaching\n\n- First point.\n- Second point.\n\n## 2. Scripture\n\n**Book 1:1**  \n"Verse text."\n\n- What it shows.\n\n## 3. The Fathers\n\n- **St. Name:** what he says.\n\n## 4. What It Rules Out\n\n- The error on one side.\n- The error on the other.\n\n## 5. Why It Matters\n\n- What depends on it.\n\n## Related\n\n- [[]]\n' }
];

/* ---------------- Write tab ---------------- */
function writeForm() {
  const draft = store.get('draft', {});
  const kind = W.kinds.find(k => k.key === draft.kind) || W.kinds[0];
  const tags = [...new Set(W.notes.flatMap(n => n._meta ? n._meta.tags : []))].sort();
  const courses = [...new Set(W.notes.map(n => n._meta && n._meta.course).filter(Boolean))].sort();
  $('#tab-write').innerHTML = `<div class="w-pane w-split">
    <form class="w-form" autocomplete="off" onsubmit="return false">
      <div class="w-row">
        <label class="w-field"><span>Section</span><select name="kind">${W.kinds.map(k => `<option value="${k.key}"${k === kind ? ' selected' : ''}>${esc(k.label)}</option>`).join('')}</select></label>
        <label class="w-field"><span>Start from a template</span><select name="tpl"><option value="">Blank note</option>${TEMPLATES.map((t, i) => `<option value="${i}">${esc(t.name)}</option>`).join('')}</select></label>
        <p class="w-addr">Address <strong id="addr">…</strong></p>
      </div>
      <label class="w-field"><span>Title</span><input name="title" required value="${esc(draft.title || '')}" placeholder="What is this note about?"></label>
      <div class="w-kind-fields"></div>
      <label class="w-field"><span>Tags <small>comma-separated</small></span><input name="tags" value="${esc(draft.tags || '')}" placeholder="philosophy-of-science, history"></label>
      ${tags.length ? `<p class="w-chips" aria-label="Existing tags">${tags.map(t => `<button type="button" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</p>` : ''}
      <label class="w-field"><span>Summary <small>one or two sentences; shown as the abstract</small></span><textarea name="summary" rows="2">${esc(draft.summary || '')}</textarea></label>
      <div class="w-field w-editor"><span>Note</span>${toolbar()}<textarea class="w-body" name="body" rows="18" placeholder="Write in Markdown. Type [[ to link another note.">${esc(draft.body || '')}</textarea>${sidePanels()}</div>
      <div class="w-actions"><button type="button" class="w-btn" data-clear>Clear</button><button type="button" class="w-btn w-primary" data-publish>Publish</button></div>
      <p class="w-status" role="status"></p>
      <datalist id="courses">${courses.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
    </form>
    <section class="w-preview-wrap" aria-label="Preview"><p class="w-preview-label">Preview</p><div id="preview" class="w-preview"></div></section>
  </div>`;
  const form = $('#tab-write form');
  const kindFields = () => {
    const k = W.kinds.find(k => k.key === form.kind.value); const f = FIELDS[k.kind] || [];
    $('.w-kind-fields', form).innerHTML = f.length ? `<div class="w-grid">${f.map(([name, label]) => `<label class="w-field"><span>${label}</span><input name="f_${name}" value="${esc((draft.f || {})[name] || '')}"${name === 'course' ? ' list="courses"' : ''}${name === 'year' || name === 'lecture' || name === 'episode' ? ' inputmode="numeric"' : ''}></label>`).join('')}</div>` : '';
  };
  const collect = () => {
    const k = W.kinds.find(k => k.key === form.kind.value);
    const f = {}; $$('[name^="f_"]', form).forEach(i => { if (i.value.trim()) f[i.name.slice(2)] = i.value.trim(); });
    return { kind: k.key, title: form.title.value.trim(), tags: form.tags.value, summary: form.summary.value.trim(), body: form.body.value, f, k };
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
  const getMeta = () => { const d = collect(); return { title: d.title, tags: tagList(d.tags), summary: d.summary, body: d.body, path: pathFor(d) }; };
  const refresh = () => { const d = collect(); const { k, ...save } = d; store.set('draft', save); previewRaw(toRaw(d), pathFor(d)); const ed = $('.w-editor', form); if (ed._redraw) ed._redraw(); };
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
      await commitFiles([{ path, content: raw }, ...await imageCommits(raw)], `Add ${d.k.label.toLowerCase()} note: ${d.title}`);
      store.del('draft'); W.images.clear(); W.imageFiles = new Map();
      W.notes.push({ path, raw }); annotate();
      done(`Published <strong>${esc(d.title)}</strong> to <code>${esc(path)}</code>. The site updates in about a minute.`);
      writeForm();
    } catch (e) { status.textContent = e.message; }
    finally { busy(false); }
  });
  kindFields(); bindEditor($('.w-editor', form), refresh, getMeta); refresh();
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

/* ---------------- Edit tab ---------------- */
function editList() {
  const q = ($('#edit-q') || {}).value || '';
  const rows = W.notes.filter(n => n._meta).map(n => n._meta)
    .filter(m => !q || (m.id + ' ' + m.title + ' ' + m.section).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  return rows.map(m => `<li><button type="button" data-open="${esc(m.path)}"><span class="w-mono">${esc(m.id)}</span> ${esc(m.title)} <small>${esc(m.section)}</small></button></li>`).join('') || '<li class="w-empty">No matching notes.</li>';
}
function editTab() {
  $('#tab-edit').innerHTML = `<div class="w-pane"><div class="w-edit-pick"><label class="w-field"><span>Find a note</span><input id="edit-q" type="search" placeholder="Title or address"></label><ul class="w-list">${editList()}</ul></div></div>`;
  $('#edit-q').addEventListener('input', () => { $('#tab-edit .w-list').innerHTML = editList(); });
}
async function openEditor(path, rawMode = false) {
  if (!conn()) { toast('Connect to GitHub in Settings first.'); showTab('settings'); return; }
  busy(true, 'Loading the latest version…');
  let raw; try { raw = await readFile(path); } catch (e) { busy(false); toast(e.message); return; } busy(false);
  W.editing = { path, original: raw };
  // With readable front matter the note opens as fields; otherwise (or on request) as the raw file.
  const fmx = rawMode ? null : splitFront(raw);
  const C0 = fmx ? { title: C.str(fmx.data.title), tags: C.list(fmx.data.tags).join(', '), summary: C.str(fmx.data.summary) } : null;
  const others = fmx ? fmx.blocks.filter(b => !['title', 'tags', 'summary'].includes(b.key)).map(b => b.text).join('\n') : '';
  const allTags = [...new Set(W.notes.flatMap(n => n._meta ? n._meta.tags : []))].sort();
  $('#tab-edit').innerHTML = `<div class="w-pane w-split">
    <form class="w-form" onsubmit="return false">
      <p class="w-back"><button type="button" class="w-link" data-back>← All notes</button> <button type="button" class="w-link w-right" data-mode>${fmx ? 'Edit the raw file' : (splitFront(raw) ? 'Edit with fields' : '')}</button></p>
      <label class="w-field"><span>File <small>change it to rename or move the note</small></span><input name="path" value="${esc(path)}" spellcheck="false" class="w-mono"></label>
      ${fmx ? `<label class="w-field"><span>Title</span><input name="title" value="${esc(C0.title)}"></label>
      <label class="w-field"><span>Tags <small>comma-separated</small></span><input name="tags" value="${esc(C0.tags)}"></label>
      <p class="w-chips" aria-label="Existing tags">${allTags.map(t => `<button type="button" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</p>
      <label class="w-field"><span>Summary <small>one or two sentences; shown in lists and guides</small></span><textarea name="summary" rows="2">${esc(C0.summary)}</textarea></label>
      <details class="w-more"><summary>Other fields <small>address, date, author, source…</small></summary><textarea name="others" rows="${Math.min(8, others.split('\n').length + 1)}" class="w-mono" spellcheck="false">${esc(others)}</textarea></details>` : ''}
      <div class="w-field w-editor"><span>${fmx ? 'Note' : 'Note, including its front matter'}</span>${toolbar()}<textarea class="w-body${fmx ? '' : ' w-raw'}" rows="${fmx ? 22 : 26}" spellcheck="true">${esc(fmx ? fmx.body : raw)}</textarea>${sidePanels()}</div>
      <div class="w-actions"><button type="button" class="w-btn w-danger" data-delete>Delete</button><button type="button" class="w-btn w-primary" data-publish>Publish changes</button></div>
      <p class="w-status" role="status"></p>
    </form>
    <section class="w-preview-wrap" aria-label="Preview"><p class="w-preview-label">Preview</p><div id="preview" class="w-preview"></div></section>
  </div>`;
  const form = $('#tab-edit form'), ta = $('.w-body', form);
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
  const refresh = () => { previewRaw(build(), form.path.value.trim()); const ed = $('.w-editor', form); if (ed._redraw) ed._redraw(); };
  bindEditor($('.w-editor', form), refresh, getMeta); refresh();
  form.path.addEventListener('change', refresh);
  form.addEventListener('input', e => { if (!e.target.classList.contains('w-body')) { clearTimeout(form._t); form._t = setTimeout(refresh, 250); } });
  form.addEventListener('click', e => {
    const t = e.target.closest('[data-tag]');
    if (t && form.tags) { const cur = form.tags.value.split(',').map(s => s.trim()).filter(Boolean); if (!cur.includes(t.dataset.tag)) cur.push(t.dataset.tag); form.tags.value = cur.join(', '); refresh(); }
  });
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
      const files = [{ path: np, content }, ...await imageCommits(content)];
      if (np !== path) files.push({ path, remove: true });
      await commitFiles(files, np !== path ? `Move ${path} to ${np}` : `Edit ${np}`);
      const n = W.notes.find(n => n.path === path); if (n) { n.path = np; n.raw = content; } annotate();
      done(`Published your changes to <code>${esc(np)}</code>. The site updates in about a minute.`); editTab();
    } catch (e) { status.textContent = e.message; } finally { busy(false); }
  };
  $('[data-delete]', form).onclick = async () => {
    if (!confirm(`Delete ${path}? Its address won't be reused, and links to it will show as not-yet-written.`)) return;
    busy(true, 'Deleting…');
    try { await commitFiles([{ path, remove: true }], `Delete ${path}`); W.notes = W.notes.filter(n => n.path !== path); annotate(); done(`Deleted <code>${esc(path)}</code>.`); editTab(); }
    catch (e) { $('.w-status', form).textContent = e.message; } finally { busy(false); }
  };
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
    n._meta = p ? { path: n.path, id: p.id, title: p.title, aliases: p.aliases, tags: p.tags, course: C.str(p.fm.course), source: C.sourceLine(p), section: p.sub ? p.sub.name : p.section.name } : null;
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
  updateConn(); showTab(conn() && conn().token ? 'write' : 'settings');
}
boot();
})();

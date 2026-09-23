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
    ...opts, headers: { Authorization: `Bearer ${c.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) }
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
    if (e.status === 422 && attempt < 2) return commitFiles(files, message, attempt + 1);   // branch moved (e.g. the address-stamping commit); retry on top of it
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
    <button type="button" data-ins="h2" title="Section heading">H</button>
    <button type="button" data-ins="link" title="Link to a note (or type [[)">[[ ]]</button>
    <button type="button" data-ins="math" title="Inline maths">$x$</button>
    <button type="button" data-ins="mathd" title="Display equation">$$</button>
    <button type="button" data-ins="fn" title="Footnote">fn</button>
    <select data-callout aria-label="Insert a block"><option value="">Block…</option>
      <option>definition</option><option>theorem</option><option>lemma</option><option>proof</option><option>example</option>
      <option>note</option><option>quote</option><option>question</option><option>idea</option></select>
    <label class="w-img" title="Insert an image">Image<input type="file" accept="image/*" hidden data-img></label>
  </div>`;
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
function bindEditor(root, onChange) {
  const ta = $('textarea.w-body', root);
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-ins]'); if (!b) return;
    const k = b.dataset.ins;
    if (k === 'bold') wrapSel(ta, '**', '**', 'bold text');
    if (k === 'italic') wrapSel(ta, '*', '*', 'italic text');
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
  $('[data-img]', root).addEventListener('change', e => { [...e.target.files].forEach(f => addImage(f, ta)); e.target.value = ''; });
  ta.addEventListener('paste', e => { const f = [...(e.clipboardData?.files || [])].find(f => f.type.startsWith('image/')); if (f) { e.preventDefault(); addImage(f, ta); } });
  ta.addEventListener('drop', e => { const fs = [...(e.dataTransfer?.files || [])].filter(f => f.type.startsWith('image/')); if (fs.length) { e.preventDefault(); fs.forEach(f => addImage(f, ta)); } });
  ta.addEventListener('keydown', e => {
    if (suggest.open && ['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) { e.preventDefault(); suggestKey(e.key, ta); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); wrapSel(ta, '**', '**', 'bold text'); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') { e.preventDefault(); wrapSel(ta, '*', '*', 'italic text'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); $('[data-publish]', root.closest('.w-pane'))?.click(); }
  });
  let t = null;
  ta.addEventListener('input', () => { openSuggest(ta); clearTimeout(t); t = setTimeout(onChange, 250); });
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
        <p class="w-addr">Address <strong id="addr">…</strong></p>
      </div>
      <label class="w-field"><span>Title</span><input name="title" required value="${esc(draft.title || '')}" placeholder="What is this note about?"></label>
      <div class="w-kind-fields"></div>
      <label class="w-field"><span>Tags <small>comma-separated</small></span><input name="tags" value="${esc(draft.tags || '')}" placeholder="philosophy-of-science, history"></label>
      ${tags.length ? `<p class="w-chips" aria-label="Existing tags">${tags.map(t => `<button type="button" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</p>` : ''}
      <label class="w-field"><span>Summary <small>one or two sentences; shown as the abstract</small></span><textarea name="summary" rows="2">${esc(draft.summary || '')}</textarea></label>
      <div class="w-field w-editor"><span>Note</span>${toolbar()}<textarea class="w-body" name="body" rows="18" placeholder="Write in Markdown. Type [[ to link another note.">${esc(draft.body || '')}</textarea></div>
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
  const refresh = () => { const d = collect(); const { k, ...save } = d; store.set('draft', save); previewRaw(toRaw(d), pathFor(d)); };
  form.addEventListener('input', e => { if (!e.target.classList.contains('w-body')) { clearTimeout(form._t); form._t = setTimeout(refresh, 250); } });
  form.kind.addEventListener('change', () => { draft.f = collect().f; kindFields(); refresh(); });
  form.addEventListener('click', e => {
    const t = e.target.closest('[data-tag]');
    if (t) { const cur = form.tags.value.split(',').map(s => s.trim()).filter(Boolean); if (!cur.includes(t.dataset.tag)) cur.push(t.dataset.tag); form.tags.value = cur.join(', '); refresh(); }
    if (e.target.closest('[data-clear]') && confirm('Clear this draft?')) { store.del('draft'); W.images.clear(); writeForm(); }
  });
  $('[data-publish]', form).addEventListener('click', async () => {
    const d = collect(); const status = $('.w-status', form);
    if (!d.title) { status.textContent = 'Give the note a title first.'; form.title.focus(); return; }
    if (!conn()) { status.textContent = 'Connect to GitHub in Settings first.'; return; }
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
  kindFields(); bindEditor($('.w-editor', form), refresh); refresh();
}

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
async function openEditor(path) {
  if (!conn()) { toast('Connect to GitHub in Settings first.'); showTab('settings'); return; }
  busy(true, 'Loading the latest version…');
  let raw; try { raw = await readFile(path); } catch (e) { busy(false); toast(e.message); return; } busy(false);
  W.editing = { path, original: raw };
  $('#tab-edit').innerHTML = `<div class="w-pane w-split">
    <form class="w-form" onsubmit="return false">
      <p class="w-back"><button type="button" class="w-link" data-back>← All notes</button></p>
      <label class="w-field"><span>File <small>change it to rename or move the note</small></span><input name="path" value="${esc(path)}" spellcheck="false" class="w-mono"></label>
      <div class="w-field w-editor"><span>Note, including its front matter</span>${toolbar()}<textarea class="w-body w-raw" rows="26" spellcheck="true">${esc(raw)}</textarea></div>
      <div class="w-actions"><button type="button" class="w-btn w-danger" data-delete>Delete</button><button type="button" class="w-btn w-primary" data-publish>Publish changes</button></div>
      <p class="w-status" role="status"></p>
    </form>
    <section class="w-preview-wrap" aria-label="Preview"><p class="w-preview-label">Preview</p><div id="preview" class="w-preview"></div></section>
  </div>`;
  const form = $('#tab-edit form'), ta = $('.w-body', form);
  const refresh = () => previewRaw(ta.value, form.path.value.trim());
  bindEditor($('.w-editor', form), refresh); refresh();
  form.path.addEventListener('change', refresh);
  $('[data-back]', form).onclick = () => { if (ta.value === W.editing.original || confirm('Discard your changes?')) editTab(); };
  $('[data-publish]', form).onclick = async () => {
    const np = form.path.value.trim().replace(/^\/+/, ''); const status = $('.w-status', form);
    if (!/^notes\/.+\.(md|markdown)$/i.test(np)) { status.textContent = 'The file must stay inside notes/ and end in .md.'; return; }
    if (np !== path && W.notes.some(n => n.path.toLowerCase() === np.toLowerCase())) { status.textContent = 'Another note already uses that file name.'; return; }
    busy(true, 'Publishing…');
    try {
      const files = [{ path: np, content: ta.value }, ...await imageCommits(ta.value)];
      if (np !== path) files.push({ path, remove: true });
      await commitFiles(files, np !== path ? `Move ${path} to ${np}` : `Edit ${np}`);
      const n = W.notes.find(n => n.path === path); if (n) { n.path = np; n.raw = ta.value; } annotate();
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

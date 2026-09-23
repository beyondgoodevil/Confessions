/* Confessions — a Forester-style notebook for GitHub Pages.
   Reads config.json + notes.json (built by tools/build.mjs) and renders everything client-side. */
(() => {
'use strict';

/* ---------------- libraries (loaded from jsDelivr on demand) ---------------- */
const LIB = {
  marked: 'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js',
  yaml: 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js',
  purify: 'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',
  hljs: 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js',
  mathjax: 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js'
};
const libReady = n => n === 'marked' ? !!window.marked : n === 'yaml' ? !!window.jsyaml : n === 'purify' ? !!window.DOMPurify
  : n === 'hljs' ? !!window.hljs : n === 'mathjax' ? !!(window.MathJax && window.MathJax.typesetPromise) : false;
const libWait = {};
function loadLib(name) {
  if (libReady(name)) return Promise.resolve(true);
  if (libWait[name]) return libWait[name];
  if (name === 'mathjax' && !window.MathJax) {
    window.MathJax = { tex: { inlineMath: [['\\(', '\\)']], displayMath: [['\\[', '\\]']] },
      svg: { fontCache: 'global' }, options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] },
      startup: { typeset: false } };
  }
  libWait[name] = new Promise(resolve => {
    const s = document.createElement('script');
    s.src = LIB[name]; s.async = true;
    s.onload = () => {
      if (name === 'mathjax' && window.MathJax && window.MathJax.startup) window.MathJax.startup.promise.then(() => resolve(true), () => resolve(false));
      else resolve(libReady(name));
    };
    s.onerror = () => { delete libWait[name]; resolve(false); };
    document.head.appendChild(s);
  });
  return libWait[name];
}

/* ---------------- helpers ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const str = v => v == null ? '' : Array.isArray(v) ? v.map(str).filter(Boolean).join(', ') : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).trim();
const list = v => v == null || v === '' ? [] : Array.isArray(v) ? v.map(str).filter(Boolean) : String(v).split(',').map(s => s.trim()).filter(Boolean);
const slug = s => String(s ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’`]/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
const humanize = s => { const t = String(s).replace(/[-_]+/g, ' ').trim(); return t.charAt(0).toUpperCase() + t.slice(1); };
function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v) ? null : v;
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + 'T00:00:00Z');
  if (/^\d{4}-\d{2}$/.test(s)) return new Date(s + '-01T00:00:00Z');
  if (/^\d{4}$/.test(s)) return new Date(s + '-01-01T00:00:00Z');
  const d = new Date(s); return isNaN(d) ? null : d;
}
const fmtDate = d => d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
const time = d => d ? d.getTime() : 0;
async function getJSON(url) { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error(url + ' returned ' + r.status); return r.json(); }
function yamlLoad(src) {
  if (window.jsyaml) { try { const v = window.jsyaml.load(src); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch (e) { console.warn('Front matter error:', e.message); } }
  const out = {}; let key = null;
  for (const line of src.split('\n')) {
    const li = line.match(/^\s*-\s+(.*)$/);
    if (li && key) { if (!Array.isArray(out[key])) out[key] = []; out[key].push(unq(li[1])); continue; }
    const m = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (m) { key = m[1]; const v = m[2].replace(/\s+#.*$/, '').trim();
      out[key] = /^\[.*\]$/.test(v) ? v.slice(1, -1).split(',').map(x => unq(x.trim())).filter(Boolean) : v === 'true' ? true : v === 'false' ? false : unq(v); }
  }
  return out;
}
const unq = s => s.replace(/^(['"])(.*)\1$/, '$2');

/* ---------------- state ---------------- */
const S = { files: new Map(), config: null, sections: [], notes: [], byId: new Map(), resolve: new Map(), back: new Map(), tags: new Map(), cache: new Map(), updated: null };

/* ---------------- indexing ---------------- */
function prepareSections(cfg) {
  return (cfg.sections || []).map((s, i) => ({
    ...s, num: i + 1, id: s.id || slug(s.name), folder: s.folder || s.id,
    aliases: list(s.aliases).map(slug),
    subsections: (s.subsections || []).map((u, j) => ({ ...u, num: `${i + 1}.${j + 1}`, id: u.id || slug(u.name), folder: u.folder || u.id, aliases: list(u.aliases).map(slug) }))
  }));
}
function matchType(t) {
  const k = slug(t); if (!k) return null;
  for (const sec of S.sections) {
    if ([sec.id, slug(sec.name), ...sec.aliases].includes(k)) return { sec };
    for (const sub of sec.subsections) if ([sub.id, slug(sub.name), ...sub.aliases].includes(k)) return { sec, sub };
  }
  return null;
}
function placeNote(fm, parts) {
  let sec = null, sub = null;
  const typed = matchType(fm.section) || matchType(fm.type);
  if (typed) ({ sec, sub = null } = typed);
  if (!sec) sec = S.sections.find(s => slug(s.folder) === slug(parts[0])) || null;
  if (!sec) sec = S.sections.find(s => s.id === S.config.defaultSection) || S.sections[S.sections.length - 1];
  const want = fm.medium || fm.subsection || fm.format;
  if (want) sub = sec.subsections.find(u => [u.id, slug(u.name), ...u.aliases].includes(slug(want))) || sub;
  if (!sub && parts.length > 2) sub = sec.subsections.find(u => slug(u.folder) === slug(parts[1])) || null;
  if (!sub && sec.subsections.length) sub = sec.subsections[sec.subsections.length - 1];
  return { sec, sub };
}
function parseNote(entry, order) {
  const raw = String(entry.raw || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  let fm = {}, body = raw;
  const m = raw.match(/^---[ \t]*\n([\s\S]*?)\n(?:---|\.\.\.)[ \t]*(?:\n|$)/);
  if (m) { fm = yamlLoad(m[1]); body = raw.slice(m[0].length); }
  const parts = entry.path.replace(/^notes\//, '').split('/');
  const base = parts[parts.length - 1].replace(/\.(md|markdown)$/i, '');
  let title = str(fm.title);
  const h1 = body.match(/^\s*#[ \t]+(.+?)[ \t#]*(?:\n|$)/);
  if (!title && h1) title = h1[1].trim();
  if (h1 && slug(h1[1]) === slug(title)) body = body.slice(h1[0].length);
  if (!title) title = humanize(base);
  const { sec, sub } = placeNote(fm, parts);
  const created = toDate(fm.date ?? fm.created) || toDate(entry.created);
  return {
    path: entry.path, dir: entry.path.slice(0, entry.path.lastIndexOf('/') + 1), fm, body, title, base, order,
    section: sec, sub, tags: list(fm.tags).map(t => t.replace(/^#/, '')), aliases: list(fm.aliases ?? fm.alias),
    summary: str(fm.summary ?? fm.abstract ?? fm.description),
    explicitId: /^[A-Za-z]+-\d+$/.test(str(fm.id)) ? str(fm.id).toUpperCase() : '',
    created, updated: toDate(fm.updated) || toDate(entry.updated) || created
  };
}
function assignIds(notes) {
  S.byId = new Map();
  for (const sec of S.sections) {
    const mine = notes.filter(n => n.section === sec);
    const used = new Set(); const autos = [];
    for (const n of mine) {
      if (n.explicitId && !S.byId.has(n.explicitId)) { n.id = n.explicitId; S.byId.set(n.id, n); const num = +n.id.split('-')[1]; if (n.id.startsWith(sec.prefix + '-')) used.add(num); }
      else { if (n.explicitId) console.warn(`Duplicate id ${n.explicitId} in ${n.path}; assigning a new one.`); autos.push(n); }
    }
    autos.sort((a, b) => time(a.created) - time(b.created) || a.path.localeCompare(b.path));
    let k = used.size ? Math.max(...used) : 0;   // new addresses always follow the highest in use, so deleted ones are never reused
    for (const n of autos) { k++; n.id = `${sec.prefix}-${String(k).padStart(4, '0')}`; S.byId.set(n.id, n); }
  }
}
function* proseLines(src) {
  let fence = null;
  for (const line of src.split('\n')) {
    const f = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) { if (f && f[1][0] === fence[0] && f[1].length >= fence.length && !line.trim().replace(/[`~]/g, '')) fence = null; continue; }
    if (f) { fence = f[1]; continue; }
    yield line.replace(/`[^`\n]*`/g, '');
  }
}
const WIKI = /!?\[\[([^\[\]\n]+?)\]\]/g;
function splitWiki(inner) {
  const s = inner.replace(/\\\|/g, '|'); const i = s.indexOf('|');
  let target = (i < 0 ? s : s.slice(0, i)).trim(); const label = i < 0 ? '' : s.slice(i + 1).trim();
  let heading = ''; const h = target.indexOf('#'); if (h >= 0) { heading = target.slice(h + 1).trim(); target = target.slice(0, h).trim(); }
  return { target, label, heading };
}
function resolveFile(name, dir) {
  const clean = String(name).trim().replace(/^\.?\//, '');
  const hit = S.files.get(clean.toLowerCase()) || S.files.get(clean.split('/').pop().toLowerCase());
  return hit || (dir || '') + clean;
}
const resolveTarget = t => { if (!t) return null; const up = String(t).trim().toUpperCase(); if (S.byId.has(up)) return up; return S.resolve.get(slug(t)) || S.resolve.get(slug(String(t).split('/').pop().replace(/\.(md|markdown)$/i, ''))) || null; };

function index(cfg, entries) {
  S.cache = new Map();
  S.config = cfg; S.sections = prepareSections(cfg);
  const notes = entries.map(parseNote);
  assignIds(notes);
  S.notes = notes;
  S.resolve = new Map();
  const add = (k, id) => { const s = slug(k); if (s && !S.resolve.has(s)) S.resolve.set(s, id); };
  for (const n of notes) add(n.title, n.id);
  for (const n of notes) { add(n.base, n.id); n.aliases.forEach(a => add(a, n.id)); }
  S.back = new Map(); S.tags = new Map();
  for (const n of notes) {
    n.links = new Set();
    for (const line of proseLines(n.body)) {
      const found = [];
      for (const m of line.matchAll(WIKI)) found.push(splitWiki(m[1]).target);
      for (const m of line.matchAll(/\]\((?!https?:|mailto:|#)([^)\s]+?\.(?:md|markdown))(?:#[^)]*)?\)/gi)) found.push(decodeURIComponent(m[1]).split('/').pop());
      for (const t of found) {
        const id = resolveTarget(t); if (!id || id === n.id) continue;
        n.links.add(id);
        const arr = S.back.get(id) || []; if (!arr.some(b => b.from === n.id)) arr.push({ from: n.id, line }); S.back.set(id, arr);
      }
    }
    for (const t of n.tags) { const k = t.toLowerCase(); const e = S.tags.get(k) || { name: t, notes: [] }; e.notes.push(n); S.tags.set(k, e); }
  }
  S.updated = notes.reduce((a, n) => time(n.updated) > time(a) ? n.updated : a, null);
}

/* ---------------- citations ---------------- */
const kindOf = n => (n.sub && (n.sub.kind || n.sub.id)) || n.section.kind || n.section.id;
const joinParts = a => a.filter(Boolean).join(', ');
function citeHTML(n) {
  const f = n.fm;
  if (f.cite) return inlineMd(str(f.cite));
  const k = kindOf(n), t = `<em>${esc(n.title)}</em>`, y = str(f.year);
  if (k === 'book') {
    const a = str(f.author ?? f.authors), pub = str(f.publisher);
    if (!a && !y && !pub) return '';
    return `${a ? esc(a) + (y ? ` (${esc(y)})` : '') + '. ' : y ? `(${esc(y)}). ` : ''}${t}.${pub ? ' ' + esc(pub) + '.' : ''}`;
  }
  if (k === 'podcast') {
    const show = str(f.show ?? f.podcast); const ep = str(f.episode);
    const bits = [show && `<em>${esc(show)}</em>`, ep && `episode ${esc(ep)}`, str(f.host ?? f.hosts) && `hosted by ${esc(str(f.host ?? f.hosts))}`,
      str(f.guest ?? f.guests) && `with ${esc(str(f.guest ?? f.guests))}`, y && esc(y)];
    return bits.some(Boolean) ? joinParts(bits) + '.' : '';
  }
  if (k === 'video') {
    const bits = [esc(str(f.creator ?? f.speaker ?? f.author)), f.channel && `<em>${esc(str(f.channel))}</em>`, esc(str(f.event)), esc(y)];
    return bits.some(Boolean) ? joinParts(bits) + '.' : '';
  }
  if (k === 'lecture') {
    const c = str(f.course), l = str(f.lecture), who = str(f.lecturer ?? f.instructor), inst = str(f.institution ?? f.school);
    const first = [c && `<em>${esc(c)}</em>`, l && `lecture ${esc(l)}`].filter(Boolean).join(', ');
    return [first, esc(who), esc(inst)].filter(Boolean).map(s => s + '.').join(' ');
  }
  return f.source ? inlineMd(str(f.source)) : '';
}
function sourceLine(n) {
  const f = n.fm; if (f.source) return str(f.source);
  const k = kindOf(n), y = str(f.year);
  if (k === 'book') return joinParts([str(f.author ?? f.authors), y]);
  if (k === 'podcast') { const show = str(f.show ?? f.podcast), host = str(f.host ?? f.hosts); return joinParts([show, host && `hosted by ${host}`]); }
  if (k === 'video') return joinParts([str(f.creator ?? f.speaker ?? f.author), str(f.channel), str(f.event), y]);
  if (k === 'lecture') { const l = str(f.lecture); return joinParts([str(f.course), l && `lecture ${l}`]); }
  return '';
}

/* ---------------- markdown ---------------- */
const FORMAL = { definition: 'Definition', theorem: 'Theorem', lemma: 'Lemma', proposition: 'Proposition', corollary: 'Corollary',
  proof: 'Proof', example: 'Example', remark: 'Remark', exercise: 'Exercise', conjecture: 'Conjecture' };
const UNNUMBERED = new Set(['proof']);
const CALLOUT = { note: 'Note', info: 'Note', tip: 'Tip', important: 'Important', warning: 'Warning', caution: 'Caution',
  danger: 'Danger', quote: 'Quote', cite: 'Quote', summary: 'Summary', abstract: 'Summary', question: 'Question', todo: 'To do', idea: 'Idea' };
function inlineMd(md) { return window.marked ? sanitize(window.marked.parseInline(md)) : esc(md); }
function sanitize(html) {
  if (window.DOMPurify) return window.DOMPurify.sanitize(html, { ADD_ATTR: ['target'], FORBID_TAGS: ['style', 'form'] });
  const t = document.createElement('template'); t.innerHTML = html;
  t.content.querySelectorAll('script,iframe,object,embed,style,form').forEach(e => e.remove());
  t.content.querySelectorAll('*').forEach(el => [...el.attributes].forEach(a => { if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) el.removeAttribute(a.name); }));
  return t.innerHTML;
}
function splitFences(src) {
  const out = []; let buf = [], fence = null;
  const flush = code => { if (buf.length) out.push({ code, text: buf.join('\n') }); buf = []; };
  for (const line of src.split('\n')) {
    const f = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) { buf.push(line); if (f && f[1][0] === fence[0] && f[1].length >= fence.length && !line.trim().replace(/[`~]/g, '')) { flush(true); fence = null; } continue; }
    if (f) { flush(false); fence = f[1]; buf.push(line); continue; }
    buf.push(line);
  }
  flush(!!fence);
  return out;
}
function renderMarkdown(src, ctx = {}) {
  const store = [];
  const ph = (type, html) => { store.push(html); return `\uE000${type}${store.length - 1}\uE001`; };
  const defs = new Map(), order = [];
  const segs = splitFences(src).map(seg => {
    if (seg.code) return seg.text;
    // footnote definitions
    const lines = seg.text.split('\n'), keep = [];
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^\[\^([^\]\s]+)\]:\s?(.*)$/);
      if (!m) { keep.push(lines[i]); continue; }
      let text = m[2];
      while (i + 1 < lines.length && /^( {2,}|\t)\S/.test(lines[i + 1])) text += ' ' + lines[++i].trim();
      defs.set(m[1], text);
    }
    return keep.join('\n');
  });
  const transform = (t, withNotes = true) => {
    t = t.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => ph('D', `<span class="math-d">\\[${esc(tex.replace(/\n\s*>\s?/g, '\n').trim())}\\]</span>`));
    t = t.replace(/(^|[^\\$\w])\$(?=[^\s$])([^$\n]+?)(?<=[^\s\\])\$(?![\w$])/g, (_, pre, tex) => pre + ph('M', `<span class="math-i">\\(${esc(tex)}\\)</span>`));
    t = t.replace(/!\[\[([^\[\]\n]+?\.(?:png|jpe?g|gif|svg|webp|avif|bmp))(?:\|([^\]\n]*))?\]\]/gi, (all, file, opt) => {
      const src = resolveFile(file, ctx.dir); const w = /^\d+$/.test(opt || '') ? ` width="${opt}"` : '';
      return ph('W', `<img src="${esc(src)}" alt="${esc(opt && !w ? opt : file.split('/').pop())}"${w} loading="lazy">`);
    });
    t = t.replace(WIKI, (all, inner) => {
      const { target, label, heading } = splitWiki(inner);
      const id = target ? resolveTarget(target) : ctx.id;
      const n = id && S.byId.get(id);
      const text = label || (n && /^[A-Za-z]+-\d+$/.test(target) ? n.title : target || heading);
      if (!n) return ph('W', `<a class="wikilink is-broken" href="#" data-missing="${esc(target)}" title="Not written yet">${esc(text)}</a>`);
      return ph('W', `<a class="wikilink" href="#/${n.id}" data-id="${n.id}"${heading ? ` data-heading="${esc(slug(heading))}"` : ''}>${esc(text)}</a>`);
    });
    if (withNotes) t = t.replace(/\[\^([^\]\s]+)\](?!:)/g, (all, key) => {
      if (!defs.has(key)) return all;
      let i = order.indexOf(key); if (i < 0) { order.push(key); i = order.length - 1; }
      return ph('F', `<sup class="sn-ref"><a href="#" data-fn="${i + 1}">${i + 1}</a></sup>`);
    });
    return t.replace(/==(?=\S)([^=\n]+?)(?<=\S)==/g, '<mark>$1</mark>');
  };
  const parts = splitFences(segs.join('\n')).map(seg => seg.code ? seg.text : seg.text.split(/(`[^`\n]*`)/).map((p, i) => i % 2 ? p : transform(p)).join(''));
  let html = window.marked ? window.marked.parse(parts.join('\n'), { gfm: true }) : '<p>' + esc(parts.join('\n')).replace(/\n{2,}/g, '</p><p>') + '</p>';
  if (order.length) html += `<section class="footnotes"><ol>${order.map((k, i) => `<li data-fn-body="${i + 1}">${window.marked ? window.marked.parseInline(transform(defs.get(k), false)) : esc(defs.get(k))} <a href="#" class="fn-back" data-fnback="${i + 1}" aria-label="Back to text">↩</a></li>`).join('')}</ol></section>`;
  html = html.replace(/<p>\s*\uE000D(\d+)\uE001\s*<\/p>/g, (_, i) => store[+i].replace(/^<span class="math-d">/, '<div class="math-d">').replace(/<\/span>$/, '</div>'));
  for (let pass = 0; pass < 3 && /\uE000/.test(html); pass++) html = html.replace(/\uE000[A-Z](\d+)\uE001/g, (_, i) => store[+i]);
  const root = document.createElement('div');
  root.innerHTML = sanitize(html);
  postProcess(root, ctx);
  return root;
}
function postProcess(root, ctx) {
  // callouts: > [!type] Title
  for (const bq of $$('blockquote', root)) {
    const p = bq.firstElementChild; if (!p || p.tagName !== 'P') continue;
    const m = p.innerHTML.match(/^\s*\[!([\w-]+)\]([+-]?)[ \t]*(.*?)(?:\n|<br\s*\/?>|$)/i); if (!m) continue;
    const type = m[1].toLowerCase(), title = m[3].trim();
    p.innerHTML = p.innerHTML.slice(m[0].length).replace(/^\s+/, '');
    if (!p.textContent.trim() && !p.querySelector('img,.math-i,.math-d')) p.remove();
    const box = document.createElement('div'), body = document.createElement('div');
    body.className = 'callout-body'; while (bq.firstChild) body.appendChild(bq.firstChild);
    if (FORMAL[type]) {
      box.className = `callout callout-${type} is-formal${UNNUMBERED.has(type) ? '' : ' is-numbered'}`;
      const head = type === 'proof'
        ? `<span class="thm-head">${title ? esc(title.replace(/<[^>]+>/g, '')) : 'Proof'}.</span> `
        : `<span class="thm-head"><span class="thm-label">${FORMAL[type]}</span><span class="thm-num"></span>${title ? ` <span class="thm-name">(${title})</span>` : ''}.</span> `;
      let first = body.firstElementChild;
      if (!first || first.tagName !== 'P') { first = document.createElement('p'); body.prepend(first); }
      first.insertAdjacentHTML('afterbegin', head);
      if (type === 'proof') { let last = body.lastElementChild; if (!last || last.tagName !== 'P') { last = document.createElement('p'); body.append(last); } last.insertAdjacentHTML('beforeend', '<span class="qed" aria-hidden="true">∎</span>'); }
      box.append(body);
    } else {
      box.className = `callout callout-${type}`;
      box.innerHTML = `<div class="callout-title">${title || CALLOUT[type] || humanize(type)}</div>`;
      box.append(body);
    }
    bq.replaceWith(box);
  }
  // headings
  const seen = new Set(); ctx.toc = [];
  for (const h of $$('h2,h3,h4', root)) {
    let a = slug(h.textContent) || 'section', k = a, i = 2; while (seen.has(k)) k = `${a}-${i++}`; seen.add(k);
    h.dataset.anchor = k;
    if (h.tagName !== 'H4') ctx.toc.push({ level: +h.tagName[1], anchor: k, text: h.textContent });
  }
  // links
  for (const a of $$('a[href]', root)) {
    if (a.classList.contains('wikilink') || a.dataset.fn || a.dataset.fnback) continue;
    const href = a.getAttribute('href');
    if (/^(https?:)?\/\//i.test(href) || /^mailto:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; a.classList.add('external'); continue; }
    if (href.startsWith('#')) continue;
    const id = resolveTarget(decodeURIComponent(href.split('#')[0]).split('/').pop());
    if (id) { a.classList.add('wikilink'); a.dataset.id = id; a.setAttribute('href', '#/' + id); }
  }
  // relative images live next to the note
  if (ctx.dir) for (const img of $$('img[src]', root)) { const s = img.getAttribute('src'); if (!/^([a-z]+:|\/|#|data:|notes\/)/i.test(s)) img.setAttribute('src', ctx.dir + s); img.loading = 'lazy'; }
  for (const t of $$('table', root)) { const w = document.createElement('div'); w.className = 'table-wrap'; t.replaceWith(w); w.append(t); }
  for (const li of $$('li', root)) if (li.firstElementChild && li.firstElementChild.matches('input[type=checkbox]')) li.classList.add('task');
  for (const code of $$('pre > code', root)) { const l = (code.className.match(/language-([\w+#-]+)/) || [])[1]; if (l) code.parentElement.dataset.lang = l; }
}
function renderNoteBody(n) {
  if (!S.cache.has(n.id)) { const ctx = { id: n.id, dir: n.dir }; const root = renderMarkdown(n.body, ctx); S.cache.set(n.id, { html: root.innerHTML, toc: ctx.toc }); }
  return S.cache.get(n.id);
}
async function enhance(el) {
  if (el.querySelector('pre > code[class*="language-"]') && await loadLib('hljs')) {
    for (const code of $$('pre > code[class*="language-"]', el)) {
      const l = (code.className.match(/language-([\w+#-]+)/) || [])[1];
      if (l && window.hljs.getLanguage(l) && !code.dataset.hl) { code.innerHTML = window.hljs.highlight(code.textContent, { language: l, ignoreIllegals: true }).value; code.dataset.hl = '1'; }
    }
  }
  if (el.querySelector('.math-i,.math-d') && await loadLib('mathjax')) { try { await window.MathJax.typesetPromise([el]); } catch (e) { console.warn(e); } }
}

/* ---------------- templates ---------------- */
const noteLink = n => `<a href="#/${n.id}" data-id="${n.id}">${esc(n.title)}</a>`;
function entryLi(n, withSummary) {
  const src = sourceLine(n);
  return `<li><span class="fr-addr">${n.id}</span><div>${noteLink(n)}${src ? `<span class="fr-src">${esc(src)}</span>` : ''}${withSummary && n.summary ? `<span class="fr-sum">${esc(n.summary)}</span>` : ''}</div></li>`;
}
const newest = (a, b) => time(b.created) - time(a.created) || time(b.updated) - time(a.updated) || a.title.localeCompare(b.title);
const notesIn = (sec, sub) => S.notes.filter(n => n.section === sec && (!sub || n.sub === sub));
const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;
const sectionNoun = sec => sec.noun || sec.name.toLowerCase();

function viewIndex() {
  const c = S.config, per = c.indexPreviewCount || 4, perSub = c.indexPreviewCountPerSubsection || 3;
  const toc = S.sections.map(sec => {
    const row = `<a href="#/s/${sec.id}"><span class="st-name">${esc(sec.name)}</span><span class="st-c">${notesIn(sec).length}</span></a>`;
    return row + sec.subsections.map(u => `<a class="st-sub" href="#/s/${sec.id}/${u.id}"><span class="st-name">${esc(u.name)}</span><span class="st-c">${notesIn(sec, u).length}</span></a>`).join('');
  }).join('');
  const secs = S.sections.map(sec => {
    const all = notesIn(sec);
    let inner;
    if (!all.length) inner = `<p class="fr-empty">No notes here yet.</p>`;
    else if (sec.subsections.length) inner = sec.subsections.map(u => {
      const ns = notesIn(sec, u).sort(newest).slice(0, perSub);
      return `<div class="subsec"><h3 class="fr-sub"><a href="#/s/${sec.id}/${u.id}">${esc(u.name)}</a></h3>${ns.length ? `<ol class="fr-list">${ns.map(n => entryLi(n)).join('')}</ol>` : '<p class="fr-empty fr-empty-sub">None yet.</p>'}</div>`;
    }).join('');
    else inner = `<ol class="fr-list">${all.sort(newest).slice(0, per).map(n => entryLi(n)).join('')}</ol>`;
    const more = all.length ? `<a class="fr-more" href="#/s/${sec.id}">All ${plural(all.length, sec.nounSingular || sectionNoun(sec) + ' note', (sec.nounSingular || sectionNoun(sec) + ' note') + 's')}</a>` : '';
    return `<section class="fr-sec"><h2 class="fr-sec-title"><a href="#/s/${sec.id}">${esc(sec.name)}</a></h2>${sec.description ? `<p class="fr-sec-desc">${esc(sec.description)}</p>` : ''}${inner}${more}</section>`;
  }).join('');
  const welcome = c.welcome || c.intro;
  const intro = welcome ? `<div class="prose fr-welcome">${renderMarkdown(welcome).innerHTML}</div>` : '';
  return `<div class="home home-forester">
    <header class="fr-head"><h1 class="home-title">${esc(c.title || 'Notes')}</h1>${c.subtitle ? `<p class="home-sub">${esc(c.subtitle)}</p>` : ''}
    ${c.author ? `<p class="fr-author">${esc(c.author)}</p>` : ''}</header>
    ${intro}<nav class="sec-toc" aria-label="Sections">${toc}</nav>${secs}</div>`;
}

function viewSection(sec, subId, sort) {
  const sub = sec.subsections.find(u => u.id === subId) || null;
  const all = notesIn(sec);
  const hasAuthor = all.some(n => n.fm.author || n.fm.authors);
  const sorts = [['newest', 'newest'], ['title', 'title']].concat(hasAuthor ? [['author', 'author']] : []);
  sort = sorts.some(s => s[0] === sort) ? sort : 'newest';
  const cmp = sort === 'title' ? (a, b) => a.title.localeCompare(b.title) : sort === 'author' ? (a, b) => str(a.fm.author ?? a.fm.authors).split(' ').pop().localeCompare(str(b.fm.author ?? b.fm.authors).split(' ').pop()) || a.title.localeCompare(b.title) : newest;
  const base = `#/s/${sec.id}`;
  const filter = sec.subsections.length ? `<span class="medium-filter">Show <a href="${base}?sort=${sort}"${!sub ? ' aria-current="true"' : ''}>all ${all.length}</a>${sec.subsections.map(u => ` <a href="${base}/${u.id}?sort=${sort}"${sub === u ? ' aria-current="true"' : ''}>${esc(u.name.toLowerCase())} ${notesIn(sec, u).length}</a>`).join('')}</span>`
    : `<span>${plural(all.length, 'note', 'notes')}</span>`;
  const here = sub ? `${base}/${sub.id}` : base;
  const sorter = `<span class="sort">Sort by ${sorts.map(([k, l]) => `<a href="${here}?sort=${k}"${k === sort ? ' aria-current="true"' : ''}>${l}</a>`).join(' ')}</span>`;
  const groups = sec.subsections.length ? (sub ? [sub] : sec.subsections) : [null];
  const body = groups.map(u => {
    const ns = notesIn(sec, u).sort(cmp);
    const head = u ? `<h2 class="yr">${esc(u.name)}</h2>` : '';
    return `<section>${head}${ns.length ? `<ol class="fr-list fr-list-full">${ns.map(n => entryLi(n, true)).join('')}</ol>` : '<p class="fr-empty">No notes here yet.</p>'}</section>`;
  }).join('');
  return `<div class="page page-section"><header class="fr-head"><h1>${esc(sec.name)}</h1>${sec.description ? `<p class="home-sub">${esc(sec.description)}</p>` : ''}</header>
    <div class="sec-tools">${filter}${sorter}</div>${body}</div>`;
}

function contextSnippet(line, targetId) {
  let s = line.replace(/^\s*(?:[-*+]|\d+\.|>+|#+)\s*/, '').replace(/\[\^[^\]]+\]/g, '');
  const strip = t => esc(t.replace(/\*\*|__|~~|==/g, '').replace(/(^|\W)[*_](\S.*?\S|\S)[*_](?=\W|$)/g, '$1$2').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\$([^$]+)\$/g, '$1').replace(/\[\[|\]\]/g, ''));
  if (s.length > 280) {
    const at = Math.max(0, s.search(/\[\[/));
    const start = Math.max(0, at - 110), end = Math.min(s.length, at + 170);
    s = (start ? '…' : '') + s.slice(start, end) + (end < s.length ? '…' : '');
  }
  let out = '', last = 0;
  for (const m of s.matchAll(WIKI)) {
    out += strip(s.slice(last, m.index));
    const { target, label } = splitWiki(m[1]); const id = resolveTarget(target); const n = id && S.byId.get(id);
    const text = label || (n && /^[A-Za-z]+-\d+$/.test(target) ? n.title : target);
    out += id === targetId ? `<strong>${esc(text)}</strong>` : esc(text);
    last = m.index + m[0].length;
  }
  return out + strip(s.slice(last));
}

function viewNote(n) {
  const r = renderNoteBody(n);
  const f = n.fm, sec = n.section;
  const label = (n.sub && n.sub.label) || sec.label || `${sec.name} notes`;
  const cite = citeHTML(n);
  const url = str(f.url ?? f.link);
  const tags = n.tags.map(t => `<a class="tag" href="#/tags/${encodeURIComponent(t.toLowerCase())}">${esc(t)}</a>`).join(' ');
  // lecture series navigation
  let series = '';
  if (f.course) {
    const run = S.notes.filter(m => m.section === sec && str(m.fm.course) === str(f.course))
      .sort((a, b) => (parseFloat(a.fm.lecture) || 0) - (parseFloat(b.fm.lecture) || 0) || time(a.created) - time(b.created));
    const i = run.indexOf(n);
    if (run.length > 1) series = `<p class="series">${i > 0 ? `Previous: <a href="#/${run[i - 1].id}">${run[i - 1].id} ${esc(run[i - 1].title)}</a>` : ''}${i < run.length - 1 ? `Next: <a href="#/${run[i + 1].id}">${run[i + 1].id} ${esc(run[i + 1].title)}</a>` : ''}</p>`;
  }
  const toc = r.toc.filter(t => t.level === 2).length >= 2
    ? `<nav class="toc" aria-label="Contents"><p class="toc-title">Contents</p><ol>${r.toc.map(t => `<li class="lvl-${t.level}"><a href="#" data-scroll="${t.anchor}">${esc(t.text)}</a></li>`).join('')}</ol></nav>` : '';
  const back = (S.back.get(n.id) || []).map(b => ({ ...b, n: S.byId.get(b.from) })).sort((a, b) => a.n.id.localeCompare(b.n.id));
  const backHTML = `<section class="backlinks"><h2>Referenced by</h2>${back.length
    ? `<ul>${back.map(b => `<li><span class="bl-addr">[${b.n.id}]</span><a class="bl-title" href="#/${b.n.id}" data-id="${b.n.id}">${esc(b.n.title)}</a><p class="bl-ctx">${contextSnippet(b.line, n.id)}</p></li>`).join('')}</ul>`
    : `<p class="bl-none">No other note links here yet. Link to it with <code>[[${esc(n.id)}]]</code> or <code>[[${esc(n.title)}]]</code>.</p>`}</section>`;
  const related = n.tags.length ? S.notes.filter(m => m !== n).map(m => ({ m, shared: m.tags.filter(t => n.tags.some(u => u.toLowerCase() === t.toLowerCase())) }))
    .filter(x => x.shared.length).sort((a, b) => b.shared.length - a.shared.length || newest(a.m, b.m)).slice(0, 8) : [];
  const relHTML = related.length ? `<section class="related"><h2>Shares tags with</h2><ul>${related.map(x => `<li><span class="bl-addr">[${x.m.id}]</span><a href="#/${x.m.id}" data-id="${x.m.id}">${esc(x.m.title)}</a> <span class="rel-tags">${x.shared.map(esc).join(', ')}</span></li>`).join('')}</ul></section>` : '';
  const outgoing = [...n.links].map(id => S.byId.get(id)).filter(m => m && !back.some(b => b.n === m));
  const outHTML = outgoing.length ? `<section class="related"><h2>Links from this note</h2><ul>${outgoing.map(m => `<li><span class="bl-addr">[${m.id}]</span><a href="#/${m.id}" data-id="${m.id}">${esc(m.title)}</a></li>`).join('')}</ul></section>` : '';
  return `<div class="note-page"><article class="note" data-id="${n.id}"><div class="note-main">
    <header class="note-head">
      <p class="note-kicker"><a class="note-taxon" href="#/s/${sec.id}${n.sub ? '/' + n.sub.id : ''}">${esc(label)}</a><span class="note-addr">${n.id}</span></p>
      <h1 class="note-title">${esc(n.title)}</h1>
      ${cite ? `<p class="cite">${cite}</p>` : ''}
      ${url ? `<p class="source-link"><a class="external" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(str(f.urlLabel) || 'Source')}</a></p>` : ''}
      ${n.updated ? `<p class="note-updated">Updated ${fmtDate(n.updated)}</p>` : ''}
      ${tags ? `<p class="note-tags">${tags}</p>` : ''}
      ${series}
      ${n.summary ? `<p class="note-summary">${esc(n.summary)}</p>` : ''}
    </header>
    ${toc}
    <div class="prose note-body">${r.html}</div>
    <footer class="note-foot">${backHTML}${outHTML}${relHTML}</footer>
  </div></article></div>`;
}

function viewTags() {
  const tags = [...S.tags.values()].sort((a, b) => a.name.localeCompare(b.name));
  return `<div class="page page-section"><header class="fr-head"><h1>Tags</h1><p class="home-sub">${plural(tags.length, 'tag', 'tags')} across ${plural(S.notes.length, 'note', 'notes')}</p></header>
    ${tags.length ? `<ul class="tag-cloud">${tags.map(t => `<li><a href="#/tags/${encodeURIComponent(t.name.toLowerCase())}">${esc(t.name)} <span class="count">${t.notes.length}</span></a></li>`).join('')}</ul>` : '<p class="fr-empty">No tags yet. Add <code>tags: [one, two]</code> to a note’s front matter.</p>'}</div>`;
}
function viewTag(key) {
  const t = S.tags.get(key);
  if (!t) return viewMissing(`No notes are tagged “${esc(key)}”.`);
  const bySec = S.sections.map(sec => ({ sec, ns: t.notes.filter(n => n.section === sec).sort(newest) })).filter(g => g.ns.length);
  return `<div class="page page-section"><header class="fr-head"><p class="note-kicker"><a class="note-taxon" href="#/tags">Tag</a></p><h1>${esc(t.name)}</h1><p class="home-sub">${plural(t.notes.length, 'note', 'notes')}</p></header>
    ${bySec.map(g => `<h2 class="yr">${esc(g.sec.name)}</h2><ol class="fr-list fr-list-full">${g.ns.map(n => entryLi(n, true)).join('')}</ol>`).join('')}</div>`;
}
const viewMissing = msg => `<div class="page page-section"><header class="fr-head"><h1>Not found</h1><p class="home-sub">${msg}</p></header><p style="text-align:center"><a href="#/">Back to the index</a></p></div>`;

/* ---------------- routing ---------------- */
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(p => { try { return decodeURIComponent(p); } catch (e) { return p; } });
  const q = new URLSearchParams(query);
  if (!parts.length) return { name: 'index' };
  if (parts[0] === 's') return { name: 'section', sec: parts[1], sub: parts[2], sort: q.get('sort') };
  if (parts[0] === 'tags') return parts[1] ? { name: 'tag', tag: parts[1] } : { name: 'tags' };
  return { name: 'note', id: parts[0].toUpperCase(), anchor: parts[1] };
}
let lastRoute = '';
function route() {
  hidePopover();
  const r = parseHash(), main = $('#main');
  let html, title = S.config.title || 'Notes', navKey = r.name === 'index' ? 'index' : r.name.startsWith('tag') ? 'tags' : null;
  if (r.name === 'index') html = viewIndex();
  else if (r.name === 'section') {
    const sec = S.sections.find(s => s.id === r.sec);
    html = sec ? viewSection(sec, r.sub, r.sort) : viewMissing('That section doesn’t exist.');
    if (sec) { title = `${sec.name} — ${title}`; navKey = sec.id; }
  } else if (r.name === 'tags') { html = viewTags(); title = `Tags — ${title}`; }
  else if (r.name === 'tag') { html = viewTag(r.tag.toLowerCase()); title = `${r.tag} — ${title}`; }
  else {
    const n = S.byId.get(r.id) || S.byId.get(resolveTarget(r.id) || '');
    if (n && n.id !== r.id) { location.replace('#/' + n.id); return; }
    html = n ? viewNote(n) : viewMissing(`There’s no note with the address ${esc(r.id)}.`);
    if (n) { title = `${n.title} — ${title}`; navKey = n.section.id; }
  }
  main.innerHTML = html;
  document.title = title;
  $$('.nav a[data-nav]').forEach(a => a.dataset.nav === navKey ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  const key = r.name === 'section' ? `s/${r.sec}` : location.hash;
  if (key !== lastRoute) window.scrollTo(0, 0);
  lastRoute = key;
  if (r.anchor) scrollToAnchor(r.anchor);
  enhance(main);
}
function scrollToAnchor(a) { const h = $(`[data-anchor="${CSS.escape(a)}"]`, $('#main')); if (h) h.scrollIntoView({ block: 'start' }); }

/* ---------------- shell ---------------- */
function buildShell() {
  const c = S.config;
  document.body.innerHTML = `<a class="skip" href="#main">Skip to content</a>
  <header class="topbar"><a class="brand" href="#/"><span class="brand-title">${esc(c.title || 'Notes')}</span></a>
    <nav class="nav" aria-label="Main"><a href="#/" data-nav="index">Index</a>${S.sections.map(s => `<a href="#/s/${s.id}" data-nav="${s.id}">${esc(s.shortName || s.name)}</a>`).join('')}
    <a href="#/tags" data-nav="tags">Tags</a><button type="button" data-action="search">Search<kbd>/</kbd></button>
    <button type="button" class="theme-btn" data-action="theme" aria-label="Switch colour theme" title="Switch colour theme"></button></nav></header>
  <main id="main" tabindex="-1"></main>
  <div class="popover" id="popover" hidden></div>`;
  updateThemeButton();
}
const THEMES = ['auto', 'light', 'dark'];
function currentTheme() { try { return localStorage.getItem('theme') || 'auto'; } catch (e) { return 'auto'; } }
function applyTheme(t) { if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; }
function updateThemeButton() { const b = $('.theme-btn'); if (b) b.textContent = { auto: 'Auto', light: 'Light', dark: 'Dark' }[currentTheme()]; }

/* ---------------- search ---------------- */
function plainText(n) {
  if (!n._plain) n._plain = n.body.replace(/!?\[\[([^\]]+)\]\]/g, (_, i) => { const { target, label } = splitWiki(i); return label || target; })
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[#*_>`=~|$\\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return n._plain;
}
function search(q) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [...S.notes].sort((a, b) => time(b.updated) - time(a.updated)).slice(0, 8).map(n => ({ n, snip: '' }));
  const res = [];
  for (const n of S.notes) {
    const title = n.title.toLowerCase(), meta = [n.id, n.tags.join(' '), sourceLine(n), n.aliases.join(' ')].join(' ').toLowerCase(), body = plainText(n), low = body.toLowerCase();
    let score = 0, ok = true;
    for (const t of terms) { if (title.includes(t)) score += 10; else if (meta.includes(t)) score += 5; else if (low.includes(t)) score += 1; else { ok = false; break; } }
    if (!ok) continue;
    if (title.startsWith(q.toLowerCase())) score += 20;
    const at = low.indexOf(terms[0]);
    let snip = at < 0 ? (n.summary || body.slice(0, 140)) : (at > 60 ? '…' : '') + body.slice(Math.max(0, at - 60), at + 110) + '…';
    snip = esc(snip); for (const t of terms) snip = snip.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`);
    res.push({ n, snip, score });
  }
  return res.sort((a, b) => b.score - a.score).slice(0, 20);
}
function openSearch() {
  if ($('.overlay')) return;
  const prev = document.activeElement;
  const ov = document.createElement('div'); ov.className = 'overlay';
  ov.innerHTML = `<div class="dialog search-dialog" role="dialog" aria-modal="true" aria-label="Search notes">
    <input class="search-input" type="search" placeholder="Search titles, tags, sources and text" aria-label="Search" autocomplete="off">
    <p class="results-label">Recently updated</p><ul class="results" role="listbox"></ul></div>`;
  document.body.append(ov);
  const input = $('input', ov), ul = $('.results', ov), label = $('.results-label', ov);
  let items = [], sel = 0;
  const draw = () => {
    items = search(input.value.trim()); sel = 0;
    label.textContent = input.value.trim() ? `${plural(items.length, 'result', 'results')}` : 'Recently updated';
    ul.innerHTML = items.length ? items.map((r, i) => `<li role="option" data-i="${i}" aria-selected="${i === sel}"><div class="r-title"><span class="r-addr">${r.n.id}</span>${esc(r.n.title)}</div>${r.snip ? `<p class="r-snip">${r.snip}</p>` : ''}</li>`).join('') : '<li class="r-empty">Nothing matches. Try fewer words.</li>';
  };
  const mark = () => $$('li[data-i]', ul).forEach((li, i) => { li.setAttribute('aria-selected', i === sel); if (i === sel) li.scrollIntoView({ block: 'nearest' }); });
  const close = () => { ov.remove(); if (prev && prev.focus) prev.focus(); };
  const open = i => { const r = items[i]; if (!r) return; close(); location.hash = '#/' + r.n.id; };
  input.addEventListener('input', draw);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(items.length - 1, sel + 1); mark(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); mark(); e.preventDefault(); }
    else if (e.key === 'Enter') open(sel);
  });
  ov.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  ov.addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) open(+li.dataset.i); else if (e.target === ov) close(); });
  draw(); input.focus();
}

/* ---------------- hover previews ---------------- */
let popTimer = null, popHide = null;
function showPopover(a) {
  const n = S.byId.get(a.dataset.id); if (!n) return;
  const pop = $('#popover'); const r = renderNoteBody(n);
  pop.innerHTML = `<p class="pop-title"><span class="pop-addr">${n.id}</span> ${esc(n.title)}</p>${sourceLine(n) ? `<p class="pop-meta">${esc(sourceLine(n))}</p>` : ''}<div class="prose">${n.summary ? `<p><em>${esc(n.summary)}</em></p>` : ''}${r.html}</div>`;
  pop.hidden = false;
  const b = a.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  let top = b.bottom + 8; if (top + h > innerHeight - 8 && b.top - h - 8 > 8) top = b.top - h - 8;
  pop.style.top = Math.max(8, top) + 'px'; pop.style.left = Math.min(Math.max(8, b.left), innerWidth - w - 8) + 'px';
  enhance(pop);
}
function hidePopover() { clearTimeout(popTimer); const p = $('#popover'); if (p) p.hidden = true; }

/* ---------------- events ---------------- */
function bindEvents() {
  document.addEventListener('click', e => {
    const act = e.target.closest('[data-action]');
    if (act) {
      if (act.dataset.action === 'search') openSearch();
      if (act.dataset.action === 'theme') { const t = THEMES[(THEMES.indexOf(currentTheme()) + 1) % 3]; try { localStorage.setItem('theme', t); } catch (x) {} applyTheme(t); updateThemeButton(); }
      return;
    }
    const miss = e.target.closest('a[data-missing]');
    if (miss) { e.preventDefault(); return; }
    const sc = e.target.closest('[data-scroll]');
    if (sc) { e.preventDefault(); scrollToAnchor(sc.dataset.scroll); return; }
    const fn = e.target.closest('[data-fn],[data-fnback]');
    if (fn) {
      e.preventDefault(); const art = fn.closest('.note, .popover') || document;
      const target = fn.dataset.fn ? $(`[data-fn-body="${fn.dataset.fn}"]`, art) : $(`[data-fn="${fn.dataset.fnback}"]`, art);
      if (target) { target.scrollIntoView({ block: 'center' }); target.classList.add('is-flash'); setTimeout(() => target.classList.remove('is-flash'), 1200); }
      return;
    }
    const wl = e.target.closest('a.wikilink[data-heading]');
    if (wl) { e.preventDefault(); location.hash = `#/${wl.dataset.id}/${wl.dataset.heading}`; }
  });
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (!typing && (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'))) { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') hidePopover();
  });
  if (matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointerover', e => {
      const a = e.target.closest('#main a.wikilink[data-id], #main .bl-title[data-id]');
      if (e.target.closest('#popover')) { clearTimeout(popHide); return; }
      if (!a) return;
      clearTimeout(popTimer); clearTimeout(popHide); popTimer = setTimeout(() => showPopover(a), 350);
    });
    document.addEventListener('pointerout', e => {
      if (e.target.closest('#main a.wikilink[data-id], #main .bl-title[data-id], #popover')) { clearTimeout(popTimer); popHide = setTimeout(hidePopover, 250); }
    });
  }
  addEventListener('scroll', hidePopover, { passive: true });
}

/* ---------------- boot ---------------- */
function fail(msg) {
  document.body.innerHTML = `<main class="page page-section"><header class="fr-head"><h1>The notes didn’t load</h1><p class="home-sub">${msg}</p></header></main>`;
}
async function boot() {
  applyTheme(currentTheme());
  let cfg, data;
  try { [cfg, data] = await Promise.all([getJSON('config.json'), getJSON('notes.json')]); }
  catch (e) {
    fail(location.protocol === 'file:'
      ? 'Browsers block pages opened straight from disk from reading files. Run <code>node tools/serve.mjs</code> in the site folder and open <code>http://localhost:8000</code> instead.'
      : `Couldn’t read <code>config.json</code> or <code>notes.json</code> (${esc(e.message)}). If this is GitHub Pages, check the latest run in the repository’s Actions tab.`);
    return;
  }
  await Promise.all([loadLib('marked'), loadLib('yaml'), loadLib('purify')]);
  S.files = new Map((data.files || []).flatMap(f => [[f.toLowerCase(), f], [f.replace(/^notes\//, '').toLowerCase(), f], [f.split('/').pop().toLowerCase(), f]]));
  try { index(cfg, data.notes || []); }
  catch (e) { console.error(e); fail(`Something in <code>config.json</code> is wrong: ${esc(e.message)}`); return; }
  buildShell(); bindEvents();
  addEventListener('hashchange', route);
  route();
}
if (window.COMMONPLACE_LIBRARY) {
  window.Commonplace = { S, loadLib, index, parseNote, viewNote, renderMarkdown, enhance, sourceLine, esc, slug, list, str, getJSON, matchType, placeNote, prepareSections };
} else boot();
})();

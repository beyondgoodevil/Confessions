/* Confessions — a commonplace book for GitHub Pages.
   Reads config.json + notes.json (built by tools/build.mjs) and renders everything client-side.
   assets/loci.js (optional) supplies the book and author tables for the indices. */
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
const fmtShort = d => d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '';
const fmtMonth = d => d ? d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
const fmtNum = k => Number(k).toLocaleString('en-GB');
const time = d => d ? d.getTime() : 0;
const reEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function roman(n) {
  let s = '';
  for (const [v, r] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { s += r; n -= v; }
  return s;
}
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
const S = { files: new Map(), config: null, sections: [], notes: [], byId: new Map(), resolve: new Map(), back: new Map(), tags: new Map(), cache: new Map(), updated: null, derived: {} };

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
  S.cache = new Map(); S.derived = {};
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
    // notes on chapters of a book name the book in `source`; cite that, not the note's own title
    if (f.source && !y && !pub) return `${a ? esc(a) + '. ' : ''}${workTitles(str(f.source))}`.replace(/([^.])$/, '$1.');
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
// "Thinking Being (Brill, 2014), ch. 3; Oxford Handbook of Nietzsche (2013)" with each work's title in italics
const workTitles = src => /[*_]/.test(src) ? inlineMd(src) : src.split(/\s*;\s*/).map(seg => { const m = seg.match(/^([^()]+?)\s*(\(.*)$/); return m ? `<em>${esc(m[1])}</em> ${esc(m[2])}` : esc(seg); }).join('; ');
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
    const plain = /^(related|other guides|see also)$/i.test(h.textContent.trim());
    if (plain) { h.classList.add('h-plain'); const l = h.nextElementSibling; if (l && /^(UL|OL)$/.test(l.tagName)) l.classList.add('rel-list'); }
    if (h.tagName !== 'H4') ctx.toc.push({ level: +h.tagName[1], anchor: k, text: h.textContent, plain });
    markHeadingNumber(h);
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
  smartQuotes(root);
}
// Typographer's quotes for the rendered page; the Markdown itself is left as written.
function smartQuotes(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: t => t.parentElement.closest('code, pre, kbd, script, style, .math-i, .math-d') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  let prev = ' ', block = null;
  for (let t = w.nextNode(); t; t = w.nextNode()) {
    const v = t.nodeValue, b = t.parentElement.closest('p, li, h1, h2, h3, h4, h5, h6, td, th, dt, dd, figcaption, blockquote, div');
    if (b !== block) { block = b; prev = ' '; }
    if (/["']/.test(v)) {
      let out = '';
      for (let i = 0; i < v.length; i++) {
        const c = v[i], before = i ? v[i - 1] : prev;
        if (c === '"') out += /[\s([{\u2014\u2013\/-]/.test(before) ? '\u201C' : '\u201D';
        else if (c === "'") out += /[\s([{\u2014\u2013\/-]/.test(before) && !/^'(?:\d0s|tis|twas|em)\b/i.test(v.slice(i, i + 6)) ? '\u2018' : '\u2019';
        else out += c;
      }
      t.nodeValue = out;
    }
    if (v.length) prev = v[v.length - 1];
  }
}
// A heading's own number ("2.", "A.", "IV)") goes in its own span so the stylesheet can set it in the margin.
const NUM_RE = /^\s*((?:\d+(?:\.\d+)*|[A-Z]|[IVXLC]+)[.)])(?:\s+|$)/;
function markHeadingNumber(h) {
  const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
  let t = w.nextNode(); while (t && !t.nodeValue.trim()) t = w.nextNode();
  const m = t && t.nodeValue.match(NUM_RE);
  if (!m || h.textContent.trim().length <= m[1].length) return;
  t.nodeValue = t.nodeValue.slice(m[0].length);
  const s = document.createElement('span'); s.className = 'h-num'; s.textContent = m[1];
  t.parentNode.insertBefore(s, t); h.classList.add('has-num');
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

/* ---------------- shared bits ---------------- */
// newest first; notes published on the same day fall back to their address, which is handed out in publishing order
const idNum = n => +String(n.id).split('-')[1] || 0;
const newest = (a, b) => time(b.created) - time(a.created) || idNum(b) - idNum(a) || a.title.localeCompare(b.title);
const byAddr = (a, b) => S.sections.indexOf(a.section) - S.sections.indexOf(b.section) || idNum(a) - idNum(b);
const notesIn = (sec, sub) => S.notes.filter(n => n.section === sec && (!sub || n.sub === sub));
const plural = (k, one, many) => `${fmtNum(k)} ${k === 1 ? one : many}`;
const secName = n => (n.sub && n.sub.name) || n.section.name;
const xref = n => `<a class="xref" href="#/${n.id}" data-id="${n.id}" aria-label="${n.id}: ${esc(n.title)}">${n.id}</a>`;
const leader = '<span class="leader" aria-hidden="true"></span>';
const tagLabel = t => /^[a-z]+(?:-[a-z]+)*$/.test(t) ? (t.charAt(0).toUpperCase() + t.slice(1)).replace(/-/g, ' ') : t;
const tagHref = t => `#/tags/${encodeURIComponent(t.toLowerCase())}`;
const siteURL = () => location.href.split('#')[0].replace(/[^/]*\.html$/, '');
const initialCap = s => { const t = String(s); const i = t.search(/\p{L}/u); return i < 0 ? esc(t) : `${esc(t.slice(0, i))}<span class="initial">${esc(t[i])}</span>${esc(t.slice(i + 1))}`; };
const wordCount = n => n._words ?? (n._words = (plainText(n).match(/[\p{L}\p{N}][\p{L}\p{N}’'-]*/gu) || []).length);
const aboutWords = k => k < 100 ? plural(k, 'word', 'words') : `c. ${fmtNum(Math.round(k / (k < 1000 ? 10 : 50)) * (k < 1000 ? 10 : 50))} words`;
const wideScreen = () => matchMedia('(min-width: 64rem)').matches;
// a note's own prose, without its links to other notes: what the indices read
const scanText = n => n._scan ?? (n._scan = [...proseLines(n.body)].join('\n').replace(/!?\[\[[^\]\n]*\]\]/g, ' ').replace(/\]\([^)\s]*\)/g, ']'));

/* ---------------- guides: reading orders and the map of topics ---------------- */
const guideSection = () => S.sections.find(s => s.id === 'guides' || s.aliases.includes('guide')) || null;
const isGuide = n => !!n && !!guideSection() && n.section === guideSection();
const guideName = n => n.title.replace(/^guide\s*[:—–-]\s*/i, '');
const SKIP_HEAD = /^(other guides|related|see also|further reading)$/i;
function guides() {
  if (S.derived.guides) return S.derived.guides;
  const gs = guideSection(), list = gs ? notesIn(gs) : [], byNote = new Map();
  for (const g of list) {
    const seq = [], heads = [], seen = new Set(), guideLinks = [];
    let group = '', skip = false;
    for (const line of proseLines(g.body)) {
      const h = line.match(/^\s{0,3}#{2,3}\s+(.+?)\s*#*\s*$/);
      if (h) { group = h[1].replace(/[*_`]/g, '').trim(); skip = SKIP_HEAD.test(group); continue; }
      for (const m of line.matchAll(WIKI)) {
        if (m[0][0] === '!') continue;
        const id = resolveTarget(splitWiki(m[1]).target), t = id && S.byId.get(id);
        if (!t || t === g) continue;
        if (t.section === gs) { if (!skip && !guideLinks.some(x => x.g === t)) guideLinks.push({ g: t, group }); continue; }
        if (skip || seen.has(id)) continue;
        seen.add(id); seq.push({ n: t, group });
        if (group && !heads.includes(group)) heads.push(group);
      }
    }
    Object.assign(g, { seq, heads, guideLinks });
    seq.forEach((x, i) => { const a = byNote.get(x.n.id) || []; a.push({ g, i, group: x.group }); byNote.set(x.n.id, a); });
  }
  // The map is the guide that mostly lists other guides ("Start Here"), unless config.json names one.
  const named = S.config.map ? S.byId.get(resolveTarget(S.config.map) || '') : null;
  const map = named || list.filter(g => g.guideLinks.length >= 3).sort((a, b) => b.guideLinks.length - a.guideLinks.length)[0] || null;
  const groups = [];
  if (map) {
    for (const { g, group } of map.guideLinks) { let grp = groups.find(x => x.name === group); if (!grp) groups.push(grp = { name: group, guides: [] }); grp.guides.push(g); }
    const listed = new Set(groups.flatMap(x => x.guides));
    const rest = list.filter(g => g !== map && !listed.has(g) && g.seq.length).sort((a, b) => a.title.localeCompare(b.title));
    if (rest.length) groups.push({ name: groups.length ? 'Further topics' : '', guides: rest });
  } else if (list.length) groups.push({ name: '', guides: list.filter(g => g.seq.length).sort((a, b) => a.title.localeCompare(b.title)) });
  return S.derived.guides = { list, map, groups: groups.filter(x => x.guides.length), byNote };
}

/* ---------------- Scripture ---------------- */
function bible() {
  if ('bible' in S.derived) return S.derived.bible;
  const L = window.CommonplaceLoci;
  if (!L || !Array.isArray(L.books)) return S.derived.bible = null;
  const books = L.books.map(([id, name, abbr, testament, ...alts], order) => ({ id, name, abbr: abbr || name, testament, order, slug: slug(name), alts }));
  const byAlias = new Map(), pats = [], PRE = { 1: ['I', 'First'], 2: ['II', 'Second'], 3: ['III', 'Third'] };
  for (const b of books) for (const a of new Set([b.name, b.abbr, ...b.alts])) {
    const m = a.match(/^([123])\s+(.+)$/);
    byAlias.set((m ? `${m[1]} ${m[2]}` : a).toLowerCase(), b);
    pats.push(m ? `(?:${m[1]}[ \\t]*|(?:${PRE[m[1]].join('|')})[ \\t]+)${reEsc(m[2]).replace(/ /g, '[ \\t]+')}` : reEsc(a).replace(/ /g, '[ \\t]+'));
  }
  pats.sort((x, y) => y.length - x.length);
  const W = '[ \\t\\u00a0]*', D = '(\\d{1,3})';
  // book, chapter, (alternative numbering), then :verse[-verse | -chapter:verse] or a range of chapters
  const src = `(?<![\\w.])(${pats.join('|')})\\.?${W}${D}(?:\\(${D}\\))?(?:${W}:${W}${D}[ab]?(?:${W}[-–—]${W}${D}(?:${W}:${W}${D})?[ab]?)?|${W}[-–—]${W}${D}(?!${W}[:\\d(]))?(?!\\d|${W}:${W}\\d|\\(|\\.\\d|\\w)`;
  const norm = t => t.replace(/^(III|Third)\s+/, '3 ').replace(/^(II|Second)\s+/, '2 ').replace(/^(I|First)\s+/, '1 ').replace(/^([123])\s*/, '$1 ').replace(/\s+/g, ' ').toLowerCase();
  return S.derived.bible = { books, re: new RegExp(src, 'g'), reLoose: new RegExp(src, 'gi'), find: t => byAlias.get(norm(t)) };
}
function findRefs(text, loose = false) {
  const B = bible(), out = []; if (!B) return out;
  const cont = /[ \t]*([,;])[ \t]*(?:(\d{1,3})[ \t]*:[ \t]*)?(\d{1,3})[ab]?(?:[ \t]*[-–][ \t]*(\d{1,3}))?(?!\d|[ \t]*:[ \t]*\d|\.\d|\w)/y;
  const push = r => { if (r.ch >= 1 && r.ch <= 151 && (!r.v1 || r.v1 <= 176) && (!r.v2 || r.ch2 || r.v2 > r.v1) && (!r.ch2 || r.ch2 > r.ch)) out.push(r); };
  for (const m of String(text).matchAll(loose ? B.reLoose : B.re)) {
    const book = B.find(m[1]); if (!book) continue;
    let ch = +m[2], v1 = m[4] ? +m[4] : 0;
    const r = { book, ch, alt: m[3] ? +m[3] : 0, v1, v2: 0, ch2: 0 };
    if (m[5]) { if (m[6]) { r.ch2 = +m[5]; r.v2 = +m[6]; } else r.v2 = +m[5]; }
    if (m[7]) r.ch2 = +m[7];
    push(r);
    cont.lastIndex = m.index + m[0].length; let c;
    while ((c = cont.exec(text))) {   // "John 14:16, 26; 15:26"
      if (c[2]) { ch = +c[2]; v1 = +c[3]; } else if (c[1] === ',' && v1) v1 = +c[3]; else { ch = +c[3]; v1 = 0; }
      push({ book, ch, alt: 0, v1, v2: v1 && c[4] ? +c[4] : 0, ch2: !v1 && c[4] ? +c[4] : 0 });
    }
  }
  return out;
}
const refKey = r => `${r.book.id}.${r.ch}.${r.v1}.${r.ch2}.${r.v2}`;
const refCmp = (a, b) => a.book.order - b.book.order || a.ch - b.ch || a.v1 - b.v1 || (a.ch2 || a.ch) - (b.ch2 || b.ch) || a.v2 - b.v2;
const refLoc = r => `${r.ch}${r.alt ? `(${r.alt})` : ''}${r.v1 ? ':' + r.v1 : ''}${r.v2 ? '–' + (r.ch2 ? r.ch2 + ':' : '') + r.v2 : r.ch2 ? '–' + r.ch2 : ''}`;
const refPath = r => `${r.ch}${r.v1 ? '-' + r.v1 : ''}`;
const refHref = r => `#/scripture/${r.book.slug}/${refPath(r)}`;
function noteRefs(n) {
  const seen = new Map();
  for (const r of [...findRefs(n.title), ...findRefs(scanText(n))]) { const k = refKey(r); if (!seen.has(k)) seen.set(k, r); }
  return [...seen.values()].sort(refCmp);
}
function scripture() {
  if ('scripture' in S.derived) return S.derived.scripture;
  const B = bible(); if (!B) return S.derived.scripture = null;
  const byNote = new Map(), byKey = new Map(); let total = 0;
  for (const n of S.notes) {
    if (isGuide(n)) continue;   // guides restate their notes; index the notes themselves
    const refs = noteRefs(n); if (refs.length) byNote.set(n.id, refs);
    for (const r of refs) { total++; const k = refKey(r); let e = byKey.get(k); if (!e) byKey.set(k, e = { ...r, notes: [] }); e.notes.push(n); }
  }
  const passages = [...byKey.values()].sort(refCmp);
  passages.forEach(p => p.notes.sort(byAddr));
  const books = B.books.map(b => ({ ...b, passages: passages.filter(p => p.book.id === b.id) })).filter(b => b.passages.length);
  return S.derived.scripture = { byNote, passages, books, total };
}

/* ---------------- authors ---------------- */
const PEOPLE_FIELDS = ['author', 'authors', 'lecturer', 'instructor', 'creator', 'speaker', 'host', 'hosts', 'guest', 'guests'];
const surname = name => name.replace(/,.*$/, '').trim().split(/\s+/).pop();
function authors() {
  if ('authors' in S.derived) return S.derived.authors;
  const L = window.CommonplaceLoci;
  if (!L || !Array.isArray(L.authors)) return S.derived.authors = null;
  const all = [];
  L.authors.forEach((a, order) => { try { all.push({ ...a, order, slug: slug(a.name), re: new RegExp((a.match && a.match.length ? a.match : [`\\b${reEsc(a.name)}\\b`]).join('|')), notes: [] }); } catch (e) { console.warn(`Index of authors: bad pattern for ${a.name}`); } });
  const sources = new Map(), byNote = new Map();
  const file = (a, n) => { if (!a.notes.includes(n)) { a.notes.push(n); const l = byNote.get(n.id) || []; l.push(a); byNote.set(n.id, l); } };
  for (const n of S.notes) {
    if (isGuide(n)) continue;
    const text = n.title + '\n' + scanText(n);
    for (const a of all) if (a.re.test(text)) file(a, n);
    for (const who of PEOPLE_FIELDS.flatMap(k => list(n.fm[k])).flatMap(s => s.split(/\s*;\s*|\s+and\s+|\s*&\s*/)).map(s => s.trim()).filter(Boolean)) {
      const known = all.find(a => a.re.test(who));
      if (known) { file(known, n); continue; }
      const key = slug(who); let a = sources.get(key);
      if (!a) sources.set(key, a = { name: who, dates: '', era: 'sources', slug: key, notes: [] });
      file(a, n);
    }
  }
  const eraNames = new Map((L.eras || []).map(([id, name]) => [id, name]));
  if (!eraNames.has('sources')) eraNames.set('sources', 'Authors of sources');
  const found = all.filter(a => a.notes.length).concat([...sources.values()].sort((a, b) => surname(a.name).localeCompare(surname(b.name)) || a.name.localeCompare(b.name)));
  found.forEach(a => a.notes.sort(byAddr));
  const eras = [...eraNames].map(([id, name]) => ({ id, name, authors: found.filter(a => a.era === id) }))
    .concat([{ id: 'other', name: 'Others', authors: found.filter(a => !eraNames.has(a.era)) }]).filter(e => e.authors.length);
  for (const l of byNote.values()) l.sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || a.name.localeCompare(b.name));
  return S.derived.authors = { eras, all: found, byNote, curated: found.filter(a => a.era !== 'sources') };
}

/* ---------------- figures for the title page and colophon ---------------- */
function stats() {
  if (S.derived.stats) return S.derived.stats;
  const sc = scripture(), au = authors();
  const first = S.notes.reduce((a, n) => n.created && (!a || n.created < a) ? n.created : a, null);
  return S.derived.stats = { notes: S.notes.length, words: S.notes.reduce((k, n) => k + wordCount(n), 0), first,
    citations: sc ? sc.total : 0, passages: sc ? sc.passages.length : 0, books: sc ? sc.books.length : 0, authors: au ? au.all.length : 0 };
}
function indexList() {
  const st = stats(), sc = scripture(), au = authors(), out = [];
  if (sc && sc.total) out.push({ href: '#/scripture', name: 'Scripture', title: 'Index of Scripture', latin: 'Index locorum', count: st.passages,
    desc: `${plural(st.citations, 'citation', 'citations')} of ${plural(st.passages, 'passage', 'passages')} in ${plural(st.books, 'book', 'books')}, from ${esc(sc.books[0].name)} to ${esc(sc.books[sc.books.length - 1].name)}.` });
  if (au && au.all.length) out.push({ href: '#/authors', name: 'Authors', title: 'Index of Authors', latin: 'Index auctorum', count: au.all.length,
    desc: `${plural(au.all.length, 'author', 'authors')}${au.curated.length > 1 ? `, from ${esc(au.curated[0].name)} to ${esc(au.curated[au.curated.length - 1].name)}` : ''}, with the entries that discuss them.` });
  out.push({ href: '#/tags', name: 'Subjects', title: 'Index of Subjects', latin: 'Index rerum', count: S.tags.size,
    desc: `${plural(S.tags.size, 'subject heading', 'subject headings')} under which the entries are filed.` });
  return out;
}

/* ---------------- entry lists ---------------- */
function regRow(n, { summary = true, date = true } = {}) {
  const src = sourceLine(n);
  return `<li class="reg-row"><span class="reg-addr">${n.id}</span><div class="reg-main"><a class="reg-title" href="#/${n.id}" data-id="${n.id}">${esc(n.title)}</a>${src ? `<span class="reg-src">${esc(src)}</span>` : ''}${summary && n.summary ? `<span class="reg-sum">${esc(n.summary)}</span>` : ''}</div>${date && n.created ? `<span class="reg-date">${fmtShort(n.created)}</span>` : ''}</li>`;
}
const register = (ns, opts) => `<ol class="register">${ns.map(n => regRow(n, opts)).join('')}</ol>`;

/* ---------------- views ---------------- */
function viewIndex() {
  const c = S.config, st = stats(), G = guides();
  const ep = c.epigraph && typeof c.epigraph === 'object' ? c.epigraph : null;
  const epigraph = ep && ep.text ? `<figure class="epigraph"><blockquote${ep.lang ? ` lang="${esc(ep.lang)}"` : ''}><p>${inlineMd(str(ep.text))}</p></blockquote>${ep.translation ? `<p class="epi-tr">${inlineMd(str(ep.translation))}</p>` : ''}${ep.source ? `<figcaption>${inlineMd(str(ep.source))}</figcaption>` : ''}</figure>` : '';
  const welcome = c.welcome || c.intro;
  const figures = [plural(st.notes, 'entry', 'entries'), st.words >= 1000 && `c. ${fmtNum(Math.round(st.words / 1000) * 1000)} words`,
    st.citations && plural(st.citations, 'citation of Scripture', 'citations of Scripture'), st.first && `kept since ${fmtMonth(st.first)}`].filter(Boolean);
  const loci = G.groups.length ? `<section class="loci" aria-labelledby="h-loci">
    <header class="block-head"><h2 id="h-loci">Loci communes</h2><p class="block-sub">Topics of study, each a reading order through the notebook.${G.map ? ` Begin with <a href="#/${G.map.id}" data-id="${G.map.id}">${esc(guideName(G.map))}</a>.` : ''}</p></header>
    ${G.groups.map((grp, i) => `<div class="locus-group">${grp.name ? `<h3 class="locus-group-h"><span class="locus-num">${roman(i + 1)}.</span> ${esc(grp.name)}</h3>` : ''}
      <ol class="loci-list">${grp.guides.map(g => `<li class="locus"><a class="locus-link" href="#/${g.id}" data-id="${g.id}"><span class="locus-title">${esc(guideName(g))}</span>${leader}<span class="locus-n" title="${plural(g.seq.length, 'entry', 'entries')}">${g.seq.length}</span></a>${g.heads.length ? `<p class="locus-heads">${g.heads.map(esc).join('<span class="dot" aria-hidden="true"> · </span>')}</p>` : ''}</li>`).join('')}</ol></div>`).join('')}
  </section>` : '';
  const contents = `<section class="aside-block" aria-labelledby="h-contents"><h2 class="aside-h" id="h-contents">Contents</h2>
    <ol class="contents">${S.sections.map((sec, i) => `<li><a href="#/s/${sec.id}"><span class="c-num">${roman(i + 1)}</span><span class="c-name">${esc(sec.name)}</span>${leader}<span class="c-n">${notesIn(sec).length}</span></a>${sec.subsections.length ? `<ol>${sec.subsections.map(u => `<li><a href="#/s/${sec.id}/${u.id}"><span class="c-num"></span><span class="c-name">${esc(u.name)}</span>${leader}<span class="c-n">${notesIn(sec, u).length}</span></a></li>`).join('')}</ol>` : ''}</li>`).join('')}</ol></section>`;
  const recent = [...S.notes].sort(newest).slice(0, c.recentCount || 8);
  const recentHTML = recent.length ? `<section class="aside-block" aria-labelledby="h-recent"><h2 class="aside-h" id="h-recent">Recent entries</h2>
    <ol class="recent">${recent.map(n => `<li><span class="reg-addr">${n.id}</span><a href="#/${n.id}" data-id="${n.id}">${esc(n.title)}</a></li>`).join('')}</ol></section>` : '';
  const ix = indexList();
  const indices = `<section class="aside-block" aria-labelledby="h-indices"><h2 class="aside-h" id="h-indices"><a href="#/indices">Indices</a></h2>
    <ol class="contents">${ix.map(x => `<li><a href="${x.href}"><span class="c-name">${esc(x.name)}</span>${leader}<span class="c-n">${fmtNum(x.count)}</span></a></li>`).join('')}</ol></section>`;
  return `<div class="home">
    <header class="title-page">
      <h1 class="tp-title">${initialCap(c.title || 'Notes')}</h1>
      ${c.subtitle ? `<p class="tp-sub">${esc(c.subtitle)}</p>` : ''}
      ${c.author ? `<p class="tp-author">${esc(c.author)}</p>` : ''}
      <p class="fleuron" aria-hidden="true"><span>❦</span></p>
      ${epigraph}
    </header>
    ${welcome ? `<div class="prose welcome">${renderMarkdown(welcome).innerHTML}</div>` : ''}
    <p class="figures">${figures.join('<span class="dot" aria-hidden="true"> · </span>')}</p>
    <div class="home-body${loci ? '' : ' no-loci'}">${loci}<aside class="home-aside" aria-label="Contents and indices">${contents}${recentHTML}${indices}</aside></div>
  </div>`;
}

function topicOf(n) {
  if (!n.tags.length) return '';
  return [...n.tags].sort((a, b) => ((S.tags.get(a.toLowerCase()) || { notes: [] }).notes.length - (S.tags.get(b.toLowerCase()) || { notes: [] }).notes.length) || a.localeCompare(b))[0];
}
function viewSection(sec, subId, sort) {
  const sub = sec.subsections.find(u => u.id === subId) || null;
  const all = notesIn(sec), shown = notesIn(sec, sub), i = S.sections.indexOf(sec);
  const hasAuthor = all.some(n => n.fm.author || n.fm.authors);
  const sorts = [['newest', 'date'], ['title', 'title']].concat(hasAuthor ? [['author', 'author']] : [], sec !== guideSection() && all.some(n => n.tags.length > 1) ? [['topic', 'topic']] : []);
  sort = sorts.some(s => s[0] === sort) ? sort : 'newest';
  const base = `#/s/${sec.id}`, here = sub ? `${base}/${sub.id}` : base;
  const authorKey = n => surname(str(n.fm.author ?? n.fm.authors).split(/;|\band\b/)[0] || '~');
  let groups;
  if (sort === 'title') {
    const ns = [...shown].sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
    groups = []; for (const n of ns) { const k = /^\p{L}/u.test(n.title) ? n.title.normalize('NFKD')[0].toUpperCase() : '0–9'; const g = groups[groups.length - 1]; if (g && g.key === k) g.ns.push(n); else groups.push({ key: k, label: k, ns: [n] }); }
  } else if (sort === 'author') {
    const ns = [...shown].sort((a, b) => authorKey(a).localeCompare(authorKey(b)) || a.title.localeCompare(b.title));
    groups = []; for (const n of ns) { const k = str(n.fm.author ?? n.fm.authors) || 'Anonymous'; const g = groups[groups.length - 1]; if (g && g.key === k) g.ns.push(n); else groups.push({ key: k, label: k, ns: [n] }); }
  } else if (sort === 'topic') {
    const m = new Map(); for (const n of shown) { const k = topicOf(n); if (!m.has(k)) m.set(k, []); m.get(k).push(n); }
    groups = [...m].map(([k, ns]) => ({ key: k, label: k ? tagLabel(k) : 'Unfiled', href: k ? tagHref(k) : '', ns: ns.sort(newest) })).sort((a, b) => b.ns.length - a.ns.length || a.label.localeCompare(b.label));
  } else {
    const ns = [...shown].sort(newest);
    groups = []; for (const n of ns) { const k = n.created ? fmtMonth(n.created) : 'Undated'; const g = groups[groups.length - 1]; if (g && g.key === k) g.ns.push(n); else groups.push({ key: k, label: k, ns: [n] }); }
  }
  const ids = all.map(n => n).sort(byAddr);
  const span = ids.length > 1 ? `<span class="dot" aria-hidden="true"> · </span>${ids[0].id} to ${ids[ids.length - 1].id}` : '';
  const filter = sec.subsections.length ? `<span class="arr-set"><span class="arr-label">Show</span> <a href="${base}?sort=${sort}"${!sub ? ' aria-current="true"' : ''}>all</a>${sec.subsections.map(u => ` <a href="${base}/${u.id}?sort=${sort}"${sub === u ? ' aria-current="true"' : ''}>${esc(u.name.toLowerCase())}</a>`).join('')}</span>` : '';
  const sorter = `<span class="arr-set"><span class="arr-label">Arrange by</span> ${sorts.map(([k, l]) => `<a href="${here}?sort=${k}"${k === sort ? ' aria-current="true"' : ''}>${l}</a>`).join(' ')}</span>`;
  const compact = sort === 'title' && shown.length > 40;
  const body = shown.length ? groups.map(g => `<section class="cat-group"><h2 class="cat-h">${g.href ? `<a href="${g.href}">${esc(g.label)}</a>` : esc(g.label)}<span class="cat-n">${g.ns.length}</span></h2>${register(g.ns, { summary: !compact, date: sort !== 'newest' })}</section>`).join('')
    : '<p class="empty">Nothing has been entered here yet.</p>';
  return `<div class="page catalogue">
    <header class="page-head"><p class="kicker">Section ${roman(i + 1)}${sub ? ` · ${esc(sub.name)}` : ''}</p><h1>${esc(sub ? sub.name : sec.name)}</h1>${sec.description ? `<p class="lede">${esc(sec.description)}</p>` : ''}
      <p class="page-meta">${plural(shown.length, 'entry', 'entries')}${sub ? '' : span}</p></header>
    <nav class="arrange" aria-label="Arrange the entries">${sorter}${filter}</nav>${body}</div>`;
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

function citation(n) {
  const c = S.config, site = c.title || 'Notes', url = siteURL() + '#/' + n.id, who = str(c.author), date = n.created ? fmtDate(n.created) : '';
  return {
    text: `${who ? who + ', ' : ''}“${n.title},” in ${site}, entry ${n.id}${date ? ` (${date})` : ''}, ${url}.`,
    html: `${who ? esc(who) + ', ' : ''}“${esc(n.title)},” in <em>${esc(site)}</em>, entry ${n.id}${date ? ` (${date})` : ''}, <a href="${esc(url)}">${esc(url)}</a>.`
  };
}
function refsHTML(refs) {
  const out = []; let book = null, cur = [];
  const flush = () => { if (book) out.push(`<span class="ref-book">${esc(book.abbr)}</span> ${cur.join(', ')}`); };
  for (const r of refs) { if (r.book !== book) { flush(); book = r.book; cur = []; } cur.push(`<a href="${refHref(r)}">${refLoc(r)}</a>`); }
  flush();
  return out.join('; ');
}

function viewNote(n) {
  const r = renderNoteBody(n);
  const f = n.fm, sec = n.section;
  const cite = citeHTML(n);
  const url = str(f.url ?? f.link);
  const tags = n.tags.map(t => `<a class="tag" href="${tagHref(t)}">${esc(t)}</a>`).join('<span class="dot" aria-hidden="true"> · </span>');
  // lecture series navigation
  let series = '';
  if (f.course) {
    const run = S.notes.filter(m => m.section === sec && str(m.fm.course) === str(f.course))
      .sort((a, b) => (parseFloat(a.fm.lecture) || 0) - (parseFloat(b.fm.lecture) || 0) || time(a.created) - time(b.created));
    const i = run.indexOf(n);
    if (run.length > 1) series = `<p class="series"><span class="kicker">${esc(str(f.course))}</span> ${i > 0 ? `<a href="#/${run[i - 1].id}" data-id="${run[i - 1].id}">← ${esc(run[i - 1].title)}</a>` : ''}${i < run.length - 1 ? `<a href="#/${run[i + 1].id}" data-id="${run[i + 1].id}">${esc(run[i + 1].title)} →</a>` : ''}</p>`;
  }
  // notes whose headings carry their own numbers ("1. …", "A. …") are not numbered again by the stylesheet
  const ownNum = r.toc.some(t => /^(\d+|[A-Z]|[IVX]+)[.)]\s/.test(t.text));
  const toc = r.toc.filter(t => t.level === 2 && !t.plain).length >= 2
    ? `<details class="toc"${wideScreen() ? ' open' : ''}><summary>Contents</summary><ol>${r.toc.map(t => { const m = t.text.match(NUM_RE); return `<li class="lvl-${t.level}${t.plain ? ' plain' : ''}"><a href="#/${n.id}/${t.anchor}" data-scroll="${t.anchor}">${m ? `<span class="toc-num">${esc(m[1])}</span>` : ''}<span class="toc-text">${esc(m ? t.text.slice(m[0].length) : t.text)}</span></a></li>`; }).join('')}</ol></details>` : '';
  // the margin: address and dates, as written at the head of a notebook entry
  const revised = n.updated && n.created && fmtDate(n.updated) !== fmtDate(n.created) ? n.updated : null;
  const ident = `<div class="m-ident"><p class="m-addr">${n.id}</p><dl class="m-meta">${n.created ? `<div><dt>Entered</dt><dd>${fmtShort(n.created)}</dd></div>` : ''}${revised ? `<div><dt>Revised</dt><dd>${fmtShort(revised)}</dd></div>` : ''}<div><dt>Length</dt><dd>${aboutWords(wordCount(n))}</dd></div></dl></div>`;
  // reading orders this entry belongs to
  const G = guides(), inG = G.byNote.get(n.id) || [];
  const roLine = inG.length ? `<p class="ro-line">Read in ${inG.map(x => `<a href="#/${x.g.id}" data-id="${x.g.id}">${esc(guideName(x.g))}</a> <span class="ro-pos">${x.i + 1}/${x.g.seq.length}</span>`).join('<span class="dot" aria-hidden="true"> · </span>')}</p>` : '';
  const roCard = (g, i, label) => {
    const prev = g.seq[i - 1], next = g.seq[i + 1], grp = g.seq[i] && g.seq[i].group;
    return `<nav class="ro-nav" aria-label="Reading order: ${esc(guideName(g))}"><p class="ro-head"><span class="kicker">${label}</span> <a href="#/${g.id}" data-id="${g.id}">${esc(guideName(g))}</a>${grp ? `<span class="ro-group"> · ${esc(grp)}</span>` : ''}<span class="ro-pos">${i + 1} of ${g.seq.length}</span></p>
      <span class="ro-bar" aria-hidden="true"><span style="width:${((i + 1) / g.seq.length * 100).toFixed(1)}%"></span></span>
      <div class="ro-links">${prev ? `<a class="ro-prev" href="#/${prev.n.id}" data-id="${prev.n.id}"><span class="ro-dir">Previous</span><span class="ro-t">${esc(prev.n.title)}</span></a>` : '<span></span>'}${next ? `<a class="ro-next" href="#/${next.n.id}" data-id="${next.n.id}"><span class="ro-dir">Next</span><span class="ro-t">${esc(next.n.title)}</span></a>` : `<a class="ro-next" href="#/${g.id}" data-id="${g.id}"><span class="ro-dir">Finished</span><span class="ro-t">Back to ${esc(guideName(g))}</span></a>`}</div></nav>`;
  };
  let roNav = inG.map(x => roCard(x.g, x.i, 'Reading order')).join('');
  if (isGuide(n) && n.seq && n.seq.length) roNav = `<nav class="ro-nav ro-begin" aria-label="Begin this reading order"><p class="ro-head"><span class="kicker">Reading order</span> ${plural(n.seq.length, 'entry', 'entries')}${n.heads.length ? ` in ${plural(n.heads.length, 'part', 'parts')}` : ''}</p><div class="ro-links"><span></span><a class="ro-next" href="#/${n.seq[0].n.id}" data-id="${n.seq[0].n.id}"><span class="ro-dir">Begin</span><span class="ro-t">${esc(n.seq[0].n.title)}</span></a></div></nav>` + roNav;
  // the apparatus at the foot of the entry
  const sc = scripture(), refs = sc ? sc.byNote.get(n.id) || [] : [];
  const au = authors(), names = au ? au.byNote.get(n.id) || [] : [];
  const lociHTML = refs.length || names.length ? `<section class="ap ap-loci">${refs.length ? `<div class="ap-part"><h2 class="ap-h">Scripture cited <span class="ap-n">${refs.length}</span></h2><p class="ap-refs">${refsHTML(refs)}</p></div>` : ''}${names.length ? `<div class="ap-part"><h2 class="ap-h">Authors discussed <span class="ap-n">${names.length}</span></h2><p class="ap-refs">${names.map(a => `<a href="#/authors/${a.slug}">${esc(a.name)}</a>`).join(', ')}</p></div>` : ''}</section>` : '';
  const back = (S.back.get(n.id) || []).map(b => ({ ...b, n: S.byId.get(b.from) })).sort((a, b) => byAddr(a.n, b.n));
  // a line that is nothing but the link (a "Related" list) says nothing more than the link itself
  const bare = b => /^\s*(?:[-*+]|\d+[.)])?\s*!?\[\[[^\]\n]+\]\]\s*[.;,]?\s*$/.test(b.line);
  const inProse = back.filter(b => !bare(b)), listed = back.filter(bare);
  const backHTML = `<section class="ap"><h2 class="ap-h">Cited by${back.length ? ` <span class="ap-n">${back.length}</span>` : ''}</h2>${back.length
    ? `${inProse.length ? `<ul class="ap-list">${inProse.map(b => `<li><span class="reg-addr">${b.n.id}</span><div><a class="bl-title" href="#/${b.n.id}" data-id="${b.n.id}">${esc(b.n.title)}</a><p class="bl-ctx">${contextSnippet(b.line, n.id)}</p></div></li>`).join('')}</ul>` : ''}${listed.length ? `${inProse.length ? `<p class="ap-sub">and among the related entries of</p>` : ''}<ul class="ap-list ap-short ap-cols">${listed.map(b => `<li><span class="reg-addr">${b.n.id}</span><div><a class="bl-title" href="#/${b.n.id}" data-id="${b.n.id}">${esc(b.n.title)}</a></div></li>`).join('')}</ul>` : ''}`
    : `<p class="bl-none">No other entry cites this one yet. Cite it as <code>[[${esc(n.id)}]]</code> or <code>[[${esc(n.title)}]]</code>.</p>`}</section>`;
  const outgoing = [...n.links].map(id => S.byId.get(id)).filter(m => m && !back.some(b => b.n === m));
  const outHTML = outgoing.length ? `<section class="ap"><h2 class="ap-h">Cites <span class="ap-n">${outgoing.length}</span></h2><ul class="ap-list ap-short">${outgoing.map(m => `<li><span class="reg-addr">${m.id}</span><div><a href="#/${m.id}" data-id="${m.id}">${esc(m.title)}</a></div></li>`).join('')}</ul></section>` : '';
  const related = n.tags.length ? S.notes.filter(m => m !== n).map(m => ({ m, shared: m.tags.filter(t => n.tags.some(u => u.toLowerCase() === t.toLowerCase())) }))
    .filter(x => x.shared.length).sort((a, b) => b.shared.length - a.shared.length || newest(a.m, b.m)).slice(0, 8) : [];
  const relHTML = related.length ? `<section class="ap"><h2 class="ap-h">Compare</h2><ul class="ap-list ap-short">${related.map(x => `<li><span class="reg-addr">${x.m.id}</span><div><a href="#/${x.m.id}" data-id="${x.m.id}">${esc(x.m.title)}</a> <span class="rel-tags">${x.shared.map(esc).join(', ')}</span></div></li>`).join('')}</ul></section>` : '';
  const ct = citation(n);
  const citeBlock = `<section class="ap ap-cite"><h2 class="ap-h">How to cite this entry</h2><p class="cite-text">${ct.html}</p><button type="button" class="quiet-btn" data-action="copy-cite" data-cite="${esc(ct.text)}">Copy citation</button></section>`;
  return `<div class="note-page"><article class="note${ownNum ? ' own-num' : ''}${isGuide(n) ? ' is-guide' : ''}" data-id="${n.id}" data-section="${esc(sec.id)}">
    ${ident}
    <header class="note-head">
      <p class="note-kicker"><a class="note-taxon" href="#/s/${sec.id}${n.sub ? '/' + n.sub.id : ''}">${esc(secName(n))}</a>${tags ? `<span class="dot" aria-hidden="true"> · </span><span class="note-tags">${tags}</span>` : ''}</p>
      <h1 class="note-title">${esc(n.title)}</h1>
      ${cite ? `<p class="cite">${cite}</p>` : ''}
      ${url ? `<p class="source-link"><a class="external" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(str(f.urlLabel) || 'Source')}</a></p>` : ''}
      ${roLine}${series}
    </header>
    ${toc ? `<aside class="m-side" aria-label="Contents of this entry">${toc}</aside>` : ''}
    <div class="prose note-body">${r.html}</div>
    ${roNav ? `<div class="ro-wrap">${roNav}</div>` : ''}
    <footer class="apparatus">${lociHTML}${backHTML}${outHTML}${relHTML}${citeBlock}</footer>
  </article></div>`;
}

function viewIndices() {
  return `<div class="page indices"><header class="page-head"><p class="kicker">Apparatus</p><h1>Indices</h1><p class="lede">Ways into the notebook other than by section: by passage of Scripture, by author, and by subject.</p></header>
    <ol class="ix-cards">${indexList().map((x, i) => `<li><a href="${x.href}"><span class="ix-num">${roman(i + 1)}</span><span class="ix-title">${esc(x.title)}</span><span class="ix-latin">${esc(x.latin)}</span><span class="ix-desc">${x.desc}</span></a></li>`).join('')}</ol></div>`;
}

function viewScripture() {
  const sc = scripture();
  if (!sc || !sc.total) return viewMissing('No passages of Scripture are cited yet.');
  const T = (window.CommonplaceLoci && window.CommonplaceLoci.testaments) || { ot: 'Old Testament', nt: 'New Testament' };
  const parts = [...new Set(sc.books.map(b => b.testament))].map(t => ({ t, books: sc.books.filter(b => b.testament === t) }));
  const jump = `<nav class="book-jump" aria-label="Books">${parts.map(p => `<div class="bj-row"><span class="bj-t">${esc(T[p.t] || p.t)}</span><span class="bj-books">${p.books.map(b => `<a href="#/scripture/${b.slug}" data-scroll="${b.slug}" title="${esc(b.name)}: ${plural(b.passages.length, 'passage', 'passages')}">${esc(b.abbr)}</a>`).join('')}</span></div>`).join('')}</nav>`;
  const book = b => {
    let lastCh = 0;
    const rows = b.passages.map(p => {
      const chMark = p.ch !== lastCh && p.v1 ? `<span class="ix-mark" data-anchor="${b.slug}-${p.ch}"></span>` : ''; lastCh = p.ch;
      return `<li class="ix-row" data-anchor="${b.slug}-${refPath(p)}">${chMark}<span class="ix-loc">${refLoc(p)}</span><span class="ix-refs">${p.notes.map(xref).join(', ')}</span></li>`;
    }).join('');
    return `<section class="ix-book" data-anchor="${b.slug}"><h3 class="ix-book-h">${esc(b.name)}<span class="ix-count">${plural(b.passages.length, 'passage', 'passages')}</span></h3><ol class="ix-rows">${rows}</ol></section>`;
  };
  return `<div class="page index-page">
    <header class="page-head"><p class="kicker">Index locorum</p><h1>Index of Scripture</h1>
      <p class="lede">Every passage cited in the notebook, in canonical order — the Old Testament in the order of the Septuagint. The figures are entry addresses.</p>
      <p class="page-meta">${plural(sc.total, 'citation', 'citations')}<span class="dot" aria-hidden="true"> · </span>${plural(sc.passages.length, 'passage', 'passages')}<span class="dot" aria-hidden="true"> · </span>${plural(sc.books.length, 'book', 'books')}</p></header>
    ${jump}
    ${parts.map(p => `<section class="ix-part"><h2 class="ix-part-h">${esc(T[p.t] || p.t)}</h2>${p.books.map(book).join('')}</section>`).join('')}
  </div>`;
}

function viewAuthors() {
  const au = authors();
  if (!au || !au.all.length) return viewMissing('No authors are indexed yet.');
  return `<div class="page index-page">
    <header class="page-head"><p class="kicker">Index auctorum</p><h1>Index of Authors</h1>
      <p class="lede">Authors and authorities discussed in the entries, in the order of their dates. The figures are entry addresses.</p>
      <p class="page-meta">${plural(au.all.length, 'author', 'authors')}</p></header>
    ${au.eras.map(e => `<section class="ix-part"><h2 class="ix-part-h">${esc(e.name)}</h2><ol class="ix-rows au-rows">${e.authors.map(a => `<li class="ix-row" data-anchor="${a.slug}"><span class="ix-loc au-name">${esc(a.name)}${a.dates ? ` <span class="au-dates">${esc(a.dates)}</span>` : ''}</span><span class="ix-refs">${a.notes.map(xref).join(', ')}</span></li>`).join('')}</ol></section>`).join('')}
  </div>`;
}

function viewTags() {
  const tags = [...S.tags.values()].sort((a, b) => tagLabel(a.name).localeCompare(tagLabel(b.name)));
  const groups = []; for (const t of tags) { const k = tagLabel(t.name).charAt(0).toUpperCase(); const g = groups[groups.length - 1]; if (g && g.k === k) g.ts.push(t); else groups.push({ k, ts: [t] }); }
  return `<div class="page index-page">
    <header class="page-head"><p class="kicker">Index rerum</p><h1>Index of Subjects</h1><p class="lede">The headings under which entries are filed, with the number of entries under each.</p>
      <p class="page-meta">${plural(tags.length, 'heading', 'headings')}<span class="dot" aria-hidden="true"> · </span>${plural(S.notes.length, 'entry', 'entries')}</p></header>
    ${tags.length ? `<div class="subjects">${groups.map(g => `<section class="subj-letter"><h2 class="subj-h">${esc(g.k)}</h2><ul class="contents">${g.ts.map(t => `<li><a href="${tagHref(t.name)}"><span class="c-name">${esc(tagLabel(t.name))}</span>${leader}<span class="c-n">${t.notes.length}</span></a></li>`).join('')}</ul></section>`).join('')}</div>`
      : '<p class="empty">No subjects yet. Add <code>tags: [one, two]</code> to a note’s front matter.</p>'}</div>`;
}
function viewTag(key) {
  const t = S.tags.get(key);
  if (!t) return viewMissing(`No entries are filed under “${esc(key)}”.`);
  const bySec = S.sections.map(sec => ({ sec, ns: t.notes.filter(n => n.section === sec).sort(newest) })).filter(g => g.ns.length);
  const co = new Map(); for (const n of t.notes) for (const u of n.tags) { const k = u.toLowerCase(); if (k !== key) co.set(k, (co.get(k) || 0) + 1); }
  const seeAlso = [...co].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8).map(([k]) => S.tags.get(k)).filter(Boolean);
  return `<div class="page catalogue">
    <header class="page-head"><p class="kicker"><a href="#/tags">Index of Subjects</a></p><h1>${esc(tagLabel(t.name))}</h1>
      <p class="page-meta">${plural(t.notes.length, 'entry', 'entries')}</p>
      ${seeAlso.length ? `<p class="see-also"><em>See also</em> ${seeAlso.map(s => `<a href="${tagHref(s.name)}">${esc(tagLabel(s.name))}</a>`).join(', ')}</p>` : ''}</header>
    ${bySec.map(g => `<section class="cat-group"><h2 class="cat-h">${esc(g.sec.name)}<span class="cat-n">${g.ns.length}</span></h2>${register(g.ns, { date: false })}</section>`).join('')}</div>`;
}
const viewMissing = msg => `<div class="page missing"><header class="page-head"><p class="kicker">Not found</p><h1>No such leaf</h1><p class="lede">${msg}</p></header><p class="missing-back"><a href="#/">Return to the contents</a> or <button type="button" class="link-btn" data-action="search">search the notebook</button>.</p></div>`;

/* ---------------- routing ---------------- */
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(p => { try { return decodeURIComponent(p); } catch (e) { return p; } });
  const q = new URLSearchParams(query);
  if (!parts.length) return { name: 'index' };
  if (parts[0] === 's') return { name: 'section', sec: parts[1], sub: parts[2], sort: q.get('sort') };
  if (parts[0] === 'tags') return parts[1] ? { name: 'tag', tag: parts[1] } : { name: 'tags' };
  if (parts[0] === 'indices') return { name: 'indices' };
  if (parts[0] === 'scripture') return { name: 'scripture', anchor: parts.slice(1, 3).join('-') };
  if (parts[0] === 'authors') return { name: 'authors', anchor: parts[1] };
  return { name: 'note', id: parts[0].toUpperCase(), anchor: parts[1] };
}
let lastRoute = '';
function route() {
  hidePopover();
  const r = parseHash(), main = $('#main');
  const site = S.config.title || 'Notes';
  let html, title = site, navKey = r.name === 'index' ? 'index' : null;
  if (r.name === 'index') html = viewIndex();
  else if (r.name === 'section') {
    const sec = S.sections.find(s => s.id === r.sec);
    html = sec ? viewSection(sec, r.sub, r.sort) : viewMissing('That section doesn’t exist.');
    if (sec) { title = `${sec.name} — ${site}`; navKey = sec.id; }
  } else if (r.name === 'tags') { html = viewTags(); title = `Index of Subjects — ${site}`; navKey = 'indices'; }
  else if (r.name === 'tag') { html = viewTag(r.tag.toLowerCase()); title = `${tagLabel(r.tag)} — ${site}`; navKey = 'indices'; }
  else if (r.name === 'indices') { html = viewIndices(); title = `Indices — ${site}`; navKey = 'indices'; }
  else if (r.name === 'scripture') { html = viewScripture(); title = `Index of Scripture — ${site}`; navKey = 'indices'; }
  else if (r.name === 'authors') { html = viewAuthors(); title = `Index of Authors — ${site}`; navKey = 'indices'; }
  else {
    const n = S.byId.get(r.id) || S.byId.get(resolveTarget(r.id) || '');
    if (n && n.id !== r.id) { location.replace('#/' + n.id + (r.anchor ? '/' + r.anchor : '')); return; }
    html = n ? viewNote(n) : viewMissing(`There’s no entry with the address ${esc(r.id)}.`);
    if (n) { title = `${n.title} — ${site}`; navKey = n.section.id; }
  }
  main.innerHTML = html;
  document.title = title;
  $$('.nav a[data-nav]').forEach(a => a.dataset.nav === navKey ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  const links = $('.nav-links'), cur = $('.nav a[aria-current="page"]');
  if (links && cur && links.scrollWidth > links.clientWidth) links.scrollLeft += cur.getBoundingClientRect().left - links.getBoundingClientRect().left - (links.clientWidth - cur.offsetWidth) / 2;
  const key = r.name === 'section' ? `s/${r.sec}` : r.name === 'note' ? `n/${r.id}` : location.hash;
  if (key !== lastRoute) window.scrollTo(0, 0);
  lastRoute = key;
  if (r.anchor) scrollToAnchor(r.anchor, r.name !== 'note');
  updateSpy();
  enhance(main);
}
function scrollToAnchor(a, flash) {
  const main = $('#main'); let h = $(`[data-anchor="${CSS.escape(a)}"]`, main);
  // in the indices, "john-17-5" falls back to the first passage in John 17, then to John
  for (let k = a; !h && flash && k.includes('-'); k = k.slice(0, k.lastIndexOf('-'))) h = $(`[data-anchor="${CSS.escape(k)}"]`, main) || $(`[data-anchor^="${CSS.escape(k)}-"]`, main);
  if (!h) return;
  h.scrollIntoView({ block: 'start' });
  if (flash) { const row = h.closest('.ix-row, .ix-book') || h; row.classList.add('is-flash'); setTimeout(() => row.classList.remove('is-flash'), 1600); }
}
// highlight the section being read in the margin's contents
let spyFrame = 0;
function updateSpy() {
  const toc = $('#main .toc'); if (!toc) return;
  const heads = $$('#main .note-body [data-anchor]'), line = 140;
  let cur = null; for (const h of heads) { if (h.getBoundingClientRect().top - line <= 0) cur = h; else break; }
  $$('a[data-scroll]', toc).forEach(a => a.classList.toggle('is-here', !!cur && a.dataset.scroll === cur.dataset.anchor));
}

/* ---------------- shell ---------------- */
const ICON = {
  search: '<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12.6 12.6 17 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  auto: '<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 3.5a6.5 6.5 0 0 1 0 13z" fill="currentColor"/></svg>',
  light: '<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" stroke-width="1.5"/><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M10 1.8v2.1M10 16.1v2.1M1.8 10h2.1M16.1 10h2.1M4.2 4.2l1.5 1.5M14.3 14.3l1.5 1.5M4.2 15.8l1.5-1.5M14.3 5.7l1.5-1.5"/></g></svg>',
  dark: '<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><path d="M15.8 12.6A6.6 6.6 0 0 1 7.4 4.2a6.6 6.6 0 1 0 8.4 8.4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'
};
function buildShell() {
  const c = S.config, latest = [...S.notes].sort(newest)[0];
  document.body.innerHTML = `<a class="skip" href="#main">Skip to content</a>
  <header class="masthead"><a class="brand" href="#/" aria-label="${esc(c.title || 'Notes')}: contents">${initialCap(c.title || 'Notes')}</a>
    <nav class="nav" aria-label="Main"><span class="nav-links"><a href="#/" data-nav="index">Contents</a>${S.sections.map(s => `<a href="#/s/${s.id}" data-nav="${s.id}">${esc(s.shortName || s.name)}</a>`).join('')}
    <a href="#/indices" data-nav="indices">Indices</a></span>
    <button type="button" class="nav-btn search-btn" data-action="search" aria-label="Search the notebook">${ICON.search}<span class="nav-btn-label">Search</span><kbd>/</kbd></button>
    <button type="button" class="nav-btn theme-btn" data-action="theme"></button></nav></header>
  <main id="main" tabindex="-1"></main>
  <footer class="colophon"><div class="colophon-inner">
    <p class="col-orn" aria-hidden="true">⁂</p>
    <p class="col-title">${initialCap(c.title || 'Notes')}</p>
    <p>${c.subtitle ? `${esc(c.subtitle)}. ` : ''}${plural(S.notes.length, 'entry', 'entries')}${latest && latest.created ? `, the latest entered ${fmtDate(latest.created)}` : ''}.</p>
    ${latest ? `<p>Every entry keeps a permanent address, such as <span class="addr">${latest.id}</span>, by which it may be cited.</p>` : ''}
    <p class="col-nav"><a href="#/">Contents</a><a href="#/indices">Indices</a><a href="#/tags">Subjects</a><button type="button" class="link-btn" data-action="search">Search</button></p>
    <p class="col-type">Set in EB Garamond.</p>
  </div></footer>
  <div class="popover" id="popover" hidden></div>`;
  updateThemeButton();
}
const THEMES = ['auto', 'light', 'dark'];
function currentTheme() { try { return localStorage.getItem('theme') || 'auto'; } catch (e) { return 'auto'; } }
function applyTheme(t) { if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; }
function updateThemeButton() {
  const b = $('.theme-btn'); if (!b) return;
  const t = currentTheme(), name = { auto: 'Automatic (follows your device)', light: 'Day', dark: 'Night' }[t];
  b.innerHTML = ICON[t]; b.setAttribute('aria-label', `Colour scheme: ${name}. Change`); b.title = `Colour scheme: ${name}`;
}

/* ---------------- search ---------------- */
function plainText(n) {
  if (!n._plain) n._plain = n.body.replace(/!?\[\[([^\]]+)\]\]/g, (_, i) => { const { target, label } = splitWiki(i); return label || target; })
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[#*_>`=~|$\\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return n._plain;
}
function search(q) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [...S.notes].sort((a, b) => time(b.updated) - time(a.updated) || newest(a, b)).slice(0, 8).map(n => ({ n, snip: '' }));
  const res = [];
  for (const n of S.notes) {
    const title = n.title.toLowerCase(), meta = [n.id, n.tags.join(' '), sourceLine(n), n.aliases.join(' ')].join(' ').toLowerCase(), body = plainText(n), low = body.toLowerCase();
    let score = 0, ok = true;
    for (const t of terms) { if (title.includes(t)) score += 10; else if (meta.includes(t)) score += 5; else if (low.includes(t)) score += 1; else { ok = false; break; } }
    if (!ok) continue;
    if (title.startsWith(q.toLowerCase())) score += 20;
    const at = low.indexOf(terms[0]);
    let snip = at < 0 ? (n.summary || body.slice(0, 140)) : (at > 60 ? '…' : '') + body.slice(Math.max(0, at - 60), at + 110) + '…';
    snip = esc(snip); for (const t of terms) snip = snip.replace(new RegExp(reEsc(esc(t)), 'gi'), m => `<mark>${m}</mark>`);
    res.push({ n, snip, score });
  }
  return res.sort((a, b) => b.score - a.score).slice(0, 20);
}
// "john 17", "gen 3:15": offer the Index of Scripture first
function scriptureHit(q) {
  const sc = scripture(); if (!sc || !/\d/.test(q)) return null;
  const r = findRefs(q.trim(), true)[0]; if (!r) return null;
  const hits = sc.passages.filter(p => p.book.id === r.book.id && (p.ch === r.ch || (p.ch2 && p.ch <= r.ch && r.ch <= p.ch2)) && (!r.v1 || !p.v1 || (p.v1 <= r.v1 && r.v1 <= (p.v2 || p.v1))));
  const ns = [...new Set(hits.flatMap(p => p.notes))];
  return { href: `#/scripture/${r.book.slug}/${refPath(r)}`, label: `${r.book.name} ${refLoc(r)}`, sub: ns.length ? `Cited in ${plural(ns.length, 'entry', 'entries')}` : 'Not cited yet; open the Index of Scripture' };
}
function openSearch() {
  if ($('.overlay')) return;
  const prev = document.activeElement;
  const ov = document.createElement('div'); ov.className = 'overlay';
  ov.innerHTML = `<div class="dialog search-dialog" role="dialog" aria-modal="true" aria-label="Search the notebook">
    <div class="search-head">${ICON.search}<input class="search-input" type="search" placeholder="Search titles, subjects, sources, text — or a passage, e.g. John 17" aria-label="Search" autocomplete="off" spellcheck="false"><kbd>esc</kbd></div>
    <p class="results-label">Recently revised</p><ul class="results" role="listbox"></ul></div>`;
  document.body.append(ov);
  const input = $('input', ov), ul = $('.results', ov), label = $('.results-label', ov);
  let items = [], sel = 0;
  const draw = () => {
    const q = input.value.trim(), hit = scriptureHit(q);
    items = (hit ? [{ hit }] : []).concat(search(q)); sel = 0;
    const k = items.length - (hit ? 1 : 0);
    label.textContent = q ? plural(k, 'entry', 'entries') : 'Recently revised';
    ul.innerHTML = items.length ? items.map((r, i) => r.hit
      ? `<li role="option" data-i="${i}" aria-selected="${i === sel}" class="r-scripture"><div class="r-title"><span class="r-addr">Index</span>${esc(r.hit.label)}</div><p class="r-snip">${esc(r.hit.sub)}</p></li>`
      : `<li role="option" data-i="${i}" aria-selected="${i === sel}"><div class="r-title"><span class="r-addr">${r.n.id}</span><span class="r-t">${esc(r.n.title)}</span><span class="r-sec">${esc(secName(r.n))}</span></div>${r.snip ? `<p class="r-snip">${r.snip}</p>` : ''}</li>`).join('')
      : '<li class="r-empty">Nothing matches. Try fewer words.</li>';
  };
  const mark = () => $$('li[data-i]', ul).forEach((li, i) => { li.setAttribute('aria-selected', i === sel); if (i === sel) li.scrollIntoView({ block: 'nearest' }); });
  const close = () => { ov.remove(); if (prev && prev.focus) prev.focus(); };
  const open = i => { const r = items[i]; if (!r) return; close(); location.hash = r.hit ? r.hit.href : '#/' + r.n.id; };
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

/* ---------------- hover previews: an index card ---------------- */
let popTimer = null, popHide = null;
function showPopover(a) {
  const n = S.byId.get(a.dataset.id); if (!n) return;
  const pop = $('#popover'); const r = renderNoteBody(n), src = sourceLine(n);
  pop.innerHTML = `<div class="card-head"><span class="card-sec">${esc(secName(n))}</span><span class="card-addr">${n.id}</span></div><p class="card-title">${esc(n.title)}</p>${src ? `<p class="card-meta">${esc(src)}</p>` : ''}<div class="prose card-body">${n.summary ? `<p class="card-sum">${esc(n.summary)}</p>` : ''}${r.html}</div>`;
  pop.hidden = false;
  const b = a.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  let top = b.bottom + 8; if (top + h > innerHeight - 8 && b.top - h - 8 > 8) top = b.top - h - 8;
  pop.style.top = Math.max(8, top) + 'px'; pop.style.left = Math.min(Math.max(8, b.left), innerWidth - w - 8) + 'px';
  enhance(pop);
}
function hidePopover() { clearTimeout(popTimer); const p = $('#popover'); if (p) p.hidden = true; }

/* ---------------- events ---------------- */
const POP_TARGET = '#main a[data-id]';
function bindEvents() {
  document.addEventListener('click', e => {
    const act = e.target.closest('[data-action]');
    if (act) {
      if (act.dataset.action === 'search') openSearch();
      if (act.dataset.action === 'theme') { const t = THEMES[(THEMES.indexOf(currentTheme()) + 1) % 3]; try { localStorage.setItem('theme', t); } catch (x) {} applyTheme(t); updateThemeButton(); }
      if (act.dataset.action === 'copy-cite') {
        const done = ok => { const was = act.textContent; act.textContent = ok ? 'Copied' : 'Select the text above to copy it'; setTimeout(() => { act.textContent = was; }, 1800); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(act.dataset.cite).then(() => done(true), () => done(false)); else done(false);
      }
      return;
    }
    const miss = e.target.closest('a[data-missing]');
    if (miss) { e.preventDefault(); return; }
    const sc = e.target.closest('[data-scroll]');
    if (sc) { e.preventDefault(); scrollToAnchor(sc.dataset.scroll); const href = sc.getAttribute('href'); if (href && href.startsWith('#/')) history.replaceState(null, '', href); return; }
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
      if (e.target.closest('#popover')) { clearTimeout(popHide); return; }
      const a = e.target.closest(POP_TARGET);
      if (!a) return;
      clearTimeout(popTimer); clearTimeout(popHide); popTimer = setTimeout(() => showPopover(a), 350);
    });
    document.addEventListener('pointerout', e => {
      if (e.target.closest(`${POP_TARGET}, #popover`)) { clearTimeout(popTimer); popHide = setTimeout(hidePopover, 250); }
    });
  }
  addEventListener('scroll', () => { hidePopover(); if (!spyFrame) spyFrame = requestAnimationFrame(() => { spyFrame = 0; updateSpy(); }); }, { passive: true });
}

/* ---------------- boot ---------------- */
function fail(msg) {
  document.body.innerHTML = `<main class="page missing"><header class="page-head"><p class="kicker">The notebook</p><h1>The notes didn’t load</h1><p class="lede">${msg}</p></header></main>`;
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

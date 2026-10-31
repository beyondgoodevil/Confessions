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
  mathjax: 'https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js',
  chess: 'assets/chess-viewer.js?v=8',
  plot: 'assets/plot-viewer.js?v=2',
  abcjs: 'assets/vendor/abcjs-basic-min.js?v=6.4.4',
  music: 'assets/music-viewer.js?v=3',
  pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
};
const PDF_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const libReady = n => n === 'marked' ? !!window.marked : n === 'yaml' ? !!window.jsyaml : n === 'purify' ? !!window.DOMPurify
  : n === 'hljs' ? !!window.hljs : n === 'mathjax' ? !!(window.MathJax && window.MathJax.typesetPromise) : n === 'chess' ? !!window.ChessViewer : n === 'plot' ? !!window.PlotViewer
  : n === 'abcjs' ? !!window.ABCJS : n === 'music' ? !!window.MusicViewer : n === 'pdfjs' ? !!window.pdfjsLib : false;
// Shorthand available in every note's maths (physics-package style); plain LaTeX still works.
const TEX_MACROS = {
  R: '\\mathbb{R}', N: '\\mathbb{N}', Z: '\\mathbb{Z}', Q: '\\mathbb{Q}', C: '\\mathbb{C}',
  dd: '\\mathop{}\\!\\mathrm{d}',                                  // \int f(x) \dd x
  dv: ['\\frac{\\mathrm{d}^{#1}#2}{\\mathrm{d}#3^{#1}}', 3, ''],     // \dv{x}{t}, \dv[2]{x}{t}
  pdv: ['\\frac{\\partial^{#1}#2}{\\partial #3^{#1}}', 3, ''],      // \pdv{f}{x}, \pdv[2]{f}{x}
  abs: ['\\left\\lvert #1 \\right\\rvert', 1], norm: ['\\left\\lVert #1 \\right\\rVert', 1],
  set: ['\\left\\{ #1 \\right\\}', 1], floor: ['\\left\\lfloor #1 \\right\\rfloor', 1], ceil: ['\\left\\lceil #1 \\right\\rceil', 1],
  vb: ['\\mathbf{#1}', 1], vu: ['\\hat{\\mathbf{#1}}', 1],         // vectors and unit vectors
  unit: ['\\,\\mathrm{#1}', 1],                                    // 9.8\unit{m/s^2}
  qty: ['#1\\,\\mathrm{#2}', 2],                                    // \qty{9.8}{m/s^2}
  evalat: ['\\left. #1 \\right\\rvert_{#2}', 2]                     // \evalat{x^2}{x=3}
};
const libWait = {};
function loadLib(name) {
  if (libReady(name)) return Promise.resolve(true);
  if (libWait[name]) return libWait[name];
  if (name === 'mathjax' && !window.MathJax) {
    window.MathJax = { tex: { inlineMath: [['\\(', '\\)']], displayMath: [['\\[', '\\]']], tags: 'ams', macros: TEX_MACROS },
      output: { font: 'mathjax-stix2', displayOverflow: 'scroll' },
      // speech/braille enrichment is slow on formula-heavy pages; assistive MathML still serves screen readers
      options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'], enableEnrichment: false, enableSpeech: false, enableBraille: false, enableExplorer: false, enableAssistiveMml: true,
        menuOptions: { settings: { enrich: false, speech: false, braille: false, assistiveMml: true } } },
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
  S.cache = new Map(); S.graph = null;
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
  // config.browse: how tags become topics for browsing (see viewSection and viewTags)
  const b = cfg.browse || {}, low = v => list(v).map(t => t.toLowerCase());
  S.browse = {
    fields: new Set(low(b.fields)),          // broad tags (theology, philosophy…): too wide to browse by
    secondary: new Set(low(b.secondary)),    // tags such as "scripture" that say what kind of note it is; it's filed under its next topic
    shelves: (Array.isArray(b.shelves) ? b.shelves : []).map(s => ({ name: str(s && s.name), tags: low(s && s.tags) })).filter(s => s.name && s.tags.length),
    labels: b.labels && typeof b.labels === 'object' ? b.labels : {},
    minNotes: +b.minNotes || 20              // sections with at least this many notes get the topic list and the filter
  };
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
    // notes on a chapter name the book in `source`; cite that rather than presenting the note's title as a book
    if (f.source && !y && !pub) return `${a ? esc(a) + '. ' : ''}${inlineMd(str(f.source))}`.replace(/([^.])$/, '$1.');
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
  proof: 'Proof', example: 'Example', remark: 'Remark', exercise: 'Exercise', conjecture: 'Conjecture',
  solution: 'Solution', answer: 'Answer' };
const UNNUMBERED = new Set(['proof', 'solution', 'answer']);
const PROOFLIKE = new Set(['proof', 'solution', 'answer']);
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
    const type = m[1].toLowerCase(), fold = m[2], title = m[3].trim();
    p.innerHTML = p.innerHTML.slice(m[0].length).replace(/^\s+/, '');
    if (!p.textContent.trim() && !p.querySelector('img,.math-i,.math-d')) p.remove();
    const box = document.createElement('div'), body = document.createElement('div');
    body.className = 'callout-body'; while (bq.firstChild) body.appendChild(bq.firstChild);
    let head = null;
    if (FORMAL[type]) {
      box.className = `callout callout-${type} is-formal${UNNUMBERED.has(type) ? '' : ' is-numbered'}`;
      const own = title.replace(/\s*[.:]\s*$/, ''); // the head adds its own full stop
      const html = PROOFLIKE.has(type)
        ? `<span class="thm-head">${own ? esc(own.replace(/<[^>]+>/g, '')) : FORMAL[type]}.</span> `
        : `<span class="thm-head"><span class="thm-label">${FORMAL[type]}</span><span class="thm-num"></span>${own ? ` <span class="thm-name">(${own})</span>` : ''}.</span> `;
      let first = body.firstElementChild;
      if (!first || first.tagName !== 'P') { first = document.createElement('p'); body.prepend(first); }
      first.insertAdjacentHTML('afterbegin', html); head = first.querySelector('.thm-head');
      if (type === 'proof') { let last = body.lastElementChild; if (!last || last.tagName !== 'P') { last = document.createElement('p'); body.append(last); } last.insertAdjacentHTML('beforeend', '<span class="qed" aria-hidden="true">∎</span>'); }
      box.append(body);
    } else {
      box.className = `callout callout-${type}`;
      box.innerHTML = `<div class="callout-title">${title || CALLOUT[type] || humanize(type)}</div>`;
      head = box.firstElementChild;
      box.append(body);
    }
    if (fold) { // > [!proof]- starts folded, > [!proof]+ starts open
      const det = document.createElement('details'), sum = document.createElement('summary');
      det.className = box.className + ' is-fold'; det.open = fold === '+';
      sum.append(head); det.append(sum, body); bq.replaceWith(det);
      const f0 = body.firstElementChild; // the head moved into the summary may leave an empty paragraph
      if (f0 && f0.tagName === 'P' && !f0.textContent.trim() && !f0.querySelector('img,.math-i,.math-d,.qed')) f0.remove();
      continue;
    }
    bq.replaceWith(box);
  }
  // headings
  const seen = new Set(); ctx.toc = [];
  for (const h of $$('h2,h3,h4', root)) {
    let a = slug(h.textContent) || 'section', k = a, i = 2; while (seen.has(k)) k = `${a}-${i++}`; seen.add(k);
    h.dataset.anchor = k;
    const plain = /^related$/i.test(h.textContent.trim()); if (plain) h.classList.add('h-plain');
    if (h.tagName !== 'H4') ctx.toc.push({ level: +h.tagName[1], anchor: k, text: h.textContent, plain });
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
  // ```plot blocks first: their $labels$ are typeset along with the rest of the note's maths (assets/plot-viewer.js)
  if (el.querySelector('pre > code.language-plot') && await loadLib('plot')) { try { window.PlotViewer.mount(el); } catch (e) { console.warn(e); } }
  // ```abc blocks become scores that play (assets/music-viewer.js, with abcjs); their captions can hold maths too
  if (el.querySelector('pre > code.language-abc') && await loadLib('abcjs') && await loadLib('music')) { try { window.MusicViewer.mount(el); } catch (e) { console.warn(e); } }
  await Promise.all([enhanceMath(el), enhanceBlocks(el)]);
}
async function enhanceBlocks(el) {
  // ```chess blocks become interactive boards (assets/chess-viewer.js)
  if (el.querySelector('pre > code.language-chess') && await loadLib('chess')) { try { window.ChessViewer.mount(el); } catch (e) { console.warn(e); } }
  if (el.querySelector('pre > code[class*="language-"]') && await loadLib('hljs')) {
    for (const code of $$('pre > code[class*="language-"]', el)) {
      const l = (code.className.match(/language-([\w+#-]+)/) || [])[1];
      if (l && window.hljs.getLanguage(l) && !code.dataset.hl) { code.innerHTML = window.hljs.highlight(code.textContent, { language: l, ignoreIllegals: true }).value; code.dataset.hl = '1'; }
    }
  }
}
async function enhanceMath(el) {
  if (!el.querySelector('.math-i,.math-d')) return;
  el.classList.add('math-pending'); // hides raw \( … \) until MathJax has typeset it
  const failsafe = setTimeout(() => el.classList.remove('math-pending'), 6000);
  try {
    if (await loadLib('mathjax')) {
      if (window.MathJax.texReset) window.MathJax.texReset(); // equation numbers and \label names start afresh for each note
      await window.MathJax.typesetPromise([el]);
      markWideMath(el);
    }
  } catch (e) { console.warn(e); }
  clearTimeout(failsafe); el.classList.remove('math-pending');
}
// Display maths wider than the column scrolls sideways; fade the edge that has more to see.
function markWideMath(el) {
  for (const box of $$('.math-d', el)) {
    const sc = [box, ...$$('mjx-container', box)].find(x => x.scrollWidth > x.clientWidth + 2);
    if (!sc) continue;
    const upd = () => { const end = sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 2, start = sc.scrollLeft <= 2;
      sc.classList.toggle('fade-r', !end); sc.classList.toggle('fade-l', !start); };
    sc.classList.add('is-wide'); upd(); sc.addEventListener('scroll', upd, { passive: true });
  }
}

/* ---------------- templates ---------------- */
const noteLink = n => `<a href="#/${n.id}" data-id="${n.id}">${esc(n.title)}</a>`;
function entryLi(n, withSummary) {
  const src = sourceLine(n);
  return `<li data-id="${n.id}"><span class="fr-addr">${n.id}</span><div>${noteLink(n)}${src ? `<span class="fr-src">${esc(src)}</span>` : ''}${withSummary && n.summary ? `<span class="fr-sum">${esc(n.summary)}</span>` : ''}</div></li>`;
}
// newest first; notes published on the same day fall back to their address, which is handed out in publishing order
const idNum = n => +String(n.id).split('-')[1] || 0;
const newest = (a, b) => time(b.created) - time(a.created) || idNum(b) - idNum(a) || a.title.localeCompare(b.title);
const notesIn = (sec, sub) => S.notes.filter(n => n.section === sec && (!sub || n.sub === sub));
const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;
const sectionNoun = sec => sec.noun || sec.name.toLowerCase();

function viewIndex() {
  const c = S.config, per = c.indexPreviewCount || 4, perSub = c.indexPreviewCountPerSubsection || 3;
  const shown = S.sections.filter(sec => sec.index !== false);   // a section can opt out of the index page with "index": false
  const secs = shown.map(sec => {
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
  // notes edited after the day they were written, latest edit first
  const edited = S.notes.filter(n => n.updated && n.created && fmtDate(n.updated) !== fmtDate(n.created) && time(n.updated) > time(n.created))
    .sort((a, b) => time(b.updated) - time(a.updated) || newest(a, b)).slice(0, c.indexUpdatedCount || 6);
  const updatedSec = edited.length ? `<section class="fr-sec fr-updated"><h2 class="fr-sec-title">Recently updated</h2><p class="fr-sec-desc">Older notes that have been revised.</p>
    <ol class="fr-list">${edited.map(n => entryLi(n).replace('</li>', `<time datetime="${n.updated.toISOString().slice(0, 10)}">${fmtDate(n.updated)}</time></li>`)).join('')}</ol></section>` : '';
  return `<div class="home home-forester">
    <header class="fr-head"><h1 class="home-title">${esc(c.title || 'Notes')}</h1>${c.subtitle ? `<p class="home-sub">${esc(c.subtitle)}</p>` : ''}
    ${c.author ? `<p class="fr-author">${esc(c.author)}</p>` : ''}</header>
    ${intro}<figure class="home-graph"><div class="graph-box">${graphSVG(null, 'graph graph-mini')}</div>
    <figcaption><span class="g-legend">${graphLegend()}</span>
    <nav class="explore" aria-label="Explore">${plural(S.notes.length, 'note', 'notes')} · <a href="#/graph">Open the full graph</a> · ${S.notes.some(n => n.fm.series) ? '<a href="#/series">Series</a> · ' : ''}<a href="#/tags">Tags</a> · <button type="button" class="linklike" data-action="random">Random note</button></nav></figcaption></figure>${secs}${updatedSec}</div>`;
}

/* ---------------- browsing: topics, people and the section filter ---------------- */
const tagLabel = t => S.browse.labels[t] || humanize(t);
const topicsOf = n => [...new Set(n.tags.map(t => t.toLowerCase()))].filter(t => !S.browse.fields.has(t));
// the one topic a note is filed under when a section is arranged by topic
const mainTopic = n => { const ts = topicsOf(n); return ts.find(t => !S.browse.secondary.has(t)) || ts[0] || ''; };
// config.browse.shelves, keeping the topics these notes use; anything on no shelf goes on a last one
function shelvesFor(ns) {
  const count = new Map();
  for (const n of ns) for (const t of topicsOf(n)) count.set(t, (count.get(t) || 0) + 1);
  const placed = new Set(S.browse.shelves.flatMap(s => s.tags));
  const out = S.browse.shelves.map(s => ({ name: s.name, topics: s.tags.filter(t => count.has(t)) }));
  const rest = [...count.keys()].filter(t => !placed.has(t)).sort((a, b) => count.get(b) - count.get(a) || a.localeCompare(b));
  if (rest.length) out.push({ name: S.browse.shelves.length ? 'Other topics' : 'Topics', topics: rest });
  return { shelves: out.filter(s => s.topics.length), count };
}
// people and series a section can be arranged by, besides topic, newest and title
const splitNames = v => (Array.isArray(v) ? v.map(str) : str(v).split(/\s*;\s*|\s+and\s+|\s*&\s*/)).map(s => s.trim()).filter(Boolean);
const GROUPINGS = {
  author: { kinds: ['book'], of: n => splitNames(n.fm.author ?? n.fm.authors) },
  course: { kinds: ['lecture'], of: n => splitNames(n.fm.course) },
  show: { kinds: ['podcast'], of: n => splitNames(n.fm.show ?? n.fm.podcast) },
  channel: { kinds: ['video'], of: n => splitNames(n.fm.channel ?? n.fm.creator) }
};
// "Eric D. Perl" under P, "St. Athanasius of Alexandria" under A
const sortName = s => { const t = s.replace(/^(st\.?|saint)\s+/i, '').split(/\s+of\s+/i)[0].trim(); return (t.split(/\s+/).pop() + ' ' + t).toLowerCase(); };

function viewSection(sec, subId, opts = {}) {
  const sub = sec.subsections.find(u => u.id === subId) || null;
  const all = notesIn(sec), inSub = notesIn(sec, sub);
  const browsing = all.length >= S.browse.minNotes;
  const { shelves, count } = shelvesFor(inSub);
  const topic = browsing && count.has(String(opts.topic || '').toLowerCase()) ? opts.topic.toLowerCase() : '';
  const groupings = Object.keys(GROUPINGS).filter(k => inSub.some(n => GROUPINGS[k].kinds.includes(kindOf(n)) && GROUPINGS[k].of(n).length));
  const sorts = ['newest', 'title', ...groupings, ...(browsing && !topic && count.size > 1 ? ['topic'] : [])];
  const sort = sorts.includes(opts.sort) ? opts.sort : sorts.includes(sec.arrange) ? sec.arrange : 'newest';
  const ns = topic ? inSub.filter(n => topicsOf(n).includes(topic)) : inSub;
  const base = `#/s/${sec.id}${sub ? '/' + sub.id : ''}`;
  // links carry their own settings in data-browse; initBrowse adds the filter words to them
  const link = (params, text, current) => `<a href="${base}${params ? '?' + params : ''}" data-browse="${esc(params)}"${current ? ' aria-current="true"' : ''}>${text}</a>`;
  const qs = o => new URLSearchParams(Object.entries(o).filter(([, v]) => v)).toString();
  const keepSort = opts.sort && sorts.includes(opts.sort) && opts.sort !== 'topic' ? opts.sort : '';

  const filterBox = browsing ? `<input class="sec-filter" type="search" placeholder="Filter by title, topic or summary" aria-label="Filter these notes" autocomplete="off" spellcheck="false">` : '';
  // open on wider screens; on a phone it starts folded unless a topic is chosen, so the notes aren't pushed a screen down
  const open = topic || !matchMedia('(max-width: 560px)').matches;
  const topicList = browsing && count.size > 1 ? `<details class="topics"${open ? ' open' : ''}><summary>Browse by topic</summary><nav class="topic-rows" aria-label="Topics">${shelves.map(s => `<div class="topic-row"><span class="topic-shelf">${esc(s.name)}</span><span class="topic-links">${s.topics.map(t =>
    link(qs({ topic: t === topic ? '' : t, sort: keepSort }), `${esc(tagLabel(t))}<span class="count">${count.get(t)}</span>`, t === topic)).join('')}</span></div>`).join('')}</nav></details>` : '';
  const medium = sec.subsections.length ? `<span class="medium-filter">Show <a href="#/s/${sec.id}?sort=${sort}"${!sub ? ' aria-current="true"' : ''}>all ${all.length}</a>${sec.subsections.map(u => ` <a href="#/s/${sec.id}/${u.id}?sort=${sort}"${sub === u ? ' aria-current="true"' : ''}>${esc(u.name.toLowerCase())} ${notesIn(sec, u).length}</a>`).join('')}</span>` : '';
  const summary = topic ? `${plural(ns.length, 'note', 'notes')} on <strong>${esc(tagLabel(topic))}</strong> · ${link(qs({ sort: keepSort }), 'all topics')}` : medium || plural(ns.length, 'note', 'notes');
  const sorter = `<span class="sort">Sort by ${sorts.map(k => link(qs({ topic, sort: k }), k, k === sort)).join(' ')}</span>`;

  const entries = xs => `<ol class="fr-list fr-list-full">${xs.map(n => entryLi(n, true)).join('')}</ol>`;
  let body;
  if (sort === 'topic') {
    const by = new Map();
    for (const n of [...ns].sort(newest)) { const t = mainTopic(n); if (!by.has(t)) by.set(t, []); by.get(t).push(n); }
    const shelf = (name, ts) => {
      const groups = ts.filter(t => by.has(t)).map(t => {
        const xs = by.get(t), more = count.get(t) > xs.length ? link(qs({ topic: t }), `All ${count.get(t)} notes on ${esc(tagLabel(t).toLowerCase())}`) : '';
        return `<section class="tgroup" data-group><h3 class="topic-head">${esc(tagLabel(t))}<span class="count">${xs.length}</span></h3>${entries(xs)}${more ? `<p class="topic-more">${more}</p>` : ''}</section>`;
      }).join('');
      return groups ? `<section class="shelf" data-group><h2 class="shelf-head">${esc(name)}</h2>${groups}</section>` : '';
    };
    body = shelves.map(s => shelf(s.name, s.topics)).join('') + (by.has('') ? `<section class="shelf" data-group><h2 class="shelf-head">No topic</h2><section class="tgroup" data-group>${entries(by.get(''))}</section></section>` : '');
  } else if (GROUPINGS[sort]) {
    const by = new Map();
    for (const n of ns) for (const name of GROUPINGS[sort].of(n)) { if (!by.has(name)) by.set(name, []); by.get(name).push(n); }
    const key = sort === 'author' ? sortName : x => x.toLowerCase();
    const names = [...by.keys()].sort((a, b) => key(a).localeCompare(key(b)));
    const none = ns.filter(n => !GROUPINGS[sort].of(n).length);
    body = names.map(name => `<section class="tgroup" data-group><h2 class="yr">${esc(name)}<span class="count">${by.get(name).length}</span></h2>${entries(by.get(name).sort((a, b) => a.title.localeCompare(b.title)))}</section>`).join('')
      + (none.length ? `<section class="tgroup" data-group><h2 class="yr">No ${esc(sort)} given</h2>${entries(none.sort(newest))}</section>` : '');
  } else {
    const cmp = sort === 'title' ? (a, b) => a.title.localeCompare(b.title) : newest;
    const groups = sec.subsections.length && !topic ? (sub ? [sub] : sec.subsections) : [null];
    body = groups.map(u => {
      const xs = (u ? ns.filter(n => n.sub === u) : ns).sort(cmp);
      return `<section data-group>${u ? `<h2 class="yr">${esc(u.name)}</h2>` : ''}${xs.length ? entries(xs) : '<p class="fr-empty">No notes here yet.</p>'}</section>`;
    }).join('');
  }
  return `<div class="page page-section" data-base="${esc(base)}"><header class="fr-head"><h1>${esc(sec.name)}</h1>${sec.description ? `<p class="home-sub">${esc(sec.description)}</p>` : ''}</header>
    ${filterBox || topicList ? `<div class="browse">${filterBox}${topicList}</div>` : ''}
    <div class="sec-tools"><span class="sec-count">${summary}</span>${sorter}</div>${body}
    <p class="fr-empty sec-nomatch" hidden>No notes match. Try fewer or shorter words.</p></div>`;
}
// the filter box: hides entries (and emptied groups) that don't contain every word typed; Enter opens the first one left
const hay = n => n._hay || (n._hay = fold([n.id, n.title, n.summary, sourceLine(n), ...n.tags, ...n.tags.map(t => tagLabel(t.toLowerCase())), ...n.aliases].join(' ')));
function initBrowse(main, q) {
  const page = $('[data-base]', main), input = page && $('.sec-filter', page);
  if (!input) return;
  const count = $('.sec-count', page), plainCount = count.innerHTML, items = $$('li[data-id]', page), groups = $$('[data-group]', page).reverse();
  let urlTimer = 0;
  const apply = () => {
    const words = fold(input.value).split(/\s+/).filter(Boolean), shown = new Set();
    for (const li of items) { const ok = words.every(w => hay(S.byId.get(li.dataset.id)).includes(w)); li.hidden = !ok; if (ok) shown.add(li.dataset.id); }
    for (const g of groups) g.hidden = !!words.length && !$('li[data-id]:not([hidden])', g);
    $$('.fr-list', page).forEach(l => l.classList.toggle('is-filtered', !!words.length));
    const total = new Set(items.map(li => li.dataset.id)).size;
    if (words.length) count.textContent = `${shown.size} of ${plural(total, 'note', 'notes')}`; else count.innerHTML = plainCount;
    $('.sec-nomatch', page).hidden = !words.length || shown.size > 0;
    // remember the words in the address (so Back and reload keep them) and in the topic and sort links
    const v = input.value.trim();
    for (const a of $$('a[data-browse]', page)) { const p = new URLSearchParams(a.dataset.browse); if (v) p.set('q', v); a.setAttribute('href', page.dataset.base + (p.toString() ? '?' + p : '')); }
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => { if (!page.isConnected) return; const p = new URLSearchParams(location.hash.split('?')[1] || ''); if (v) p.set('q', v); else p.delete('q'); try { history.replaceState(history.state, '', page.dataset.base + (p.toString() ? '?' + p : '')); } catch (e) {} }, 250);
  };
  input.addEventListener('input', apply);
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape' && input.value) { e.stopPropagation(); input.value = ''; apply(); }
    if (e.key === 'Enter') { const first = $('li[data-id]:not([hidden]) a[data-id]', page); if (first) location.hash = first.getAttribute('href'); }
  });
  if (q) { input.value = q; apply(); }
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

// the notes in n's series, in order: `series: Name` (with an optional `part: 2`) or, for lectures, the same `course`
function seriesRun(n) {
  const name = str(n.fm.series);
  if (name) return S.notes.filter(m => slug(str(m.fm.series)) === slug(name))
    .sort((a, b) => (parseFloat(a.fm.part) || Infinity) - (parseFloat(b.fm.part) || Infinity) || time(a.created) - time(b.created) || idNum(a) - idNum(b));
  if (!n.fm.course) return [];
  return S.notes.filter(m => m.section === n.section && str(m.fm.course) === str(n.fm.course))
    .sort((a, b) => (parseFloat(a.fm.lecture) || 0) - (parseFloat(b.fm.lecture) || 0) || time(a.created) - time(b.created));
}
function viewSeries(key) {
  const first = S.notes.find(m => slug(str(m.fm.series)) === key);
  if (!first) return viewMissing(`There’s no series called “${esc(key)}”.`);
  const run = seriesRun(first), name = str(first.fm.series);
  return `<div class="page page-section"><header class="fr-head"><p class="note-kicker"><a class="note-taxon" href="#/series">Series</a></p><h1>${esc(name)}</h1><p class="home-sub">${plural(run.length, 'part', 'parts')}</p></header>
    <ol class="fr-list fr-list-full">${run.map(m => entryLi(m, true)).join('')}</ol></div>`;
}
function viewSeriesList() {
  const by = new Map();
  for (const m of S.notes) { const name = str(m.fm.series); if (name) { const k = slug(name); if (!by.has(k)) by.set(k, { name, ns: [] }); by.get(k).ns.push(m); } }
  const rows = [...by.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
  return `<div class="page page-section"><header class="fr-head"><h1>Series</h1><p class="home-sub">Notes meant to be read in order. Add <code>series: Name</code> (and optionally <code>part: 1</code>) to a note’s front matter.</p></header>
    ${rows.length ? `<ol class="fr-list fr-list-full">${rows.map(([k, s]) => `<li><span class="fr-addr">${s.ns.length}</span><div><a href="#/series/${encodeURIComponent(k)}">${esc(s.name)}</a></div></li>`).join('')}</ol>` : '<p class="fr-empty">No series yet.</p>'}</div>`;
}

function viewNote(n) {
  const r = renderNoteBody(n);
  const f = n.fm, sec = n.section;
  const label = (n.sub && n.sub.label) || sec.label || `${sec.name} notes`;
  const cite = citeHTML(n);
  const url = str(f.url ?? f.link);
  const tags = n.tags.map(t => `<a class="tag" href="#/tags/${encodeURIComponent(t.toLowerCase())}">${esc(t)}</a>`).join(' ');
  // series navigation: `series:` runs across sections (ordered by `part`, then date); a lecture course runs by lecture number
  let series = '', seriesFoot = '';
  const run = seriesRun(n);
  if (run.length > 1) {
    const i = run.indexOf(n), name = str(f.series);
    const prevNext = `${i > 0 ? `Previous: <a href="#/${run[i - 1].id}">${run[i - 1].id} ${esc(run[i - 1].title)}</a>` : ''}${i < run.length - 1 ? `Next: <a href="#/${run[i + 1].id}">${run[i + 1].id} ${esc(run[i + 1].title)}</a>` : ''}`;
    const head = name ? `<a class="series-name" href="#/series/${encodeURIComponent(slug(name))}">${esc(name)}</a> · part ${i + 1} of ${run.length}<br>` : '';
    series = `<p class="series">${head}${prevNext}</p>`;
    if (name) seriesFoot = `<nav class="series-foot" aria-label="Series"><p class="series-foot-title">Series: <a href="#/series/${encodeURIComponent(slug(name))}">${esc(name)}</a></p><p class="series">${prevNext}</p></nav>`;
  }
  // notes whose headings carry their own numbers ("1. …", "A. …") are not numbered again by the stylesheet
  const ownNum = r.toc.some(t => /^(\d+|[A-Z]|[IVX]+)[.)]\s/.test(t.text));
  // sections are usually "### 1. …" under no "##" at all, so the contents take whichever level carries two or more sections
  const count = l => r.toc.filter(t => t.level === l && !t.plain).length;
  const top = count(2) >= 2 ? 2 : count(3) >= 2 ? 3 : 0;
  const toc = top
    ? `<nav class="toc" aria-label="Contents"><p class="toc-title">Contents</p><ol>${r.toc.map(t => `<li class="lvl-${Math.max(2, t.level - top + 2)}${t.plain ? ' plain' : ''}"><a href="#" data-scroll="${t.anchor}">${esc(t.text)}</a></li>`).join('')}</ol></nav>` : '';
  const back = (S.back.get(n.id) || []).map(b => ({ ...b, n: S.byId.get(b.from) })).sort((a, b) => a.n.id.localeCompare(b.n.id));
  const backHTML = `<section class="backlinks"><h2>Referenced by</h2>${back.length
    ? `<ul>${back.map(b => `<li><span class="bl-addr">[${b.n.id}]</span><a class="bl-title" href="#/${b.n.id}" data-id="${b.n.id}">${esc(b.n.title)}</a><p class="bl-ctx">${contextSnippet(b.line, n.id)}</p></li>`).join('')}</ul>`
    : `<p class="bl-none">No other note links here yet. Link to it with <code>[[${esc(n.id)}]]</code> or <code>[[${esc(n.title)}]]</code>.</p>`}</section>`;
  const related = n.tags.length ? S.notes.filter(m => m !== n).map(m => ({ m, shared: m.tags.filter(t => n.tags.some(u => u.toLowerCase() === t.toLowerCase())) }))
    .filter(x => x.shared.length).sort((a, b) => b.shared.length - a.shared.length || newest(a.m, b.m)).slice(0, 8) : [];
  const relHTML = related.length ? `<section class="related"><h2>Shares tags with</h2><ul>${related.map(x => `<li><span class="bl-addr">[${x.m.id}]</span><a href="#/${x.m.id}" data-id="${x.m.id}">${esc(x.m.title)}</a> <span class="rel-tags">${x.shared.map(esc).join(', ')}</span></li>`).join('')}</ul></section>` : '';
  const outgoing = [...n.links].map(id => S.byId.get(id)).filter(m => m && !back.some(b => b.n === m));
  const outHTML = outgoing.length ? `<section class="related"><h2>Links from this note</h2><ul>${outgoing.map(m => `<li><span class="bl-addr">[${m.id}]</span><a href="#/${m.id}" data-id="${m.id}">${esc(m.title)}</a></li>`).join('')}</ul></section>` : '';
  return `<div class="note-page"><article class="note${ownNum ? ' own-num' : ''}" data-id="${n.id}"><div class="note-main">
    <header class="note-head">
      <p class="note-kicker"><a class="note-taxon" href="#/s/${sec.id}${n.sub ? '/' + n.sub.id : ''}">${esc(label)}</a><span class="note-addr">${n.id}</span></p>
      <h1 class="note-title">${esc(n.title)}</h1>
      ${cite ? `<p class="cite">${cite}</p>` : ''}
      ${url ? `<p class="source-link"><a class="external" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(str(f.urlLabel) || 'Source')}</a></p>` : ''}
      ${n.updated ? `<p class="note-updated">Updated ${fmtDate(n.updated)}</p>` : ''}
      ${tags ? `<p class="note-tags">${tags}</p>` : ''}
      ${series}
    </header>
    ${toc}
    <div class="prose note-body">${r.html}</div>
    <footer class="note-foot">${seriesFoot}${backHTML}${outHTML}${relHTML}</footer>
  </div></article></div>`;
}

/* ---------------- graph: every note as a dot, every link as a line ---------------- */
function graphLayout() {
  if (S.graph) return S.graph;
  const ns = S.notes, at = new Map(ns.map((n, i) => [n.id, i])), edges = [];
  for (const n of ns) for (const id of n.links) { const j = at.get(id); if (j != null && j !== at.get(n.id)) edges.push([at.get(n.id), j]); }
  const deg = ns.map(() => 0); for (const [a, b] of edges) { deg[a]++; deg[b]++; }
  // start each section on its own arc so the picture comes out the same on every visit
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // colour and place each note by its subject: the first broad field among its tags (config.browse.fields)
  const field = n => n.tags.map(t => t.toLowerCase()).find(t => S.browse.fields.has(t)) || '';
  const tally = new Map(); for (const n of ns) { const f = field(n); tally.set(f, (tally.get(f) || 0) + 1); }
  const named = [...tally.keys()].filter(Boolean).sort((a, b) => tally.get(b) - tally.get(a) || a.localeCompare(b)).slice(0, GRAPH_COLOURS);
  const dom = ns.map(n => { const i = named.indexOf(field(n)); return i < 0 ? named.length : i; });
  const domains = named.map(f => ({ name: tagLabel(f), count: tally.get(f) }));
  const rest = ns.length - domains.reduce((a, d) => a + d.count, 0); if (rest) domains.push({ name: 'Other', count: rest, other: true });
  const k = domains.length || 1;
  const x = ns.map((n, i) => Math.cos(2 * Math.PI * (dom[i] + rnd() * .8) / k) * 300 + rnd() * 60);
  const y = ns.map((n, i) => Math.sin(2 * Math.PI * (dom[i] + rnd() * .8) / k) * 300 + rnd() * 60);
  const N = ns.length, vx = new Float64Array(N), vy = new Float64Array(N);
  for (let it = 0, heat = 1; it < 220; it++, heat *= .985) {
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      let dx = x[i] - x[j], dy = y[i] - y[j], d2 = dx * dx + dy * dy + .01;
      if (d2 > 90000) continue;
      const f = 900 / d2; vx[i] += dx * f; vy[i] += dy * f; vx[j] -= dx * f; vy[j] -= dy * f;
    }
    for (const [a, b] of edges) { const dx = x[b] - x[a], dy = y[b] - y[a], f = .02; vx[a] += dx * f; vy[a] += dy * f; vx[b] -= dx * f; vy[b] -= dy * f; }
    for (let i = 0; i < N; i++) {
      vx[i] -= x[i] * .006; vy[i] -= y[i] * .006;   // gravity keeps unlinked notes from drifting off
      const v = Math.hypot(vx[i], vy[i]), cap = 12 * heat;
      if (v > cap) { vx[i] *= cap / v; vy[i] *= cap / v; }
      x[i] += vx[i]; y[i] += vy[i]; vx[i] *= .5; vy[i] *= .5;
    }
  }
  return (S.graph = { ns, x, y, edges, deg, dom, domains });
}
function viewGraph(opts) {
  const g = graphLayout(), tag = String(opts.tag || '').toLowerCase(), only = opts.only || '';
  const has = i => tag ? g.ns[i].tags.some(t => t.toLowerCase() === tag) : true;
  const lone = i => g.deg[i] === 0;
  const lit = g.ns.map((n, i) => has(i) && (only !== 'orphans' || lone(i)));
  const tags = [...S.tags.values()].filter(t => t.notes.length > 1).sort((a, b) => a.name.localeCompare(b.name));
  const nLone = g.deg.filter(d => !d).length;
  return `<div class="page page-graph"><header class="fr-head"><h1>Graph</h1><p class="home-sub">${plural(g.ns.length, 'note', 'notes')} and ${plural(g.edges.length, 'link', 'links')}. Bigger dots have more links; scroll to zoom, drag to move, click a dot to open it.</p></header>
    <form class="graph-tools" onsubmit="return false"><label>Tag <select data-graph="tag"><option value="">all notes</option>${tags.map(t => `<option value="${esc(t.name.toLowerCase())}"${t.name.toLowerCase() === tag ? ' selected' : ''}>${esc(t.name)} (${t.notes.length})</option>`).join('')}</select></label>
    <label><input type="checkbox" data-graph="orphans"${only === 'orphans' ? ' checked' : ''}> only notes with no links (${nLone})</label><span class="g-legend">${graphLegend()}</span></form>
    <div class="graph-box">${graphSVG(lit)}</div></div>`;
}
const GRAPH_COLOURS = 8;   // subjects beyond the eight largest share the grey of "Other"
const domClass = (d, i) => d.other ? 'g-dom-other' : `g-dom-${i}`;
const graphLegend = () => graphLayout().domains.map((d, i) => `<span class="g-key"><svg width="10" height="10" aria-hidden="true"><circle cx="5" cy="5" r="4.5" class="${domClass(d, i)}"/></svg>${esc(d.name)} <span class="count">${d.count}</span></span>`).join('');
// the drawing itself; lit[i] false greys out note i (and lines touching it)
function graphSVG(lit, cls = 'graph') {
  const g = graphLayout(), on = i => !lit || lit[i], lone = i => g.deg[i] === 0;
  const pad = 40, minX = Math.min(...g.x) - pad, minY = Math.min(...g.y) - pad, w = Math.max(...g.x) - minX + pad, h = Math.max(...g.y) - minY + pad;
  const vb = `${minX.toFixed(0)} ${minY.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}`;
  const lines = g.edges.map(([a, b]) => `<line x1="${g.x[a].toFixed(1)}" y1="${g.y[a].toFixed(1)}" x2="${g.x[b].toFixed(1)}" y2="${g.y[b].toFixed(1)}"${on(a) && on(b) ? '' : ' class="dim"'}/>`).join('');
  const dots = g.ns.map((n, i) => `<a href="#/${n.id}" data-gid="${n.id}"><circle cx="${g.x[i].toFixed(1)}" cy="${g.y[i].toFixed(1)}" r="${(3 + Math.sqrt(g.deg[i]) * 1.6).toFixed(1)}" class="${domClass(g.domains[g.dom[i]], g.dom[i])}${on(i) ? '' : ' dim'}${lone(i) ? ' lone' : ''}"><title>${esc(n.id + ' ' + n.title)}</title></circle></a>`).join('');
  return `<svg class="${cls}" viewBox="${vb}" data-vb="${vb}" role="img" aria-label="Graph of notes and links"><g class="g-edges">${lines}</g><g class="g-nodes">${dots}</g></svg>`;
}
function initGraph(main) {
  const svg = $('svg.graph', main); if (!svg) return;
  const go = () => {
    const tag = $('[data-graph="tag"]', main).value, orphans = $('[data-graph="orphans"]', main).checked;
    const p = new URLSearchParams(); if (tag) p.set('tag', tag); if (orphans) p.set('only', 'orphans');
    location.hash = '#/graph' + (p.toString() ? '?' + p : '');
  };
  $$('[data-graph]', main).forEach(el => el.addEventListener('change', go));
  let vb = svg.dataset.vb.split(' ').map(Number), drag = null, moved = false;
  const set = () => svg.setAttribute('viewBox', vb.map(v => v.toFixed(1)).join(' '));
  svg.addEventListener('wheel', e => {
    e.preventDefault();
    const r = svg.getBoundingClientRect(), f = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    const px = vb[0] + (e.clientX - r.left) / r.width * vb[2], py = vb[1] + (e.clientY - r.top) / r.height * vb[3];
    vb = [px - (px - vb[0]) * f, py - (py - vb[1]) * f, vb[2] * f, vb[3] * f]; set();
  }, { passive: false });
  svg.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, vb: [...vb] }; moved = false; });
  addEventListener('pointerup', () => { drag = null; });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const r = svg.getBoundingClientRect(), dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    vb = [drag.vb[0] - dx / r.width * vb[2], drag.vb[1] - dy / r.height * vb[3], vb[2], vb[3]]; set();
  });
  svg.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
}

function viewTags() {
  const tags = [...S.tags.values()].sort((a, b) => a.name.localeCompare(b.name));
  const head = `<header class="fr-head"><h1>Tags</h1><p class="home-sub">${plural(tags.length, 'tag', 'tags')} across ${plural(S.notes.length, 'note', 'notes')}</p></header>`;
  const cloud = ts => `<ul class="tag-cloud">${ts.map(t => `<li><a href="#/tags/${encodeURIComponent(t.name.toLowerCase())}">${esc(t.name)} <span class="count">${t.notes.length}</span></a></li>`).join('')}</ul>`;
  if (!tags.length) return `<div class="page page-section">${head}<p class="fr-empty">No tags yet. Add <code>tags: [one, two]</code> to a note’s front matter.</p></div>`;
  if (!S.browse.shelves.length) return `<div class="page page-section">${head}${cloud(tags)}</div>`;
  // grouped like the topic lists on the section pages: broad fields, then each shelf, then whatever is left
  const used = new Set(), take = keys => keys.map(k => S.tags.get(k)).filter(t => t && !used.has(t)).map(t => (used.add(t), t));
  const groups = [['Fields', take([...S.browse.fields]).sort((a, b) => b.notes.length - a.notes.length)], ...S.browse.shelves.map(s => [s.name, take(s.tags)])];
  groups.push(['Other tags', tags.filter(t => !used.has(t))]);
  return `<div class="page page-section page-tags">${head}${groups.filter(([, ts]) => ts.length).map(([name, ts]) => `<section class="tag-shelf"><h2 class="shelf-head">${esc(name)}</h2>${cloud(ts)}</section>`).join('')}</div>`;
}
function viewTag(key) {
  const t = S.tags.get(key);
  if (!t) return viewMissing(`No notes are tagged “${esc(key)}”.`);
  const bySec = S.sections.map(sec => ({ sec, ns: t.notes.filter(n => n.section === sec).sort(newest) })).filter(g => g.ns.length);
  return `<div class="page page-section"><header class="fr-head"><p class="note-kicker"><a class="note-taxon" href="#/tags">Tag</a></p><h1>${esc(t.name)}</h1><p class="home-sub">${plural(t.notes.length, 'note', 'notes')}</p></header>
    ${bySec.map(g => `<h2 class="yr">${esc(g.sec.name)}</h2><ol class="fr-list fr-list-full">${g.ns.map(n => entryLi(n, true)).join('')}</ol>`).join('')}</div>`;
}
const viewMissing = msg => `<div class="page page-section"><header class="fr-head"><h1>Not found</h1><p class="home-sub">${msg}</p></header><p style="text-align:center"><a href="#/">Back to the index</a></p></div>`;

/* ---------------- PDF library ---------------- */
// library.json (built from library/<Channel>/<file>.pdf) is fetched the first time the Library is opened.
// Channels and files are shown as square blocks; a file opens in a reader drawn with pdf.js, page by page as it scrolls into view.
const LIBRARY = { data: null, loading: null, thumbs: new Map(), thumbObs: null, reader: null };
const pdfUrl = p => p.split('/').map(encodeURIComponent).join('/');
const fileSize = b => b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
function loadLibrary() {
  if (LIBRARY.data) return Promise.resolve(LIBRARY.data);
  return LIBRARY.loading || (LIBRARY.loading = getJSON('library.json').catch(() => ({ channels: [], items: [] })).then(d => {
    const items = d.items || [], used = new Set();
    for (const i of items) {
      i.chSlug = slug(i.channel);
      let s = slug(i.path.split('/').pop().replace(/\.pdf$/i, '')) || 'file', k = s, n = 2;
      while (used.has(i.chSlug + '/' + k)) k = `${s}-${n++}`;
      used.add(i.chSlug + '/' + k); i.slug = k;
    }
    const channels = (d.channels || []).map(c => {
      const its = items.filter(i => i.channel === c.name);
      return { ...c, slug: slug(c.name), items: its, added: its.reduce((a, i) => i.added > a ? i.added : a, '') };
    });
    return (LIBRARY.data = { channels, items });
  }));
}
function sortBlocks(arr, sort, key = x => x.title || x.name) {
  const a = [...arr];
  if (sort === 'title') a.sort((x, y) => key(x).localeCompare(key(y)));
  else if (sort === 'random') { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }
  else a.sort((x, y) => String(y.added).localeCompare(String(x.added)) || key(x).localeCompare(key(y)));
  return a;
}
const libChoice = (label, opts, cur, href) => `<div class="lib-choice"><span class="lib-choice-label">${label}</span>${opts.map(([v, name]) =>
  `<a href="${href(v)}"${v === cur ? ' aria-current="true"' : ''}>${name}</a>`).join('')}</div>`;
const channelBlock = c => `<a class="blk blk-ch" href="#/library/${encodeURIComponent(c.slug)}"><span class="blk-ch-name">${esc(c.name)}</span>
  <span class="blk-meta">${plural(c.items.length, 'PDF', 'PDFs')}${c.added ? `<br>updated ${esc(fmtDate(toDate(c.added)))}` : ''}</span></a>`;
const fileBlock = i => `<figure class="blk-wrap"><a class="blk blk-file" href="#/library/${encodeURIComponent(i.chSlug)}/${encodeURIComponent(i.slug)}" data-pdf="${esc(pdfUrl(i.path))}">
  ${i.cover ? `<img src="${esc(pdfUrl(i.cover))}" alt="" loading="lazy">` : `<span class="blk-fallback">${esc(i.title)}</span>`}</a>
  <figcaption class="blk-cap"><span class="blk-title">${esc(i.title)}</span>${i.author ? `<span class="blk-author">${esc(i.author)}</span>` : ''}</figcaption></figure>`;
function viewLibrary(r) {
  const d = LIBRARY.data;
  if (!d) return { html: `<div class="page page-library"><header class="fr-head"><h1>Library</h1><p class="home-sub">Loading…</p></header></div>` };
  const kicker = extra => `<p class="note-kicker"><a class="note-taxon" href="#/library">Library</a>${extra || ''}</p>`;
  const sorts = [['recent', 'Recently added'], ['title', 'Title'], ['random', 'Random']], sort = sorts.some(s => s[0] === r.sort) ? r.sort : 'recent';
  if (!r.channel) {
    const view = ['channels', 'files'].includes(r.view) ? r.view : 'all';
    const href = (v, s) => `#/library?${new URLSearchParams({ ...(v !== 'all' ? { view: v } : {}), ...(s !== 'recent' ? { sort: s } : {}) })}`.replace(/\?$/, '');
    const blocks = [...(view !== 'files' ? sortBlocks(d.channels, sort).map(channelBlock) : []), ...(view !== 'channels' ? sortBlocks(d.items, sort).map(fileBlock) : [])];
    const empty = `<p class="fr-empty">Nothing here yet. Put PDFs in <code>library/&lt;Channel&gt;/</code> in the repository and publish.</p>`;
    return { html: `<div class="page page-library"><header class="fr-head"><h1>Library</h1><p class="home-sub">${plural(d.items.length, 'PDF', 'PDFs')} in ${plural(d.channels.length, 'channel', 'channels')}</p></header>
      <div class="lib-controls">${libChoice('View', [['all', 'All'], ['channels', 'Channels'], ['files', 'Files']], view, v => href(v, sort))}${libChoice('Sort', sorts, sort, s => href(view, s))}</div>
      ${d.items.length ? `<div class="blk-grid">${blocks.join('')}</div>` : empty}</div>` };
  }
  const c = d.channels.find(x => x.slug === r.channel);
  if (!c) return { html: viewMissing('That channel isn’t in the library.') };
  if (!r.file) {
    const href = s => `#/library/${encodeURIComponent(c.slug)}${s !== 'recent' ? '?sort=' + s : ''}`;
    return { title: c.name, html: `<div class="page page-library"><header class="fr-head">${kicker()}<h1>${esc(c.name)}</h1>
      <p class="home-sub">${c.description ? esc(c.description) + ' · ' : ''}${plural(c.items.length, 'PDF', 'PDFs')}</p></header>
      <div class="lib-controls">${libChoice('Sort', sorts, sort, href)}</div><div class="blk-grid">${sortBlocks(c.items, sort).map(fileBlock).join('')}</div></div>` };
  }
  const i = c.items.find(x => x.slug === r.file);
  if (!i) return { html: viewMissing('That file isn’t in this channel.') };
  const note = i.note && (S.byId.get(String(i.note).toUpperCase()) || S.byId.get(resolveTarget(i.note) || ''));
  const facts = [i.author, i.year, fileSize(i.size), i.added && `added ${fmtDate(toDate(i.added))}`].filter(Boolean).map(esc).join(' · ');
  return { title: i.title, html: `<div class="page page-library page-reader"><header class="fr-head">${kicker(` <span class="kicker-sep">/</span> <a class="note-taxon" href="#/library/${encodeURIComponent(c.slug)}">${esc(c.name)}</a>`)}
    <h1>${esc(i.title)}</h1><p class="home-sub">${facts}</p>${i.description ? `<p class="lib-desc">${esc(i.description)}</p>` : ''}
    <p class="lib-actions"><a class="lib-btn" href="${esc(pdfUrl(i.path))}" download>Download</a><a class="lib-btn" href="${esc(pdfUrl(i.path))}" target="_blank" rel="noopener">Open in a new tab</a>${note ? `<a class="lib-btn" href="#/${note.id}">My notes on it</a>` : ''}</p></header>
    <div class="pdf-bar"><button type="button" data-zoom="-1" aria-label="Zoom out">−</button><span class="pdf-zoom">100%</span><button type="button" data-zoom="1" aria-label="Zoom in">+</button><span class="pdf-count">Loading…</span></div>
    <div class="pdf-pages" data-pdf="${esc(pdfUrl(i.path))}"></div></div>` };
}
async function pdfReady() {
  if (!(await loadLib('pdfjs'))) return null;
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
  return window.pdfjsLib;
}
const openPdf = (lib, url) => lib.getDocument({ url, disableAutoFetch: true, disableStream: true, isEvalSupported: false }).promise;
function initLibrary(main, r) {
  if (!LIBRARY.data) { loadLibrary().then(() => { if (parseHash().name === 'library') route(); }); return; }
  const pages = $('.pdf-pages', main);
  if (pages) return openReader(main, pages);
  // first-page pictures for files without a cover, two at a time, as they come into view
  const queue = [], seen = new Set(); let busy = 0;
  const pump = () => {
    while (busy < 2 && queue.length) {
      const a = queue.shift(); busy++;
      thumbFor(a.dataset.pdf).then(src => { if (src && a.isConnected) a.innerHTML = `<img src="${src}" alt="">`; }).finally(() => { busy--; pump(); });
    }
  };
  const obs = LIBRARY.thumbObs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting || seen.has(e.target)) return;
    seen.add(e.target); obs.unobserve(e.target);
    const cached = LIBRARY.thumbs.get(e.target.dataset.pdf);
    if (typeof cached === 'string') { if (cached) e.target.innerHTML = `<img src="${cached}" alt="">`; } else { queue.push(e.target); pump(); }
  }), { rootMargin: '300px 0px' });
  $$('.blk-file', main).filter(a => !a.querySelector('img')).forEach(a => obs.observe(a));
}
async function thumbFor(url) {
  if (LIBRARY.thumbs.has(url)) return LIBRARY.thumbs.get(url);
  const job = (async () => {
    const lib = await pdfReady(); if (!lib) return '';
    let doc;
    try {
      doc = await openPdf(lib, url);
      const page = await doc.getPage(1), v0 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: 420 / v0.width });
      const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
      await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
      return cv.toDataURL('image/jpeg', 0.82);
    } catch (e) { console.warn('No preview for', url, e); return ''; }
    finally { if (doc) doc.destroy(); }
  })();
  LIBRARY.thumbs.set(url, job);
  const src = await job; LIBRARY.thumbs.set(url, src); return src;
}
async function openReader(main, box) {
  const url = box.dataset.pdf, count = $('.pdf-count', main), zoomLabel = $('.pdf-zoom', main);
  const bar = $('.pdf-bar', main), top = $('.topbar'); if (top && getComputedStyle(top).position === 'sticky') bar.style.top = top.offsetHeight + 'px';   // sit just under the site's own bar
  const fallback = msg => { count.textContent = ''; box.innerHTML = `<p class="fr-empty">${msg}</p><iframe class="pdf-frame" src="${esc(url)}" title="PDF"></iframe>`; };
  const lib = await pdfReady();
  if (!box.isConnected) return;
  if (!lib) return fallback('The page viewer didn’t load, so here is your browser’s own PDF viewer.');
  let doc;
  try { doc = await openPdf(lib, url); } catch (e) { return fallback(`This PDF couldn’t be opened here (${esc(e.message)}). Your browser’s viewer may manage it.`); }
  if (!box.isConnected) { doc.destroy(); return; }
  const ZOOMS = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 2, 2.5];
  const R = LIBRARY.reader = { doc, zoom: 3, obs: null, onScroll: null, tasks: new Map() };
  const first = (await doc.getPage(1)).getViewport({ scale: 1 });
  box.innerHTML = Array.from({ length: doc.numPages }, (_, k) => `<div class="pdf-page" data-n="${k + 1}" style="aspect-ratio:${first.width} / ${first.height}"></div>`).join('');
  const pageEls = $$('.pdf-page', box);
  const draw = async el => {
    if (el.dataset.drawn === String(R.zoom)) return;
    const z = el.dataset.drawn = String(R.zoom);
    const page = await doc.getPage(+el.dataset.n); if (!el.isConnected || el.dataset.drawn !== z) return;
    const v0 = page.getViewport({ scale: 1 }), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    el.style.aspectRatio = `${v0.width} / ${v0.height}`;
    const vp = page.getViewport({ scale: el.clientWidth * dpr / v0.width });
    const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
    const task = page.render({ canvasContext: cv.getContext('2d'), viewport: vp }); R.tasks.set(el, task);
    try { await task.promise; } catch (e) { return; } finally { if (R.tasks.get(el) === task) R.tasks.delete(el); }
    if (el.dataset.drawn === z) el.replaceChildren(cv);
  };
  const clear = el => { const t = R.tasks.get(el); if (t) t.cancel(); delete el.dataset.drawn; el.replaceChildren(); };
  R.obs = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? draw(e.target) : clear(e.target)), { rootMargin: '1200px 0px' });
  pageEls.forEach(el => R.obs.observe(el));
  const current = () => { const y = bar.getBoundingClientRect().bottom + 10; return pageEls.find(el => el.getBoundingClientRect().bottom > y) || pageEls[0]; };
  const show = () => { count.textContent = `Page ${current().dataset.n} of ${doc.numPages}`; };
  let frame = 0; R.onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(show); };
  addEventListener('scroll', R.onScroll, { passive: true }); show();
  const setZoom = z => {
    const at = current(), off = at.getBoundingClientRect().top;
    R.zoom = Math.max(0, Math.min(ZOOMS.length - 1, z));
    box.style.setProperty('--pdf-zoom', ZOOMS[R.zoom]); zoomLabel.textContent = `${Math.round(ZOOMS[R.zoom] * 100)}%`;
    pageEls.forEach(clear);
    window.scrollBy(0, at.getBoundingClientRect().top - off);
    const near = innerHeight + 1200;   // redraw what is on or near the screen; the observer handles the rest as the reader scrolls
    pageEls.filter(el => { const r = el.getBoundingClientRect(); return r.bottom > -1200 && r.top < near; }).forEach(draw);
  };
  bar.addEventListener('click', e => { const b = e.target.closest('[data-zoom]'); if (b) setZoom(R.zoom + +b.dataset.zoom); });
}
function closeReader() {
  if (LIBRARY.thumbObs) { LIBRARY.thumbObs.disconnect(); LIBRARY.thumbObs = null; }
  const R = LIBRARY.reader; if (!R) return;
  LIBRARY.reader = null;
  if (R.obs) R.obs.disconnect();
  if (R.onScroll) removeEventListener('scroll', R.onScroll);
  R.tasks.forEach(t => t.cancel());
  R.doc.destroy();
}

/* ---------------- routing ---------------- */
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(p => { try { return decodeURIComponent(p); } catch (e) { return p; } });
  const q = new URLSearchParams(query);
  if (!parts.length) return { name: 'index' };
  if (parts[0] === 's') return { name: 'section', sec: parts[1], sub: parts[2], sort: q.get('sort'), topic: q.get('topic'), q: q.get('q') };
  if (parts[0] === 'tags') return parts[1] ? { name: 'tag', tag: parts[1] } : { name: 'tags' };
  if (parts[0] === 'graph') return { name: 'graph', tag: q.get('tag'), only: q.get('only') };
  if (parts[0] === 'library' && S.config.library) return { name: 'library', channel: parts[1], file: parts[2], view: q.get('view'), sort: q.get('sort') };
  if (parts[0] === 'series') return parts[1] ? { name: 'series', key: parts[1] } : { name: 'serieslist' };
  return { name: 'note', id: parts[0].toUpperCase(), anchor: parts[1] };
}
let lastRoute = '';
function route() {
  hidePopover();
  closeReader();
  const r = parseHash(), main = $('#main');
  let html, title = S.config.title || 'Notes', navKey = r.name === 'index' ? 'index' : r.name.startsWith('tag') ? 'tags' : null;
  if (r.name === 'index') html = viewIndex();
  else if (r.name === 'section') {
    const sec = S.sections.find(s => s.id === r.sec);
    html = sec ? viewSection(sec, r.sub, { sort: r.sort, topic: r.topic }) : viewMissing('That section doesn’t exist.');
    if (sec) { title = `${r.topic && S.tags.has(r.topic.toLowerCase()) ? tagLabel(r.topic.toLowerCase()) + ' — ' : ''}${sec.name} — ${title}`; navKey = sec.id; }
  } else if (r.name === 'tags') { html = viewTags(); title = `Tags — ${title}`; }
  else if (r.name === 'tag') { html = viewTag(r.tag.toLowerCase()); title = `${r.tag} — ${title}`; }
  else if (r.name === 'graph') { html = viewGraph(r); title = `Graph — ${title}`; navKey = 'graph'; }
  else if (r.name === 'series') { html = viewSeries(slug(r.key)); title = `Series — ${title}`; }
  else if (r.name === 'serieslist') { html = viewSeriesList(); title = `Series — ${title}`; }
  else if (r.name === 'library') { const v = viewLibrary(r); html = v.html; title = `${v.title ? v.title + ' — ' : ''}Library — ${title}`; navKey = 'library'; }
  else {
    const n = S.byId.get(r.id) || S.byId.get(resolveTarget(r.id) || '');
    if (n && n.id !== r.id) { location.replace('#/' + n.id); return; }
    html = n ? viewNote(n) : viewMissing(`There’s no note with the address ${esc(r.id)}.`);
    if (n) { title = `${n.title} — ${title}`; navKey = n.section.id; }
  }
  main.innerHTML = html;
  if (r.name === 'section') initBrowse(main, r.q);   // before restoring the scroll position, since filtering changes the page's length
  if (r.name === 'graph') initGraph(main);
  if (r.name === 'library') initLibrary(main, r);
  document.title = title;
  $$('.nav a[data-nav]').forEach(a => a.dataset.nav === navKey ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  const links = $('.nav-links'), cur = $('.nav a[aria-current="page"]');
  if (links && cur && links.scrollWidth > links.clientWidth) links.scrollLeft += cur.getBoundingClientRect().left - links.getBoundingClientRect().left - (links.clientWidth - cur.offsetWidth) / 2;
  const key = r.name === 'section' ? `s/${r.sec}?${(r.topic || '').toLowerCase()}` : location.hash;
  const saved = scrollMemory[entryKey()];
  if (!entryKey()) { try { history.replaceState({ ...(history.state || {}), cp: Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }, ''); } catch (e) {} }
  if (saved != null) window.scrollTo(0, saved);   // Back, Forward or reload: return to where the reader was
  else { if (key !== lastRoute) window.scrollTo(0, 0); if (r.anchor) scrollToAnchor(r.anchor); }
  lastRoute = key;
  enhance(main).then(markTocCurrent);
  markTocCurrent();
}
// Each history entry gets a key in history.state; its last scroll position is kept for the session.
const SCROLL_STORE = 'cp-scroll';
const scrollMemory = (() => { try { return JSON.parse(sessionStorage.getItem(SCROLL_STORE)) || {}; } catch (e) { return {}; } })();
const entryKey = () => (history.state && history.state.cp) || '';
let scrollSaveTimer = 0;
function rememberScroll() {
  const k = entryKey(); if (!k) return;
  scrollMemory[k] = Math.round(window.scrollY);
  clearTimeout(scrollSaveTimer);
  scrollSaveTimer = setTimeout(() => {
    const keys = Object.keys(scrollMemory); keys.slice(0, Math.max(0, keys.length - 200)).forEach(x => delete scrollMemory[x]);
    try { sessionStorage.setItem(SCROLL_STORE, JSON.stringify(scrollMemory)); } catch (e) {}
  }, 300);
}
// The contents box highlights the section being read (on wide screens it sits beside the note and stays put).
let tocFrame = 0;
function markTocCurrent() {
  cancelAnimationFrame(tocFrame);
  tocFrame = requestAnimationFrame(() => {
    const toc = $('#main nav.toc'); if (!toc) return;
    const links = $$('a[data-scroll]', toc); if (!links.length) return;
    let cur = null;
    for (const a of links) { const h = $(`[data-anchor="${CSS.escape(a.dataset.scroll)}"]`, $('#main')); if (h && h.getBoundingClientRect().top < 140) cur = a; }
    for (const a of links) a.classList.toggle('is-current', a === cur);
    if (cur && getComputedStyle(toc).position === 'fixed') {
      const t = cur.offsetTop, b = t + cur.offsetHeight;
      if (t < toc.scrollTop + 30) toc.scrollTop = Math.max(0, t - 30); else if (b > toc.scrollTop + toc.clientHeight - 30) toc.scrollTop = b - toc.clientHeight + 30;
    }
  });
}
function scrollToAnchor(a) { const h = $(`[data-anchor="${CSS.escape(a)}"]`, $('#main')); if (h) h.scrollIntoView({ block: 'start' }); }

/* ---------------- shell ---------------- */
function buildShell() {
  const c = S.config;
  document.body.innerHTML = `<a class="skip" href="#main">Skip to content</a>
  <header class="topbar"><a class="brand" href="#/"><span class="brand-title">${esc(c.title || 'Notes')}</span></a>
    <nav class="nav" aria-label="Main"><span class="nav-links"><a href="#/" data-nav="index">Index</a>${S.sections.map(s => `<a href="#/s/${s.id}" data-nav="${s.id}">${esc(s.shortName || s.name)}</a>`).join('')}
    ${c.library ? '<a href="#/library" data-nav="library">Library</a>' : ''}<a href="#/tags" data-nav="tags">Tags</a></span><button type="button" data-action="random" title="Open a random note">Random</button><button type="button" data-action="search">Search<kbd>/</kbd></button>
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
// Search ignores case, accents and breathings: "theosis" finds "théosis", "θεωσις" finds "θέωσις".
const fold = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\u03c2/g, '\u03c3');   // final sigma ς counts as σ
function folded(n) {
  if (!n._fold) n._fold = { title: fold(n.title), meta: fold([n.id, n.tags.join(' '), sourceLine(n), n.aliases.join(' ')].join(' ')), body: fold(plainText(n)) };
  return n._fold;
}
// wrap each match of the (folded) terms in <mark>, mapping folded positions back to the original text
function markTerms(text, terms) {
  let f = '', map = [];
  for (let i = 0; i < text.length; i++) { const c = fold(text[i]); for (let j = 0; j < c.length; j++) { f += c[j]; map.push(i); } }
  map.push(text.length);
  const spans = [];
  for (const t of terms) for (let i = f.indexOf(t); i >= 0; i = f.indexOf(t, i + t.length)) spans.push([map[i], map[i + t.length]]);
  spans.sort((a, b) => a[0] - b[0]);
  let out = '', last = 0;
  for (const [a, b] of spans) { if (a < last) continue; out += esc(text.slice(last, a)) + `<mark>${esc(text.slice(a, b))}</mark>`; last = b; }
  return out + esc(text.slice(last));
}
function search(q) {
  const terms = fold(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return [...S.notes].sort((a, b) => time(b.updated) - time(a.updated) || newest(a, b)).slice(0, 8).map(n => ({ n, snip: '' }));
  const res = [], whole = fold(q.trim());
  for (const n of S.notes) {
    const F = folded(n), body = plainText(n);
    let score = 0, ok = true;
    for (const t of terms) { if (F.title.includes(t)) score += 10; else if (F.meta.includes(t)) score += 5; else if (F.body.includes(t)) score += 1; else { ok = false; break; } }
    if (!ok) continue;
    if (F.title.startsWith(whole)) score += 20;
    const at = F.body.indexOf(terms[0]);
    const snip = at < 0 ? markTerms(n.summary || body.slice(0, 140), terms) : (at > 60 ? '…' : '') + markTerms(body.slice(Math.max(0, at - 60), at + 110), terms) + '…';
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
    <p class="results-label">Newest</p><ul class="results" role="listbox"></ul></div>`;
  document.body.append(ov);
  const input = $('input', ov), ul = $('.results', ov), label = $('.results-label', ov);
  let items = [], sel = 0;
  const draw = () => {
    items = search(input.value.trim()); sel = 0;
    label.textContent = input.value.trim() ? `${plural(items.length, 'result', 'results')}` : 'Newest';
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

/* ---------------- maths helpers ---------------- */
const EQREF = 'a[data-mjx-href^="#mjx-eqn"], a[href^="#mjx-eqn"]';
function eqTarget(a) {
  const id = decodeURIComponent((a.getAttribute('data-mjx-href') || a.getAttribute('href')).slice(1)), t = document.getElementById(id);
  return t && (t.closest('.math-d') || t.closest('mjx-container') || t);
}
let eqTip = null;
function showEqTip(a) {
  const t = eqTarget(a); if (!t) return;
  if (!eqTip) { eqTip = document.createElement('div'); eqTip.className = 'eq-tip prose'; document.body.append(eqTip); }
  eqTip.innerHTML = ''; eqTip.append(t.cloneNode(true)); eqTip.hidden = false;
  const b = a.getBoundingClientRect(), w = eqTip.offsetWidth, h = eqTip.offsetHeight;
  let top = b.top - h - 8; if (top < 8) top = b.bottom + 8;
  eqTip.style.top = top + 'px'; eqTip.style.left = Math.min(Math.max(8, b.left - w / 2), innerWidth - w - 8) + 'px';
}
function hideEqTip() { if (eqTip) eqTip.hidden = true; }
// Double-click any formula to copy its LaTeX.
function copyMath(container) {
  const MJ = window.MathJax; if (!MJ || !MJ.startup || !MJ.startup.document) return false;
  const item = MJ.startup.document.getMathItemsWithin(container)[0]; if (!item) return false;
  const tex = item.display ? `$$${item.math.trim()}$$` : `$${item.math.trim()}$`;
  if (navigator.clipboard) navigator.clipboard.writeText(tex).then(() => toast('LaTeX copied'), () => {});
  return true;
}
function toast(msg) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = msg; t.classList.add('is-on'); clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('is-on'), 1400);
}

/* ---------------- events ---------------- */
function bindEvents() {
  document.addEventListener('click', e => {
    const act = e.target.closest('[data-action]');
    if (act) {
      if (act.dataset.action === 'search') openSearch();
      if (act.dataset.action === 'random') {
        const here = parseHash().id, pool = S.notes.filter(n => n.id !== here && !(n.section && n.section.index === false));
        if (pool.length) location.hash = '#/' + pool[Math.floor(Math.random() * pool.length)].id;
      }
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
    // hovering an equation reference shows the equation
    document.addEventListener('pointerover', e => { const a = e.target.closest(EQREF); if (a) showEqTip(a); });
    document.addEventListener('pointerout', e => { if (e.target.closest(EQREF)) hideEqTip(); });
  }
  // \eqref links: scroll within the note (capture phase, before MathJax changes the address and the router reacts)
  document.addEventListener('click', e => {
    const a = e.target.closest(EQREF); if (!a) return;
    e.preventDefault(); e.stopPropagation(); hideEqTip();
    const t = eqTarget(a);
    if (t) { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); t.classList.add('is-flash'); setTimeout(() => t.classList.remove('is-flash'), 1400); }
  }, true);
  document.addEventListener('dblclick', e => {
    const m = e.target.closest('mjx-container');
    if (m && copyMath(m)) { const sel = getSelection(); if (sel) sel.removeAllRanges(); }
  });
  addEventListener('scroll', () => { hidePopover(); hideEqTip(); rememberScroll(); markTocCurrent(); }, { passive: true });
  addEventListener('resize', markTocCurrent, { passive: true });
}

/* ---------------- boot ---------------- */
function fail(msg) {
  document.body.innerHTML = `<main class="page page-section"><header class="fr-head"><h1>The notes didn’t load</h1><p class="home-sub">${msg}</p></header></main>`;
}
async function boot() {
  applyTheme(currentTheme());
  let cfg, data;
  // index.html starts these downloads before the libraries load; reuse them if it did
  const early = Array.isArray(window.__notebookData) && window.__notebookData.length === 2 ? window.__notebookData : null;
  try { [cfg, data] = await Promise.all(early || [getJSON('config.json'), getJSON('notes.json')]); }
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
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';   // route() restores positions itself
  addEventListener('hashchange', route);
  route();
}
if (window.COMMONPLACE_LIBRARY) {
  window.Commonplace = { S, loadLib, index, parseNote, viewNote, renderMarkdown, enhance, sourceLine, esc, slug, list, str, getJSON, matchType, placeNote, prepareSections };
} else boot();
})();

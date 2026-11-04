/* Chess page (#/chess): an analysis board and practice partner.
   - Rules and the "Classic" pieces come from chess-viewer.js (window.ChessViewer).
   - Engine: Stockfish 19 (GPLv3, github.com/nmrugg/stockfish.js). "Lite" (1.8 MB, in assets/vendor/stockfish) or
     "Full NNUE" (the full network, about 100 MB, streamed once from unpkg and then kept by the browser cache).
   - Pieces: cburnett and merida (GPLv2+, from lichess-org/lila). Opening names: lichess-org/chess-openings (CC0).
   - Opening explorer: Lichess's explorer API, which needs the visitor to connect a Lichess account (OAuth with PKCE).
   Games and analysis are kept in this browser (localStorage "cp-chess2"). */
(function () {
'use strict';
const CV = window.ChessViewer;
const VENDOR = 'assets/vendor/';
const ENGINES = {
  lite: { name: 'Stockfish 19 Lite', url: VENDOR + 'stockfish/stockfish-19-lite-single.js', hash: 64 },
  full: { name: 'Stockfish 19 Full NNUE', url: VENDOR + 'stockfish/stockfish-19-single.js#' + encodeURIComponent('https://unpkg.com/stockfish@19.0.1/bin/stockfish-19-single.wasm'), hash: 128 },
};
const STORE = 'cp-chess2', FILES = 'abcdefgh', START = CV.START;
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ================= positions ================= */
function toFEN(st) {
  let s = '';
  for (let r = 7; r >= 0; r--) {
    let e = 0;
    for (let f = 0; f < 8; f++) { const p = st.board[r * 8 + f]; if (!p) e++; else { if (e) s += e; e = 0; s += p; } }
    if (e) s += e; if (r) s += '/';
  }
  // only name an en-passant square when a capture there is actually possible (as Stockfish and PGN tools expect)
  let ep = '-';
  if (st.ep >= 0) { const pawn = st.turn === 'w' ? 'P' : 'p', r = st.ep >> 3, f = st.ep & 7, from = st.turn === 'w' ? r - 1 : r + 1;
    if ([f - 1, f + 1].some(x => x >= 0 && x < 8 && st.board[from * 8 + x] === pawn)) ep = CV.sqName(st.ep); }
  return `${s} ${st.turn} ${st.castling || '-'} ${ep} ${st.half} ${st.full}`;
}
const repKey = st => toFEN(st).split(' ').slice(0, 4).join(' ');
const openKey = st => toFEN(st).split(' ').slice(0, 2).join(' ');
const uciOf = m => CV.sqName(m.from) + CV.sqName(m.to) + (m.promo ? m.promo.toLowerCase() : '');
function moveFromUci(st, uci) {
  if (!uci || uci.length < 4) return null;
  const from = CV.sqIdx(uci.slice(0, 2)), to = CV.sqIdx(uci.slice(2, 4)), pr = uci[4];
  return CV.legalMoves(st).find(m => m.from === from && m.to === to && (!m.promo || m.promo.toLowerCase() === (pr || 'q'))) || null;
}
const sanIn = (st, m) => CV.sanOf(st, m, CV.legalMoves(st));
function insufficient(st) {
  const ps = st.board.filter(Boolean).filter(p => p.toLowerCase() !== 'k');
  if (!ps.length) return true;
  if (ps.length === 1 && /[nbNB]/.test(ps[0])) return true;
  if (ps.every(p => p.toLowerCase() === 'b')) return new Set(st.board.map((p, i) => p && p.toLowerCase() === 'b' ? ((i >> 3) + (i & 7)) % 2 : -1).filter(x => x >= 0)).size === 1;
  return false;
}
function validPosition(st) {
  const wk = st.board.filter(p => p === 'K').length, bk = st.board.filter(p => p === 'k').length;
  if (wk !== 1 || bk !== 1) return 'Each side needs exactly one king.';
  if ([0, 1, 2, 3, 4, 5, 6, 7, 56, 57, 58, 59, 60, 61, 62, 63].some(i => /[pP]/.test(st.board[i] || ''))) return 'Pawns can’t stand on the first or last rank.';
  if (CV.inCheck({ ...st, turn: st.turn === 'w' ? 'b' : 'w' })) return 'The side not to move is in check.';
  return '';
}
// White's winning chances (0–100) from centipawns, as Lichess computes them
const winPct = cp => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
const cpOf = sc => !sc ? 0 : sc.mate != null ? (sc.mate > 0 ? 10000 - sc.mate * 10 : -10000 - sc.mate * 10) : sc.cp;
const fmtScore = sc => !sc ? '…' : sc.mate != null ? (sc.mate === 0 ? '#' : `${sc.mate > 0 ? '+' : '−'}M${Math.abs(sc.mate)}`) : `${sc.cp > 0 ? '+' : sc.cp < 0 ? '−' : ''}${Math.abs(sc.cp / 100).toFixed(2)}`;
const whiteScore = (sc, turn) => !sc ? null : sc.mate != null ? { mate: turn === 'w' ? sc.mate : -sc.mate } : { cp: turn === 'w' ? sc.cp : -sc.cp };
const fmtNodes = n => n >= 1e9 ? (n / 1e9).toFixed(1) + 'G' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(n || 0);

/* ================= move tree ================= */
let nodeId = 0;
function makeNode(parent, m, st, san) {
  return { id: ++nodeId, parent, move: m || null, uci: m ? uciOf(m) : '', san: san || '', st, children: [], comment: '', nags: [], ply: parent ? parent.ply + 1 : 0 };
}
const Tree = {
  root: null,
  reset(fen) { this.root = makeNode(null, null, CV.parseFEN(fen || START)); this.root.fen0 = fen || START; return this.root; },
  add(node, m) {
    const u = uciOf(m), have = node.children.find(c => c.uci === u); if (have) return have;
    const n = makeNode(node, m, CV.makeMove(node.st, m), sanIn(node.st, m)); node.children.push(n); return n;
  },
  mainline() { const out = []; let n = this.root; while (n) { out.push(n); n = n.children[0]; } return out; },
  path(n) { const out = []; while (n) { out.unshift(n); n = n.parent; } return out; },
  isMain(n) { while (n.parent) { if (n.parent.children[0] !== n) return false; n = n.parent; } return true; },
  promote(n) { let x = n; while (x.parent) { const p = x.parent, i = p.children.indexOf(x); if (i > 0) { p.children.splice(i, 1); p.children.unshift(x); return; } x = p; } },
  remove(n) { const p = n.parent; if (!p) return null; p.children.splice(p.children.indexOf(n), 1); return p; },
  find(id) { const stack = [this.root]; while (stack.length) { const n = stack.pop(); if (n.id === id) return n; stack.push(...n.children); } return null; },
};

/* ================= PGN ================= */
const NAG_SYM = { 1: '!', 2: '?', 3: '!!', 4: '??', 5: '!?', 6: '?!' };
const SYM_NAG = Object.fromEntries(Object.entries(NAG_SYM).map(([k, v]) => [v, +k]));
function exportPGN(headers) {
  const root = Tree.root;
  const mv = (n, force) => { const st = n.parent.st; return `${st.turn === 'w' ? `${st.full}. ` : force ? `${st.full}... ` : ''}${n.san}${n.nags.map(k => NAG_SYM[k] || ` $${k}`).join('')}${n.comment ? ` {${n.comment.replace(/[{}]/g, '')}}` : ''}`; };
  function line(n, force) {
    const out = [];
    while (n) {
      out.push(mv(n, force)); force = !!n.comment;
      const p = n.parent;
      if (p.children[0] === n && p.children.length > 1) { for (const v of p.children.slice(1)) out.push(`(${line(v, true)})`); force = true; }
      n = n.children[0];
    }
    return out.join(' ');
  }
  const h = { Event: 'Analysis', Site: location.origin + location.pathname, Date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'), White: '?', Black: '?', Result: '*', ...headers };
  if (root.fen0 && root.fen0 !== START) { h.SetUp = '1'; h.FEN = root.fen0; }
  const body = (root.comment ? `{${root.comment}} ` : '') + (root.children[0] ? line(root.children[0], true) : '');
  return Object.entries(h).map(([k, v]) => `[${k} "${String(v).replace(/"/g, "'")}"]`).join('\n') + '\n\n' + `${body} ${h.Result}`.trim().replace(/(.{1,79})(\s|$)/g, '$1\n');
}
function importPGN(text) {
  text = String(text || '').trim();
  if (!text) throw new Error('Nothing to load.');
  const headers = {}; text = text.replace(/\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]/g, (_, k, v) => { headers[k] = v; return ' '; }).trim();
  if (/^[pnbrqkPNBRQK1-8]+(\/[pnbrqkPNBRQK1-8]+){7}(\s|$)/.test(text)) {
    const parts = text.split(/\s+/), fen = [parts[0], parts[1] || 'w', parts[2] || '-', parts[3] || '-', parts[4] || 0, parts[5] || 1].join(' ');
    const bad = validPosition(CV.parseFEN(fen)); if (bad) throw new Error(bad);
    Tree.reset(fen); return { headers: {}, fen };
  }
  const fen = headers.FEN || START, bad = validPosition(CV.parseFEN(fen)); if (bad) throw new Error(bad);
  Tree.reset(fen);
  const re = /\{([^}]*)\}|;[^\n]*|\(|\)|\$(\d+)|(\d+)\.(\.\.)?|(1-0|0-1|1\/2-1\/2|\*)|([!?]{1,2})|([A-Za-z][A-Za-z0-9+#=\-]*)/g;
  let cur = Tree.root, stack = [], m, count = 0, firstErr = '';
  while ((m = re.exec(text))) {
    if (m[1] !== undefined) { cur.comment = (cur.comment ? cur.comment + ' ' : '') + m[1].trim(); continue; }
    const t = m[0];
    if (t === '(') { stack.push(cur); cur = cur.parent || cur; continue; }
    if (t === ')') { cur = stack.pop() || cur; continue; }
    if (m[2]) { if (cur.move) cur.nags.push(+m[2]); continue; }
    if (m[3] || m[5] || t[0] === ';') continue;
    if (m[6]) { if (cur.move && SYM_NAG[m[6]]) cur.nags.push(SYM_NAG[m[6]]); continue; }
    if (m[7]) {
      const tok = m[7].replace(/^0-0-0/, 'O-O-O').replace(/^0-0/, 'O-O');
      const found = CV.findMove(cur.st, tok) || (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(tok) && { m: moveFromUci(cur.st, tok) });
      if (!found || !found.m) { firstErr = firstErr || `couldn’t read “${tok}” after ${count} moves`; if (!stack.length) break; continue; }
      cur = Tree.add(cur, found.m); count++;
    }
  }
  return { headers, fen, warning: firstErr };
}

/* ================= engine ================= */
class Engine {
  constructor(kind) {
    this.kind = kind; this.w = new Worker(ENGINES[kind].url); this.handlers = new Set(); this.busy = null; this.queue = Promise.resolve(); this.latest = 0;
    this.w.onmessage = e => { const line = typeof e.data === 'string' ? e.data : ''; for (const h of [...this.handlers]) h(line); };
    this.w.onerror = e => { this.failed = e.message || 'the engine could not start'; for (const h of [...this.handlers]) h('error'); };
    this.ready = this.wait('uci', 'uciok').then(() => { this.send(`setoption name Hash value ${ENGINES[kind].hash}`); return this.wait('isready', 'readyok'); });
  }
  send(c) { this.w.postMessage(c); }
  wait(cmd, token) {
    return new Promise((res, rej) => {
      const h = line => { if (line === 'error') { this.handlers.delete(h); rej(new Error(this.failed)); } else if (line.startsWith(token)) { this.handlers.delete(h); res(line); } };
      this.handlers.add(h); if (cmd) this.send(cmd);
    });
  }
  async stop() { if (this.busy) { this.send('stop'); await this.busy.catch(() => {}); } }
  // one search at a time. Analysis searches are "cancellable": a newer one stops them at once.
  search(fen, { opts = {}, go = 'go depth 18', multipv = 1, onInfo, cancellable = false } = {}) {
    const token = ++this.latest;
    if (this.busy && this.busyCancel) this.send('stop');   // anything newer ends a running analysis (which may be infinite)
    const run = async () => {
      await this.ready; await this.stop();
      if (cancellable && token !== this.latest) return { best: null, lines: [], cancelled: true };
      for (const [k, v] of Object.entries({ MultiPV: multipv, ...opts })) this.send(`setoption name ${k} value ${v}`);
      await this.wait('isready', 'readyok');
      if (cancellable && token !== this.latest) return { best: null, lines: [], cancelled: true };
      const lines = [], stats = {};
      const p = new Promise((res, rej) => {
        const h = line => {
          if (line === 'error') { this.handlers.delete(h); return rej(new Error(this.failed)); }
          if (line.startsWith('info')) {
            const g = k => { const mm = line.match(new RegExp(` ${k} (-?\\d+)`)); return mm ? +mm[1] : null; };
            for (const k of ['nodes', 'nps', 'time', 'hashfull', 'seldepth']) { const v = g(k); if (v != null) stats[k] = v; }
            if (!line.includes(' pv ')) return;
            const sc = line.match(/ score (cp|mate) (-?\d+)/); if (!sc) return;
            lines[(g('multipv') || 1) - 1] = { depth: g('depth'), score: sc[1] === 'cp' ? { cp: +sc[2] } : { mate: +sc[2] }, pv: line.split(' pv ')[1].trim().split(' ') };
            stats.depth = Math.max(stats.depth || 0, g('depth') || 0);
            if (onInfo) onInfo(lines.slice(), { ...stats });
          } else if (line.startsWith('bestmove')) { this.handlers.delete(h); res({ best: line.split(' ')[1], lines, stats }); }
        };
        this.handlers.add(h);
      });
      this.busy = p; this.busyCancel = cancellable;
      this.send(`position fen ${fen}`); this.send(go);
      if (cancellable && token !== this.latest) this.send('stop');   // something newer was asked for while this one was starting
      try { return await p; } finally { if (this.busy === p) this.busy = null; }
    };
    return (this.queue = this.queue.then(run, run));
  }
}

/* ================= opponents and clocks ================= */
const LEVELS = [
  { id: 'beginner', name: 'Beginner', rating: '400', depth: 1, multipv: 6, random: 0.3, temp: 160, skill: 0 },
  { id: 'novice', name: 'Novice', rating: '800', depth: 2, multipv: 5, random: 0.12, temp: 90, skill: 0 },
  { id: 'casual', name: 'Casual', rating: '1100', depth: 4, multipv: 4, random: 0.04, temp: 50, skill: 3 },
  { id: 'club', name: 'Club', rating: '1500', elo: 1500 },
  { id: 'strong', name: 'Strong club', rating: '1900', elo: 1900 },
  { id: 'expert', name: 'Expert', rating: '2200', elo: 2200 },
  { id: 'im', name: 'Int. Master', rating: '2450', elo: 2450 },
  { id: 'gm', name: 'Grandmaster', rating: '2650', elo: 2650 },
  { id: 'elite', name: 'Elite GM', rating: '2850', elo: 2850 },
  { id: 'max', name: 'Stockfish', rating: 'Full strength', full: true },
  { id: 'custom', name: 'Custom', rating: '', custom: true },
];
const FULL = { UCI_LimitStrength: 'false', 'Skill Level': 20 };
const CLOCKS = [['none', '∞', 'Unlimited'], ['1+0', '1+0', 'Bullet'], ['2+1', '2+1', 'Bullet'], ['3+0', '3+0', 'Blitz'], ['3+2', '3+2', 'Blitz'], ['5+3', '5+3', 'Blitz'], ['10+0', '10+0', 'Rapid'], ['15+10', '15+10', 'Rapid'], ['30+20', '30+20', 'Classical'], ['90+30', '90+30', 'Classical'], ['custom', 'Custom', '…']];

/* ================= review ================= */
const CLASSES = {
  book: { label: 'Book', sym: 'B', col: '#a88865' }, great: { label: 'Great', sym: '!', col: '#5b8bb4' },
  best: { label: 'Best', sym: '★', col: '#5c8b2f' }, excellent: { label: 'Excellent', sym: '✓', col: '#77a33d' },
  good: { label: 'Good', sym: '·', col: '#8fa77a' }, inaccuracy: { label: 'Inaccuracy', sym: '?!', col: '#e2b23c' },
  mistake: { label: 'Mistake', sym: '?', col: '#e58f2a' }, miss: { label: 'Miss', sym: '×', col: '#d4573b' },
  blunder: { label: 'Blunder', sym: '??', col: '#ca3431' },
};
const moveAccuracy = loss => Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * Math.max(0, loss)) - 3.1669));

/* ================= state ================= */
const DEFAULT_PREFS = {
  theme: 'brown', pieces: 'cburnett', coords: true, anim: 'normal', legal: true, sound: true, autoQueen: false, size: 100,
  engine: 'lite', multipv: 3, depth: 'infinite', arrows: true, level: 'gm', customElo: 2000, color: 'w', clock: '5+3', customMins: 5, customInc: 3, premove: true,
};
const App = {
  root: null, engines: {}, openings: null, prefs: { ...DEFAULT_PREFS },
  mode: 'analyse', node: null, flip: false, headers: {}, game: null, review: null,
  ana: { on: true, lines: [], stats: {}, fen: '', done: false, threat: null, threatOn: false },
  arrows: [], marks: [], hint: null, sel: -1, drag: null, drawing: null, premove: null, timer: 0,
  edit: null, explorer: { on: false, db: 'masters', data: null, fen: '', error: '' }, tb: null, tbFen: '',
};
const curSt = () => App.node.st;
const tip = () => { let n = App.node; while (n.children[0]) n = n.children[0]; return n; };

function savePrefs() { try { localStorage.setItem(STORE + '-prefs', JSON.stringify(App.prefs)); } catch (e) {} }
function save() {
  try {
    const R = App.review && App.review.done ? { ...App.review, byId: undefined, path: Tree.mainline().map(n => R0(n)) } : null;
    localStorage.setItem(STORE, JSON.stringify({ pgn: exportPGN({}), path: Tree.path(App.node).slice(1).map(n => n.parent.children.indexOf(n)), mode: App.mode === 'edit' ? 'analyse' : App.mode, flip: App.flip,
      game: App.game && { ...App.game, turnStart: 0 }, headers: App.headers, review: R }));
  } catch (e) {}
  function R0(n) { return App.review.byId[n.id] || ''; }
}
function load() {
  try { App.prefs = { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(STORE + '-prefs') || '{}') }; } catch (e) {}
  let d = null; try { d = JSON.parse(localStorage.getItem(STORE)); } catch (e) {}
  Tree.reset(START); App.node = Tree.root;
  if (!d) return;
  try { importPGN(d.pgn); } catch (e) { Tree.reset(START); }
  let n = Tree.root; for (const i of d.path || []) { if (!n.children[i]) break; n = n.children[i]; }
  App.node = n; App.mode = ['play', 'analyse', 'review'].includes(d.mode) ? d.mode : 'analyse';
  App.flip = !!d.flip; App.game = d.game || null; App.headers = d.headers || {};
  const line = Tree.mainline();
  if (d.review && d.review.path && d.review.path.length === line.length) { App.review = { ...d.review, byId: {} }; line.forEach((x, i) => { if (d.review.path[i]) App.review.byId[x.id] = d.review.path[i]; }); }
}

/* ================= sound ================= */
let audio = null;
function tock(kind) {
  if (!App.prefs.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime, len = { move: 0.07, capture: 0.11, check: 0.12, end: 0.45, low: 0.08 }[kind] || 0.07;
    // a short burst of filtered noise sounds like wood on wood
    const buf = audio.createBuffer(1, Math.ceil(audio.sampleRate * len), audio.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, kind === 'capture' ? 2 : 4);
    const src = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.frequency.value = { move: 1200, capture: 700, check: 1700, end: 420, low: 2400 }[kind] || 1200; f.Q.value = kind === 'end' ? 2 : 1.2;
    g.gain.value = 0.9; src.connect(f).connect(g).connect(audio.destination); src.start(t);
    if (kind === 'end' || kind === 'check') { const o = audio.createOscillator(), og = audio.createGain(); o.frequency.value = kind === 'end' ? 392 : 880; og.gain.setValueAtTime(0.07, t); og.gain.exponentialRampToValueAtTime(0.0001, t + len); o.connect(og).connect(audio.destination); o.start(t); o.stop(t + len); }
  } catch (e) {}
}

/* ================= layout ================= */
const I = {
  first: '<svg viewBox="0 0 24 24"><path d="M6 5v14M18 6l-8 6 8 6z"/></svg>', prev: '<svg viewBox="0 0 24 24"><path d="M15 6l-7 6 7 6z"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M9 6l7 6-7 6z"/></svg>', last: '<svg viewBox="0 0 24 24"><path d="M18 5v14M6 6l8 6-8 6z"/></svg>',
  flip: '<svg viewBox="0 0 24 24"><path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
};
function shell() {
  return `<div class="cx" data-theme-board="${App.prefs.theme}" data-pieces="${App.prefs.pieces}" data-anim="${App.prefs.anim}" style="--cx-size:${App.prefs.size}%">
  <div class="cx-main">
    <div class="cx-strip cx-top"></div>
    <div class="cx-boardrow">
      <div class="cx-evalbar" aria-hidden="true"><div class="cx-evalfill"></div><span class="cx-evaltxt"></span></div>
      <div class="cx-board" tabindex="0" aria-label="Chess board"><div class="cx-sqs"></div><div class="cx-pcs"></div><svg class="cx-arrows" viewBox="0 0 800 800" aria-hidden="true"></svg><div class="cx-promo" hidden></div><div class="cx-over" hidden></div></div>
    </div>
    <div class="cx-strip cx-bottom"></div>
    <div class="cx-under">
      <div class="cx-navbtns"><button data-c="first" title="Start (↑)">${I.first}</button><button data-c="prev" title="Back (←)">${I.prev}</button><button data-c="next" title="Forward (→)">${I.next}</button><button data-c="last" title="End (↓)">${I.last}</button></div>
      <input class="cx-type" type="text" placeholder="Type a move: Nf3, e4, e7e8q" aria-label="Type a move" autocomplete="off" spellcheck="false">
      <div class="cx-navbtns"><button data-c="flip" title="Flip board (F)">${I.flip}</button><button data-c="settings" title="Settings">${I.gear}</button></div>
    </div>
  </div>
  <aside class="cx-side">
    <div class="cx-tabs" role="tablist">${[['play', 'Play'], ['analyse', 'Analysis'], ['review', 'Review'], ['edit', 'Editor']].map(([m, n]) => `<button role="tab" data-mode="${m}">${n}</button>`).join('')}</div>
    <div class="cx-panel"></div>
  </aside></div>`;
}

/* ================= board ================= */
let pieceCssDone = false;
function pieceCss() {
  if (pieceCssDone) return; pieceCssDone = true;
  let css = '';
  for (const set of ['cburnett', 'merida']) for (const c of 'wb') for (const t of 'KQRBNP') {
    const p = c === 'w' ? t : t.toLowerCase();
    css += `.cx[data-pieces="${set}"] .cx-pc[data-p="${p}"],.cx-piece-${set}-${c}${t}{background-image:url("${VENDOR}pieces/${set}/${c}${t}.svg")}\n`;
  }
  const s = document.createElement('style'); s.textContent = css; document.head.append(s);
}
const pieceInner = p => App.prefs.pieces === 'classic' ? CV.pieceSVG(p) : '';
const pieceIcon = p => App.prefs.pieces === 'classic' ? `<span class="cx-icon">${CV.pieceSVG(p)}</span>` : `<span class="cx-icon cx-piece-${App.prefs.pieces}-${p === p.toUpperCase() ? 'w' : 'b'}${p.toUpperCase()}"></span>`;
const sqXY = s => { const f = s & 7, r = s >> 3; return App.flip ? [7 - f, r] : [f, 7 - r]; };
const xyToSq = (x, y) => App.flip ? (y * 8 + (7 - x)) : ((7 - y) * 8 + x);
function drawSquares() {
  const b = $('.cx-sqs', App.root); let h = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const s = xyToSq(x, y), light = ((s >> 3) + (s & 7)) % 2 === 1;
    h += `<div class="cx-sq ${light ? 'l' : 'd'}" data-sq="${s}" style="left:${x * 12.5}%;top:${y * 12.5}%">${App.prefs.coords && x === 0 ? `<i class="cx-rk">${(s >> 3) + 1}</i>` : ''}${App.prefs.coords && y === 7 ? `<i class="cx-fl">${FILES[s & 7]}</i>` : ''}</div>`;
  }
  b.innerHTML = h;
  $('.cx-pcs', App.root).innerHTML = ''; App._prev = null;
}
function drawPieces(animate) {
  const st = App.edit ? App.edit.st : curSt(), layer = $('.cx-pcs', App.root), have = new Map();
  for (const e of $$('.cx-pc', layer)) { if (have.has(e.dataset.k) || e.classList.contains('is-drag')) e.remove(); else have.set(e.dataset.k, e); }
  const prev = App._prev || [], now = st.board, used = new Set(), keep = [];
  const m = animate && !App.edit && App.node.move;
  for (let i = 0; i < 64; i++) {
    const p = now[i]; if (!p) continue;
    let k = null;
    if (prev[i] === p && have.has(`${i}`)) k = `${i}`;
    else if (m && i === m.to && have.has(`${m.from}`)) k = `${m.from}`;
    else if (m && m.castle) { const r0 = m.castle === 'K' ? m.from + 3 : m.from - 4, r1 = m.castle === 'K' ? m.from + 1 : m.from - 1; if (i === r1 && have.has(`${r0}`)) k = `${r0}`; }
    let el = k && !used.has(k) ? have.get(k) : null; if (el) used.add(k);
    if (!el) { el = document.createElement('div'); el.className = 'cx-pc'; }
    if (el.dataset.p !== p) { el.dataset.p = p; el.innerHTML = pieceInner(p); }
    const [x, y] = sqXY(i); el.style.transform = `translate(${x * 100}%,${y * 100}%)`; el.dataset.sq = i; keep.push([el, `${i}`]);
  }
  const keepSet = new Set(keep.map(x => x[0]));
  for (const e of $$('.cx-pc', layer)) if (!keepSet.has(e)) e.remove();
  for (const [el, k] of keep) { el.dataset.k = k; if (!el.isConnected) layer.append(el); }
  App._prev = now.slice();
  drawMarks();
}
function drawMarks() {
  if (!App.root) return;
  const st = App.edit ? App.edit.st : curSt();
  for (const q of $$('.cx-sq', App.root)) { q.className = q.className.replace(/ (last|sel|dot|cap|check|pm|mk-\w+)/g, ''); const b = q.querySelector('.cx-badge'); if (b) b.remove(); }
  const sq = n => $(`.cx-sq[data-sq="${n}"]`, App.root);
  if (!App.edit) {
    const m = App.node.move;
    if (m) { sq(m.from).classList.add('last'); sq(m.to).classList.add('last'); }
    const c = App.review && App.review.done && App.review.byId[App.node.id];
    if (m && c && CLASSES[c]) { const b = document.createElement('span'); b.className = 'cx-badge'; b.style.background = CLASSES[c].col; b.textContent = CLASSES[c].sym; b.title = CLASSES[c].label; sq(m.to).append(b); }
    if (CV.inCheck(st)) { const k = st.board.indexOf(st.turn === 'w' ? 'K' : 'k'); if (k >= 0) sq(k).classList.add('check'); }
    if (App.premove) { sq(App.premove.from).classList.add('pm'); sq(App.premove.to).classList.add('pm'); }
    for (const mk of App.marks) sq(mk.sq).classList.add('mk-' + mk.col);
    if (App.sel >= 0) {
      sq(App.sel).classList.add('sel');
      if (App.prefs.legal) {
        const mv = canPremove() ? premoveTargets(App.sel) : CV.legalMoves(st).filter(x => x.from === App.sel);
        for (const x of mv) sq(x.to).classList.add(x.capture || st.board[x.to] ? 'cap' : 'dot');
      }
    }
  }
  drawArrows();
}
function arrowGeom(from, to) {
  const [x1, y1] = sqXY(from), [x2, y2] = sqXY(to), c = v => v * 100 + 50;
  const knight = (Math.abs(x2 - x1) === 1 && Math.abs(y2 - y1) === 2) || (Math.abs(x2 - x1) === 2 && Math.abs(y2 - y1) === 1);
  return knight ? [[c(x1), c(y1)], Math.abs(x2 - x1) === 2 ? [c(x2), c(y1)] : [c(x1), c(y2)], [c(x2), c(y2)]] : [[c(x1), c(y1)], [c(x2), c(y2)]];
}
const ARROW_COL = { g: '#15781b', r: '#882020', b: '#003088', y: '#e68f00', e: '#1f6fd1', h: '#e6a400', v: '#5c8b2f' };
function drawArrows() {
  const svg = $('.cx-arrows', App.root); if (!svg) return; let h = '';
  const arrow = (from, to, col, w = 15, op = 0.8) => {
    const pts = arrowGeom(from, to), n = pts.length, [ax, ay] = pts[n - 2], [bx, by] = pts[n - 1];
    const ang = Math.atan2(by - ay, bx - ax), head = w * 2.1, ex = bx - Math.cos(ang) * head, ey = by - Math.sin(ang) * head;
    const [sx, sy] = pts[0], [tx, ty] = pts[1], a0 = Math.atan2(ty - sy, tx - sx), s0 = [sx + Math.cos(a0) * 26, sy + Math.sin(a0) * 26];
    const d = `M${s0[0]},${s0[1]} ` + pts.slice(1, -1).map(p => `L${p[0]},${p[1]} `).join('') + `L${ex},${ey}`;
    const hw = w * 1.5, p1 = [ex + Math.cos(ang + Math.PI / 2) * hw, ey + Math.sin(ang + Math.PI / 2) * hw], p2 = [ex + Math.cos(ang - Math.PI / 2) * hw, ey + Math.sin(ang - Math.PI / 2) * hw];
    h += `<g opacity="${op}"><path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linejoin="round"/><polygon points="${p1.join(',')} ${bx - Math.cos(ang) * 4},${by - Math.sin(ang) * 4} ${p2.join(',')}" fill="${col}"/></g>`;
  };
  if (!App.edit) {
    const st = curSt(), fen = toFEN(st);
    if (App.mode === 'analyse' && App.ana.on && App.prefs.arrows && App.ana.fen === fen) {
      App.ana.lines.slice(0, App.prefs.multipv).forEach((l, i) => { const m = l && moveFromUci(st, l.pv[0]); if (m) arrow(m.from, m.to, ARROW_COL.e, i ? 10 : 16, i ? 0.4 : 0.75); });
      const t = App.ana.threat; if (App.ana.threatOn && t && t.fen === fen) { const m = moveFromUci(t.st, t.best); if (m) arrow(m.from, m.to, ARROW_COL.r, 13, 0.7); }
    }
    if (App.mode === 'review' && App.review && App.review.done && App.node.children[0]) { const e = App.review.byFen[fen], m = e && moveFromUci(st, e.best); if (m) arrow(m.from, m.to, ARROW_COL.v, 14, 0.75); }
    if (App.hint && App.hint.fen === fen) arrow(App.hint.m.from, App.hint.m.to, ARROW_COL.h, 16, 0.85);
    if (App.premove) arrow(App.premove.from, App.premove.to, '#7b6c9e', 10, 0.55);
    for (const a of App.arrows) arrow(a.from, a.to, ARROW_COL[a.col], 15, 0.8);
    if (App.drawing && App.drawing.to >= 0 && App.drawing.to !== App.drawing.from) arrow(App.drawing.from, App.drawing.to, ARROW_COL[App.drawing.col], 15, 0.5);
  }
  svg.innerHTML = h;
}

/* ================= interaction ================= */
function canMove(st) {
  if (App.mode === 'review' || App.edit) return false;
  if (App.mode === 'play') { const g = App.game; return g && !g.over && App.node === tip() && st.turn === g.color; }
  return true;
}
function canPremove() { const g = App.game; return App.mode === 'play' && g && !g.over && App.prefs.premove && App.node === tip() && curSt().turn !== g.color; }
function premoveTargets(from) { const st = curSt(), out = []; for (let to = 0; to < 64; to++) if (to !== from && reach(st, from, to)) out.push({ from, to }); return out; }
function reach(st, from, to) {
  // where a piece could go if the board stayed as it is, ignoring blockers and checks: enough to accept a premove
  const pc = st.board[from]; if (!pc) return false;
  const p = pc.toLowerCase(), w = pc === pc.toUpperCase(), df = (to & 7) - (from & 7), dr = (to >> 3) - (from >> 3), adf = Math.abs(df), adr = Math.abs(dr);
  const own = st.board[to] && (st.board[to] === st.board[to].toUpperCase()) === w; if (own) return false;
  if (p === 'n') return (adf === 1 && adr === 2) || (adf === 2 && adr === 1);
  if (p === 'k') return (adf <= 1 && adr <= 1) || (adr === 0 && adf === 2 && (from & 7) === 4);
  if (p === 'p') { const dir = w ? 1 : -1; return (df === 0 && (dr === dir || (dr === 2 * dir && (from >> 3) === (w ? 1 : 6)))) || (adf === 1 && dr === dir); }
  if (p === 'b') return adf === adr && adf > 0;
  if (p === 'r') return (adf === 0) !== (adr === 0);
  return (adf === adr && adf > 0) || ((adf === 0) !== (adr === 0));
}
function squareAt(ev) {
  const r = $('.cx-board', App.root).getBoundingClientRect();
  const x = Math.floor((ev.clientX - r.left) / r.width * 8), y = Math.floor((ev.clientY - r.top) / r.height * 8);
  return x < 0 || y < 0 || x > 7 || y > 7 ? -1 : xyToSq(x, y);
}
const drawColour = e => e.shiftKey && e.altKey ? 'y' : e.shiftKey || e.ctrlKey ? 'r' : e.altKey ? 'b' : 'g';
function bindBoard() {
  const board = $('.cx-board', App.root);
  board.addEventListener('contextmenu', e => e.preventDefault());
  board.addEventListener('pointerdown', e => {
    if (!$('.cx-promo', App.root).hidden) return;
    const s = squareAt(e); if (s < 0) return;
    if (App.edit) { board.setPointerCapture(e.pointerId); return editPointer(e, s); }
    if (e.button === 2) { App.drawing = { from: s, to: s, col: drawColour(e) }; if (App.premove) { App.premove = null; drawMarks(); } return; }
    if (e.button !== 0) return;
    if (App.arrows.length || App.marks.length) { App.arrows = []; App.marks = []; }
    const st = curSt(), p = st.board[s];
    if (App.sel >= 0 && App.sel !== s && tryMove(App.sel, s)) return;
    const mine = p && (p === p.toUpperCase() ? 'w' : 'b');
    const movable = p && ((canMove(st) && mine === st.turn) || (canPremove() && mine === App.game.color));
    if (movable) {
      App.sel = s; drawMarks();
      const el = $(`.cx-pc[data-sq="${s}"]`, App.root); if (!el) return;
      App.drag = { s, el, r: board.getBoundingClientRect(), moved: false, x0: e.clientX, y0: e.clientY };
      board.setPointerCapture(e.pointerId);
    } else { App.sel = -1; if (App.premove) App.premove = null; drawMarks(); }
  });
  board.addEventListener('pointermove', e => {
    if (App.edit) return editMove(e);
    if (App.drawing) { const s = squareAt(e); if (s !== App.drawing.to) { App.drawing.to = s; drawArrows(); } return; }
    const d = App.drag; if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 4) return;
    if (!d.moved) { d.moved = true; d.el.classList.add('is-drag'); }
    const sz = d.r.width / 8; d.el.style.transform = `translate(${e.clientX - d.r.left - sz / 2}px,${e.clientY - d.r.top - sz / 2}px)`;
    const s = squareAt(e); const old = $('.cx-sq.hover', App.root); if (old) old.classList.remove('hover'); if (s >= 0) $(`.cx-sq[data-sq="${s}"]`, App.root).classList.add('hover');
  });
  const end = e => {
    if (App.edit) return editUp(e);
    const hv = $('.cx-sq.hover', App.root); if (hv) hv.classList.remove('hover');
    if (App.drawing) {
      const { from, to, col } = App.drawing; App.drawing = null;
      if (to === from) { const i = App.marks.findIndex(m => m.sq === from); i >= 0 ? App.marks.splice(i, 1) : App.marks.push({ sq: from, col }); }
      else if (to >= 0) { const i = App.arrows.findIndex(a => a.from === from && a.to === to); i >= 0 ? App.arrows.splice(i, 1) : App.arrows.push({ from, to, col }); }
      drawMarks(); return;
    }
    const d = App.drag; if (!d) return; App.drag = null;
    d.el.classList.remove('is-drag');
    const s = squareAt(e);
    if (d.moved && s >= 0 && s !== d.s && tryMove(d.s, s)) return;
    const [x, y] = sqXY(d.s); d.el.style.transform = `translate(${x * 100}%,${y * 100}%)`;
    if (d.moved) { App.sel = -1; drawMarks(); }
  };
  board.addEventListener('pointerup', end); board.addEventListener('pointercancel', end);
  board.addEventListener('wheel', e => { if (App.edit || App.mode === 'play') return; e.preventDefault(); step(e.deltaY > 0 ? 1 : -1); }, { passive: false });
}
function tryMove(from, to) {
  const st = curSt();
  if (canPremove()) {
    const pc = st.board[from]; if (!pc || (pc === pc.toUpperCase() ? 'w' : 'b') !== App.game.color || !reach(st, from, to)) return false;
    App.premove = { from, to }; App.sel = -1; drawMarks(); return true;
  }
  const cands = CV.legalMoves(st).filter(m => m.from === from && m.to === to);
  if (!cands.length) return false;
  App.sel = -1;
  if (cands.length > 1) { if (App.prefs.autoQueen) userMove(cands.find(c => /q/i.test(c.promo))); else askPromotion(cands, to); return true; }
  userMove(cands[0]); return true;
}
function askPromotion(cands, to) {
  const box = $('.cx-promo', App.root), color = curSt().turn, [x, y] = sqXY(to);
  box.innerHTML = `<div class="cx-promo-col" style="left:${x * 12.5}%;${y === 0 ? 'top:0' : 'bottom:0'}">${'qnrb'.split('').map(t => { const p = color === 'w' ? t.toUpperCase() : t; return `<button data-p="${p}" aria-label="${{ q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' }[t]}">${pieceIcon(p)}</button>`; }).join('')}<button data-p="" class="cx-promo-x" aria-label="Cancel">×</button></div>`;
  box.hidden = false;
  box.onclick = e => { const b = e.target.closest('button'); box.hidden = true; const m = b && cands.find(c => c.promo === b.dataset.p); if (m) userMove(m); else drawPieces(false); };
}
function userMove(m) {
  App.hint = null; App.arrows = []; App.marks = [];
  App.node = Tree.add(App.node, m);
  if (App.mode === 'play') { clockMoved(); moved(true); checkEnd(); if (!App.game.over) botMove(); return; }
  moved(true);
}
function moved(animate) {
  const n = App.node, st = n.st;
  if (n.move) tock(CV.statusOf(st) === 'mate' ? 'end' : CV.inCheck(st) ? 'check' : n.move.capture ? 'capture' : 'move');
  render(animate); save();
}
function goTo(n, sound) {
  if (!n || n === App.node) return;
  const fwd = n.parent === App.node; App.node = n; App.sel = -1; App.arrows = []; App.marks = []; App.premove = null;
  if (fwd && sound !== false) tock(n.move.capture ? 'capture' : 'move');
  render(fwd); save();
}
function step(d) {
  if (App.mode === 'play' && App.game && !App.game.over && d > 0 && App.node === tip()) return;
  if (d > 0) goTo(App.node.children[0]); else if (App.node.parent) goTo(App.node.parent);
}
function bindTyping() {
  const inp = $('.cx-type', App.root);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Escape') { inp.value = ''; inp.blur(); return; }
    if (e.key !== 'Enter') return;
    const t = inp.value.trim(); if (!t) return;
    const st = curSt(), bad = () => { inp.classList.add('bad'); setTimeout(() => inp.classList.remove('bad'), 600); };
    if (!canMove(st)) return bad();
    const norm = t.replace(/^[0o]-[0o]-[0o]$/i, 'O-O-O').replace(/^[0o]-[0o]$/i, 'O-O');
    const f = CV.findMove(st, norm) || CV.findMove(st, norm.charAt(0).toUpperCase() + norm.slice(1)) || (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(t) && { m: moveFromUci(st, t.toLowerCase()) });
    if (f && f.m) { inp.value = ''; userMove(f.m); } else bad();
  });
}

/* ================= playing ================= */
const levelOf = g => LEVELS.find(l => l.id === g.level) || LEVELS[0];
function levelName(g) { const l = levelOf(g); return l.custom ? `Stockfish ${g.elo}` : l.full ? 'Stockfish' : `${l.name} · ${l.rating}`; }
function newGame(fromFen) {
  const p = App.prefs, color = p.color === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : p.color;
  Tree.reset(fromFen || START);
  App.node = Tree.root; App.review = null; App.hint = null; App.premove = null; App.mode = 'play'; App.flip = color === 'b'; App.msg = '';
  const [mins, inc] = p.clock === 'none' ? [0, 0] : p.clock === 'custom' ? [+p.customMins || 5, +p.customInc || 0] : p.clock.split('+').map(Number);
  App.game = { color, level: p.level, elo: +p.customElo || 2000, clock: p.clock !== 'none', base: mins * 60000, inc: inc * 1000, times: [mins * 60000, mins * 60000],
    running: Tree.root.st.turn === 'w' ? 0 : 1, turnStart: Date.now(), over: false, result: '', reason: '', engine: p.engine, moves: 0 };
  const opp = levelName(App.game);
  App.headers = { Event: 'Practice game', White: color === 'w' ? 'You' : opp, Black: color === 'b' ? 'You' : opp, TimeControl: mins ? `${mins * 60}+${inc}` : '-', Result: '*' };
  App.overClosed = false; drawSquares(); render(); save();
  if (Tree.root.st.turn !== color) botMove();
}
const clockOn = () => App.game && App.game.clock && !App.game.over;
function tickClock() {
  const g = App.game; if (!clockOn()) return;
  const side = g.running, now = Date.now();
  if (g.turnStart && g.moves > 0) g.times[side] -= now - g.turnStart;   // the clock starts after the first move
  g.turnStart = now;
  if (g.times[side] <= 10000 && !g['low' + side] && side === (g.color === 'w' ? 0 : 1)) { g['low' + side] = true; tock('low'); }
  if (g.times[side] <= 0) {
    g.times[side] = 0; const winner = side === 0 ? 'b' : 'w';
    const ps = tip().st.board.filter(p => p && (p === p.toUpperCase()) === (winner === 'w') && p.toLowerCase() !== 'k');
    const canMate = ps.some(p => /[pqrPQR]/.test(p)) || ps.length >= 2;
    endGame(canMate ? (winner === 'w' ? '1-0' : '0-1') : '1/2-1/2', canMate ? 'time' : 'timeout vs insufficient material');
  }
  if (App.root) drawStrips();
}
function clockMoved() {
  const g = App.game; if (!g || g.over) return;
  if (g.clock) { tickClock(); if (g.over) return; const moved = App.node.st.turn === 'w' ? 1 : 0; if (g.moves > 0) g.times[moved] += g.inc; g.running = 1 - moved; g.turnStart = Date.now(); }
  g.moves++;
}
async function botMove() {
  const g = App.game; if (!g || g.over) return;
  const start = App.node, st = start.st; if (st.turn === g.color) return;
  App.thinking = true; drawStrips();
  const lv = levelOf(g), fen = toFEN(st), legal = CV.legalMoves(st), eng = await engine(g.engine);
  let uci = null, evalW = null;
  try {
    if (lv.depth) {
      const minDelay = wait(300 + Math.random() * 600);
      const r = await eng.search(fen, { opts: { UCI_LimitStrength: 'false', 'Skill Level': lv.skill }, multipv: lv.multipv, go: `go depth ${lv.depth}` });
      await minDelay;
      if (Math.random() < lv.random) uci = uciOf(legal[Math.floor(Math.random() * legal.length)]);
      else {
        const ls = r.lines.filter(Boolean), best = Math.max(...ls.map(l => cpOf(l.score))), ws = ls.map(l => Math.exp((cpOf(l.score) - best) / lv.temp)), tot = ws.reduce((a, b) => a + b, 0);
        let x = Math.random() * tot; for (let i = 0; i < ls.length; i++) { x -= ws[i]; if (x <= 0) { uci = ls[i].pv[0]; break; } }
        uci = uci || r.best;
      }
      evalW = r.lines[0] && whiteScore(r.lines[0].score, st.turn);
    } else {
      const opts = lv.full ? FULL : { UCI_LimitStrength: 'true', UCI_Elo: lv.custom ? Math.max(1320, Math.min(3190, g.elo)) : lv.elo, 'Skill Level': 20 };
      // with a clock it manages its own time like a player; without one it takes a fixed think
      const go = g.clock ? `go wtime ${Math.max(50, Math.round(g.times[0]))} btime ${Math.max(50, Math.round(g.times[1]))} winc ${g.inc} binc ${g.inc}` : `go movetime ${lv.full ? 3000 : 1500}`;
      const r = await eng.search(fen, { opts, go });
      uci = r.best; evalW = r.lines[0] && whiteScore(r.lines[0].score, st.turn);
    }
  } catch (e) { App.thinking = false; showError(e); return; }
  App.thinking = false;
  if (!App.root || App.game !== g || g.over || App.node !== start) { if (App.root) drawStrips(); return; }
  g.botEval = evalW;
  App.node = Tree.add(App.node, moveFromUci(st, uci) || legal[0]); clockMoved(); moved(true); checkEnd();
  // a premove made while the engine thought is played at once, if it is legal now
  if (App.premove && !g.over) {
    const pm = App.premove; App.premove = null;
    const cands = CV.legalMoves(App.node.st).filter(x => x.from === pm.from && x.to === pm.to);
    if (cands.length) { App.node = Tree.add(App.node, cands.find(c => !c.promo || /q/i.test(c.promo))); clockMoved(); moved(true); checkEnd(); if (!g.over) botMove(); }
    else drawMarks();
  }
}
function gameStatus(n) {
  const st = n.st, status = CV.statusOf(st);
  if (status === 'mate') return { over: true, result: st.turn === 'w' ? '0-1' : '1-0', reason: 'checkmate' };
  if (status === 'stalemate') return { over: true, result: '1/2-1/2', reason: 'stalemate' };
  if (insufficient(st)) return { over: true, result: '1/2-1/2', reason: 'insufficient material' };
  if (st.half >= 100) return { over: true, result: '1/2-1/2', reason: 'fifty-move rule' };
  const k = repKey(st); let c = 0; for (let x = n; x; x = x.parent) if (repKey(x.st) === k) c++;
  if (c >= 3) return { over: true, result: '1/2-1/2', reason: 'threefold repetition' };
  return { over: false };
}
function checkEnd() { const r = gameStatus(App.node); if (r.over) endGame(r.result, r.reason); }
function endGame(result, reason) {
  const g = App.game; if (!g || g.over) return;
  g.over = true; g.result = result; g.reason = reason; App.thinking = false; App.premove = null;
  App.headers.Result = result; App.headers.Termination = reason;
  tock('end'); save(); render();
}
function resultLine(g) {
  const win = (g.result === '1-0' && g.color === 'w') || (g.result === '0-1' && g.color === 'b');
  return { head: g.reason === 'abort' ? 'Game aborted' : g.result === '1/2-1/2' ? 'Draw' : win ? 'You won' : 'Stockfish won',
    why: { checkmate: 'by checkmate', resignation: 'by resignation', time: 'on time', agreement: 'by agreement', abort: '' }[g.reason] ?? g.reason,
    score: g.reason === 'abort' ? '–' : g.result.replace('1/2-1/2', '½–½').replace('-', '–') };
}

/* ================= analysis ================= */
let anaToken = 0;
async function engine(kind) {
  kind = kind || App.prefs.engine;
  if (!App.engines[kind]) {
    App.engines[kind] = new Engine(kind);
    App.engines[kind].ready.then(() => { App.loaded = { ...App.loaded, [kind]: true }; if (App.root) drawEngine(); }, e => { delete App.engines[kind]; showError(e); });
  }
  return App.engines[kind];
}
async function analyse() {
  if (App.mode !== 'analyse' || !App.ana.on || App.edit) return;
  const st = curSt(), fen = toFEN(st), token = ++anaToken;
  if (App.ana.fen === fen && App.ana.lines.length) { drawEngine(); return; }
  App.ana = { ...App.ana, fen, lines: [], stats: {}, done: false };
  drawEngine();
  if (CV.statusOf(st) === 'mate' || CV.statusOf(st) === 'stalemate') { App.ana.done = true; drawEngine(); return; }
  const eng = await engine();
  const go = App.prefs.depth === 'infinite' ? 'go infinite' : `go depth ${App.prefs.depth}`;
  try {
    const res = await eng.search(fen, { opts: FULL, multipv: App.prefs.multipv, cancellable: true, go, onInfo: (lines, stats) => {
      if (token !== anaToken) return;
      App.ana.lines = lines; App.ana.stats = stats; scheduleEngineDraw();
    } });
    if (res.cancelled || token !== anaToken) return;
    App.ana.done = true; drawEngine();
  } catch (e) { showError(e); }
}
let engDrawPending = false;
function scheduleEngineDraw() { if (engDrawPending) return; engDrawPending = true; requestAnimationFrame(() => { engDrawPending = false; drawEngine(); drawArrows(); }); }
async function analyseThreat() {
  const st = curSt(); if (!App.ana.threatOn || CV.inCheck(st)) { App.ana.threat = null; return; }
  const fen = toFEN(st), ts = { ...st, turn: st.turn === 'w' ? 'b' : 'w', ep: -1 };
  if (validPosition(ts)) { App.ana.threat = null; return; }
  const eng = await engine(), r = await eng.search(toFEN(ts), { opts: FULL, go: 'go depth 16' });
  if (!App.root || toFEN(curSt()) !== fen) return;
  const l = r.lines[0]; App.ana.threat = { fen, best: r.best, line: l ? l.pv : [], score: l ? whiteScore(l.score, ts.turn) : null, st: ts };
  App.ana.fen = ''; drawEngine(); drawArrows(); analyse();
}
function pvHTML(st, pv, max = 16) {
  const out = []; let x = st;
  for (let i = 0; i < Math.min(max, pv.length); i++) {
    const m = moveFromUci(x, pv[i]); if (!m) break;
    out.push(`${x.turn === 'w' ? `<b>${x.full}.</b>` : i === 0 ? `<b>${x.full}…</b>` : ''}<span class="cx-pvm" data-pv="${pv.slice(0, i + 1).join(' ')}">${esc(sanIn(x, m))}</span>`);
    x = CV.makeMove(x, m);
  }
  return out.join(' ');
}
function drawEngine() {
  const box = $('.cx-engine', App.root); if (!box) return;
  const a = App.ana, st = curSt(), status = CV.statusOf(st);
  const lines = a.lines.filter(Boolean).map(l => ({ ...l, w: whiteScore(l.score, st.turn) }));
  const loading = !(App.loaded && App.loaded[App.prefs.engine]), s = a.stats || {};
  $('.cx-eng-eval', box).textContent = !a.on ? '' : status === 'mate' ? (st.turn === 'w' ? '0–1' : '1–0') : status === 'stalemate' ? '½–½' : lines[0] ? fmtScore(lines[0].w) : '…';
  $('.cx-eng-info', box).innerHTML = !a.on ? '<span>Engine off</span>' : loading ? `<span>${App.prefs.engine === 'full' ? 'Downloading the full network (≈100 MB, first time only)…' : 'Starting Stockfish…'}</span>`
    : status === 'mate' ? '<span>Checkmate</span>' : status === 'stalemate' ? '<span>Stalemate</span>'
    : `<span>${esc(ENGINES[App.prefs.engine].name)}</span><span>Depth ${s.depth || 0}${s.seldepth ? '/' + s.seldepth : ''}${a.done ? '' : ''}</span><span>${fmtNodes(s.nps)} nodes/s</span>`;
  $('.cx-eng-lines', box).innerHTML = a.on && !status ? (lines.map(l => `<div class="cx-line"><span class="cx-line-sc${cpOf(l.w) < 0 ? ' neg' : ''}">${fmtScore(l.w)}</span><span class="cx-line-pv">${pvHTML(st, l.pv)}</span></div>`).join('') || '<div class="cx-line cx-muted">Thinking…</div>') : '';
  const th = a.threat; $('.cx-eng-threat', box).innerHTML = a.on && a.threatOn ? (th && th.fen === toFEN(st) ? `<span class="cx-threat-label">Threat</span> ${pvHTML(th.st, th.line, 8)}` : CV.inCheck(st) ? '<span class="cx-muted">In check: no threat to show.</span>' : '<span class="cx-muted">Looking for the threat…</span>') : '';
  if (lines[0] && a.on) setEvalBar(lines[0].w);
  else if (status === 'mate') setEvalBar({ mate: 0, white: st.turn === 'b' });
}
function setEvalBar(w) {
  const bar = $('.cx-evalbar', App.root); if (!bar || !w) return;
  const fill = $('.cx-evalfill', bar), txt = $('.cx-evaltxt', bar);
  let pct, label;
  if (w.mate != null) { const white = w.mate === 0 ? w.white : w.mate > 0; pct = white ? 100 : 0; label = w.mate === 0 ? (white ? '1-0' : '0-1') : `M${Math.abs(w.mate)}`; }
  else { pct = winPct(w.cp); label = Math.abs(w.cp / 100).toFixed(1); }
  fill.style.height = `${pct}%`; txt.textContent = label; bar.classList.toggle('w-ahead', pct >= 50); bar.classList.toggle('flipped', App.flip);
}
async function tablebase() {
  const st = curSt(), n = st.board.filter(Boolean).length, fen = toFEN(st);
  if (n > 7 || App.mode !== 'analyse') { App.tb = null; App.tbFen = ''; return; }
  if (App.tbFen === fen) return; App.tbFen = fen; App.tb = { loading: true }; drawExplorer();
  try {
    const r = await fetch('https://tablebase.lichess.ovh/standard?fen=' + encodeURIComponent(fen)); if (!r.ok) throw new Error(r.status);
    const d = await r.json(); if (App.tbFen === fen) App.tb = d;
  } catch (e) { if (App.tbFen === fen) App.tb = { error: true }; }
  drawExplorer();
}

/* ================= opening explorer (Lichess, needs a connected account) ================= */
const LI = { client: 'confessions-notebook', tokenKey: 'cp-lichess-token', pkceKey: 'cp-lichess-pkce' };
const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const redirectUri = () => location.origin + location.pathname;
async function lichessConnect() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48))), state = b64url(crypto.getRandomValues(new Uint8Array(12)));
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  sessionStorage.setItem(LI.pkceKey, JSON.stringify({ verifier, state }));
  location.href = `https://lichess.org/oauth?${new URLSearchParams({ response_type: 'code', client_id: LI.client, redirect_uri: redirectUri(), code_challenge_method: 'S256', code_challenge: challenge, state })}`;
}
async function lichessFinish() {
  const q = new URLSearchParams(location.search), code = q.get('code'), state = q.get('state');
  let saved = null; try { saved = JSON.parse(sessionStorage.getItem(LI.pkceKey)); } catch (e) {}
  if (!saved || !(code || q.get('error'))) return;
  sessionStorage.removeItem(LI.pkceKey);
  history.replaceState(history.state, '', location.pathname + location.hash);
  if (!code) { App.toast('Lichess connection cancelled.'); return; }
  if (state !== saved.state) { App.toast('Lichess sign-in failed (state mismatch).'); return; }
  try {
    const r = await fetch('https://lichess.org/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, code_verifier: saved.verifier, redirect_uri: redirectUri(), client_id: LI.client }) });
    const d = await r.json(); if (!d.access_token) throw new Error(d.error_description || d.error || r.status);
    localStorage.setItem(LI.tokenKey, d.access_token); App.toast('Lichess connected: the opening explorer is on.');
    App.explorer.on = true; App.explorer.fen = ''; App.mode = 'analyse';
  } catch (e) { App.toast(`Lichess sign-in failed: ${e.message}`); }
}
async function explore() {
  const ex = App.explorer, token = localStorage.getItem(LI.tokenKey);
  if (!ex.on || App.mode !== 'analyse' || !token) return drawExplorer();
  const fen = toFEN(curSt()), key = ex.db + fen;
  if (ex.fen === key) return drawExplorer();
  ex.fen = key; ex.data = null; ex.error = ''; drawExplorer();
  const url = ex.db === 'masters' ? `https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}&topGames=0`
    : `https://explorer.lichess.ovh/lichess?fen=${encodeURIComponent(fen)}&speeds=blitz,rapid,classical&ratings=2200,2500&topGames=0&recentGames=0`;
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (r.status === 401) { localStorage.removeItem(LI.tokenKey); throw new Error('the Lichess connection expired; connect again'); }
    if (!r.ok) throw new Error(`the explorer returned ${r.status}`);
    const d = await r.json(); if (ex.fen === key) ex.data = d;
  } catch (e) { if (ex.fen === key) ex.error = e.message; }
  drawExplorer();
}
function drawExplorer() {
  const box = $('.cx-explorer', App.root); if (!box) return;
  const ex = App.explorer, token = localStorage.getItem(LI.tokenKey), st = curSt(), tb = App.tb;
  let body = '';
  if (tb && tb.category) {
    const word = c => ({ win: 'Win', loss: 'Loss', draw: 'Draw', 'cursed-win': 'Win (50-move draw)', 'blessed-loss': 'Loss (50-move save)', 'maybe-win': 'Win?', 'maybe-loss': 'Loss?', unknown: '?' }[c] || c);
    const flipC = c => ({ win: 'loss', loss: 'win', 'cursed-win': 'blessed-loss', 'blessed-loss': 'cursed-win', 'maybe-win': 'maybe-loss', 'maybe-loss': 'maybe-win' }[c] || c);
    body += `<div class="cx-tb"><div class="cx-xhead">Tablebase · ${st.turn === 'w' ? 'White' : 'Black'} to move: <b>${esc(word(tb.category))}</b>${tb.dtm ? ` · mate in ${Math.ceil(Math.abs(tb.dtm) / 2)}` : ''}</div>
      <table class="cx-xt">${(tb.moves || []).slice(0, 8).map(m => `<tr data-uci="${esc(m.uci)}"><td class="cx-xt-mv">${esc(m.san)}</td><td class="cx-tb-${esc(flipC(m.category))}">${esc(word(flipC(m.category)))}${m.dtm ? ` · DTM ${Math.abs(m.dtm)}` : m.dtz ? ` · DTZ ${Math.abs(m.dtz)}` : ''}</td></tr>`).join('')}</table></div>`;
  } else if (tb && tb.loading) body += '<p class="cx-muted">Tablebase…</p>';
  if (ex.on) {
    body += `<div class="cx-xhead cx-xtabs">Opening explorer ${[['masters', 'Masters'], ['lichess', 'Lichess 2200+']].map(([v, n]) => `<button data-db="${v}" aria-pressed="${ex.db === v}">${n}</button>`).join('')}</div>`;
    if (!token) body += `<div class="cx-xconnect"><p>Shows what masters and strong online players chose here, and how they scored. Lichess asks for a free Lichess account to use it.</p><button class="cx-btn cx-primary" data-c="li-connect">Connect Lichess</button></div>`;
    else if (ex.error) body += `<p class="cx-err">Explorer: ${esc(ex.error)}</p>`;
    else if (!ex.data) body += '<p class="cx-muted">Loading…</p>';
    else {
      const d = ex.data, tot = d.white + d.draws + d.black;
      body += `<table class="cx-xt"><tbody>${d.moves.slice(0, 12).map(m => {
        const n = m.white + m.draws + m.black, pw = n ? m.white / n * 100 : 0, pd = n ? m.draws / n * 100 : 0, pb = 100 - pw - pd;
        return `<tr data-uci="${esc(m.uci)}"><td class="cx-xt-mv">${esc(m.san)}</td><td class="cx-xt-n">${tot ? Math.round(n / tot * 100) : 0}%<small>${n.toLocaleString()}</small></td><td class="cx-xt-bar"><div class="cx-wdl"><span class="w" style="width:${pw}%">${pw >= 15 ? Math.round(pw) : ''}</span><span class="d" style="width:${pd}%">${pd >= 15 ? Math.round(pd) : ''}</span><span class="b" style="width:${pb}%">${pb >= 15 ? Math.round(pb) : ''}</span></div></td></tr>`;
      }).join('') || '<tr><td colspan="3" class="cx-muted">No games reached this position.</td></tr>'}</tbody></table>
      <button class="cx-linklike" data-c="li-disconnect">Disconnect Lichess</button>`;
    }
  }
  box.innerHTML = body; box.hidden = !body;
}

/* ================= review ================= */
async function runReview(depth) {
  const line = Tree.mainline(); if (line.length < 2) return;
  if (App.review && App.review.running) return;
  const R = App.review = { running: true, done: false, progress: 0, depth, byId: {}, byFen: {}, acc: null, counts: { w: {}, b: {} } };
  render();
  const eng = await engine();
  try {
    for (let i = 0; i < line.length; i++) {
      if (App.review !== R) return;
      const st = line[i].st, fen = toFEN(st), status = CV.statusOf(st);
      if (status === 'mate') R.byFen[fen] = { score: { mate: 0, white: st.turn === 'b' }, cp: st.turn === 'w' ? -10000 : 10000 };
      else if (status === 'stalemate' || insufficient(st)) R.byFen[fen] = { score: { cp: 0 }, cp: 0 };
      else {
        const r = await eng.search(fen, { opts: FULL, multipv: 2, go: `go depth ${depth}` });
        const l = r.lines[0], l2 = r.lines[1], ws = l ? whiteScore(l.score, st.turn) : { cp: 0 };
        R.byFen[fen] = { score: ws, cp: cpOf(ws), best: r.best, second: l2 ? cpOf(whiteScore(l2.score, st.turn)) : null };
      }
      R.progress = i / (line.length - 1); drawReview();
    }
    const accs = { w: [], b: [] }; let prevCls = 'book';
    for (let i = 1; i < line.length; i++) {
      const n = line[i], prev = line[i - 1], mover = prev.st.turn, sg = mover === 'w' ? 1 : -1;
      const e0 = R.byFen[toFEN(prev.st)], e1 = R.byFen[toFEN(n.st)];
      const before = winPct(sg * e0.cp), after = winPct(sg * e1.cp), loss = Math.max(0, before - after);
      const isBest = n.uci === e0.best, onlyMove = e0.second != null && before - winPct(sg * e0.second) > 20;
      const book = App.openings && App.openings[openKey(n.st)] && i <= 30 && prevCls === 'book';
      let c;
      if (book) c = 'book';
      else if (isBest) c = onlyMove && before < 92 ? 'great' : 'best';
      else if (before > 80 && after < 65 && loss >= 15) c = 'miss';
      else c = loss < 2 ? 'excellent' : loss < 5 ? 'good' : loss < 10 ? 'inaccuracy' : loss < 20 ? 'mistake' : 'blunder';
      prevCls = c; R.byId[n.id] = c; accs[mover].push(moveAccuracy(loss)); R.counts[mover][c] = (R.counts[mover][c] || 0) + 1;
    }
    const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
    R.acc = { w: mean(accs.w), b: mean(accs.b) }; R.running = false; R.done = true;
    save(); render();
  } catch (e) { R.running = false; showError(e); }
}
function evalGraph(line, scoreAt, marks) {
  const n = line.length - 1; if (n < 1) return '';
  const W = 600, H = 110, xs = i => i / n * W, ys = cp => H - winPct(Math.max(-1500, Math.min(1500, cp))) / 100 * H;
  const pts = line.map(nd => { const c = scoreAt(nd); return c; }).map((c, i) => c == null ? null : [xs(i), ys(c)]);
  let d = '', first = null, last = null; pts.forEach(p => { if (p) { d += `${first ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)} `; first = first || p; last = p; } });
  if (!last) return '';
  const area = `M${first[0]},${H} L${d.slice(1)} L${last[0]},${H} Z`, idx = line.indexOf(App.node), cx = idx >= 0 ? xs(idx).toFixed(1) : -10;
  return `<svg class="cx-graph" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><rect width="${W}" height="${H}" class="bg"/><path d="${area}" class="w"/><line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" class="mid"/>${(marks || []).map(([i, col]) => pts[i] ? `<circle cx="${pts[i][0].toFixed(1)}" cy="${pts[i][1].toFixed(1)}" r="5" fill="${col}" stroke="#fff" stroke-width="1.2"/>` : '').join('')}<line x1="${cx}" y1="0" x2="${cx}" y2="${H}" class="now"/></svg>`;
}
function drawReview() {
  const box = $('.cx-review', App.root); if (!box) return;
  const R = App.review, line = Tree.mainline();
  if (line.length < 2) { box.innerHTML = '<p class="cx-muted">Play a game or load one (PGN) to review it. Stockfish checks every move and classifies it from Best to Blunder, with an accuracy score for each side.</p>'; return; }
  if (!R || (!R.running && !R.done)) {
    box.innerHTML = `<p class="cx-muted">${line.length - 1} plies in the main line. Choose how deeply Stockfish should check them:</p><div class="cx-seg cx-wide">${[[12, 'Quick'], [16, 'Standard'], [22, 'Deep']].map(([d, n]) => `<button data-review="${d}">${n}<small>depth ${d}</small></button>`).join('')}</div>`; return;
  }
  if (R.running) { box.innerHTML = `<p>Checking every move at depth ${R.depth}… ${Math.round(R.progress * 100)}%</p><div class="cx-progress"><span style="width:${R.progress * 100}%"></span></div>`; return; }
  const names = { w: App.headers.White && App.headers.White !== '?' ? App.headers.White : 'White', b: App.headers.Black && App.headers.Black !== '?' ? App.headers.Black : 'Black' };
  const marks = []; line.forEach((n, i) => { const c = R.byId[n.id]; if (['blunder', 'mistake', 'miss'].includes(c)) marks.push([i, CLASSES[c].col]); });
  const c = R.byId[App.node.id], prev = App.node.parent;
  let verdict = '';
  if (c && prev) {
    const e0 = R.byFen[toFEN(prev.st)], bm = e0 && moveFromUci(prev.st, e0.best), bsan = bm ? sanIn(prev.st, bm) : '', e1 = R.byFen[toFEN(App.node.st)];
    const word = { book: 'a book move', best: 'the best move', great: 'a great move, the only good one', miss: 'a missed chance' }[c] || `${/^[aeiou]/i.test(CLASSES[c].label) ? 'an' : 'a'} ${CLASSES[c].label.toLowerCase()}`;
    verdict = `<div class="cx-verdict" style="--c:${CLASSES[c].col}"><span class="cx-cls" style="background:${CLASSES[c].col}">${CLASSES[c].sym}</span><div><b>${esc(App.node.san)}</b> is ${word}.${!['best', 'book', 'great'].includes(c) && bsan ? ` Best was <b class="cx-pvm" data-best="${esc(e0.best)}">${esc(bsan)}</b>.` : ''}</div><span class="cx-verdict-ev">${e1 ? fmtScore(e1.score) : ''}</span></div>`;
  } else verdict = '<div class="cx-verdict cx-muted">Step through the moves (← →) or click the graph.</div>';
  const rows = Object.keys(CLASSES).map(k => `<tr><td><span class="cx-cls" style="background:${CLASSES[k].col}">${CLASSES[k].sym}</span>${CLASSES[k].label}</td><td>${R.counts.w[k] || 0}</td><td>${R.counts.b[k] || 0}</td></tr>`).join('');
  box.innerHTML = `${evalGraph(line, n => { const e = R.byFen[toFEN(n.st)]; return e ? e.cp : null; }, marks)}${verdict}
    <div class="cx-row"><button class="cx-btn" data-c="prev-key">◀ Previous mistake</button><button class="cx-btn" data-c="next-key">Next mistake ▶</button></div>
    <table class="cx-acc"><thead><tr><th></th><th>${esc(names.w)}</th><th>${esc(names.b)}</th></tr></thead><tbody>
    <tr class="cx-acc-big"><td>Accuracy</td><td>${R.acc.w != null ? R.acc.w.toFixed(1) : '–'}</td><td>${R.acc.b != null ? R.acc.b.toFixed(1) : '–'}</td></tr>${rows}</tbody></table>
    <p class="cx-muted">Checked at depth ${R.depth}. The green arrow shows Stockfish's choice.</p>`;
}

/* ================= board editor ================= */
function startEditor() {
  const st = curSt(); App.edit = { st: { ...st, board: st.board.slice() }, tool: 'P', castle: { K: /K/.test(st.castling), Q: /Q/.test(st.castling), k: /k/.test(st.castling), q: /q/.test(st.castling) } };
  App.mode = 'edit'; App.sel = -1; for (const e of Object.values(App.engines)) e.stop();
  drawPieces(false); drawStrips(); drawPanel(); editChanged();
}
function editPointer(e, s) {
  const ed = App.edit;
  if (ed.tool === 'move' && e.button === 0) { if (ed.st.board[s]) ed.dragFrom = s; return; }
  if (e.button === 2 || ed.tool === 'x') { ed.st.board[s] = null; ed.painting = 'erase'; }
  else { ed.st.board[s] = ed.st.board[s] === ed.tool ? null : ed.tool; ed.painting = ed.st.board[s] ? 'paint' : 'erase'; }
  drawPieces(false);
}
function editMove(e) {
  const ed = App.edit; if (!ed.painting) return;
  const s = squareAt(e); if (s < 0) return;
  ed.st.board[s] = ed.painting === 'erase' ? null : ed.tool; drawPieces(false);
}
function editUp(e) {
  const ed = App.edit;
  if (ed.dragFrom != null) { const s = squareAt(e); if (s >= 0 && s !== ed.dragFrom) { ed.st.board[s] = ed.st.board[ed.dragFrom]; ed.st.board[ed.dragFrom] = null; } else if (s < 0) ed.st.board[ed.dragFrom] = null; ed.dragFrom = null; drawPieces(false); }
  ed.painting = null; editChanged();
}
function editFen() {
  const ed = App.edit, b = ed.st.board;
  let c = ''; if (b[4] === 'K' && b[7] === 'R' && ed.castle.K) c += 'K'; if (b[4] === 'K' && b[0] === 'R' && ed.castle.Q) c += 'Q'; if (b[60] === 'k' && b[63] === 'r' && ed.castle.k) c += 'k'; if (b[60] === 'k' && b[56] === 'r' && ed.castle.q) c += 'q';
  return toFEN({ ...ed.st, castling: c || '-', ep: -1, half: 0, full: 1 });
}
function editChanged() { const inp = $('.cx-edit-fen', App.root); if (!inp) return; inp.value = editFen(); $('.cx-edit-err', App.root).textContent = validPosition(CV.parseFEN(inp.value)); drawStrips(); }

/* ================= panels ================= */
const fmtClock = ms => { ms = Math.max(0, ms); const s = Math.floor(ms / 1000); return ms < 10000 ? `${(ms / 1000).toFixed(1)}` : s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function material(st) {
  const val = { p: 1, n: 3, b: 3, r: 5, q: 9 }, start = { p: 8, n: 2, b: 2, r: 2, q: 1 }, have = { w: {}, b: {} }; let sw = 0, sb = 0;
  for (const p of st.board) if (p && p.toLowerCase() !== 'k') { const c = p === p.toUpperCase() ? 'w' : 'b', t = p.toLowerCase(); have[c][t] = (have[c][t] || 0) + 1; if (c === 'w') sw += val[t]; else sb += val[t]; }
  const taken = c => { let h = ''; const o = c === 'w' ? 'b' : 'w'; for (const t of 'pnbrq') for (let i = 0; i < Math.max(0, start[t] - (have[o][t] || 0)); i++) h += pieceIcon(o === 'w' ? t.toUpperCase() : t); return h; };
  return { w: taken('w'), b: taken('b'), diff: sw - sb };
}
function drawStrips() {
  if (!App.root) return;
  const g = App.game, st = App.edit ? App.edit.st : curSt(), mat = material(st);
  const nm = side => { const v = App.headers[side === 'w' ? 'White' : 'Black']; return v && v !== '?' ? v : side === 'w' ? 'White' : 'Black'; };
  const bottom = App.flip ? 'b' : 'w';
  for (const [cls, side] of [['.cx-top', bottom === 'w' ? 'b' : 'w'], ['.cx-bottom', bottom]]) {
    const el = $(cls, App.root), adv = side === 'w' ? mat.diff : -mat.diff, idx = side === 'w' ? 0 : 1;
    const inGame = App.mode === 'play' && g, clock = inGame && g.clock, running = clock && !g.over && g.running === idx && g.moves > 0;
    const thinking = inGame && App.thinking && side !== g.color, toMove = !App.edit && st.turn === side;
    el.innerHTML = `<span class="cx-who${toMove ? ' to-move' : ''}"><span class="cx-dot ${side}"></span>${esc(nm(side))}${thinking ? '<span class="cx-thinking"><i></i><i></i><i></i></span>' : ''}</span><span class="cx-mat">${mat[side]}${adv > 0 ? `<em>+${adv}</em>` : ''}</span>${clock ? `<span class="cx-clock${running ? ' on' : ''}${g.times[idx] < 20000 ? ' low' : ''}">${fmtClock(g.times[idx])}</span>` : ''}`;
  }
}
function drawPanel() {
  const p = $('.cx-panel', App.root), g = App.game;
  $$('.cx-tabs [data-mode]', App.root).forEach(b => b.setAttribute('aria-selected', b.dataset.mode === App.mode));
  $('.cx', App.root).classList.toggle('no-eval', App.mode === 'play' || App.mode === 'edit' || (App.mode === 'analyse' && !App.ana.on) || (App.mode === 'review' && !(App.review && App.review.done)));
  if (App.mode === 'play') p.innerHTML = playPanel(g);
  else if (App.mode === 'analyse') {
    p.innerHTML = `<div class="cx-engine"><div class="cx-eng-bar"><label class="cx-toggle" title="Engine on/off (L)"><input type="checkbox" data-c="engine" ${App.ana.on ? 'checked' : ''}><span></span></label><span class="cx-eng-eval"></span><span class="cx-eng-info"></span>
        <select class="cx-mini" data-pref="multipv" title="Number of lines">${[1, 2, 3, 4, 5].map(n => `<option value="${n}"${App.prefs.multipv === n ? ' selected' : ''}>${n} line${n > 1 ? 's' : ''}</option>`).join('')}</select></div>
      <div class="cx-eng-lines"></div><div class="cx-eng-threat"></div></div>
      ${movesBlock()}<div class="cx-explorer" hidden></div>
      <div class="cx-tools"><button class="cx-btn" data-c="threat" aria-pressed="${App.ana.threatOn}" title="What does the opponent threaten? (X)">Threat</button><button class="cx-btn" data-c="explorer" aria-pressed="${App.explorer.on}" title="Opening explorer (E)">Explorer</button><button class="cx-btn" data-c="play-here" title="Play this position against Stockfish">Play from here</button><button class="cx-btn cx-more" data-c="menu">${I.menu}</button></div>`;
    drawEngine(); drawExplorer();
  } else if (App.mode === 'review') { p.innerHTML = `<div class="cx-review"></div>${movesBlock()}<div class="cx-tools"><span class="cx-grow"></span><button class="cx-btn cx-more" data-c="menu">${I.menu}</button></div>`; drawReview(); }
  else if (App.mode === 'edit') p.innerHTML = editPanel();
  drawMoves();
}
function playPanel(g) {
  const pr = App.prefs;
  if (g && !g.over) {
    return `<div class="cx-game"><div class="cx-game-head"><b>${esc(levelName(g))}</b><span class="cx-muted">${g.clock ? `${g.base / 60000}+${g.inc / 1000}` : 'Unlimited'} · you have ${g.color === 'w' ? 'White' : 'Black'}</span></div>
      ${movesBlock()}
      <div class="cx-game-btns"><button class="cx-btn" data-c="takeback" title="Take back your last move">↶<span>Takeback</span></button><button class="cx-btn" data-c="draw">½<span>Draw</span></button><button class="cx-btn" data-c="resign">⚑<span>${Tree.mainline().length <= 2 ? 'Abort' : 'Resign'}</span></button><button class="cx-btn" data-c="hint" title="Show Stockfish's move">?<span>Hint</span></button></div>
      <p class="cx-msg" aria-live="polite">${esc(App.msg || '')}</p></div>`;
  }
  const res = g && g.over ? resultLine(g) : null;
  const opts = (key, list) => list.map(([v, n, sub]) => `<button data-set="${key}" data-val="${v}" aria-pressed="${pr[key] === v}">${n}${sub ? `<small>${sub}</small>` : ''}</button>`).join('');
  return `${res ? `<div class="cx-result"><div class="cx-result-score">${res.score}</div><b>${res.head}</b> <span>${esc(res.why)}</span><div class="cx-row cx-center"><button class="cx-btn cx-primary" data-c="go-review">Game review</button><button class="cx-btn" data-c="go-analyse">Analyse</button><button class="cx-btn" data-c="rematch">Rematch</button></div></div>` : ''}
    <div class="cx-setup">
      <h3>Opponent</h3><div class="cx-levels">${LEVELS.map(l => `<button data-set="level" data-val="${l.id}" aria-pressed="${pr.level === l.id}"><b>${l.name}</b><small>${l.custom ? `<input type="number" class="cx-elo" min="1320" max="3190" step="10" value="${pr.customElo}" aria-label="Custom rating">` : l.rating}</small></button>`).join('')}</div>
      <h3>Time control</h3><div class="cx-clocks">${opts('clock', CLOCKS)}</div>
      ${pr.clock === 'custom' ? `<div class="cx-row cx-custom"><label>Minutes <input type="number" min="0.25" max="180" step="0.25" data-num="customMins" value="${pr.customMins}"></label><label>Increment (s) <input type="number" min="0" max="60" data-num="customInc" value="${pr.customInc}"></label></div>` : ''}
      <h3>Your colour</h3><div class="cx-seg cx-wide">${opts('color', [['w', 'White'], ['r', 'Random'], ['b', 'Black']])}</div>
      <button class="cx-btn cx-primary cx-big" data-c="start">Play</button>
      <p class="cx-muted">Ratings are approximate Elo. From Club up, Stockfish limits its own strength and spends its clock like a player. Premoves and auto-queen are in settings (⚙).</p>
    </div>${g && g.over ? movesBlock() : ''}`;
}
function editPanel() {
  const ed = App.edit, pal = c => 'KQRBNP'.split('').map(t => { const p = c === 'w' ? t : t.toLowerCase(); return `<button data-tool="${p}" aria-pressed="${ed.tool === p}" title="${p}">${pieceIcon(p)}</button>`; }).join('');
  return `<div class="cx-edit"><div class="cx-palette">${pal('w')}</div><div class="cx-palette">${pal('b')}</div>
    <div class="cx-seg cx-wide"><button data-tool="move" aria-pressed="${ed.tool === 'move'}">Move pieces</button><button data-tool="x" aria-pressed="${ed.tool === 'x'}">Erase</button></div>
    <p class="cx-muted">Pick a piece, then click or drag across squares. Right-click erases.</p>
    <h3>Side to move</h3><div class="cx-seg cx-wide"><button data-turn="w" aria-pressed="${ed.st.turn === 'w'}">White</button><button data-turn="b" aria-pressed="${ed.st.turn === 'b'}">Black</button></div>
    <h3>Castling</h3><div class="cx-castle">${['K', 'Q', 'k', 'q'].map(k => `<label class="cx-check"><input type="checkbox" data-castle="${k}" ${ed.castle[k] ? 'checked' : ''}> ${k === 'K' ? 'White O-O' : k === 'Q' ? 'White O-O-O' : k === 'k' ? 'Black O-O' : 'Black O-O-O'}</label>`).join('')}</div>
    <h3>FEN</h3><input class="cx-edit-fen cx-input" type="text" spellcheck="false" aria-label="FEN"><p class="cx-err cx-edit-err"></p>
    <div class="cx-row"><button class="cx-btn" data-c="ed-start">Starting position</button><button class="cx-btn" data-c="ed-clear">Empty board</button></div>
    <div class="cx-row"><button class="cx-btn cx-primary" data-c="ed-analyse">Analyse</button><button class="cx-btn" data-c="ed-play">Play against Stockfish</button></div></div>`;
}
const movesBlock = () => `<div class="cx-opening"></div><div class="cx-moves" aria-label="Moves"></div>`;
function drawMoves() {
  const box = $('.cx-moves', App.root); if (!box) return;
  const R = App.review && App.review.done ? App.review : null;
  const glyph = n => { const c = R && R.byId[n.id]; const nag = n.nags.map(k => NAG_SYM[k] || '').join(''); return (c && !['best', 'excellent', 'good', 'book'].includes(c) ? `<i class="cx-g" style="color:${CLASSES[c].col}">${CLASSES[c].sym}</i>` : '') + (nag ? `<i class="cx-nag">${nag}</i>` : ''); };
  const mvSpan = (n, cls = '') => `<span class="cx-mv${cls}${n === App.node ? ' cur' : ''}" data-id="${n.id}">${esc(n.san)}${glyph(n)}</span>`;
  function inline(n, force) {
    // a side line written out in full: "12… Nf6 13. e5 (13. d5 Ne4) Nd5"
    let out = '', first = true;
    while (n) {
      const st = n.parent.st;
      if (st.turn === 'w') out += `<b class="cx-in">${st.full}.</b>`; else if (first || force) out += `<b class="cx-in">${st.full}…</b>`;
      out += mvSpan(n, ' cx-vmv') + (n.comment ? `<span class="cx-cm">${esc(n.comment)}</span>` : ''); force = !!n.comment; first = false;
      const p = n.parent;
      if (p.children[0] === n && p.children.length > 1) { out += p.children.slice(1).map(v => `<span class="cx-paren">(${inline(v, true)})</span>`).join(''); force = true; }
      n = n.children[0];
    }
    return out;
  }
  let h = '', n = Tree.root.children[0], half = false;   // half: a row has its White move and waits for Black's
  if (Tree.root.comment) h += `<div class="cx-cmt">${esc(Tree.root.comment)}</div>`;
  while (n) {
    const st = n.parent.st;
    if (st.turn === 'w') { h += `<span class="cx-num">${st.full}</span>${mvSpan(n)}`; half = true; }
    else { if (!half) h += `<span class="cx-num">${st.full}</span><span class="cx-mv cx-gap">…</span>`; h += mvSpan(n); half = false; }
    const sides = n.parent.children.slice(1);
    if (n.comment || sides.length) {
      if (half) h += '<span class="cx-mv cx-gap"></span>';
      if (n.comment) h += `<div class="cx-cmt">${esc(n.comment)}</div>`;
      if (sides.length) h += `<div class="cx-var">${sides.map(v => `<div class="cx-varline">${inline(v, true)}</div>`).join('')}</div>`;
      half = false;
    }
    n = n.children[0];
  }
  if (half) h += '<span></span>';
  const g = App.game, res = g && g.over && g.reason !== 'abort' ? `<div class="cx-res">${resultLine(g).score} <span>${esc(resultLine(g).why)}</span></div>` : '';
  box.innerHTML = h ? h + res : '<p class="cx-muted cx-empty">No moves yet. Move a piece, or type a move under the board.</p>';
  const c = $('.cx-mv.cur', box); if (c) { const bb = box.getBoundingClientRect(), cb = c.getBoundingClientRect(); if (cb.top < bb.top || cb.bottom > bb.bottom) box.scrollTop += cb.top - bb.top - bb.height / 2; }
  let name = ''; for (let x = App.node; x && x.ply <= 40; x = x.parent) { const v = App.openings && App.openings[openKey(x.st)]; if (v) { name = v; break; } }
  const op = $('.cx-opening', App.root); if (op) op.innerHTML = name ? `<span class="cx-eco">${esc(name.split('|')[0])}</span>${esc(name.split('|')[1])}` : '';
}
function drawOver() {
  const o = $('.cx-over', App.root), g = App.game;
  if (App.mode === 'play' && g && g.over && g.reason !== 'abort' && App.node === tip() && !App.overClosed) {
    const r = resultLine(g);
    o.innerHTML = `<div class="cx-over-card"><button class="cx-x" data-c="close-over" aria-label="Close">×</button><div class="cx-result-score">${r.score}</div><b>${r.head}</b><span>${esc(r.why)}</span><div class="cx-row cx-center"><button class="cx-btn cx-primary" data-c="go-review">Game review</button><button class="cx-btn" data-c="rematch">Rematch</button></div></div>`;
    o.hidden = false;
  } else o.hidden = true;
}
function render(animate) {
  if (!App.root) return;
  drawPieces(animate); drawStrips(); drawPanel(); drawOver();
  if (App.mode === 'analyse') { analyse(); if (App.ana.threatOn) analyseThreat(); if (App.explorer.on) explore(); tablebase(); }
  if (App.mode === 'review' && App.review && App.review.done) { const e = App.review.byFen[toFEN(curSt())]; if (e) setEvalBar(e.score); }
}
function showError(e) { if (App.toast) App.toast(`Engine problem: ${e && e.message ? e.message : e}. Reload the page to restart it.`); }

/* ================= settings, menus, dialogs ================= */
function openSettings() {
  const p = App.prefs, ov = document.createElement('div'); ov.className = 'overlay';
  const seg = (key, list) => `<div class="cx-seg">${list.map(([v, n]) => `<button data-sp="${key}" data-val="${v}" aria-pressed="${String(p[key]) === String(v)}">${n}</button>`).join('')}</div>`;
  ov.innerHTML = `<div class="dialog cx-dialog" role="dialog" aria-modal="true" aria-label="Board settings"><div class="cx-dialog-head"><b>Settings</b><button class="cx-x" data-x aria-label="Close">×</button></div>
    <div class="cx-set"><span>Board</span><div class="cx-swatches">${[['brown', '#f0d9b5', '#b58863'], ['wood', '#efdcb6', '#b07d52'], ['green', '#eeeed2', '#769656'], ['blue', '#dee3e6', '#8ca2ad'], ['grey', '#e1e1e1', '#9d9d9d'], ['purple', '#e8e4f0', '#9283b3']].map(([v, l, d]) => `<button data-sp="theme" data-val="${v}" aria-pressed="${p.theme === v}" title="${v}" style="background:linear-gradient(135deg,${l} 50%,${d} 50%)"></button>`).join('')}</div></div>
    <div class="cx-set"><span>Pieces</span>${seg('pieces', [['cburnett', 'Standard'], ['merida', 'Merida'], ['classic', 'Classic']])}</div>
    <div class="cx-set"><span>Board size</span><input type="range" min="60" max="100" step="5" data-range="size" value="${p.size}"></div>
    <div class="cx-set"><span>Animation</span>${seg('anim', [['none', 'Off'], ['fast', 'Fast'], ['normal', 'Normal']])}</div>
    <div class="cx-set"><span>Engine</span>${seg('engine', [['lite', 'Lite · 1.8 MB'], ['full', 'Full NNUE · ≈100 MB']])}</div>
    <div class="cx-set"><span>Analysis depth</span>${seg('depth', [['20', '20'], ['26', '26'], ['32', '32'], ['infinite', '∞']])}</div>
    <div class="cx-set cx-checks">${[['coords', 'Coordinates'], ['legal', 'Show legal moves'], ['arrows', 'Engine arrows'], ['sound', 'Sounds'], ['premove', 'Premoves'], ['autoQueen', 'Auto-queen']].map(([k, n]) => `<label class="cx-check"><input type="checkbox" data-sb="${k}" ${p[k] ? 'checked' : ''}> ${n}</label>`).join('')}</div>
    <p class="cx-muted">Full NNUE is Stockfish 19 with its complete neural network, the strongest analysis available in a browser; it downloads once (about 100 MB) and is then cached. Lite starts instantly and is still far stronger than any human. Both run on one processor core.</p></div>`;
  document.body.append(ov);
  const apply = () => { const root = $('.cx', App.root); root.dataset.themeBoard = p.theme; root.dataset.pieces = p.pieces; root.style.setProperty('--cx-size', p.size + '%'); root.dataset.anim = p.anim; savePrefs(); };
  ov.addEventListener('click', e => {
    if (e.target === ov || e.target.closest('[data-x]')) return ov.remove();
    const b = e.target.closest('[data-sp]'); if (!b) return;
    const k = b.dataset.sp, old = p[k]; p[k] = b.dataset.val;
    $$(`[data-sp="${k}"]`, ov).forEach(x => x.setAttribute('aria-pressed', x === b));
    apply();
    if (k === 'pieces') { $('.cx-pcs', App.root).innerHTML = ''; App._prev = null; render(); }
    if ((k === 'engine' || k === 'depth') && old !== p[k]) { App.ana.fen = ''; if (App.mode === 'analyse') { if (k === 'engine') engine(); render(); } }
  });
  ov.addEventListener('change', e => { const t = e.target; if (t.dataset.sb) { p[t.dataset.sb] = t.checked; apply(); if (t.dataset.sb === 'coords') drawSquares(); render(); } });
  ov.addEventListener('input', e => { if (e.target.dataset.range) { p.size = +e.target.value; apply(); } });
  ov.addEventListener('keydown', e => { if (e.key === 'Escape') ov.remove(); });
}
function popMenu(html, x, y, onClick) {
  const old = $('.cx-menu'); if (old) old.remove();
  const m = document.createElement('div'); m.className = 'cx-menu'; m.innerHTML = html; document.body.append(m);
  m.style.left = `${Math.max(8, Math.min(x, innerWidth - m.offsetWidth - 8))}px`; m.style.top = `${Math.max(8, Math.min(y, innerHeight - m.offsetHeight - 8)) + scrollY}px`;
  setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('pointerdown', off); } }), 0);
  m.addEventListener('click', e => { if (onClick(e) !== false) m.remove(); });
}
function openMenu(anchor) {
  const r = anchor.getBoundingClientRect();
  popMenu([['copy-pgn', 'Copy PGN'], ['copy-fen', 'Copy FEN'], ['download-pgn', 'Download PGN'], ['import', 'Load PGN or FEN…'], ['new-board', 'New analysis board'], ['edit', 'Set up a position'], ['open-lichess', 'Open on Lichess']].map(([c, n]) => `<button data-c="${c}">${n}</button>`).join(''),
    r.right - 220, r.top - 290, e => { const b = e.target.closest('[data-c]'); if (b) command(b.dataset.c, b); });
}
function moveMenu(n, x, y) {
  popMenu(`<div class="cx-menu-nags">${[1, 2, 3, 4, 5, 6].map(k => `<button data-nag="${k}" aria-pressed="${n.nags.includes(k)}">${NAG_SYM[k]}</button>`).join('')}</div>
    <button data-mm="comment">${n.comment ? 'Edit comment' : 'Add comment'}</button>${Tree.isMain(n) ? '' : '<button data-mm="promote">Promote variation</button>'}<button data-mm="delete">Delete from here</button>`, x, y, e => {
    const nag = e.target.closest('[data-nag]'), mm = e.target.closest('[data-mm]');
    if (nag) { const k = +nag.dataset.nag; n.nags = n.nags.includes(k) ? n.nags.filter(v => v !== k) : [...n.nags.filter(v => v > 6), k]; drawMoves(); save(); }
    if (mm && mm.dataset.mm === 'comment') { const c = prompt(`Comment on ${n.san}`, n.comment); if (c != null) { n.comment = c.trim(); drawMoves(); save(); } }
    if (mm && mm.dataset.mm === 'promote') { Tree.promote(n); App.review = null; drawPanel(); save(); }
    if (mm && mm.dataset.mm === 'delete') { const p = Tree.remove(n); let x2 = App.node; while (x2 && x2 !== n) x2 = x2.parent; if (x2 === n) App.node = p; App.review = null; render(); save(); }
  });
}
function openImport() {
  const ov = document.createElement('div'); ov.className = 'overlay';
  ov.innerHTML = `<div class="dialog cx-dialog" role="dialog" aria-modal="true" aria-label="Load a game"><div class="cx-dialog-head"><b>Load a game or position</b><button class="cx-x" data-x aria-label="Close">×</button></div>
    <textarea class="cx-input" rows="10" placeholder="Paste a PGN (variations and comments are kept) or a FEN"></textarea><p class="cx-err"></p>
    <div class="cx-row"><label class="cx-btn">Open a .pgn file<input type="file" accept=".pgn,.txt" hidden></label><span class="cx-grow"></span><button class="cx-btn cx-primary" data-load>Load</button></div></div>`;
  document.body.append(ov);
  const ta = $('textarea', ov); ta.focus();
  $('input[type=file]', ov).addEventListener('change', async e => { const f = e.target.files[0]; if (f) ta.value = (await f.text()).split(/\n\s*\n(?=\[Event )/)[0]; });
  ov.addEventListener('click', e => {
    if (e.target === ov || e.target.closest('[data-x]')) return ov.remove();
    if (!e.target.closest('[data-load]')) return;
    try {
      const r = importPGN(ta.value); App.headers = { ...r.headers }; App.game = null; App.review = null; App.mode = 'analyse'; App.node = Tree.root; App.ana.fen = ''; App.edit = null;
      ov.remove(); drawSquares(); render(); save(); if (r.warning) App.toast(`Loaded, but ${r.warning}.`);
    } catch (err) { $('.cx-err', ov).textContent = err.message; }
  });
  ov.addEventListener('keydown', e => { if (e.key === 'Escape') ov.remove(); });
}

/* ================= commands ================= */
const copy = (t, msg) => navigator.clipboard.writeText(t).then(() => App.toast(msg), () => prompt('Copy:', t));
function freshBoard(fen, headers) { Tree.reset(fen); App.node = Tree.root; App.game = null; App.review = null; App.headers = headers || {}; App.mode = 'analyse'; App.ana.fen = ''; App.edit = null; drawSquares(); render(); save(); }
async function command(c, el) {
  const g = App.game;
  switch (c) {
    case 'first': goTo(Tree.root); break;
    case 'prev': step(-1); break;
    case 'next': step(1); break;
    case 'last': goTo(tip()); break;
    case 'flip': App.flip = !App.flip; drawSquares(); render(); save(); break;
    case 'settings': openSettings(); break;
    case 'menu': openMenu(el); break;
    case 'start': newGame(); break;
    case 'rematch': App.prefs.color = g && g.color === 'w' ? 'b' : 'w'; savePrefs(); newGame(); break;
    case 'close-over': App.overClosed = true; drawOver(); break;
    case 'go-review': App.overClosed = true; switchMode('review'); runReview(16); break;
    case 'go-analyse': switchMode('analyse'); break;
    case 'resign': if (g && !g.over) { if (Tree.mainline().length <= 2) endGame('*', 'abort'); else if (confirm('Resign this game?')) endGame(g.color === 'w' ? '0-1' : '1-0', 'resignation'); } break;
    case 'draw': {
      if (!g || g.over) break;
      const e = g.botEval ? cpOf(g.botEval) : 0, forBot = g.color === 'w' ? -e : e;
      if (tip().ply < 40) { App.msg = 'Stockfish declines: too early for a draw.'; drawPanel(); break; }
      if (forBot < -150 || Math.abs(e) < 20) endGame('1/2-1/2', 'agreement'); else { App.msg = 'Stockfish declines the draw.'; drawPanel(); }
      break;
    }
    case 'takeback': {
      if (!g || g.over) break;
      if (App.thinking) { App.msg = 'Wait for Stockfish to move.'; drawPanel(); break; }
      let n = tip(), back = n.st.turn === g.color ? 2 : 1;
      while (back-- > 0 && n.parent) { const p = n.parent; Tree.remove(n); n = p; }
      App.node = n; App.premove = null; App.hint = null; App.msg = ''; render(); save(); break;
    }
    case 'hint': {
      if (!g || g.over || App.thinking || curSt().turn !== g.color) break;
      App.msg = 'Thinking…'; drawPanel();
      const st = curSt(), fen = toFEN(st), eng = await engine(g.engine), r = await eng.search(fen, { opts: FULL, go: 'go movetime 1000' });
      const m = moveFromUci(st, r.best); if (m && App.node.st === st) { App.hint = { fen, m }; App.msg = `Stockfish suggests ${sanIn(st, m)}.`; drawPanel(); drawArrows(); }
      break;
    }
    case 'threat': App.ana.threatOn = !App.ana.threatOn; App.ana.threat = null; App.ana.fen = ''; drawPanel(); if (App.ana.threatOn) analyseThreat(); else analyse(); break;
    case 'explorer': App.explorer.on = !App.explorer.on; App.explorer.fen = ''; drawPanel(); if (App.explorer.on) explore(); break;
    case 'li-connect': lichessConnect(); break;
    case 'li-disconnect': localStorage.removeItem(LI.tokenKey); App.explorer.data = null; drawExplorer(); break;
    case 'play-here': newGame(toFEN(curSt())); break;
    case 'copy-pgn': copy(exportPGN(App.headers), 'PGN copied'); break;
    case 'copy-fen': copy(toFEN(curSt()), 'FEN copied'); break;
    case 'download-pgn': { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([exportPGN(App.headers)], { type: 'application/x-chess-pgn' })); a.download = `chess-${new Date().toISOString().slice(0, 10)}.pgn`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); break; }
    case 'import': openImport(); break;
    case 'new-board': freshBoard(START); break;
    case 'edit': switchMode('edit'); break;
    case 'open-lichess': window.open(`https://lichess.org/analysis/standard/${toFEN(curSt()).replace(/ /g, '_')}`, '_blank', 'noopener'); break;
    case 'prev-key': case 'next-key': {
      const R = App.review; if (!R || !R.done) break;
      const line = Tree.mainline(), i = Math.max(0, line.indexOf(App.node)), bad = n => ['blunder', 'mistake', 'miss', 'inaccuracy'].includes(R.byId[n.id]);
      const t = (c === 'next-key' ? line.slice(i + 1) : line.slice(0, i).reverse()).find(bad); if (t) goTo(t, false); break;
    }
    case 'ed-start': App.edit.st = CV.parseFEN(START); App.edit.castle = { K: true, Q: true, k: true, q: true }; drawPieces(false); drawPanel(); editChanged(); break;
    case 'ed-clear': App.edit.st = CV.parseFEN('8/8/8/8/8/8/8/8 w - - 0 1'); drawPieces(false); editChanged(); break;
    case 'ed-analyse': case 'ed-play': {
      const fen = editFen(), er = validPosition(CV.parseFEN(fen)); if (er) { $('.cx-edit-err', App.root).textContent = er; break; }
      App.edit = null; if (c === 'ed-play') newGame(fen); else freshBoard(fen); break;
    }
  }
}
function switchMode(m) {
  if (m === App.mode) return;
  if (App.game && !App.game.over && m !== 'play') { App.toast('Finish or resign the game first: no engine help while playing.'); return; }
  if (App.mode === 'edit') { App.edit = null; App._prev = null; $('.cx-pcs', App.root).innerHTML = ''; }
  if (m === 'edit') return startEditor();
  App.mode = m; App.sel = -1; App.hint = null;
  if (m === 'play' && App.game && !App.game.over) App.node = tip();
  if (m !== 'analyse') for (const e of Object.values(App.engines)) e.stop();
  render(); save();
}
function bindControls() {
  App.root.addEventListener('click', e => {
    const t = e.target;
    const set = t.closest('[data-set]'); if (set && !t.closest('input')) { App.prefs[set.dataset.set] = set.dataset.val; savePrefs(); drawPanel(); return; }
    const mv = t.closest('.cx-mv[data-id]'); if (mv) { const n = Tree.find(+mv.dataset.id); if (n) goTo(n, false); return; }
    const pv = t.closest('.cx-pvm[data-pv]'); if (pv && App.mode === 'analyse') { let n = App.node; for (const u of pv.dataset.pv.split(' ')) { const m = moveFromUci(n.st, u); if (!m) break; n = Tree.add(n, m); } goTo(n); return; }
    const best = t.closest('[data-best]'); if (best) { const m = moveFromUci(App.node.parent.st, best.dataset.best); if (m) goTo(Tree.add(App.node.parent, m)); return; }
    const xr = t.closest('tr[data-uci]'); if (xr && App.mode === 'analyse') { const m = moveFromUci(curSt(), xr.dataset.uci); if (m) userMove(m); return; }
    const db = t.closest('[data-db]'); if (db) { App.explorer.db = db.dataset.db; App.explorer.fen = ''; explore(); return; }
    const rv = t.closest('[data-review]'); if (rv) { runReview(+rv.dataset.review); return; }
    const tab = t.closest('[data-mode]'); if (tab) { switchMode(tab.dataset.mode); return; }
    const tool = t.closest('[data-tool]'); if (tool) { App.edit.tool = tool.dataset.tool; $$('[data-tool]', App.root).forEach(x => x.setAttribute('aria-pressed', x === tool)); return; }
    const turn = t.closest('[data-turn]'); if (turn) { App.edit.st.turn = turn.dataset.turn; $$('[data-turn]', App.root).forEach(x => x.setAttribute('aria-pressed', x === turn)); editChanged(); return; }
    const gr = t.closest('.cx-graph'); if (gr) { const r = gr.getBoundingClientRect(), line = Tree.mainline(), i = Math.round((e.clientX - r.left) / r.width * (line.length - 1)); goTo(line[Math.max(0, Math.min(line.length - 1, i))], false); return; }
    const c = t.closest('[data-c]'); if (c && c.tagName !== 'INPUT') command(c.dataset.c, c);
  });
  App.root.addEventListener('contextmenu', e => { const mv = e.target.closest('.cx-mv[data-id]'); if (mv && App.mode !== 'play') { e.preventDefault(); const n = Tree.find(+mv.dataset.id); if (n) moveMenu(n, e.clientX, e.clientY); } });
  App.root.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-c="engine"]')) { App.ana.on = t.checked; if (!App.ana.on) { for (const en of Object.values(App.engines)) en.stop(); App.ana.fen = ''; } render(); }
    if (t.matches('[data-pref="multipv"]')) { App.prefs.multipv = +t.value; savePrefs(); App.ana.fen = ''; analyse(); }
    if (t.dataset.num) { App.prefs[t.dataset.num] = +t.value; savePrefs(); }
    if (t.classList.contains('cx-elo')) { App.prefs.customElo = Math.max(1320, Math.min(3190, +t.value || 2000)); App.prefs.level = 'custom'; savePrefs(); drawPanel(); }
    if (t.dataset.castle) { App.edit.castle[t.dataset.castle] = t.checked; editChanged(); }
    if (t.classList.contains('cx-edit-fen')) { try { const st = CV.parseFEN(t.value.trim()); App.edit.st = st; App.edit.castle = { K: /K/.test(st.castling), Q: /Q/.test(st.castling), k: /k/.test(st.castling), q: /q/.test(st.castling) }; drawPieces(false); drawPanel(); editChanged(); } catch (err) { $('.cx-edit-err', App.root).textContent = err.message; } }
  });
  App.keys = e => {
    if (!App.root || !App.root.isConnected || e.ctrlKey || e.metaKey || e.altKey || $('.overlay') || e.target.closest('input,textarea,select,[contenteditable]')) return;
    const map = {
      ArrowLeft: () => step(-1), ArrowRight: () => step(1), ArrowUp: () => goTo(Tree.root), ArrowDown: () => goTo(tip()), Home: () => goTo(Tree.root), End: () => goTo(tip()),
      f: () => command('flip'), l: () => { const cb = App.mode === 'analyse' && $('[data-c="engine"]', App.root); if (cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change', { bubbles: true })); } },
      x: () => App.mode === 'analyse' && command('threat'), e: () => App.mode === 'analyse' && command('explorer'),
    };
    if (map[e.key]) { e.preventDefault(); map[e.key](); return; }
    // starting to type a move jumps into the move box
    if (/^[a-hNBRQKO]$/.test(e.key) && (App.mode === 'analyse' || App.mode === 'play')) $('.cx-type', App.root).focus();
  };
  document.addEventListener('keydown', App.keys);
}

/* ================= mount ================= */
async function mount(root, { toast } = {}) {
  CV.install(); pieceCss();
  App.root = root; App.toast = toast || (m => alert(m));
  load();
  root.innerHTML = shell();
  drawSquares(); bindBoard(); bindTyping(); bindControls();
  if (/[?&](code|error)=/.test(location.search)) await lichessFinish();
  render();
  App.timer = setInterval(() => { if (App.mode === 'play' && clockOn()) tickClock(); }, 100);
  if (App.game && !App.game.over) { App.game.turnStart = Date.now(); if (App.mode === 'play' && App.node === tip() && curSt().turn !== App.game.color) botMove(); }
  if (App.mode === 'analyse' || App.prefs.level) engine();   // warm the engine up while the page settles
  fetch(VENDOR + 'openings.json').then(r => r.json()).then(d => { App.openings = d; if (App.root) drawMoves(); }).catch(() => {});
}
function unmount() {
  clearInterval(App.timer); if (App.keys) document.removeEventListener('keydown', App.keys);
  for (const e of Object.values(App.engines)) e.stop();
  if (clockOn()) tickClock();
  save(); App.root = null; App._prev = null; App.thinking = false; App.edit = null;
  const m = $('.cx-menu'); if (m) m.remove();
}
window.ChessApp = { mount, unmount };
})();

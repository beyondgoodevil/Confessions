/* Chess page (#/chess): play Stockfish from beginner to full strength, analyse positions, and review games.
   Rules and piece drawings come from chess-viewer.js (window.ChessViewer). The engine is Stockfish 19 "lite,
   single-threaded" (assets/vendor/stockfish, GPLv3, from github.com/nmrugg/stockfish.js), run in a Web Worker.
   Opening names: lichess-org/chess-openings (CC0), as assets/vendor/openings.json. */
(function () {
'use strict';
const CV = window.ChessViewer;
const ENGINE_URL = 'assets/vendor/stockfish/stockfish-19-lite-single.js';
const STORE = 'cp-chess';
const FILES = 'abcdefgh';
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- position helpers ---------- */
function toFEN(st) {
  let s = '';
  for (let r = 7; r >= 0; r--) {
    let e = 0;
    for (let f = 0; f < 8; f++) { const p = st.board[r * 8 + f]; if (!p) e++; else { if (e) s += e; e = 0; s += p; } }
    if (e) s += e; if (r) s += '/';
  }
  return `${s} ${st.turn} ${st.castling || '-'} ${st.ep >= 0 ? CV.sqName(st.ep) : '-'} ${st.half} ${st.full}`;
}
const repKey = st => toFEN(st).split(' ').slice(0, 4).join(' ');
const openKey = st => toFEN(st).split(' ').slice(0, 2).join(' ');
const uciOf = m => CV.sqName(m.from) + CV.sqName(m.to) + (m.promo ? m.promo.toLowerCase() : '');
function moveFromUci(st, uci) {
  const from = CV.sqIdx(uci.slice(0, 2)), to = CV.sqIdx(uci.slice(2, 4)), pr = uci[4];
  return CV.legalMoves(st).find(m => m.from === from && m.to === to && (!m.promo || m.promo.toLowerCase() === (pr || 'q'))) || null;
}
function insufficient(st) {
  const ps = st.board.filter(Boolean).filter(p => p.toLowerCase() !== 'k');
  if (!ps.length) return true;
  if (ps.length === 1 && /[nbNB]/.test(ps[0])) return true;
  if (ps.every(p => p.toLowerCase() === 'b')) { const cols = new Set(st.board.map((p, i) => p && p.toLowerCase() === 'b' ? ((i >> 3) + (i & 7)) % 2 : -1).filter(x => x >= 0)); return cols.size === 1; }
  return false;
}
// win chance (0–100) for White from a centipawn score, the curve Lichess uses
const winPct = cp => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
const scoreCp = sc => sc ? (sc.mate != null ? (sc.mate > 0 ? 10000 - sc.mate * 10 : -10000 - sc.mate * 10) : sc.cp) : 0;
const fmtScore = sc => !sc ? '…' : sc.mate != null ? (sc.mate === 0 ? '#' : `${sc.mate > 0 ? '' : '-'}M${Math.abs(sc.mate)}`) : `${sc.cp > 0 ? '+' : ''}${(sc.cp / 100).toFixed(2)}`;

/* ---------- the engine ---------- */
class Engine {
  constructor() {
    this.w = new Worker(ENGINE_URL); this.handlers = new Set(); this.busy = null; this.queue = Promise.resolve();
    this.w.onmessage = e => { const line = typeof e.data === 'string' ? e.data : ''; for (const h of [...this.handlers]) h(line); };
    this.w.onerror = e => { this.failed = e.message || 'The engine could not start.'; for (const h of [...this.handlers]) h('error'); };
    this.ready = this.wait('uci', 'uciok').then(() => this.wait('isready', 'readyok'));
  }
  send(c) { this.w.postMessage(c); }
  wait(cmd, token) {
    return new Promise((res, rej) => {
      const h = line => { if (line === 'error') { this.handlers.delete(h); rej(new Error(this.failed)); } else if (line.startsWith(token)) { this.handlers.delete(h); res(line); } };
      this.handlers.add(h); if (cmd) this.send(cmd);
    });
  }
  async stop() { if (this.busy) { this.send('stop'); await this.busy.catch(() => {}); } }
  // one search at a time; a new search stops the one running
  search(fen, { opts = {}, go = 'go depth 18', multipv = 1, onInfo, cancellable = false } = {}) {
    const token = this.latest = (this.latest || 0) + 1;
    if (cancellable && this.busy && this.busyCancel) this.send('stop');   // a newer position: end the running analysis now
    const run = async () => {
      await this.ready; await this.stop();
      if (cancellable && token !== this.latest) return { best: null, lines: [], cancelled: true };
      for (const [k, v] of Object.entries({ MultiPV: multipv, ...opts })) this.send(`setoption name ${k} value ${v}`);
      await this.wait('isready', 'readyok');
      const lines = [];
      const p = new Promise((res, rej) => {
        const h = line => {
          if (line === 'error') { this.handlers.delete(h); return rej(new Error(this.failed)); }
          if (line.startsWith('info') && line.includes(' pv ')) {
            const g = k => { const m = line.match(new RegExp(` ${k} (-?\\d+)`)); return m ? +m[1] : null; };
            const mpv = g('multipv') || 1, sc = line.match(/ score (cp|mate) (-?\d+)/);
            if (!sc) return;
            lines[mpv - 1] = { depth: g('depth'), score: sc[1] === 'cp' ? { cp: +sc[2] } : { mate: +sc[2] }, pv: line.split(' pv ')[1].trim().split(' '), bound: / (lower|upper)bound/.test(line) };
            if (onInfo) onInfo(lines.slice());
          } else if (line.startsWith('bestmove')) { this.handlers.delete(h); res({ best: line.split(' ')[1], lines }); }
        };
        this.handlers.add(h);
      });
      this.busy = p; this.busyCancel = cancellable; this.send(`position fen ${fen}`); this.send(go);
      try { return await p; } finally { if (this.busy === p) this.busy = null; }
    };
    return (this.queue = this.queue.then(run, run));
  }
}

/* ---------- opponents ---------- */
const LEVELS = [
  { name: 'Beginner', rating: '≈400', depth: 1, multipv: 6, random: 0.3, temp: 160, skill: 0 },
  { name: 'Novice', rating: '≈800', depth: 2, multipv: 5, random: 0.12, temp: 90, skill: 0 },
  { name: 'Easy', rating: '≈1100', depth: 4, multipv: 4, random: 0.04, temp: 50, skill: 3 },
  { name: 'Medium', rating: '≈1500', elo: 1500, ms: 400 },
  { name: 'Hard', rating: '≈1900', elo: 1900, ms: 700 },
  { name: 'Expert', rating: '≈2300', elo: 2300, ms: 1000 },
  { name: 'Master', rating: '≈2700', elo: 2700, ms: 1500 },
  { name: 'Impossible', rating: 'full strength', full: true, ms: 2500 },
];
const FULL = { UCI_LimitStrength: 'false', 'Skill Level': 20 };
const CLOCKS = [['none', 'No clock'], ['3+2', '3 | 2'], ['5+0', '5 min'], ['10+0', '10 min'], ['15+10', '15 | 10'], ['30+0', '30 min']];

/* ---------- review ---------- */
const CLASSES = {
  book: { label: 'Book', sym: '≡', col: '#a88865' }, best: { label: 'Best', sym: '★', col: '#5c8b2f' },
  excellent: { label: 'Excellent', sym: '!', col: '#77a33d' }, good: { label: 'Good', sym: '✓', col: '#89a86b' },
  inaccuracy: { label: 'Inaccuracy', sym: '?!', col: '#e2b23c' }, mistake: { label: 'Mistake', sym: '?', col: '#e58f2a' },
  blunder: { label: 'Blunder', sym: '??', col: '#ca3431' }, miss: { label: 'Missed win', sym: '×', col: '#d4573b' },
};
function classify(lossPct, isBest, bestWasWinning, nowWinning) {
  if (isBest) return 'best';
  if (bestWasWinning && !nowWinning && lossPct >= 20) return 'miss';
  return lossPct < 2 ? 'excellent' : lossPct < 5 ? 'good' : lossPct < 10 ? 'inaccuracy' : lossPct < 20 ? 'mistake' : 'blunder';
}
const moveAccuracy = loss => Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * Math.max(0, loss)) - 3.1669));

/* ---------- sounds (made on the spot, no files) ---------- */
let audio = null;
function tock(kind) {
  if (!App.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain(), f = audio.createBiquadFilter();
    const spec = { move: [520, 0.09], capture: [330, 0.13], check: [780, 0.16], end: [260, 0.4] }[kind] || [520, 0.09];
    o.type = kind === 'end' ? 'sine' : 'triangle'; o.frequency.setValueAtTime(spec[0], t); o.frequency.exponentialRampToValueAtTime(spec[0] * 0.55, t + spec[1]);
    f.type = 'lowpass'; f.frequency.value = 1800;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + spec[1]);
    o.connect(f).connect(g).connect(audio.destination); o.start(t); o.stop(t + spec[1] + 0.02);
  } catch (e) { /* no sound */ }
}

/* ---------- state ---------- */
const App = {
  root: null, engine: null, openings: null, mode: 'play', flip: false, sound: true,
  startFen: CV.START, states: [], moves: [], sans: [], cur: 0,
  game: null,              // play: { color, level, clock, times:[w,b], inc, result, reason, over, turnStart }
  analysis: { on: true, lines: [], depth: 0, lastFen: '' },
  review: null,            // { evals:[{score,best}], cls:[], acc:{w,b}, running, done }
  arrows: [], marks: new Set(), hint: null, sel: -1, drag: null, timer: 0, tbFen: '', tb: null,
};
const st = () => App.states[App.cur];
const lastState = () => App.states[App.states.length - 1];

function setPosition(fen) {
  App.startFen = fen; App.states = [CV.parseFEN(fen)]; App.moves = []; App.sans = []; App.cur = 0; App.review = null; App.arrows = []; App.marks.clear(); App.hint = null;
}
function pushMove(m) {
  const s = lastState(), legal = CV.legalMoves(s);
  App.sans.push(CV.sanOf(s, m, legal)); App.moves.push(m); App.states.push(CV.makeMove(s, m)); App.cur = App.states.length - 1;
}
function truncate(at) { App.states.length = at + 1; App.moves.length = at; App.sans.length = at; App.cur = at; App.review = null; }
function gameStatus(atEnd = true) {
  const s = atEnd ? lastState() : st(), status = CV.statusOf(s);
  if (status === 'mate') return { over: true, result: s.turn === 'w' ? '0-1' : '1-0', reason: 'checkmate' };
  if (status === 'stalemate') return { over: true, result: '½-½', reason: 'stalemate' };
  if (insufficient(s)) return { over: true, result: '½-½', reason: 'insufficient material' };
  if (s.half >= 100) return { over: true, result: '½-½', reason: 'the fifty-move rule' };
  const k = repKey(s); if (App.states.filter(x => repKey(x) === k).length >= 3) return { over: true, result: '½-½', reason: 'threefold repetition' };
  return { over: false };
}
function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify({ mode: App.mode, flip: App.flip, sound: App.sound, start: App.startFen, moves: App.moves.map(uciOf), cur: App.cur,
      game: App.game && { ...App.game, turnStart: 0 }, review: App.review && App.review.done ? App.review : null, prefs: App.prefs }));
  } catch (e) {}
}
function load() {
  let d; try { d = JSON.parse(localStorage.getItem(STORE)); } catch (e) {}
  App.prefs = (d && d.prefs) || { color: 'w', level: 3, clock: 'none' };
  if (!d) { setPosition(CV.START); return; }
  App.mode = d.mode || 'play'; App.flip = !!d.flip; App.sound = d.sound !== false;
  try { setPosition(d.start || CV.START); for (const u of d.moves || []) { const m = moveFromUci(lastState(), u); if (!m) break; pushMove(m); } } catch (e) { setPosition(CV.START); }
  App.cur = Math.min(d.cur ?? App.states.length - 1, App.states.length - 1);
  App.game = d.game || null; App.review = d.review && d.review.cls && d.review.cls.length === App.moves.length ? d.review : null;
}

/* ---------- layout ---------- */
const ICONS = {
  flip: CV.ICON.flip, first: CV.ICON.first, prev: CV.ICON.prev, next: CV.ICON.next, last: CV.ICON.last,
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
};
function shell() {
  return `<div class="ch-app">
  <div class="ch-left">
    <div class="ch-player ch-top"></div>
    <div class="ch-boardwrap"><div class="ch-evalbar" title="Evaluation"><div class="ch-evalfill"></div><span class="ch-evaltxt"></span></div>
      <div class="ch-board" tabindex="0" aria-label="Chess board"><div class="ch-squares"></div><div class="ch-pieces"></div><svg class="ch-arrows" viewBox="0 0 800 800"></svg><div class="ch-promo" hidden></div><div class="ch-over" hidden></div></div></div>
    <div class="ch-player ch-bottom"></div>
    <div class="ch-nav"><button data-c="first" title="Start (Home)">${ICONS.first}</button><button data-c="prev" title="Back (←)">${ICONS.prev}</button><button data-c="next" title="Forward (→)">${ICONS.next}</button><button data-c="last" title="End (End)">${ICONS.last}</button><span class="ch-gap"></span><button data-c="flip" title="Flip board (F)">${ICONS.flip}</button><button data-c="sound" title="Sound">${ICONS.sound}</button></div>
  </div>
  <div class="ch-right">
    <div class="ch-tabs" role="tablist"><button role="tab" data-mode="play">Play</button><button role="tab" data-mode="analyse">Analyse</button><button role="tab" data-mode="review">Review</button></div>
    <div class="ch-panel"></div>
    <div class="ch-opening"></div>
    <div class="ch-moves" aria-label="Moves"></div>
    <div class="ch-io"><button data-c="pgn">Copy PGN</button><button data-c="fen">Copy FEN</button><button data-c="import">Load PGN / FEN</button></div>
  </div></div>`;
}

/* ---------- board drawing ---------- */
const sqXY = s => { const f = s & 7, r = s >> 3; return App.flip ? [7 - f, r] : [f, 7 - r]; };
const xyToSq = (x, y) => App.flip ? (y * 8 + (7 - x)) : ((7 - y) * 8 + x);
function drawSquares() {
  const b = $('.ch-squares', App.root); let h = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const s = xyToSq(x, y), light = ((s >> 3) + (s & 7)) % 2 === 1;
    h += `<div class="ch-sq ${light ? 'l' : 'd'}" data-sq="${s}" style="left:${x * 12.5}%;top:${y * 12.5}%">${x === 0 ? `<span class="ch-rank">${(s >> 3) + 1}</span>` : ''}${y === 7 ? `<span class="ch-file">${FILES[s & 7]}</span>` : ''}</div>`;
  }
  b.innerHTML = h;
}
function drawPieces(animate) {
  const s = st(), layer = $('.ch-pieces', App.root), have = new Map();
  for (const e of $$('.ch-pc', layer)) { if (have.has(e.dataset.key) || e.classList.contains('is-drag')) e.remove(); else have.set(e.dataset.key, e); }
  // match pieces to their previous elements so moves slide instead of jumping
  const prev = App._prevBoard || [], now = s.board, used = new Set(), els = [];
  const move = App.cur > 0 ? App.moves[App.cur - 1] : null;
  for (let i = 0; i < 64; i++) {
    const p = now[i]; if (!p) continue;
    let key = null;
    if (prev[i] === p && have.has(`${i}`)) key = `${i}`;
    else if (animate && move && i === move.to && have.has(`${move.from}`)) key = `${move.from}`;
    else if (animate && move && move.castle && have.has(`${move.castle === 'K' ? move.from + 3 : move.from - 4}`) && (i === (move.castle === 'K' ? move.from + 1 : move.from - 1))) key = `${move.castle === 'K' ? move.from + 3 : move.from - 4}`;
    let el = key && !used.has(key) ? have.get(key) : null;
    if (el) used.add(key);
    if (!el || el.dataset.p !== p && !(move && i === move.to && move.promo)) { el = document.createElement('div'); el.className = 'ch-pc'; }
    if (el.dataset.p !== p) { el.innerHTML = CV.pieceSVG(p); el.dataset.p = p; }
    const [x, y] = sqXY(i); el.style.transform = `translate(${x * 100}%,${y * 100}%)`; el.dataset.sq = i; els.push([el, `${i}`]);
  }
  const keep = new Set(els.map(([el]) => el));
  for (const e of $$('.ch-pc', layer)) if (!keep.has(e)) e.remove();
  for (const [el, k] of els) { el.dataset.key = k; if (!el.isConnected) layer.append(el); }
  App._prevBoard = now.slice();
  drawMarks();
}
function drawMarks() {
  const s = st();
  $$('.ch-sq', App.root).forEach(q => { q.classList.remove('last', 'sel', 'dot', 'cap', 'check', 'mk'); q.style.removeProperty('--cls'); const b = q.querySelector('.ch-badge'); if (b) b.remove(); });
  const sq = n => $(`.ch-sq[data-sq="${n}"]`, App.root);
  if (App.cur > 0) { const m = App.moves[App.cur - 1]; sq(m.from).classList.add('last'); sq(m.to).classList.add('last');
    const c = App.review && App.review.cls[App.cur - 1];
    if (c && CLASSES[c]) { const b = document.createElement('span'); b.className = 'ch-badge'; b.style.background = CLASSES[c].col; b.textContent = CLASSES[c].sym; b.title = CLASSES[c].label; sq(m.to).append(b); }
  }
  if (CV.inCheck(s)) { const k = s.board.indexOf(s.turn === 'w' ? 'K' : 'k'); if (k >= 0) sq(k).classList.add('check'); }
  for (const n of App.marks) sq(n).classList.add('mk');
  if (App.sel >= 0) {
    sq(App.sel).classList.add('sel');
    for (const m of CV.legalMoves(s).filter(m => m.from === App.sel)) sq(m.to).classList.add(m.capture ? 'cap' : 'dot');
  }
  drawArrows();
}
function arrowPath(from, to) {
  const [x1, y1] = sqXY(from), [x2, y2] = sqXY(to), c = v => v * 100 + 50;
  const ax = c(x1), ay = c(y1), bx = c(x2), by = c(y2), dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  const knight = (Math.abs(x2 - x1) === 1 && Math.abs(y2 - y1) === 2) || (Math.abs(x2 - x1) === 2 && Math.abs(y2 - y1) === 1);
  const ex = bx - ux * 30, ey = by - uy * 30;
  if (knight) { const mx = Math.abs(x2 - x1) === 2 ? bx : ax, my = Math.abs(x2 - x1) === 2 ? ay : by; return { d: `M${ax + (mx - ax ? Math.sign(mx - ax) * 22 : 0)},${ay + (my - ay ? Math.sign(my - ay) * 22 : 0)} L${mx},${my} L${ex},${ey}`, tip: [bx, by, ex, ey] }; }
  return { d: `M${ax + ux * 22},${ay + uy * 22} L${ex},${ey}`, tip: [bx, by, ex, ey] };
}
function drawArrows() {
  const svg = $('.ch-arrows', App.root); let h = '';
  const draw = (from, to, col, w = 16, op = 0.8) => {
    const { d, tip: [bx, by, ex, ey] } = arrowPath(from, to), ang = Math.atan2(by - ey, bx - ex), hw = w * 1.45;
    const p1 = [ex + Math.cos(ang + Math.PI / 2) * hw, ey + Math.sin(ang + Math.PI / 2) * hw], p2 = [ex + Math.cos(ang - Math.PI / 2) * hw, ey + Math.sin(ang - Math.PI / 2) * hw];
    const tipX = bx - Math.cos(ang) * 6, tipY = by - Math.sin(ang) * 6;
    h += `<g opacity="${op}"><path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="butt" stroke-linejoin="round"/><polygon points="${p1.join(',')} ${tipX},${tipY} ${p2.join(',')}" fill="${col}"/></g>`;
  };
  const showEngine = App.mode === 'analyse' && App.analysis.on && App.analysis.fen === toFEN(st());
  if (showEngine) App.analysis.lines.slice(0, 3).forEach((l, i) => { if (l && l.pv[0]) { const m = moveFromUci(st(), l.pv[0]); if (m) draw(m.from, m.to, i === 0 ? '#2f7fd6' : '#2f7fd6', i === 0 ? 17 : 11, i === 0 ? 0.8 : 0.42); } });
  if (App.mode === 'review' && App.review && App.cur < App.moves.length) {
    const e = App.review.evals[App.cur]; const m = e && e.best && moveFromUci(st(), e.best); if (m) draw(m.from, m.to, '#5c8b2f', 15, 0.75);
  }
  if (App.hint && App.hint.fen === toFEN(st())) draw(App.hint.m.from, App.hint.m.to, '#e0a800', 17, 0.85);
  for (const a of App.arrows) draw(a.from, a.to, '#e8730c', 15, 0.82);
  if (App.drawing && App.drawing.to !== App.drawing.from && App.drawing.to >= 0) draw(App.drawing.from, App.drawing.to, '#e8730c', 15, 0.5);
  svg.innerHTML = h;
}

/* ---------- interaction ---------- */
function humanCanMove() {
  if (App.mode === 'review') return false;
  if (App.mode === 'play') { const g = App.game; return g && !g.over && App.cur === App.states.length - 1 && st().turn === g.color && !App.thinking; }
  return true;
}
function squareAt(ev) {
  const r = $('.ch-board', App.root).getBoundingClientRect();
  const x = Math.floor((ev.clientX - r.left) / r.width * 8), y = Math.floor((ev.clientY - r.top) / r.height * 8);
  return x < 0 || y < 0 || x > 7 || y > 7 ? -1 : xyToSq(x, y);
}
function bindBoard() {
  const board = $('.ch-board', App.root);
  board.addEventListener('contextmenu', e => e.preventDefault());
  board.addEventListener('pointerdown', e => {
    if ($('.ch-promo', App.root).hidden === false) return;
    const s = squareAt(e); if (s < 0) return;
    if (e.button === 2) { App.drawing = { from: s, to: s }; return; }
    if (e.button !== 0) return;
    if (App.arrows.length || App.marks.size) { App.arrows = []; App.marks.clear(); }
    const p = st().board[s];
    if (App.sel >= 0 && App.sel !== s && tryMove(App.sel, s)) return;
    if (p && humanCanMove() && (p === p.toUpperCase() ? 'w' : 'b') === st().turn) {
      App.sel = s; drawMarks();
      const el = $(`.ch-pc[data-sq="${s}"]`, App.root); if (!el) return;
      const r = board.getBoundingClientRect();
      App.drag = { s, el, r, moved: false, x0: e.clientX, y0: e.clientY };
      board.setPointerCapture(e.pointerId); el.classList.add('is-drag');
    } else { App.sel = -1; drawMarks(); }
  });
  board.addEventListener('pointermove', e => {
    if (App.drawing) { const s = squareAt(e); if (s !== App.drawing.to) { App.drawing.to = s; drawArrows(); } return; }
    const d = App.drag; if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 4) return;
    d.moved = true; const sz = d.r.width / 8;
    d.el.style.transform = `translate(${e.clientX - d.r.left - sz / 2}px,${e.clientY - d.r.top - sz / 2}px)`;
    d.el.style.width = d.el.style.height = sz + 'px';
  });
  const end = e => {
    if (App.drawing) {
      const { from, to } = App.drawing; App.drawing = null;
      if (to === from) { App.marks.has(from) ? App.marks.delete(from) : App.marks.add(from); }
      else if (to >= 0) { const i = App.arrows.findIndex(a => a.from === from && a.to === to); i >= 0 ? App.arrows.splice(i, 1) : App.arrows.push({ from, to }); }
      drawMarks(); return;
    }
    const d = App.drag; if (!d) return; App.drag = null;
    d.el.classList.remove('is-drag'); d.el.style.width = d.el.style.height = '';
    const s = squareAt(e);
    if (d.moved && s >= 0 && s !== d.s && tryMove(d.s, s)) return;
    const [x, y] = sqXY(d.s); d.el.style.transform = `translate(${x * 100}%,${y * 100}%)`;
    if (d.moved) { App.sel = -1; drawMarks(); }
  };
  board.addEventListener('pointerup', end); board.addEventListener('pointercancel', end);
}
function tryMove(from, to) {
  const s = st(), cands = CV.legalMoves(s).filter(m => m.from === from && m.to === to);
  if (!cands.length) return false;
  App.sel = -1;
  if (cands.length > 1) { askPromotion(cands); return true; }
  playerMove(cands[0]); return true;
}
function askPromotion(cands) {
  const box = $('.ch-promo', App.root), color = st().turn;
  box.innerHTML = 'qrbn'.split('').map(t => { const p = color === 'w' ? t.toUpperCase() : t; return `<button data-p="${p}" aria-label="${{ q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' }[t]}">${CV.pieceSVG(p)}</button>`; }).join('') + '<button data-p="" class="ch-promo-x" aria-label="Cancel">×</button>';
  box.hidden = false;
  box.onclick = e => { const b = e.target.closest('button'); if (!b) return; box.hidden = true; const m = cands.find(c => c.promo === b.dataset.p); if (m) playerMove(m); else render(); };
}
function playerMove(m) {
  if (App.mode === 'analyse' && App.cur < App.states.length - 1) {
    // a move that matches the game continues it; anything else starts a new line from here
    if (uciOf(App.moves[App.cur]) === uciOf(m)) { App.cur++; afterMove(true); return; }
    truncate(App.cur);
  }
  App.hint = null; App.arrows = []; App.marks.clear();
  pushMove(m);
  if (App.mode === 'play') applyIncrement();
  afterMove(true);
  if (App.mode === 'play') { checkGameEnd(); if (!App.game.over) botMove(); }
}
function afterMove(animate) {
  const m = App.moves[App.cur - 1], s = st();
  if (m) tock(CV.statusOf(s) === 'mate' ? 'end' : CV.inCheck(s) ? 'check' : m.capture ? 'capture' : 'move');
  render(animate); save();
}

/* ---------- playing ---------- */
function newGame(prefs) {
  App.prefs = prefs; App.mode = 'play';
  const color = prefs.color === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : prefs.color;
  setPosition(CV.START); App.flip = color === 'b';
  const [mins, inc] = prefs.clock === 'none' ? [0, 0] : prefs.clock.split('+').map(Number);
  App.game = { color, level: prefs.level, clock: prefs.clock, times: [mins * 60000, mins * 60000], inc: inc * 1000, over: false, result: '', reason: '', turnStart: Date.now(), running: 0 };
  drawSquares(); render(); save();
  if (color === 'b') botMove();
}
function clockOn() { return App.game && App.game.clock !== 'none' && !App.game.over; }
// the running clock belongs to g.running (0 White, 1 Black); time is charged to it since g.turnStart
function canMate(color) {
  const ps = lastState().board.filter(p => p && (p === p.toUpperCase()) === (color === 'w') && p.toLowerCase() !== 'k');
  return ps.some(p => /[pqrPQR]/.test(p)) || ps.length >= 2;
}
function tickClock() {
  const g = App.game; if (!clockOn()) return;
  const side = g.running ?? (lastState().turn === 'w' ? 0 : 1), now = Date.now();
  if (g.turnStart) g.times[side] -= now - g.turnStart;
  g.turnStart = now;
  if (g.times[side] <= 0) {
    g.times[side] = 0;
    const winner = side === 0 ? 'b' : 'w';
    if (canMate(winner)) endGame(winner === 'w' ? '1-0' : '0-1', 'time'); else endGame('½-½', 'timeout with insufficient mating material');
  }
  if (App.root) drawPlayers();
}
function applyIncrement() {
  const g = App.game; if (!clockOn()) return;
  tickClock(); if (g.over) return;
  const moved = lastState().turn === 'w' ? 1 : 0;
  g.times[moved] += g.inc; g.running = 1 - moved; g.turnStart = Date.now();
}
async function botMove() {
  const g = App.game; if (!g || g.over || lastState().turn === g.color) return;
  App.thinking = true; drawPlayers();
  const lv = LEVELS[g.level], fen = toFEN(lastState()), s0 = lastState(), legal = CV.legalMoves(s0);
  let uci = null;
  try {
    if (lv.depth) {
      const minDelay = new Promise(r => setTimeout(r, 350 + Math.random() * 500));
      const r = await App.engine.search(fen, { opts: { UCI_LimitStrength: 'false', 'Skill Level': lv.skill }, multipv: lv.multipv, go: `go depth ${lv.depth}` });
      await minDelay;
      if (Math.random() < lv.random) uci = uciOf(legal[Math.floor(Math.random() * legal.length)]);
      else {
        const ls = r.lines.filter(Boolean), best = Math.max(...ls.map(l => scoreCp(l.score)));
        const ws = ls.map(l => Math.exp((scoreCp(l.score) - best) / lv.temp)), tot = ws.reduce((a, b) => a + b, 0);
        let x = Math.random() * tot; for (let i = 0; i < ls.length; i++) { x -= ws[i]; if (x <= 0) { uci = ls[i].pv[0]; break; } }
        uci = uci || r.best;
      }
      g.botEval = r.lines[0] && scoreCp(r.lines[0].score) * (s0.turn === 'w' ? 1 : -1);
    } else {
      const left = g.clock !== 'none' ? g.times[s0.turn === 'w' ? 0 : 1] : Infinity;
      const ms = Math.max(80, Math.min(lv.ms, left / 30));
      const opts = lv.full ? FULL : { UCI_LimitStrength: 'true', UCI_Elo: lv.elo, 'Skill Level': 20 };
      const r = await App.engine.search(fen, { opts, go: `go movetime ${Math.round(ms)}` });
      uci = r.best; g.botEval = r.lines[0] && scoreCp(r.lines[0].score) * (s0.turn === 'w' ? 1 : -1);
    }
  } catch (e) { App.thinking = false; showError(e); return; }
  App.thinking = false;
  if (!App.root) return;   // left the page; the move is asked for again on return
  if (!App.game || App.game !== g || g.over || toFEN(lastState()) !== fen) return;   // the game changed while it was thinking
  const m = moveFromUci(lastState(), uci) || legal[0];
  App.cur = App.states.length - 1; pushMove(m); applyIncrement(); afterMove(true); checkGameEnd();
}
function checkGameEnd() { const r = gameStatus(); if (r.over) endGame(r.result, r.reason); }
function endGame(result, reason) {
  const g = App.game; if (!g || g.over) return;
  g.over = true; g.result = result; g.reason = reason; App.thinking = false; tock('end'); save(); render();
}
function resultText(g) {
  if (!g || !g.over) return '';
  const youWin = (g.result === '1-0' && g.color === 'w') || (g.result === '0-1' && g.color === 'b');
  const head = g.result === '½-½' ? 'Draw' : youWin ? 'You won' : 'Stockfish won';
  const why = { checkmate: 'by checkmate', resignation: 'by resignation', time: 'on time', agreement: 'by agreement' }[g.reason] || `by ${g.reason}`;
  return `<strong>${head}</strong> <span>${why}</span>`;
}

/* ---------- analysis ---------- */
let anaToken = 0;
async function analyse() {
  if (App.mode !== 'analyse' || !App.analysis.on) return;
  const fen = toFEN(st()), token = ++anaToken;
  if (App.analysis.fen === fen && App.analysis.done) { drawEngine(); return; }
  App.analysis = { ...App.analysis, fen, lines: [], depth: 0, done: false };
  drawEngine();
  if (gameStatus(false).over) { App.analysis.done = true; drawEngine(); return; }
  try {
    const res = await App.engine.search(fen, { opts: FULL, multipv: 3, cancellable: true, go: 'go depth 22 movetime 15000', onInfo: lines => {
      if (token !== anaToken) return;
      App.analysis.lines = lines; App.analysis.depth = Math.max(...lines.filter(Boolean).map(l => l.depth || 0)); drawEngine(); drawArrows();
    } });
    if (res.cancelled) return;
    if (token === anaToken) { App.analysis.done = true; drawEngine(); }
  } catch (e) { showError(e); }
  tablebase();
}
async function tablebase() {
  const s = st(), n = s.board.filter(Boolean).length, fen = toFEN(s);
  if (n > 7 || App.mode !== 'analyse') { App.tb = null; return; }
  if (App.tbFen === fen) return; App.tbFen = fen; App.tb = { loading: true }; drawEngine();
  try {
    const r = await fetch('https://tablebase.lichess.ovh/standard?fen=' + encodeURIComponent(fen)); if (!r.ok) throw new Error(r.status);
    const d = await r.json(); if (App.tbFen !== fen) return;
    App.tb = { cat: d.category, dtm: d.dtm, dtz: d.dtz, moves: (d.moves || []).slice(0, 5) };
  } catch (e) { if (App.tbFen === fen) App.tb = { error: true }; }
  drawEngine();
}
function lineSan(s, pv, max = 10) {
  let out = [], x = s;
  for (const u of pv.slice(0, max)) {
    const m = moveFromUci(x, u); if (!m) break;
    const n = x.full, san = CV.sanOf(x, m, CV.legalMoves(x));
    out.push(x.turn === 'w' ? `<b>${n}.</b> ${san}` : (out.length ? san : `<b>${n}…</b> ${san}`));
    x = CV.makeMove(x, m);
  }
  return out.join(' ');
}
function drawEngine() {
  const box = $('.ch-engine', App.root); if (!box) return;
  const a = App.analysis, s = st(), sign = s.turn === 'w' ? 1 : -1;
  const lines = a.lines.filter(Boolean).map(l => ({ ...l, w: l.score.mate != null ? { mate: l.score.mate * sign } : { cp: l.score.cp * sign } }));
  const over = gameStatus(false);
  $('.ch-eng-head', box).innerHTML = !a.on ? 'Engine off' : over.over ? `Game over: ${over.reason}` : `<span class="ch-eng-score">${lines[0] ? fmtScore(lines[0].w) : '…'}</span> <span class="ch-eng-depth">Stockfish 19 · depth ${a.depth || 0}${a.done ? '' : '…'}</span>`;
  $('.ch-eng-lines', box).innerHTML = a.on && !over.over ? lines.map(l => `<div class="ch-line"><span class="ch-line-sc">${fmtScore(l.w)}</span><span class="ch-line-pv">${lineSan(s, l.pv)}</span></div>`).join('') : '';
  const tb = App.tb, tbBox = $('.ch-tb', box);
  if (!tb) tbBox.innerHTML = '';
  else if (tb.loading) tbBox.innerHTML = 'Endgame tablebase…';
  else if (tb.error) tbBox.innerHTML = 'Endgame tablebase unavailable (needs a connection).';
  else {
    const word = { win: 'Win', loss: 'Loss', draw: 'Draw', 'cursed-win': 'Win, but drawn by the 50-move rule', 'blessed-loss': 'Loss, but saved by the 50-move rule', 'maybe-win': 'Probably a win', 'maybe-loss': 'Probably a loss', unknown: 'Unknown' }[tb.cat] || tb.cat;
    tbBox.innerHTML = `<b>Tablebase</b> (perfect play): ${s.turn === 'w' ? 'White' : 'Black'} to move — ${esc(word)}${tb.dtm ? `, mate in ${Math.ceil(Math.abs(tb.dtm) / 2)}` : ''}${tb.moves.length ? `<br>Best: ${tb.moves.slice(0, 3).map(m => esc(m.san)).join(', ')}` : ''}`;
  }
  if (lines[0]) setEvalBar(lines[0].w); else if (over.over) setEvalBar(over.result === '1-0' ? { mate: 0, white: true } : over.result === '0-1' ? { mate: 0, white: false } : { cp: 0 });
}
function setEvalBar(w) {
  const bar = $('.ch-evalbar', App.root), fill = $('.ch-evalfill', bar), txt = $('.ch-evaltxt', bar);
  let pct, label;
  if (w.mate != null) { const white = w.mate === 0 ? w.white : w.mate > 0; pct = white ? 100 : 0; label = w.mate === 0 ? (white ? '1-0' : '0-1') : `M${Math.abs(w.mate)}`; }
  else { pct = winPct(w.cp); label = Math.abs(w.cp / 100).toFixed(1); }
  fill.style.height = `${pct}%`; txt.textContent = label; bar.classList.toggle('white-ahead', pct >= 50); bar.classList.toggle('flipped', App.flip);
}

/* ---------- review ---------- */
async function runReview() {
  if (!App.moves.length) return;
  if (App.review && (App.review.done || App.review.running)) return;
  const R = App.review = { evals: [], cls: [], acc: null, running: true, done: false, progress: 0 };
  render();
  try {
    for (let i = 0; i <= App.moves.length; i++) {
      if (App.review !== R) return;
      const s = App.states[i];
      const status = CV.statusOf(s);
      if (status === 'mate') R.evals[i] = { cp: s.turn === 'w' ? -10000 : 10000, best: null };
      else if (status === 'stalemate' || insufficient(s)) R.evals[i] = { cp: 0, best: null };
      else {
        const r = await App.engine.search(toFEN(s), { opts: FULL, go: 'go depth 14 movetime 1500' });
        const l = r.lines[0]; R.evals[i] = { cp: l ? scoreCp(l.score) * (s.turn === 'w' ? 1 : -1) : 0, best: r.best, score: l && (l.score.mate != null ? { mate: l.score.mate * (s.turn === 'w' ? 1 : -1) } : { cp: l.score.cp * (s.turn === 'w' ? 1 : -1) }) };
      }
      R.progress = i / App.moves.length; drawReview();
    }
    const accs = { w: [], b: [] }, counts = { w: {}, b: {} };
    for (let i = 0; i < App.moves.length; i++) {
      const mover = App.states[i].turn, sgn = mover === 'w' ? 1 : -1;
      const before = winPct(sgn * R.evals[i].cp), after = winPct(sgn * R.evals[i + 1].cp), loss = Math.max(0, before - after);
      const book = App.openings && App.openings[openKey(App.states[i + 1])] && i < 24 && (i === 0 || R.cls[i - 1] === 'book');
      const c = book ? 'book' : classify(loss, uciOf(App.moves[i]) === R.evals[i].best, before > 80, after > 60);
      R.cls[i] = c; accs[mover].push(moveAccuracy(loss)); counts[mover][c] = (counts[mover][c] || 0) + 1;
    }
    const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
    R.acc = { w: mean(accs.w), b: mean(accs.b) }; R.counts = counts; R.running = false; R.done = true;
    save(); render();
  } catch (e) { R.running = false; showError(e); }
}
function evalGraph() {
  const R = App.review; if (!R || !R.evals.length) return '';
  const n = App.moves.length, W = 600, H = 120, pts = R.evals.map((e, i) => [i / Math.max(1, n) * W, H - winPct(Math.max(-1500, Math.min(1500, e.cp))) / 100 * H]);
  const area = `M0,${H} ` + pts.map(p => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ` L${pts[pts.length - 1][0].toFixed(1)},${H} Z`;
  const marks = R.cls.map((c, i) => ['blunder', 'mistake', 'miss'].includes(c) ? `<circle cx="${pts[i + 1][0].toFixed(1)}" cy="${pts[i + 1][1].toFixed(1)}" r="4" fill="${CLASSES[c].col}"/>` : '').join('');
  const cx = (App.cur / Math.max(1, n) * W).toFixed(1);
  return `<svg class="ch-graph" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><rect width="${W}" height="${H}" class="ch-graph-bg"/><path d="${area}" class="ch-graph-w"/><line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" class="ch-graph-mid"/>${marks}<line x1="${cx}" y1="0" x2="${cx}" y2="${H}" class="ch-graph-cur"/></svg>`;
}
function drawReview() {
  const box = $('.ch-review', App.root); if (!box) return;
  const R = App.review;
  if (!App.moves.length) { box.innerHTML = '<p class="ch-muted">Play or load a game, then review it here: every move is checked by Stockfish and marked from best to blunder.</p>'; return; }
  if (!R) { box.innerHTML = `<p class="ch-muted">${App.moves.length} moves to check.</p><button class="ch-primary" data-c="review">Review this game</button>`; return; }
  if (R.running) { box.innerHTML = `<p>Checking every move… ${Math.round(R.progress * 100)}%</p><div class="ch-progress"><span style="width:${R.progress * 100}%"></span></div>`; return; }
  const names = playerNames(), row = (c) => `<tr><td><span class="ch-cls" style="background:${CLASSES[c].col}">${CLASSES[c].sym}</span> ${CLASSES[c].label}</td><td>${R.counts.w[c] || 0}</td><td>${R.counts.b[c] || 0}</td></tr>`;
  const cur = App.cur > 0 && R.cls[App.cur - 1], i = App.cur - 1;
  let note = '';
  if (cur) {
    const best = R.evals[i].best, bm = best && moveFromUci(App.states[i], best), bsan = bm ? CV.sanOf(App.states[i], bm, CV.legalMoves(App.states[i])) : '';
    note = `<div class="ch-verdict" style="--c:${CLASSES[cur].col}"><span class="ch-cls" style="background:${CLASSES[cur].col}">${CLASSES[cur].sym}</span> <b>${esc(App.sans[i])}</b> is ${cur === 'book' ? 'a book move' : cur === 'best' ? 'the best move' : cur === 'miss' ? 'a missed win' : `${/^[aeiou]/i.test(CLASSES[cur].label) ? 'an' : 'a'} ${CLASSES[cur].label.toLowerCase()}`}.${!['best', 'book'].includes(cur) && bsan ? ` Best was <b>${esc(bsan)}</b>.` : ''}<span class="ch-verdict-ev">${fmtScore(R.evals[i + 1].score || { cp: R.evals[i + 1].cp })}</span></div>`;
  }
  box.innerHTML = `${evalGraph()}${note}
    <table class="ch-acc"><thead><tr><th></th><th>${esc(names.w)}</th><th>${esc(names.b)}</th></tr></thead>
    <tbody><tr class="ch-acc-row"><td>Accuracy</td><td>${R.acc.w != null ? R.acc.w.toFixed(1) : '–'}</td><td>${R.acc.b != null ? R.acc.b.toFixed(1) : '–'}</td></tr>
    ${Object.keys(CLASSES).map(row).join('')}</tbody></table>
    <p class="ch-muted">Use ← → to step through. The green arrow shows Stockfish's choice.</p>`;
  const g = $('.ch-graph', box); if (g) g.addEventListener('click', e => { const r = g.getBoundingClientRect(); goTo(Math.round((e.clientX - r.left) / r.width * App.moves.length)); });
}

/* ---------- panels ---------- */
function playerNames() {
  const g = App.game, bot = g ? `Stockfish · ${LEVELS[g.level].name}` : 'Black';
  if (!g) return { w: 'White', b: 'Black' };
  return g.color === 'w' ? { w: 'You', b: bot } : { w: bot, b: 'You' };
}
const fmtClock = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : ms < 10000 ? (Math.max(0, ms) / 1000).toFixed(1) : `0:${String(s).padStart(2, '0')}`; };
function captured(color) {
  const s = st(), start = { p: 8, n: 2, b: 2, r: 2, q: 1 }, have = {};
  for (const p of s.board) if (p && (p === p.toUpperCase()) === (color === 'w') && p.toLowerCase() !== 'k') have[p.toLowerCase()] = (have[p.toLowerCase()] || 0) + 1;
  let out = ''; const val = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  let score = 0;
  for (const t of 'qrbnp') { const lost = Math.max(0, start[t] - (have[t] || 0)); score += (have[t] || 0) * val[t]; for (let i = 0; i < lost; i++) out += `<span class="ch-cap">${CV.pieceSVG(color === 'w' ? t.toUpperCase() : t)}</span>`; }
  return { html: out, score };
}
function drawPlayers() {
  const names = playerNames(), g = App.game;
  const bottom = App.flip ? 'b' : 'w', top = bottom === 'w' ? 'b' : 'w';
  const cw = captured('w'), cb = captured('b'), diff = cw.score - cb.score;
  for (const [cls, side] of [['.ch-top', top], ['.ch-bottom', bottom]]) {
    const el = $(cls, App.root), mine = side === 'w' ? cb : cw;   // pieces this side has taken = the other side's losses
    const adv = side === 'w' ? diff : -diff;
    const showClock = App.mode === 'play' && g && g.clock !== 'none';
    const idx = side === 'w' ? 0 : 1, running = showClock && !g.over && lastState().turn === side;
    const thinking = App.mode === 'play' && App.thinking && g && side !== g.color;
    el.innerHTML = `<span class="ch-pname"><span class="ch-swatch ${side}"></span>${esc(names[side])}${thinking ? ' <span class="ch-think">thinking…</span>' : ''}</span><span class="ch-caps">${mine.html}${adv > 0 ? `<span class="ch-adv">+${adv}</span>` : ''}</span>${showClock ? `<span class="ch-clock${running ? ' on' : ''}${g.times[idx] < 20000 ? ' low' : ''}">${fmtClock(g.times[idx])}</span>` : ''}`;
  }
}
function drawPanel() {
  const p = $('.ch-panel', App.root), g = App.game;
  $$('.ch-tabs [data-mode]', App.root).forEach(b => b.setAttribute('aria-selected', b.dataset.mode === App.mode));
  $('.ch-evalbar', App.root).hidden = App.mode === 'play' && !(g && g.over);
  if (App.mode === 'play') {
    if (!g || g.over) {
      const pr = App.prefs;
      p.innerHTML = `${g && g.over ? `<div class="ch-result">${resultText(g)}<div class="ch-row"><button class="ch-primary" data-c="go-review">Review game</button><button data-c="go-analyse">Analyse</button></div></div>` : ''}
        <h3 class="ch-h">New game against Stockfish</h3>
        <div class="ch-levels">${LEVELS.map((l, i) => `<button data-level="${i}" aria-pressed="${pr.level === i}"><b>${l.name}</b><span>${l.rating}</span></button>`).join('')}</div>
        <div class="ch-row ch-colors"><span>Play as</span>${[['w', 'White'], ['r', 'Random'], ['b', 'Black']].map(([v, n]) => `<button data-color="${v}" aria-pressed="${pr.color === v}">${n}</button>`).join('')}</div>
        <div class="ch-row ch-clocks"><span>Clock</span>${CLOCKS.map(([v, n]) => `<button data-clock="${v}" aria-pressed="${pr.clock === v}">${n}</button>`).join('')}</div>
        <button class="ch-primary ch-start" data-c="start">Start game</button>`;
    } else {
      p.innerHTML = `<div class="ch-ingame"><p><b>${LEVELS[g.level].name}</b> <span class="ch-muted">(${LEVELS[g.level].rating})</span> · you play ${g.color === 'w' ? 'White' : 'Black'}</p>
        <div class="ch-row"><button data-c="hint">Hint</button><button data-c="takeback">Take back</button><button data-c="draw">Offer draw</button><button data-c="resign" class="ch-danger">Resign</button></div>
        <p class="ch-msg" aria-live="polite">${esc(App.msg || '')}</p></div>`;
    }
  } else if (App.mode === 'analyse') {
    p.innerHTML = `<div class="ch-engine"><div class="ch-row ch-eng-top"><label class="ch-switch"><input type="checkbox" data-c="engine" ${App.analysis.on ? 'checked' : ''}> Engine</label><div class="ch-eng-head"></div></div>
      <div class="ch-eng-lines"></div><div class="ch-tb"></div>
      <div class="ch-row"><button data-c="new-board">New board</button><button data-c="play-here">Play from here</button></div></div>`;
    drawEngine();
  } else {
    p.innerHTML = `<div class="ch-review"></div>`; drawReview();
  }
}
function drawMoves() {
  const box = $('.ch-moves', App.root); let h = '';
  const start = App.states[0], off = start.turn === 'b' ? 1 : 0;
  const cell = i => { const c = App.review && App.review.cls[i]; return `<span class="ch-mv${App.cur === i + 1 ? ' cur' : ''}" data-ply="${i + 1}">${c && !['best', 'excellent', 'good', 'book'].includes(c) ? `<i style="color:${CLASSES[c].col}">${CLASSES[c].sym}</i>` : ''}${esc(App.sans[i])}</span>`; };
  let i = 0;
  if (off && App.sans.length) { h += `<span class="ch-n">${start.full}.</span><span class="ch-mv ch-empty">…</span>` + cell(0); i = 1; }
  for (; i < App.sans.length; i += 2) h += `<span class="ch-n">${start.full + Math.floor((i + off) / 2)}.</span>` + cell(i) + (i + 1 < App.sans.length ? cell(i + 1) : '<span></span>');
  const g = App.game, res = App.mode !== 'analyse' && g && g.over ? `<span class="ch-res">${g.result}</span>` : '';
  box.innerHTML = h ? h + res : '<span class="ch-muted">No moves yet.</span>';
  const cur = $('.ch-mv.cur', box); if (cur) cur.scrollIntoView({ block: 'nearest' });
  // opening name
  let name = '';
  for (let i = Math.min(App.cur, 30); i >= 0; i--) { const v = App.openings && App.openings[openKey(App.states[i])]; if (v) { name = v; break; } }
  $('.ch-opening', App.root).innerHTML = name ? `<span class="ch-eco">${esc(name.split('|')[0])}</span> ${esc(name.split('|')[1])}` : '';
}
function drawOver() {
  const o = $('.ch-over', App.root), g = App.game;
  if (App.mode === 'play' && g && g.over && App.cur === App.states.length - 1 && !App.overDismissed) {
    o.innerHTML = `<div class="ch-over-card">${resultText(g)}<div class="ch-row"><button class="ch-primary" data-c="go-review">Review game</button><button data-c="rematch">Rematch</button><button data-c="close-over" aria-label="Close">×</button></div></div>`;
    o.hidden = false;
  } else o.hidden = true;
}
function render(animate) {
  if (!App.root) return;
  drawPieces(animate); drawPlayers(); drawPanel(); drawMoves(); drawOver();
  $('.ch-nav [data-c="sound"]', App.root).innerHTML = App.sound ? ICONS.sound : ICONS.mute;
  if (App.mode === 'analyse') analyse(); else setEvalBarForReview();
}
function setEvalBarForReview() {
  if (App.mode === 'review' && App.review && App.review.evals[App.cur]) { const e = App.review.evals[App.cur]; setEvalBar(e.score || { cp: e.cp }); }
  else if (App.mode === 'review') setEvalBar({ cp: 0 });
}
function goTo(i) {
  i = Math.max(0, Math.min(App.states.length - 1, i)); if (i === App.cur) return;
  const fwd = i === App.cur + 1; App.cur = i; App.sel = -1; App.arrows = []; App.marks.clear();
  if (fwd) tock(App.moves[i - 1].capture ? 'capture' : 'move');
  render(fwd); save();
}
function showError(e) {
  const p = $('.ch-panel', App.root); if (!p) return;
  const m = document.createElement('p'); m.className = 'ch-err';
  m.textContent = `The engine stopped working (${e && e.message ? e.message : e}). Reload the page to restart it.`; p.prepend(m);
}

/* ---------- PGN / FEN ---------- */
function pgnText() {
  const g = App.game, names = playerNames(), d = new Date();
  const res = g && g.over && App.mode !== 'analyse' ? g.result.replace('½-½', '1/2-1/2') : '*';
  const head = [['Event', g ? 'Casual game against Stockfish' : 'Analysis'], ['Site', location.origin + location.pathname], ['Date', `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`],
    ['White', names.w], ['Black', names.b], ['Result', res]];
  if (App.startFen !== CV.START) head.push(['SetUp', '1'], ['FEN', App.startFen]);
  if (g && g.over) head.push(['Termination', g.reason]);
  let body = '', s0 = App.states[0], off = s0.turn === 'b' ? 1 : 0;
  App.sans.forEach((san, i) => {
    const ply = i + off; if (ply % 2 === 0) body += `${s0.full + ply / 2}. `; else if (i === 0) body += `${s0.full}... `;
    const c = App.review && App.review.cls[i], nag = { inaccuracy: '?!', mistake: '?', blunder: '??', miss: '?' }[c] || '';
    body += san + nag + ' ';
  });
  return head.map(([k, v]) => `[${k} "${String(v).replace(/"/g, "'")}"]`).join('\n') + '\n\n' + (body + res).trim() + '\n';
}
function importText(text) {
  text = String(text || '').trim(); if (!text) return 'Nothing to load.';
  const looksFen = /^[pnbrqkPNBRQK1-8]+(\/[pnbrqkPNBRQK1-8]+){7}(\s|$)/.test(text);
  let fen = CV.START, moves = text;
  if (looksFen) { moves = ''; fen = text.split(/\s+/).length >= 4 ? text : text + (text.split(' ').length === 1 ? ' w - - 0 1' : ''); }
  else { const f = text.match(/\[FEN\s+"([^"]+)"\]/); if (f) fen = f[1]; }
  let s; try { s = CV.parseFEN(fen); } catch (e) { return `That position doesn't read as FEN: ${e.message}`; }
  if (s.board.indexOf('K') < 0 || s.board.indexOf('k') < 0) return 'A position needs both kings.';
  const tokens = moves.replace(/\[[^\]]*\]/g, ' ').replace(/\{[^}]*\}/g, ' ').replace(/;[^\n]*/g, ' ');
  let flat = tokens, prev; do { prev = flat; flat = flat.replace(/\([^()]*\)/g, ' '); } while (flat !== prev);
  const list = flat.replace(/\$\d+/g, ' ').replace(/\d+\.(\.\.)?/g, ' ').split(/\s+/).filter(t => t && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t));
  setPosition(fen);
  for (const t of list) { const m = CV.findMove(lastState(), t); if (!m) { App.cur = App.states.length - 1; return `Loaded up to move ${App.moves.length}; couldn't read "${t}".`; } pushMove(m.m); }
  App.cur = App.states.length - 1; return '';
}
function openImport() {
  const ov = document.createElement('div'); ov.className = 'overlay';
  ov.innerHTML = `<div class="dialog ch-import" role="dialog" aria-modal="true" aria-label="Load a game"><p class="ch-h">Load a game or position</p>
    <textarea rows="9" placeholder="Paste PGN (1. e4 e5 2. Nf3 …) or a FEN position"></textarea><p class="ch-err" hidden></p>
    <div class="ch-row"><button class="ch-primary" data-x="load">Load into analysis</button><button data-x="cancel">Cancel</button></div></div>`;
  document.body.append(ov);
  const ta = $('textarea', ov); ta.focus();
  const close = () => ov.remove();
  ov.addEventListener('click', e => {
    const b = e.target.closest('[data-x]'); if (e.target === ov || (b && b.dataset.x === 'cancel')) return close();
    if (b && b.dataset.x === 'load') {
      const err = importText(ta.value);
      if (err && App.moves.length === 0 && err !== 'Nothing to load.' && !/^Loaded/.test(err)) { const p = $('.ch-err', ov); p.hidden = false; p.textContent = err; return; }
      App.game = null; App.mode = 'analyse'; App.analysis.fen = ''; close(); drawSquares(); render(); save();
      if (err) App.toast(err);
    }
  });
  ov.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ---------- controls ---------- */
function bindControls() {
  App.root.addEventListener('click', async e => {
    const lv = e.target.closest('[data-level]'), col = e.target.closest('[data-color]'), clk = e.target.closest('[data-clock]'), tab = e.target.closest('[data-mode]'), mv = e.target.closest('[data-ply]');
    if (lv) { App.prefs.level = +lv.dataset.level; drawPanel(); save(); return; }
    if (col) { App.prefs.color = col.dataset.color; drawPanel(); save(); return; }
    if (clk) { App.prefs.clock = clk.dataset.clock; drawPanel(); save(); return; }
    if (mv) { goTo(+mv.dataset.ply); return; }
    if (tab) { switchMode(tab.dataset.mode); return; }
    const c = e.target.closest('[data-c]'); if (!c) return;
    const g = App.game;
    switch (c.dataset.c) {
      case 'first': goTo(0); break;
      case 'prev': goTo(App.cur - 1); break;
      case 'next': goTo(App.cur + 1); break;
      case 'last': goTo(App.states.length - 1); break;
      case 'flip': App.flip = !App.flip; drawSquares(); App._prevBoard = null; $('.ch-pieces', App.root).innerHTML = ''; render(); save(); break;
      case 'sound': App.sound = !App.sound; render(); save(); break;
      case 'start': App.overDismissed = false; App.msg = ''; newGame({ ...App.prefs }); break;
      case 'rematch': App.overDismissed = false; App.msg = ''; newGame({ ...App.prefs }); break;
      case 'close-over': App.overDismissed = true; drawOver(); break;
      case 'go-review': App.overDismissed = true; switchMode('review'); runReview(); break;
      case 'go-analyse': switchMode('analyse'); break;
      case 'review': runReview(); break;
      case 'resign': if (g && !g.over && confirm('Resign this game?')) endGame(g.color === 'w' ? '0-1' : '1-0', 'resignation'); break;
      case 'draw': {
        if (!g || g.over) break;
        if (App.moves.length < 20) { App.msg = 'Stockfish declines: it is too early for a draw.'; drawPanel(); break; }
        const e2 = g.botEval ?? 0, botSide = g.color === 'w' ? -1 : 1, forBot = e2 * botSide;
        if (forBot < -150 || Math.abs(e2) < 30) endGame('½-½', 'agreement'); else { App.msg = 'Stockfish declines the draw.'; drawPanel(); }
        break;
      }
      case 'takeback': {
        if (!g || g.over || App.thinking) { if (App.thinking) { App.msg = 'Wait for Stockfish to move first.'; drawPanel(); } break; }
        let back = lastState().turn === g.color ? 2 : 1; back = Math.min(back, App.moves.length - (g.color === 'b' ? 1 : 0));
        if (back <= 0) break;
        truncate(App.states.length - 1 - back); App.hint = null; App.msg = ''; render(); save(); break;
      }
      case 'hint': {
        if (!g || g.over || App.thinking || lastState().turn !== g.color) break;
        App.msg = 'Thinking about a hint…'; drawPanel();
        const fen = toFEN(lastState()); const r = await App.engine.search(fen, { opts: FULL, go: 'go movetime 800' });
        const m = moveFromUci(lastState(), r.best); if (m && toFEN(lastState()) === fen) { App.hint = { fen, m }; App.msg = 'The yellow arrow shows Stockfish\'s suggestion.'; drawPanel(); drawArrows(); }
        break;
      }
      case 'new-board': setPosition(CV.START); App.game = null; App.analysis.fen = ''; drawSquares(); render(); save(); break;
      case 'play-here': {
        const fen = toFEN(st()); setPosition(fen); App.mode = 'play';
        const color = CV.parseFEN(fen).turn, [mins, inc] = App.prefs.clock === 'none' ? [0, 0] : App.prefs.clock.split('+').map(Number);
        App.game = { color, level: App.prefs.level, clock: App.prefs.clock, times: [mins * 60000, mins * 60000], inc: inc * 1000, over: false, result: '', reason: '', turnStart: Date.now(), running: color === 'w' ? 0 : 1 };
        App.flip = color === 'b'; App.overDismissed = false; drawSquares(); render(); save(); break;
      }
      case 'pgn': navigator.clipboard.writeText(pgnText()).then(() => App.toast('PGN copied'), () => prompt('Copy the PGN:', pgnText())); break;
      case 'fen': navigator.clipboard.writeText(toFEN(st())).then(() => App.toast('FEN copied'), () => prompt('Copy the FEN:', toFEN(st()))); break;
      case 'import': openImport(); break;
    }
  });
  App.root.addEventListener('change', e => { if (e.target.matches('[data-c="engine"]')) { App.analysis.on = e.target.checked; if (!App.analysis.on) { App.engine.stop(); App.analysis.fen = ''; } render(); } });
  App.keys = e => {
    if (!App.root || !App.root.isConnected || e.target.closest('input,textarea,select,[contenteditable]') || e.ctrlKey || e.metaKey || e.altKey || $('.overlay')) return;
    const k = { ArrowLeft: () => goTo(App.cur - 1), ArrowRight: () => goTo(App.cur + 1), Home: () => goTo(0), End: () => goTo(App.states.length - 1), f: () => $('[data-c="flip"]', App.root).click() }[e.key];
    if (k) { e.preventDefault(); k(); }
  };
  document.addEventListener('keydown', App.keys);
}
function switchMode(m) {
  if (m === App.mode) return;
  if (App.game && !App.game.over && m !== 'play') { App.toast('Finish or resign the game first: no engine help during play.'); return; }
  App.mode = m; App.sel = -1; App.hint = null;
  if (m === 'play' && App.game && !App.game.over) App.cur = App.states.length - 1;
  if (m !== 'analyse') App.engine && App.engine.stop();
  render(); save();
  if (m === 'review' && App.moves.length && !App.review) runReview();
}

/* ---------- mount ---------- */
async function mount(root, { toast } = {}) {
  CV.install();
  App.root = root; App.toast = toast || (m => alert(m));
  root.innerHTML = shell();
  load();
  if (!App.engine) {
    try { App.engine = new Engine(); } catch (e) { showError(e); }
  }
  drawSquares(); bindBoard(); bindControls(); render();
  App.timer = setInterval(() => { if (App.mode === 'play' && clockOn()) tickClock(); }, 100);
  if (App.game && !App.game.over) { App.game.turnStart = Date.now(); if (App.game.running == null) App.game.running = lastState().turn === 'w' ? 0 : 1; if (lastState().turn !== App.game.color && App.mode === 'play') botMove(); }
  fetch('assets/vendor/openings.json').then(r => r.json()).then(d => { App.openings = d; if (App.root) drawMoves(); }).catch(() => {});
}
function unmount() {
  clearInterval(App.timer); if (App.keys) document.removeEventListener('keydown', App.keys);
  if (App.engine) App.engine.stop();
  if (App.game && !App.game.over && clockOn()) tickClock();
  save(); App.root = null; App._prevBoard = null; App.thinking = false;
}
window.ChessApp = { mount, unmount };
})();

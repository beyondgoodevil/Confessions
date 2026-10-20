/* Chess viewer for the notebook.
   Turns ```chess blocks into interactive, animated boards.

   Block format (PGN-like):
     fen: <FEN>          optional; default is the starting position (placement alone is fine)
     flip: true          optional; Black at the bottom
     start: end          optional; ply shown first: 0, end (default), or a number
     caption: text       optional; shown under the board
     1.e4 e5 2.Nf3 {A comment. [%cal Gf3e5,Rd8h4] [%csl Re8,Ye4]} Nc6 ...
   A comment before the first move belongs to the starting position.
   Arrow/mark colours: G green, R red, B blue, Y yellow.

   The file only touches the DOM inside mount(), so tools can load it in Node to validate games. */
(function () {
'use strict';

/* ======================= rules engine ======================= */
const FILES = 'abcdefgh';
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const sqName = s => FILES[s & 7] + ((s >> 3) + 1);
const sqIdx = n => (n.charCodeAt(1) - 49) * 8 + (n.charCodeAt(0) - 97);
const colorOf = p => (p === p.toUpperCase() ? 'w' : 'b');
const KN = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const KG = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]], ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const at = (b, f, r) => (f >= 0 && f < 8 && r >= 0 && r < 8 ? b[r * 8 + f] : undefined);

function parseFEN(fen) {
  const parts = String(fen).trim().split(/\s+/);
  const rows = parts[0].split('/');
  if (rows.length !== 8) throw new Error(`FEN needs 8 ranks: "${fen}"`);
  const board = new Array(64).fill(null);
  rows.forEach((row, i) => {
    const r = 7 - i; let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) f += +ch;
      else if (/[pnbrqk]/i.test(ch)) { if (f > 7) break; board[r * 8 + f] = ch; f++; }
      else throw new Error(`bad character "${ch}" in FEN`);
    }
    if (f !== 8) throw new Error(`FEN rank "${row}" doesn't have 8 squares`);
  });
  let castling = parts[2];
  if (castling === undefined) { // infer from piece placement
    castling = '';
    if (board[4] === 'K') { if (board[7] === 'R') castling += 'K'; if (board[0] === 'R') castling += 'Q'; }
    if (board[60] === 'k') { if (board[63] === 'r') castling += 'k'; if (board[56] === 'r') castling += 'q'; }
    if (!castling) castling = '-';
  }
  return { board, turn: parts[1] || 'w', castling, ep: parts[3] && parts[3] !== '-' ? sqIdx(parts[3]) : -1,
    half: +parts[4] || 0, full: +parts[5] || 1 };
}

function attacked(b, s, by) {
  const f = s & 7, r = s >> 3, w = by === 'w';
  for (const df of [-1, 1]) if (at(b, f + df, r + (w ? -1 : 1)) === (w ? 'P' : 'p')) return true;
  for (const [df, dr] of KN) if (at(b, f + df, r + dr) === (w ? 'N' : 'n')) return true;
  for (const [df, dr] of KG) if (at(b, f + df, r + dr) === (w ? 'K' : 'k')) return true;
  const slide = (dirs, kinds) => dirs.some(([df, dr]) => {
    for (let i = 1; i < 8; i++) {
      const p = at(b, f + df * i, r + dr * i);
      if (p === undefined) return false;
      if (p) return colorOf(p) === by && kinds.includes(p.toLowerCase());
    }
    return false;
  });
  return slide(DIAG, 'bq') || slide(ORTH, 'rq');
}
const kingSq = (b, c) => b.indexOf(c === 'w' ? 'K' : 'k');
const inCheck = st => { const k = kingSq(st.board, st.turn); return k >= 0 && attacked(st.board, k, st.turn === 'w' ? 'b' : 'w'); };

function pseudoMoves(st) {
  const b = st.board, us = st.turn, them = us === 'w' ? 'b' : 'w', out = [];
  const add = (from, to, extra = {}) => out.push(Object.assign({ from, to }, extra));
  for (let s = 0; s < 64; s++) {
    const p = b[s]; if (!p || colorOf(p) !== us) continue;
    const f = s & 7, r = s >> 3, t = p.toLowerCase();
    if (t === 'p') {
      const dir = us === 'w' ? 1 : -1, last = us === 'w' ? 7 : 0, home = us === 'w' ? 1 : 6;
      const pushPromo = (to, extra) => {
        if ((to >> 3) === last) for (const q of 'qrbn') add(s, to, Object.assign({ promo: us === 'w' ? q.toUpperCase() : q }, extra));
        else add(s, to, extra);
      };
      if (at(b, f, r + dir) === null) {
        pushPromo((r + dir) * 8 + f, {});
        if (r === home && at(b, f, r + 2 * dir) === null) add(s, (r + 2 * dir) * 8 + f, { double: true });
      }
      for (const df of [-1, 1]) {
        const tp = at(b, f + df, r + dir); if (tp === undefined) continue;
        const to = (r + dir) * 8 + f + df;
        if (tp && colorOf(tp) === them) pushPromo(to, { capture: true });
        else if (to === st.ep) add(s, to, { capture: true, ep: true });
      }
    } else if (t === 'n' || t === 'k') {
      for (const [df, dr] of t === 'n' ? KN : KG) {
        const tp = at(b, f + df, r + dr); if (tp === undefined) continue;
        if (!tp || colorOf(tp) === them) add(s, (r + dr) * 8 + f + df, { capture: !!tp });
      }
      if (t === 'k' && s === (us === 'w' ? 4 : 60) && !attacked(b, s, them)) {
        const rights = us === 'w' ? st.castling.replace(/[a-z]/g, '') : st.castling.replace(/[A-Z]/g, '').toUpperCase();
        const rook = us === 'w' ? 'R' : 'r';
        if (rights.includes('K') && b[s + 3] === rook && !b[s + 1] && !b[s + 2] && !attacked(b, s + 1, them) && !attacked(b, s + 2, them)) add(s, s + 2, { castle: 'K' });
        if (rights.includes('Q') && b[s - 4] === rook && !b[s - 1] && !b[s - 2] && !b[s - 3] && !attacked(b, s - 1, them) && !attacked(b, s - 2, them)) add(s, s - 2, { castle: 'Q' });
      }
    } else {
      const dirs = t === 'b' ? DIAG : t === 'r' ? ORTH : DIAG.concat(ORTH);
      for (const [df, dr] of dirs) for (let i = 1; i < 8; i++) {
        const tp = at(b, f + df * i, r + dr * i); if (tp === undefined) break;
        if (!tp) { add(s, (r + dr * i) * 8 + f + df * i); continue; }
        if (colorOf(tp) === them) add(s, (r + dr * i) * 8 + f + df * i, { capture: true });
        break;
      }
    }
  }
  return out;
}

function makeMove(st, m) {
  const b = st.board.slice(), p = b[m.from], us = st.turn, isPawn = p.toLowerCase() === 'p';
  b[m.to] = m.promo || p; b[m.from] = null;
  if (m.ep) b[m.to + (us === 'w' ? -8 : 8)] = null;
  if (m.castle) { const r0 = m.castle === 'K' ? m.from + 3 : m.from - 4, r1 = m.castle === 'K' ? m.from + 1 : m.from - 1; b[r1] = b[r0]; b[r0] = null; }
  let c = st.castling === '-' ? '' : st.castling;
  if (p === 'K') c = c.replace(/[KQ]/g, ''); if (p === 'k') c = c.replace(/[kq]/g, '');
  const corner = { 0: 'Q', 7: 'K', 56: 'q', 63: 'k' };
  for (const sq of [m.from, m.to]) if (corner[sq] !== undefined) c = c.replace(corner[sq], '');
  return { board: b, turn: us === 'w' ? 'b' : 'w', castling: c || '-', ep: m.double ? (m.from + m.to) / 2 : -1,
    half: isPawn || m.capture ? 0 : st.half + 1, full: st.full + (us === 'b' ? 1 : 0) };
}
function legalMoves(st) {
  return pseudoMoves(st).filter(m => {
    const n = makeMove(st, m), k = kingSq(n.board, st.turn);
    return k >= 0 && !attacked(n.board, k, n.turn);
  });
}
function sanOf(st, m, legal) {
  const p = st.board[m.from], t = p.toLowerCase();
  let s;
  if (m.castle) s = m.castle === 'K' ? 'O-O' : 'O-O-O';
  else if (t === 'p') s = (m.capture ? FILES[m.from & 7] + 'x' : '') + sqName(m.to) + (m.promo ? '=' + m.promo.toUpperCase() : '');
  else {
    s = t.toUpperCase();
    const others = legal.filter(o => o.to === m.to && o.from !== m.from && st.board[o.from] === p);
    if (others.length) {
      const sameFile = others.some(o => (o.from & 7) === (m.from & 7)), sameRank = others.some(o => (o.from >> 3) === (m.from >> 3));
      s += !sameFile ? FILES[m.from & 7] : !sameRank ? String((m.from >> 3) + 1) : sqName(m.from);
    }
    s += (m.capture ? 'x' : '') + sqName(m.to);
  }
  const n = makeMove(st, m);
  if (inCheck(n)) s += legalMoves(n).length ? '+' : '#';
  return s;
}
function findMove(st, token) {
  const clean = token.replace(/[+#!?]+$/, '').replace(/^0-0-0/, 'O-O-O').replace(/^0-0/, 'O-O').replace(/=/, '');
  const legal = legalMoves(st);
  for (const m of legal) {
    const s = sanOf(st, m, legal);
    if (s.replace(/[+#]/g, '').replace('=', '') === clean) return { m, san: s };
  }
  return null;
}
const statusOf = st => { const l = legalMoves(st).length, c = inCheck(st); return l ? (c ? 'check' : '') : (c ? 'mate' : 'stalemate'); };

/* ======================= block parsing ======================= */
function parseComment(raw) {
  const arrows = [], marks = [];
  const text = raw.replace(/\[%(cal|csl)\s+([^\]]*)\]/g, (all, kind, list) => {
    for (const item of list.split(',').map(x => x.trim()).filter(Boolean)) {
      const m = item.match(/^([GRBYO])?([a-h][1-8])([a-h][1-8])?$/i);
      if (!m) throw new Error(`can't read ${kind} entry "${item}"`);
      const col = (m[1] || 'G').toUpperCase();
      if (kind === 'cal') { if (!m[3]) throw new Error(`arrow "${item}" needs two squares`); arrows.push({ from: sqIdx(m[2]), to: sqIdx(m[3]), col }); }
      else marks.push({ sq: sqIdx(m[2]), col });
    }
    return '';
  }).replace(/\s+/g, ' ').trim();
  return { text, arrows, marks };
}

function parseBlock(src) {
  const opts = {}; const lines = String(src).replace(/\r/g, '').split('\n'); let i = 0;
  for (; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(fen|flip|start|caption|title|orientation)\s*:\s*(.*)$/i);
    if (m) opts[m[1].toLowerCase()] = m[2].trim(); else if (lines[i].trim()) break;
  }
  const text = lines.slice(i).join('\n');
  const st0 = parseFEN(opts.fen || START);
  const plies = [{ st: st0, san: null, move: null, comment: '', arrows: [], marks: [], glyph: '' }];
  const tokens = text.match(/\{[^}]*\}|\(|\)|\$\d+|[^\s{}()]+/g) || [];
  let depth = 0;
  for (let tok of tokens) {
    if (tok === '(') { depth++; continue; }
    if (tok === ')') { depth = Math.max(0, depth - 1); continue; }
    if (depth) continue;
    if (tok[0] === '{') {
      const c = parseComment(tok.slice(1, -1)), cur = plies[plies.length - 1];
      cur.comment = (cur.comment ? cur.comment + ' ' : '') + c.text; cur.arrows.push(...c.arrows); cur.marks.push(...c.marks);
      continue;
    }
    if (/^\$\d+$/.test(tok) || /^(1-0|0-1|1\/2-1\/2|\*)$/.test(tok)) continue;
    tok = tok.replace(/^\d+\.+/, ''); if (!tok) continue;
    const prev = plies[plies.length - 1].st, found = findMove(prev, tok);
    if (!found) {
      throw new Error(`illegal or unreadable move "${tok}" (${prev.turn === 'w' ? 'White' : 'Black'} to play, after ${plies.length - 1} half-moves)`);
    }
    const glyph = (tok.match(/[!?]+$/) || [''])[0];
    plies.push({ st: makeMove(prev, found.m), san: found.san, move: found.m, comment: '', arrows: [], marks: [], glyph });
  }
  let start = plies.length - 1;
  if (opts.start !== undefined && opts.start !== '' && opts.start !== 'end') start = Math.max(0, Math.min(plies.length - 1, parseInt(opts.start, 10) || 0));
  const flip = /^(true|yes|black|1)$/i.test(opts.flip || opts.orientation || '');
  return { plies, start, flip, caption: opts.caption || opts.title || '' };
}

/* ======================= graphics ======================= */
// Piece outlines on a 45x45 grid: body paths are filled with the piece gradient, lines are details.
const PIECES = {
  p: { body: ['M22.5 8.5a4.5 4.5 0 0 0-3.4 7.5C17.3 17.3 16.3 19.2 16.3 21.3c0 2 .9 3.8 2.4 5C15.6 27.6 11.5 31.8 11.5 39h22c0-7.2-4.1-11.4-7.2-12.7 1.5-1.2 2.4-3 2.4-5 0-2.1-1-4-2.8-5.3a4.5 4.5 0 0 0-3.4-7.5z'], lines: [] },
  r: { body: ['M11 39h23v-3.5h-2.5l-1.5-14 2.5-2.5v-6h-4v3h-3.5v-3h-5v3h-3.5v-3h-4v6l2.5 2.5-1.5 14H11z'], lines: ['M15 21.5h15', 'M13.5 35.5h18', 'M12.5 19h20'] },
  b: { body: ['M12 39c3-2.2 6.5-3 10.5-3s7.5.8 10.5 3z', 'M16.5 35.5h12l-1.5-4h-9z',
    'M22.5 10.5c-5.5 4-8 9.5-6.2 14.5 1 2.6 2.6 4 2.6 4L18 31.5h9l-.9-2.5s1.6-1.4 2.6-4c1.8-5-.7-10.5-6.2-14.5z', 'M22.5 5.5a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 1 1 0-5.2z'],
    lines: ['M20 22h5', 'M22.5 19.5v5'] },
  n: { body: ['M14 38.5h21c0-9-1-16-4-21.5-2-3.5-5-6-9-7l-1-3.2-2.2 3.6c-1.5-.5-2.6 0-3.1 1L9.3 20c-1 1.6-.9 3 .6 4l1.6 1.1c1 .6 2.2.5 3-.3l3-2.7c1.6.2 3-.3 4-1.5-.5 4-3 7-6 10-2.6 2.6-3.5 5-3.5 7.9z'],
    lines: ['M24.5 12.5c3 1.2 5.2 3.8 6.6 7.6', 'M26 11.3c3.4 1.5 6 4.6 7.4 8.8'], eye: [16.2, 15.2, 1.15], nostril: [10.9, 21.6, 0.6] },
  q: { body: ['M14 30 10 14.5l6.5 9.5-.5-13 4.5 12 2-14 2 14 4.5-12-.5 13 6.5-9.5L31 30z',
    'M14 30c3-1.2 14-1.2 17 0l1 4c-4-1.2-15-1.2-19 0z', 'M13 34l-1 4.5c5-1.4 16-1.4 21 0l-1-4.5c-4-1.2-15-1.2-19 0z'],
    lines: [], balls: [[10, 13.5, 2.2], [16, 10.5, 2.2], [22.5, 8.5, 2.2], [29, 10.5, 2.2], [35, 13.5, 2.2]] },
  k: { body: ['M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5z',
    'M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5z'],
    lines: ['M12.5 30c5.5-3 14.5-3 20 0', 'M12.5 33.5c5.5-3 14.5-3 20 0'], cross: true },
};
function pieceSVG(ch) {
  const w = ch === ch.toUpperCase(), d = PIECES[ch.toLowerCase()];
  const fill = w ? 'url(#cv-g-w)' : 'url(#cv-g-b)', stroke = w ? '#2b241b' : '#050505', det = w ? '#3d3427' : '#d8d0c2';
  let s = `<svg viewBox="0 0 45 45" aria-hidden="true"><g stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">`;
  for (const p of d.body) s += `<path d="${p}" fill="${fill}"/>`;
  for (const [cx, cy, r] of d.balls || []) s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
  if (d.cross) s += `<path d="M22.5 11.6V5.5M19.5 8h6" fill="none"/>`;
  for (const p of d.lines) s += `<path d="${p}" fill="none" stroke="${det}" stroke-width="1.1" opacity=".85"/>`;
  if (d.eye) s += `<circle cx="${d.eye[0]}" cy="${d.eye[1]}" r="${d.eye[2]}" fill="${det}" stroke="none"/>`;
  if (d.nostril) s += `<circle cx="${d.nostril[0]}" cy="${d.nostril[1]}" r="${d.nostril[2]}" fill="${det}" stroke="none"/>`;
  // a soft sheen over the upper half
  s += `</g><g style="mix-blend-mode:screen" opacity="${w ? 0.55 : 0.35}">` + d.body.map(p => `<path d="${p}" fill="url(#cv-g-sheen)"/>`).join('') + '</g></svg>';
  return s;
}

const CSS = `
.cv{--cv-l:#efdcb6;--cv-d:#b07d52;--cv-frame1:#7a5131;--cv-frame2:#3e2716;--cv-coord-l:#a7754b;--cv-coord-d:#f3e3c4;
  width:min(100%,460px);margin:1.6em auto 1.9em;font-family:var(--font-ui,serif);outline:none;-webkit-tap-highlight-color:transparent}
.cv:focus-visible .cv-frame{box-shadow:0 0 0 3px var(--accent,#1d4ba0),0 18px 40px rgba(0,0,0,.35)}
.cv-stage{perspective:1150px;perspective-origin:50% 0%}
.cv-frame{position:relative;padding:3.4%;border-radius:14px;transform-style:preserve-3d;
  background:radial-gradient(120% 90% at 30% 0%,rgba(255,255,255,.16),transparent 60%),linear-gradient(150deg,var(--cv-frame1),var(--cv-frame2));
  box-shadow:0 22px 46px -10px rgba(0,0,0,.45),0 3px 8px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.22),inset 0 -2px 0 rgba(0,0,0,.35);
  transition:transform .8s cubic-bezier(.2,.75,.2,1),box-shadow .8s}
.cv.is-3d .cv-frame{transform:rotateX(36deg) translateY(-3%) scale(.9);box-shadow:0 60px 60px -30px rgba(0,0,0,.55),0 3px 8px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.22)}
.cv-board{position:relative;aspect-ratio:1;border-radius:4px;transform-style:preserve-3d;
  background:repeating-conic-gradient(var(--cv-d) 0 25%,var(--cv-l) 0 50%) 0 0/25% 25%;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.35),inset 0 0 24px rgba(0,0,0,.18)}
.cv-board::before{content:"";position:absolute;inset:0;border-radius:4px;pointer-events:none;opacity:.32;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.012 .22' numOctaves='3' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 .35 0 0 0 0 .22 0 0 0 0 .1 0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E");background-size:240px 240px}
.cv-board::after{content:"";position:absolute;inset:0;border-radius:4px;pointer-events:none;background:linear-gradient(160deg,rgba(255,255,255,.18),transparent 45%,rgba(0,0,0,.12))}
.cv-layer{position:absolute;inset:0;transform-style:preserve-3d}
.cv-coord{position:absolute;font-size:clamp(7px,2.1vw,10.5px);font-weight:600;line-height:1;pointer-events:none;letter-spacing:.02em}
.cv-sqfx{position:absolute;width:12.5%;height:12.5%;pointer-events:none;transition:opacity .25s}
.cv-last{background:rgba(255,222,89,.48);box-shadow:inset 0 0 0 2px rgba(255,236,150,.55)}
.cv-mk-R{background:radial-gradient(circle,rgba(235,40,40,.0) 30%,rgba(235,40,40,.55) 70%)}
.cv-mk-G{background:radial-gradient(circle,rgba(30,160,60,.0) 30%,rgba(30,160,60,.55) 70%)}
.cv-mk-B{background:radial-gradient(circle,rgba(40,110,220,.0) 30%,rgba(40,110,220,.55) 70%)}
.cv-mk-Y{background:radial-gradient(circle,rgba(255,200,0,.0) 30%,rgba(255,200,0,.6) 70%)}
.cv-mk-O{background:radial-gradient(circle,rgba(240,130,30,.0) 30%,rgba(240,130,30,.6) 70%)}
.cv-check{background:radial-gradient(circle,rgba(255,40,40,.95) 0%,rgba(230,0,0,.55) 38%,rgba(200,0,0,0) 72%);animation:cv-pulse 1.6s ease-in-out infinite}
.cv-mate{background:radial-gradient(circle,rgba(255,30,30,1) 0%,rgba(200,0,0,.7) 45%,rgba(160,0,0,0) 78%)}
@keyframes cv-pulse{50%{opacity:.6}}
.cv-arrows{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.cv-arrows path{stroke-linecap:round;stroke-linejoin:round;fill:none}
.cv-arrows>g{animation:cv-fade .4s ease-out both}
@keyframes cv-fade{from{opacity:0}to{opacity:1}}
.cv-pc{position:absolute;left:0;top:0;width:12.5%;height:12.5%;transform-style:preserve-3d;will-change:transform;
  transition:transform .34s cubic-bezier(.25,.8,.25,1),opacity .3s}
.cv-pc.is-new{animation:cv-pop .35s cubic-bezier(.3,1.4,.5,1) both}
@keyframes cv-pop{from{opacity:0}to{opacity:1}}
.cv-pc.is-gone{opacity:0}
.cv-pi{position:absolute;inset:4%;transform-origin:50% 92%;transition:transform .8s cubic-bezier(.2,.75,.2,1)}
.cv-pi svg{width:100%;height:100%;display:block;filter:drop-shadow(0 1.5px 1.2px rgba(0,0,0,.45)) drop-shadow(0 0 .5px rgba(0,0,0,.4))}
.cv-pc::before{content:"";position:absolute;left:20%;right:20%;bottom:6%;height:14%;border-radius:50%;background:radial-gradient(rgba(0,0,0,.45),transparent 70%);opacity:0;transition:opacity .8s}
.cv.is-3d .cv-pi{transform:rotateX(-36deg) scale(1.12)}
.cv.is-3d .cv-pc::before{opacity:1}
.cv-cap{margin:.75em .3em 0;font-size:.93em;line-height:1.4;color:var(--muted,#5a606b);font-style:italic;text-align:center}
.cv-note{margin:.7em 0 0;padding:.55em .85em;border-radius:8px;background:var(--surface,#f4f5f7);border:1px solid var(--rule,#d9dce1);font-size:.92em;line-height:1.45;color:var(--ink,#16181d);min-height:1.4em;transition:background .3s}
.cv-note:empty{display:none}
.cv-bar{display:flex;align-items:center;justify-content:center;gap:.25em;margin-top:.7em;flex-wrap:wrap;font-size:.95em}
.cv-btn{display:inline-flex;align-items:center;justify-content:center;width:2.1em;height:2em;border-radius:8px;border:1px solid var(--rule,#d9dce1);
  background:var(--paper,#fff);color:var(--ink,#16181d);cursor:pointer;padding:0;transition:background .15s,transform .1s,border-color .15s;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.cv-btn:hover{border-color:var(--accent,#1d4ba0);color:var(--accent,#1d4ba0)}
.cv-btn:active{transform:translateY(1px)}
.cv-btn[aria-pressed="true"]{background:var(--accent-soft,#e6ecf7);border-color:var(--accent,#1d4ba0);color:var(--accent,#1d4ba0)}
.cv-btn:disabled{opacity:.35;cursor:default}
.cv-btn svg{width:1.05em;height:1.05em}
.cv-sep{width:.25em}
.cv-ply{font-variant-numeric:tabular-nums;font-size:.82em;color:var(--muted,#5a606b);min-width:4.6em;text-align:center;white-space:nowrap}
.cv-moves{margin-top:.6em;max-height:7.2em;overflow:auto;font-size:.9em;line-height:1.75;padding:.2em .3em;scrollbar-width:thin}
.cv-moves .n{color:var(--muted,#5a606b);margin:0 .15em 0 .45em;font-variant-numeric:tabular-nums}
.cv-moves .m{cursor:pointer;padding:.08em .32em;border-radius:5px;white-space:nowrap}
.cv-moves .m:hover{background:var(--surface,#f4f5f7)}
.cv-moves .m.cur{background:var(--accent,#1d4ba0);color:var(--paper,#fff)}
.cv-moves .m.has-note::after{content:"";display:inline-block;width:.32em;height:.32em;border-radius:50%;background:currentColor;opacity:.5;margin-left:.22em;vertical-align:.25em}
.cv-err{margin:.6em 0 0;padding:.6em .8em;border-radius:8px;background:#fde8e8;color:#8a1c1c;font-size:.88em}
.cv-src{display:none}
@media (max-width:480px){.cv-ply,.cv-sep{display:none}.cv-btn{width:2.3em;height:2.2em}}
@media (prefers-reduced-motion:reduce){.cv-pc,.cv-frame,.cv-pi{transition:none}.cv-arrows>g,.cv-check{animation:none}}
`;
const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<linearGradient id="cv-g-w" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#f4ecdb"/><stop offset="1" stop-color="#c7b897"/></linearGradient>
<linearGradient id="cv-g-b" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#6a645c"/><stop offset=".45" stop-color="#2d2a26"/><stop offset="1" stop-color="#0b0a09"/></linearGradient>
<linearGradient id="cv-g-sheen" x1="0" y1="0" x2="1" y2=".25"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".28" stop-color="#fff" stop-opacity=".55"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs></svg>`;
const ICON = {
  first: '<svg viewBox="0 0 24 24"><path d="M6 5v14M18 6l-8 6 8 6z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><path d="M16 6l-8 6 8 6z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M8 6l8 6-8 6z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  last: '<svg viewBox="0 0 24 24"><path d="M18 5v14M6 6l8 6-8 6z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  flip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/></svg>',
  threeD: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
};
const ARROW_COL = { G: '#15803d', R: '#d62828', B: '#1d5fd1', Y: '#e0a800', O: '#e8730c' };

let installed = false, uid = 0;
function install() {
  if (installed) return; installed = true;
  const st = document.createElement('style'); st.id = 'cv-style'; st.textContent = CSS; document.head.appendChild(st);
  const holder = document.createElement('div'); holder.innerHTML = DEFS; document.body.appendChild(holder.firstChild);
}

function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

function Viewer(pre, data, srcText) {
  const id = ++uid, root = el('figure', 'cv'); root.tabIndex = 0;
  root.setAttribute('role', 'group'); root.setAttribute('aria-label', 'Chess board');
  let ply = data.start, flip = data.flip, threeD = false, timer = null;
  const stage = el('div', 'cv-stage'), frame = el('div', 'cv-frame'), board = el('div', 'cv-board');
  const coordL = el('div', 'cv-layer'), fxL = el('div', 'cv-layer'), pcL = el('div', 'cv-layer');
  const svgNS = 'http://www.w3.org/2000/svg', arrows = document.createElementNS(svgNS, 'svg');
  arrows.setAttribute('class', 'cv-arrows'); arrows.setAttribute('viewBox', '0 0 800 800'); arrows.setAttribute('preserveAspectRatio', 'none');
  board.append(coordL, fxL, arrows, pcL); frame.append(board); stage.append(frame); root.append(stage);
  const note = el('div', 'cv-note'); note.setAttribute('aria-live', 'polite');
  const many = data.plies.length > 1;
  const bar = el('div', 'cv-bar'), btn = (name, label, fn) => { const b = el('button', 'cv-btn', ICON[name]); b.type = 'button'; b.title = label; b.setAttribute('aria-label', label); b.onclick = e => { e.preventDefault(); fn(); root.focus({ preventScroll: true }); }; return b; };
  const bFirst = btn('first', 'Start (Home)', () => go(0)), bPrev = btn('prev', 'Back (←)', () => go(ply - 1));
  const bPlay = btn('play', 'Play', () => toggle()), bNext = btn('next', 'Forward (→)', () => go(ply + 1)), bLast = btn('last', 'End (End)', () => go(data.plies.length - 1));
  const bFlip = btn('flip', 'Flip board (f)', () => { flip = !flip; layoutCoords(); render(true); });
  const b3d = btn('threeD', '3D view (d)', () => { threeD = !threeD; root.classList.toggle('is-3d', threeD); b3d.setAttribute('aria-pressed', threeD); });
  b3d.setAttribute('aria-pressed', 'false');
  const bCopy = btn('copy', 'Copy PGN', () => { if (navigator.clipboard) navigator.clipboard.writeText(srcText).then(() => { bCopy.title = 'Copied'; setTimeout(() => (bCopy.title = 'Copy PGN'), 1500); }); });
  const plyLbl = el('span', 'cv-ply');
  if (many) bar.append(bFirst, bPrev, bPlay, bNext, bLast, el('span', 'cv-sep'), plyLbl, el('span', 'cv-sep'));
  bar.append(bFlip, b3d, bCopy);
  const moves = el('div', 'cv-moves');
  root.append(note, bar);
  if (many) {
    data.plies.forEach((p, i) => {
      if (!i) return;
      const white = p.st.turn === 'b', num = data.plies[i - 1].st.full;
      if (white) moves.append(el('span', 'n', num + '.'));
      else if (i === 1) moves.append(el('span', 'n', num + '…'));
      const m = el('span', 'm' + (p.comment ? ' has-note' : ''), (p.san + p.glyph).replace(/-/g, '‑'));
      m.dataset.i = i; m.onclick = () => go(i); moves.append(m);
    });
    root.append(moves);
  }
  if (data.caption) root.append(el('figcaption', 'cv-cap', esc(data.caption)));
  pre.replaceWith(root);

  // coordinates
  function layoutCoords() {
    coordL.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const file = flip ? 7 - i : i, rank = flip ? i + 1 : 8 - i;
      const fsq = el('span', 'cv-coord', FILES[file]); // bottom row
      fsq.style.left = `calc(${i * 12.5}% + 12.5% - 1.15em)`; fsq.style.bottom = '.35em';
      fsq.style.color = (i + 0) % 2 === 0 ? 'var(--cv-coord-d)' : 'var(--cv-coord-l)';
      const rsq = el('span', 'cv-coord', String(rank)); rsq.style.left = '.35em'; rsq.style.top = `calc(${i * 12.5}% + .35em)`;
      rsq.style.color = i % 2 === 0 ? 'var(--cv-coord-l)' : 'var(--cv-coord-d)';
      coordL.append(fsq, rsq);
    }
  }
  const xy = s => { const f = s & 7, r = s >> 3; return flip ? [7 - f, r] : [f, 7 - r]; };
  const place = (node, s) => { const [x, y] = xy(s); node.style.transform = `translate(${x * 100}%, ${y * 100}%)`; };

  // pieces: keep elements and slide them between positions
  let pieces = []; // {el, ch, sq}
  function syncPieces(target, mv, instant) {
    const want = []; target.forEach((ch, s) => { if (ch) want.push({ ch, sq: s }); });
    const free = pieces.slice(), next = [];
    const take = (pred) => { const k = free.findIndex(pred); return k < 0 ? null : free.splice(k, 1)[0]; };
    // 1. pieces that stay put
    for (const w of want.slice()) { const p = take(o => o.ch === w.ch && o.sq === w.sq); if (p) { next.push(p); want.splice(want.indexOf(w), 1); } }
    // 2. the moved piece (and promotions) by the move itself
    if (mv) for (const w of want.slice()) {
      if (w.sq !== mv.to) continue;
      const p = take(o => o.sq === mv.from); if (p) { if (p.ch !== w.ch) { p.ch = w.ch; p.inner.innerHTML = pieceSVG(w.ch); } p.sq = w.sq; next.push(p); want.splice(want.indexOf(w), 1); }
    }
    // 3. nearest same-kind piece for everything else (jumps across several moves, castling rooks)
    for (const w of want.slice()) {
      let best = -1, bd = 1e9;
      free.forEach((o, k) => { if (o.ch !== w.ch) return; const d = Math.abs((o.sq & 7) - (w.sq & 7)) + Math.abs((o.sq >> 3) - (w.sq >> 3)); if (d < bd) { bd = d; best = k; } });
      if (best >= 0) { const p = free.splice(best, 1)[0]; p.sq = w.sq; next.push(p); want.splice(want.indexOf(w), 1); }
    }
    // 4. leftovers fade out; missing ones fade in
    for (const o of free) { o.el.classList.add('is-gone'); o.el.style.zIndex = 1; setTimeout(() => o.el.remove(), 320); }
    for (const w of want) {
      const node = el('div', 'cv-pc is-new'), inner = el('div', 'cv-pi', pieceSVG(w.ch)); node.append(inner); pcL.append(node);
      next.push({ el: node, inner, ch: w.ch, sq: w.sq });
    }
    for (const p of next) {
      p.el.style.transition = instant ? 'none' : '';
      p.el.style.zIndex = mv && p.sq === mv.to ? 5 : 2;
      place(p.el, p.sq);
      if (instant) { void p.el.offsetWidth; p.el.style.transition = ''; }
    }
    pieces = next;
  }

  function drawArrow(a) {
    const [x1, y1] = xy(a.from).map(v => v + 0.5), [x2, y2] = xy(a.to).map(v => v + 0.5);
    const col = ARROW_COL[a.col] || ARROW_COL.G, dx = x2 - x1, dy = y2 - y1;
    const knight = (Math.abs(dx) === 1 && Math.abs(dy) === 2) || (Math.abs(dx) === 2 && Math.abs(dy) === 1);
    let pts;
    if (knight) { const c = Math.abs(dx) > Math.abs(dy) ? [x2, y1] : [x1, y2]; pts = [[x1, y1], c, [x2, y2]]; }
    else pts = [[x1, y1], [x2, y2]];
    // shorten start and end
    const [ax, ay] = pts[pts.length - 2], len = Math.hypot(x2 - ax, y2 - ay), ux = (x2 - ax) / len, uy = (y2 - ay) / len;
    const head = 0.42, tip = [x2 - ux * 0.12, y2 - uy * 0.12], base = [tip[0] - ux * head, tip[1] - uy * head];
    const [bx, by] = pts[1], l0 = Math.hypot(bx - x1, by - y1), s0 = [x1 + (bx - x1) / l0 * 0.22, y1 + (by - y1) / l0 * 0.22];
    const mid = pts.slice(1, -1);
    let d = `M${s0[0].toFixed(3)} ${s0[1].toFixed(3)}`;
    if (mid.length) { const [cx, cy] = mid[0]; d += ` L${(cx - (cx - s0[0]) * 0.18).toFixed(3)} ${(cy - (cy - s0[1]) * 0.18).toFixed(3)} Q${cx} ${cy} ${(cx + (base[0] - cx) * 0.18).toFixed(3)} ${(cy + (base[1] - cy) * 0.18).toFixed(3)}`; }
    d += ` L${base[0].toFixed(3)} ${base[1].toFixed(3)}`;
    const g = document.createElementNS(svgNS, 'g'); g.setAttribute('opacity', '.82'); g.setAttribute('transform', 'scale(100)');
    const poly = `${tip[0].toFixed(3)},${tip[1].toFixed(3)} ${(base[0] - uy * 0.23).toFixed(3)},${(base[1] + ux * 0.23).toFixed(3)} ${(base[0] + uy * 0.23).toFixed(3)},${(base[1] - ux * 0.23).toFixed(3)}`;
    const dash = '';
    g.innerHTML = `<g transform="translate(.03 .05)" opacity=".28"><path d="${d}" stroke="#000" stroke-width=".19" ${dash}/><polygon points="${poly}" fill="#000"/></g>` +
      `<path d="${d}" stroke="${col}" stroke-width=".17" ${dash}/><polygon points="${poly}" fill="${col}"/>`;
    arrows.append(g);
  }

  function sqFx(s, cls) { const n = el('div', 'cv-sqfx ' + cls); place(n, s); fxL.append(n); }

  function render(instant) {
    const p = data.plies[ply];
    syncPieces(p.st.board, instant ? null : p.move, instant);
    fxL.innerHTML = '';
    if (p.move) { sqFx(p.move.from, 'cv-last'); sqFx(p.move.to, 'cv-last'); }
    for (const m of p.marks) sqFx(m.sq, 'cv-mk-' + m.col);
    const status = statusOf(p.st);
    if (status === 'check' || status === 'mate') sqFx(kingSq(p.st.board, p.st.turn), status === 'mate' ? 'cv-mate' : 'cv-check');
    arrows.innerHTML = '';
    for (const a of p.arrows) drawArrow(a);
    let text = p.comment || '';
    if (!text && status === 'mate') text = 'Checkmate.'; else if (!text && status === 'stalemate') text = 'Stalemate.';
    note.textContent = text;
    if (many) {
      plyLbl.textContent = ply ? `${data.plies[ply - 1].st.full}${data.plies[ply - 1].st.turn === 'w' ? '.' : '…'} ${p.san}` : 'Start';
      bFirst.disabled = bPrev.disabled = ply === 0; bNext.disabled = bLast.disabled = ply === data.plies.length - 1;
      for (const m of moves.querySelectorAll('.m')) m.classList.toggle('cur', +m.dataset.i === ply);
      const cur = moves.querySelector('.m.cur');
      if (cur) { const top = cur.offsetTop - moves.offsetTop; if (top < moves.scrollTop || top > moves.scrollTop + moves.clientHeight - 20) moves.scrollTop = top - 20; }
    }
    root.setAttribute('aria-label', `Chess board${p.san ? ', after ' + p.san : ''}${text ? '. ' + text : ''}`);
  }
  function go(i) { i = Math.max(0, Math.min(data.plies.length - 1, i)); if (i === ply) return; ply = i; render(false); if (timer && ply === data.plies.length - 1) toggle(); }
  function toggle() {
    if (timer) { clearInterval(timer); timer = null; bPlay.innerHTML = ICON.play; bPlay.title = 'Play'; return; }
    if (ply === data.plies.length - 1) go(0);
    bPlay.innerHTML = ICON.pause; bPlay.title = 'Pause';
    timer = setInterval(() => { if (ply >= data.plies.length - 1) toggle(); else go(ply + 1); }, 1150);
  }
  root.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    if (k === 'ArrowRight') go(ply + 1); else if (k === 'ArrowLeft') go(ply - 1); else if (k === 'Home') go(0);
    else if (k === 'End') go(data.plies.length - 1); else if (k === 'f') bFlip.click(); else if (k === 'd') b3d.click();
    else if (k === ' ' && many) toggle(); else return;
    e.preventDefault();
  });
  // swipe on touch screens
  let tx = null;
  board.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  board.addEventListener('touchend', e => { if (tx == null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) go(ply + (dx < 0 ? 1 : -1)); tx = null; });
  layoutCoords(); render(true);
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }

function mount(rootEl) {
  install();
  for (const code of rootEl.querySelectorAll('pre > code.language-chess')) {
    const pre = code.parentElement; if (pre.dataset.cvDone) continue; pre.dataset.cvDone = '1';
    const src = code.textContent;
    try { Viewer(pre, parseBlock(src), src); }
    catch (e) { const box = el('div', 'cv-err', 'Chess diagram error: ' + esc(e.message)); pre.after(box); }
  }
}

const api = { parseFEN, legalMoves, makeMove, sanOf, findMove, statusOf, parseBlock, mount, START };
if (typeof window !== 'undefined') window.ChessViewer = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();

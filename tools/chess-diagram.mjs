#!/usr/bin/env node
// Draws chess diagrams as SVG files for notes.
//
//   node tools/chess-diagram.mjs <spec.json>
//
// spec.json is a list of diagrams:
//   [{ "out": "notes/misc/chess-diagrams/legall-mate.svg",
//      "fen": "r2qkbnr/ppp2p1p/...",            // piece placement (the rest of a FEN is ignored)
//      "arrows": [["f3", "e5"], ["c4", "f7", "red"]],   // colours: green (default), red, blue, orange
//      "highlight": ["d5", "e7"],                // squares tinted yellow (e.g. the last move)
//      "marks": ["f7"],                          // squares tinted red (e.g. the king in check)
//      "flip": false }]                          // true = Black at the bottom
//
// Embed in a note with ![[legall-mate.svg|360]].
import fs from 'node:fs';
import path from 'node:path';

const SQ = 45, PAD = 18, BOARD = SQ * 8, SIZE = BOARD + PAD * 2;
const LIGHT = '#f0d9b5', DARK = '#b58863', FRAME = '#6b4a2f';
const ARROW = { green: '#15781b', red: '#c0392b', blue: '#1f5fa8', orange: '#d9822b' };

// Pieces drawn on a 45x45 grid. Each piece: outline paths (filled with the piece colour)
// and detail lines (drawn in the contrasting colour).
const PIECES = {
  p: { body: ['M22.5 8.5a4.5 4.5 0 0 0-3.4 7.5C17.3 17.3 16.3 19.2 16.3 21.3c0 2 .9 3.8 2.4 5C15.6 27.6 11.5 31.8 11.5 39h22c0-7.2-4.1-11.4-7.2-12.7 1.5-1.2 2.4-3 2.4-5 0-2.1-1-4-2.8-5.3a4.5 4.5 0 0 0-3.4-7.5z'], lines: [] },
  r: { body: ['M11 39h23v-3.5h-2.5l-1.5-14 2.5-2.5v-6h-4v3h-3.5v-3h-5v3h-3.5v-3h-4v6l2.5 2.5-1.5 14H11z'],
       lines: ['M15 21.5h15', 'M13.5 35.5h18', 'M12.5 19h20'] },
  b: { body: ['M12 39c3-2.2 6.5-3 10.5-3s7.5.8 10.5 3z', 'M16.5 35.5h12l-1.5-4h-9z',
              'M22.5 10.5c-5.5 4-8 9.5-6.2 14.5 1 2.6 2.6 4 2.6 4L18 31.5h9l-.9-2.5s1.6-1.4 2.6-4c1.8-5-.7-10.5-6.2-14.5z',
              'M22.5 5.5a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 1 1 0-5.2z'],
       lines: ['M20 22h5', 'M22.5 19.5v5', 'M18.5 31.5h8'] },
  n: { body: ['M14 38.5h21c0-9-1-16-4-21.5-2-3.5-5-6-9-7l-1-3.2-2.2 3.6c-1.5-.5-2.6 0-3.1 1L9.3 20c-1 1.6-.9 3 .6 4l1.6 1.1c1 .6 2.2.5 3-.3l3-2.7c1.6.2 3-.3 4-1.5-.5 4-3 7-6 10-2.6 2.6-3.5 5-3.5 7.9z'],
       lines: ['M16.2 15.2h.01', 'M10.8 21.6h.01'], dots: [[16.2, 15.2, 1.1], [10.9, 21.6, 0.6]] },
  q: { body: ['M14 30 10 14.5l6.5 9.5-.5-13 4.5 12 2-14 2 14 4.5-12-.5 13 6.5-9.5L31 30z',
              'M14 30c3-1.2 14-1.2 17 0l1 4c-4-1.2-15-1.2-19 0z', 'M13 34l-1 4.5c5-1.4 16-1.4 21 0l-1-4.5c-4-1.2-15-1.2-19 0z'],
       lines: ['M14 30c3-1.2 14-1.2 17 0', 'M13 34c4-1.2 15-1.2 19 0'],
       dots: [[10, 13.5, 2.2], [16, 10.5, 2.2], [22.5, 8.5, 2.2], [29, 10.5, 2.2], [35, 13.5, 2.2]] },
  k: { body: ['M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5z',
              'M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5z'],
       lines: ['M12.5 30c5.5-3 14.5-3 20 0', 'M12.5 33.5c5.5-3 14.5-3 20 0', 'M12.5 37c5.5-3 14.5-3 20 0'],
       cross: true },
};

function pieceSvg(ch, x, y) {
  const white = ch === ch.toUpperCase();
  const p = PIECES[ch.toLowerCase()];
  const fill = white ? '#ffffff' : '#262421', stroke = '#111111', detail = white ? '#111111' : '#ececec';
  let s = `<g transform="translate(${x},${y})" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">`;
  for (const d of p.body) s += `<path d="${d}" fill="${fill}"/>`;
  for (const [cx, cy, r] of p.dots || []) {
    const isEye = ch.toLowerCase() === 'n';
    s += isEye ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${detail}" stroke="none"/>`
               : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
  }
  for (const d of p.lines) if (!d.endsWith('.01')) s += `<path d="${d}" fill="none" stroke="${detail}" stroke-width="1.2"/>`;
  if (p.cross) s += `<path d="M22.5 11.6V5.5M19.5 8h6" fill="none" stroke="${stroke}" stroke-width="1.5"/>`;
  return s + '</g>';
}

function parseFen(fen) {
  const rows = fen.trim().split(/\s+/)[0].split('/');
  if (rows.length !== 8) throw new Error(`bad FEN: ${fen}`);
  const board = [];
  for (const row of rows) {
    const r = [];
    for (const c of row) if (/\d/.test(c)) for (let i = 0; i < +c; i++) r.push(null); else r.push(c);
    if (r.length !== 8) throw new Error(`bad FEN row "${row}" in ${fen}`);
    board.push(r);
  }
  return board; // board[0] is rank 8
}

function render(spec) {
  const board = parseFen(spec.fen), flip = !!spec.flip;
  const pos = sq => { // top-left corner of a square in board coordinates
    const f = sq.charCodeAt(0) - 97, r = +sq[1] - 1;
    if (f < 0 || f > 7 || r < 0 || r > 7) throw new Error(`bad square ${sq}`);
    return flip ? [(7 - f) * SQ, r * SQ] : [f * SQ, (7 - r) * SQ];
  };
  const tint = (list, colour) => (list || []).map(sq => { const [x, y] = pos(sq); return `<rect x="${x}" y="${y}" width="${SQ}" height="${SQ}" fill="${colour}"/>`; }).join('');
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img">`;
  s += `<rect width="${SIZE}" height="${SIZE}" rx="6" fill="${FRAME}"/>`;
  s += `<g transform="translate(${PAD},${PAD})">`;
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++)
    s += `<rect x="${f * SQ}" y="${r * SQ}" width="${SQ}" height="${SQ}" fill="${(r + f) % 2 ? DARK : LIGHT}"/>`;
  s += tint(spec.highlight, 'rgba(255,214,0,0.45)') + tint(spec.marks, 'rgba(220,40,40,0.5)');
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
    const ch = board[r][f]; if (!ch) continue;
    const sq = String.fromCharCode(97 + f) + (8 - r); const [x, y] = pos(sq);
    s += pieceSvg(ch, x, y);
  }
  for (const [from, to, col = 'green'] of spec.arrows || []) {
    const [x1, y1] = pos(from).map(v => v + SQ / 2), [x2, y2] = pos(to).map(v => v + SQ / 2);
    const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const head = 15, w = 4.5, ex = x2 - ux * 8, ey = y2 - uy * 8, bx = ex - ux * head, by = ey - uy * head;
    const c = ARROW[col] || col;
    s += `<g opacity="0.8"><line x1="${(x1 + ux * 8).toFixed(1)}" y1="${(y1 + uy * 8).toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${c}" stroke-width="${w * 2}" stroke-linecap="round"/>`;
    s += `<polygon points="${ex.toFixed(1)},${ey.toFixed(1)} ${(bx - uy * 11).toFixed(1)},${(by + ux * 11).toFixed(1)} ${(bx + uy * 11).toFixed(1)},${(by - ux * 11).toFixed(1)}" fill="${c}"/></g>`;
  }
  s += '</g>';
  // coordinates
  const font = 'font-family="Georgia, \'Times New Roman\', serif" font-size="11" fill="#f0d9b5" text-anchor="middle"';
  for (let i = 0; i < 8; i++) {
    const file = String.fromCharCode(97 + (flip ? 7 - i : i)), rank = flip ? i + 1 : 8 - i;
    s += `<text x="${PAD + i * SQ + SQ / 2}" y="${SIZE - 5}" ${font}>${file}</text>`;
    s += `<text x="${PAD / 2}" y="${PAD + i * SQ + SQ / 2 + 4}" ${font}>${rank}</text>`;
  }
  return s + '</svg>\n';
}

const specs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
for (const spec of specs) {
  fs.mkdirSync(path.dirname(spec.out), { recursive: true });
  fs.writeFileSync(spec.out, render(spec));
  console.log('wrote', spec.out);
}

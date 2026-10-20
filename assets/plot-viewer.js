/* Plot viewer for the notebook.
   Turns ```plot blocks into interactive graphs: sliders, a hover read-out, drag to pan, zoom buttons.

   Block format, one item per line; most items can be followed by "| label | style":
     x: -2, 4                     x-range (default -5, 5); y: works the same (default: fitted to the curves)
     xstep: pi/2                  tick spacing (a multiple of pi gives pi labels); also ystep:
     equal: true                  same scale on both axes
     xlabel: t (s)                axis names (plain text); also ylabel:
     caption: text                shown under the graph
     slider: a = 1, -1..3         a parameter with a slider; an optional third part is the step (, 0.5);
                                  "| loop" makes ▶ wrap round instead of bouncing back
     f(x) = x^2 | $f$             define a function of x and draw it ("| hidden" defines it without drawing)
     s(t) = 5t^2                  a helper function (not drawn, because its variable isn't x)
     y = 2a(x - a) + a^2          draw an unnamed curve
     x = a                        a vertical line
     curve: (cos(t), sin(t)), t = 0..2pi        a parametric curve
     point: (a, f(a)) | label | open            open = hollow dot (a hole in a graph)
     vector: (0, 0), (3, 4) | $\vb v$           an arrow from a point, with the given components
     text: (1, 2) | words
     area: f(x), 0..2             shade between a curve and the x-axis (or between two: area: f(x), g(x), 0..2)
     riemann: f(x), 0..2, n, left               rectangles: left, right, mid or trap; the legend shows the sum
     hband: L - e, L + e          a horizontal strip between two y-values; vband: for x-values
   Labels may contain $maths$. Styles: red blue green orange purple grey, dashed dotted thick, hidden, open.
   Expressions: + - * / ^, implicit multiplication (2x, 2a(x - a), a x), pi, e, sin cos tan sec csc cot,
   asin acos atan, sinh cosh tanh, exp ln log sqrt cbrt abs floor ceil round sign min max,
   and f'(x), f''(x) for derivatives of a defined function.

   Like the chess viewer, the DOM is only touched in mount(), so tools can load this in Node to check blocks. */
(function () {
'use strict';

/* ======================= expressions ======================= */
const BUILTIN = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, sec: x => 1 / Math.cos(x), csc: x => 1 / Math.sin(x), cot: x => 1 / Math.tan(x),
  asin: Math.asin, acos: Math.acos, atan: Math.atan, arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, exp: Math.exp, ln: Math.log, log: Math.log, log10: Math.log10, log2: Math.log2,
  sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round, sign: Math.sign, sgn: Math.sign,
  min: Math.min, max: Math.max, hypot: Math.hypot, atan2: Math.atan2, mod: (a, b) => ((a % b) + b) % b
};
const ARITY = { min: -1, max: -1, hypot: -1, atan2: 2, mod: 2 };
const CONST = { pi: Math.PI, 'π': Math.PI, e: Math.E, tau: 2 * Math.PI };

function tokenize(s) {
  const re = /\s*(?:(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+)|([\p{L}_][\p{L}\p{N}_]*)|(\*\*|[-+*/^(),'·×−]))/uy, out = [];
  let i = 0;
  while (i < s.length) {
    re.lastIndex = i; const m = re.exec(s);
    if (!m) { if (/^\s*$/.test(s.slice(i))) break; throw new Error(`can't read "${s.slice(i).trim()}"`); }
    i = re.lastIndex;
    if (m[1]) out.push({ num: parseFloat(m[1]) });
    else if (m[2]) out.push({ id: m[2] });
    else out.push({ op: { '**': '^', '·': '*', '×': '*', '−': '-' }[m[3]] || m[3] });
  }
  return out;
}

function parseExpr(src) {
  const tk = tokenize(src); let p = 0;
  const is = (t, o) => t && t.op === o, peek = () => tk[p], next = () => tk[p++];
  const show = t => t ? (t.op || t.id || t.num) : 'end';
  function expr() { let a = term(); while (is(peek(), '+') || is(peek(), '-')) { const op = next().op; a = { t: 'bin', op, a, b: term() }; } return a; }
  function term() {
    let a = unary();
    for (;;) {
      const t = peek();
      if (is(t, '*') || is(t, '/')) { next(); a = { t: 'bin', op: t.op, a, b: unary() }; }
      else if (t && (t.num != null || t.id || is(t, '('))) a = { t: 'bin', op: '*', a, b: power() }; // 2x, a(x - 1)
      else return a;
    }
  }
  function unary() { if (is(peek(), '-')) { next(); return { t: 'neg', a: unary() }; } if (is(peek(), '+')) { next(); return unary(); } return power(); }
  function power() { const a = primary(); if (is(peek(), '^')) { next(); return { t: 'bin', op: '^', a, b: unary() }; } return a; }
  function primary() {
    const t = next();
    if (!t) throw new Error(`"${src}" ends too soon`);
    if (t.num != null) return { t: 'num', v: t.num };
    if (is(t, '(')) { const a = expr(); if (!is(next(), ')')) throw new Error(`missing ) in "${src}"`); return a; }
    if (t.id) {
      let d = 0; while (is(peek(), "'")) { next(); d++; }
      if (is(peek(), '(')) {
        next(); const args = [];
        if (!is(peek(), ')')) { args.push(expr()); while (is(peek(), ',')) { next(); args.push(expr()); } }
        if (!is(next(), ')')) throw new Error(`missing ) in "${src}"`);
        return { t: 'call', n: t.id, d, args };
      }
      if (d) throw new Error(`write ${t.id}${"'".repeat(d)}(x), with brackets`);
      return { t: 'var', n: t.id };
    }
    throw new Error(`unexpected "${show(t)}" in "${src}"`);
  }
  const ast = expr();
  if (p < tk.length) throw new Error(`unexpected "${show(tk[p])}" in "${src}"`);
  return ast;
}

// x^(1/3), x^(2/3) etc. are real for negative x
function pow(a, b) {
  if (a < 0 && !Number.isInteger(b)) for (const q of [3, 5, 7, 9]) { const k = b * q; if (Math.abs(k - Math.round(k)) < 1e-9) return (Math.round(k) % 2 ? -1 : 1) * Math.pow(-a, b); }
  return Math.pow(a, b);
}
function derivative(f, d) {
  if (!d) return f;
  const g = derivative(f, d - 1);
  return (v, e) => { const h = 1e-4 * Math.max(1, Math.abs(v)); return (g(v + h, e) - g(v - h, e)) / (2 * h); };
}

// ctx: { vars: Set of names read from the environment, fns: { name: { param, ev(v, env) } } }
function compile(ast, ctx) {
  switch (ast.t) {
    case 'num': { const v = ast.v; return () => v; }
    case 'neg': { const a = compile(ast.a, ctx); return e => -a(e); }
    case 'bin': {
      const a = compile(ast.a, ctx), b = compile(ast.b, ctx);
      switch (ast.op) {
        case '+': return e => a(e) + b(e);
        case '-': return e => a(e) - b(e);
        case '*': return e => a(e) * b(e);
        case '/': return e => a(e) / b(e);
        default: return e => pow(a(e), b(e));
      }
    }
    case 'var': return variable(ast.n, ctx);
    case 'call': {
      const { n, d, args } = ast, cargs = args.map(a => compile(a, ctx));
      if (ctx.fns[n]) {
        if (cargs.length !== 1) throw new Error(`${n} takes one input`);
        const f = ctx.fns[n], a = cargs[0];
        if (!d) return e => f.ev(a(e), e);
        const df = derivative((v, e) => f.ev(v, e), d); return e => df(a(e), e);
      }
      if (BUILTIN[n]) {
        const want = ARITY[n] || 1, fn = BUILTIN[n];
        if (want > 0 && cargs.length !== want) throw new Error(`${n} takes ${want} input${want > 1 ? 's' : ''}`);
        if (d) { if (want !== 1) throw new Error(`can't differentiate ${n}`); const df = derivative(v => fn(v), d), a = cargs[0]; return e => df(a(e), e); }
        if (cargs.length === 1) { const a = cargs[0]; return e => fn(a(e)); }
        return e => fn(...cargs.map(c => c(e)));
      }
      if (!d && cargs.length === 1 && (ctx.vars.has(n) || n in CONST)) { const v = variable(n, ctx), a = cargs[0]; return e => v(e) * a(e); } // a(x - 1) means a·(x - 1)
      throw new Error(`unknown function "${n}"`);
    }
  }
}
function variable(n, ctx) {
  if (ctx.vars.has(n)) return e => e[n];
  if (n in CONST) { const v = CONST[n]; return () => v; }
  if (ctx.fns[n] || BUILTIN[n]) throw new Error(`${n} is a function: write ${n}(x)`);
  // "ax" or "kt" written without a space: a product of one-letter names
  const parts = [...n];
  if (parts.length > 1 && parts.every(c => ctx.vars.has(c) || c in CONST)) { const fs = parts.map(c => variable(c, ctx)); return e => fs.reduce((p, f) => p * f(e), 1); }
  throw new Error(`unknown name "${n}"`);
}

/* ======================= block format ======================= */
const STYLES = new Set(['red', 'blue', 'green', 'orange', 'purple', 'grey', 'gray', 'dashed', 'dotted', 'thick', 'hidden', 'open', 'loop']);
const COLOR = { blue: 1, red: 2, green: 3, orange: 4, purple: 5, grey: 6, gray: 6 };
const KEYS = new Set(['x', 'y', 'xstep', 'ystep', 'equal', 'xlabel', 'ylabel', 'caption', 'slider', 'curve', 'point', 'vector', 'text', 'area', 'riemann', 'hband', 'vband']);
const NAME = '[\\p{L}_][\\p{L}\\p{N}_]*';

function splitTop(s, sep) {
  const out = []; let depth = 0, cur = '';
  for (const c of s) {
    if (c === '(') depth++; else if (c === ')') depth--;
    if (c === sep && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += c;
  }
  out.push(cur.trim()); return out;
}
// "|" separates options, except inside $maths$
function opts(line) {
  const parts = ['']; let inMath = false;
  for (const c of line) { if (c === '$') inMath = !inMath; if (c === '|' && !inMath) parts.push(''); else parts[parts.length - 1] += c; }
  const [main, ...rest] = parts; const o = { main: main.trim(), label: '', style: new Set() };
  for (const part of rest.map(r => r.trim()).filter(Boolean)) {
    const words = part.toLowerCase().split(/\s+/);
    if (words.every(w => STYLES.has(w))) words.forEach(w => o.style.add(w)); else o.label = part;
  }
  return o;
}
function pair(s, what) {
  const m = s.trim().match(/^\((.*)\)$/); const p = m ? splitTop(m[1], ',') : [];
  if (p.length !== 2) throw new Error(`${what} needs a pair like (1, 2), not "${s}"`);
  return p;
}
function range(s, what) {
  const p = s.split('..'); if (p.length !== 2) throw new Error(`${what} needs a range like 0..2, not "${s}"`);
  return p;
}

function parseBlock(src) {
  const lines = src.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
  const spec = { x: [-5, 5], y: null, xstep: 0, ystep: 0, xpi: 0, ypi: 0, equal: false, xlabel: '', ylabel: '', caption: '', sliders: [], items: [] };
  const sliderNames = new Set(), fns = {};
  // first pass: sliders and function names, so items can use them in any order
  for (const l of lines) {
    let m = l.match(/^slider\s*:\s*(.*)$/);
    if (m) {
      const o = opts(m[1]), mm = o.main.match(new RegExp(`^(${NAME})\\s*=\\s*(.+)$`, 'u'));
      if (!mm) throw new Error(`slider needs "name = value, min..max", not "${o.main}"`);
      const parts = splitTop(mm[2], ','); if (parts.length < 2) throw new Error(`slider ${mm[1]} needs a range, like ${mm[1]} = 1, 0..2`);
      spec.sliders.push({ name: mm[1], parts, label: o.label, loop: o.style.has('loop') }); sliderNames.add(mm[1]); continue;
    }
    m = l.match(new RegExp(`^(${NAME})\\s*\\(\\s*(${NAME})\\s*\\)\\s*=\\s*(.+)$`, 'u'));
    if (m) fns[m[1]] = { param: m[2] };
  }
  const constCtx = { vars: new Set(), fns: {} };
  const num = (s, what) => { const v = compile(parseExpr(s), constCtx)({}); if (!Number.isFinite(v)) throw new Error(`${what} "${s}" isn't a number`); return v; };
  const env = {};
  for (const s of spec.sliders) {
    s.value = num(s.parts[0], `slider ${s.name}`);
    const [lo, hi] = range(s.parts[1], `slider ${s.name}`); s.min = num(lo, 'slider minimum'); s.max = num(hi, 'slider maximum');
    s.step = s.parts[2] ? num(s.parts[2], 'slider step') : 0;
    if (!(s.max > s.min)) throw new Error(`slider ${s.name}: the maximum must be bigger than the minimum`);
    env[s.name] = s.value; delete s.parts;
  }
  const ctxWith = (...names) => ({ vars: new Set([...sliderNames, ...names]), fns });
  const ex = (s, ...names) => compile(parseExpr(s), ctxWith(...names));
  for (const [name, f] of Object.entries(fns)) f.ctx = ctxWith(f.param);

  for (const l of lines) {
    let m;
    if ((m = l.match(/^([a-z]+)\s*:\s*(.*)$/))) {
      const [, key, rest] = m;
      if (!KEYS.has(key)) throw new Error(`unknown setting "${key}:"`);
      const o = opts(rest), it = { label: o.label, style: o.style };
      switch (key) {
        case 'x': case 'y': {
          const p = splitTop(rest, ','); if (p.length !== 2) throw new Error(`${key}: needs two numbers, like ${key}: -2, 4`);
          spec[key] = [num(p[0], key), num(p[1], key)];
          if (!(spec[key][1] > spec[key][0])) throw new Error(`${key}: the second number must be bigger`);
          break;
        }
        case 'xstep': case 'ystep': {
          const v = num(rest, key); if (!(v > 0)) throw new Error(`${key} must be positive`);
          spec[key] = v; if (/pi|π/.test(rest)) spec[key[0] + 'pi'] = 1;
          break;
        }
        case 'equal': spec.equal = /^(true|yes)$/i.test(rest.trim()); break;
        case 'xlabel': case 'ylabel': case 'caption': spec[key] = rest.trim(); break;
        case 'slider': break;
        case 'curve': {
          const p = splitTop(o.main, ','); const tm = (p[1] || '').match(new RegExp(`^(${NAME})\\s*=\\s*(.+)$`, 'u'));
          if (p.length !== 2 || !tm) throw new Error('curve needs "(x(t), y(t)), t = a..b"');
          const [X, Y] = pair(p[0], 'curve'), [a, b] = range(tm[2], 'curve');
          Object.assign(it, { k: 'curve', X: ex(X, tm[1]), Y: ex(Y, tm[1]), tv: tm[1], a: ex(a), b: ex(b) });
          break;
        }
        case 'point': case 'text': { const [X, Y] = pair(o.main, key); Object.assign(it, { k: key, X: ex(X), Y: ex(Y) }); break; }
        case 'vector': {
          const p = splitTop(o.main, ','); if (p.length !== 2) throw new Error('vector needs "(x0, y0), (dx, dy)"');
          const [X, Y] = pair(p[0], 'vector'), [DX, DY] = pair(p[1], 'vector');
          Object.assign(it, { k: 'vector', X: ex(X), Y: ex(Y), DX: ex(DX), DY: ex(DY) });
          break;
        }
        case 'area': {
          const p = splitTop(o.main, ','); if (p.length < 2 || p.length > 3) throw new Error('area needs "f(x), a..b" or "f(x), g(x), a..b"');
          const [a, b] = range(p[p.length - 1], 'area');
          Object.assign(it, { k: 'area', f: ex(p[0], 'x'), g: p.length === 3 ? ex(p[1], 'x') : null, a: ex(a), b: ex(b) });
          break;
        }
        case 'riemann': {
          const p = splitTop(o.main, ','); if (p.length < 3) throw new Error('riemann needs "f(x), a..b, n, left|right|mid|trap"');
          const rule = (p[3] || 'left').toLowerCase(); if (!['left', 'right', 'mid', 'trap'].includes(rule)) throw new Error(`riemann rule "${rule}" should be left, right, mid or trap`);
          const [a, b] = range(p[1], 'riemann');
          Object.assign(it, { k: 'riemann', f: ex(p[0], 'x'), a: ex(a), b: ex(b), n: ex(p[2]), rule });
          break;
        }
        case 'hband': case 'vband': {
          const p = splitTop(o.main, ','); if (p.length !== 2) throw new Error(`${key} needs two values`);
          Object.assign(it, { k: key, lo: ex(p[0]), hi: ex(p[1]) });
          break;
        }
      }
      if (it.k) spec.items.push(it);
      continue;
    }
    const o = opts(l), it = { label: o.label, style: o.style };
    if ((m = o.main.match(new RegExp(`^(${NAME})\\s*\\(\\s*(${NAME})\\s*\\)\\s*=\\s*(.+)$`, 'u')))) {
      const f = fns[m[1]], body = compile(parseExpr(m[3]), f.ctx), p = f.param;
      f.ev = (v, e) => { const old = e[p]; e[p] = v; const r = body(e); e[p] = old; return r; };
      if (p === 'x' && !o.style.has('hidden')) spec.items.push(Object.assign(it, { k: 'fn', f: e => f.ev(e.x, e) }));
    } else if ((m = o.main.match(/^y\s*=\s*(.+)$/))) spec.items.push(Object.assign(it, { k: 'fn', f: ex(m[1], 'x') }));
    else if ((m = o.main.match(/^x\s*=\s*(.+)$/))) spec.items.push(Object.assign(it, { k: 'vline', v: ex(m[1]) }));
    else throw new Error(`can't read the line "${l}"`);
  }
  // functions used before their line was reached are fine; any left undefined have no body
  for (const [name, f] of Object.entries(fns)) if (!f.ev) throw new Error(`${name} is never defined`);

  // colours: curves, areas and bands take the next colour in turn; an area or sum follows the curve above it
  let next = 0, last = 1;
  for (const it of spec.items) {
    const named = [...it.style].map(s => COLOR[s]).find(Boolean);
    if (named) it.color = named;
    else if (it.k === 'point' || it.k === 'text') it.color = 0;
    else if ((it.k === 'area' || it.k === 'riemann') && next) it.color = last;
    else it.color = (next++ % 5) + 1;
    if (it.k === 'fn' || it.k === 'curve') last = it.color;
  }
  // every expression must at least run with the starting slider values
  env.x = (spec.x[0] + spec.x[1]) / 2;
  for (const it of spec.items) {
    if (it.tv) env[it.tv] = 0;
    for (const k of ['f', 'g', 'X', 'Y', 'DX', 'DY', 'a', 'b', 'n', 'lo', 'hi', 'v']) if (typeof it[k] === 'function') it[k](env);
  }
  for (const sl of spec.sliders) env[sl.name] = sl.value;
  spec.env = env;
  return spec;
}

/* ======================= view ======================= */
const CSS = `
.pv{--pl1:#1f5bc4;--pl2:#c8322f;--pl3:#1e8a4c;--pl4:#d26a0a;--pl5:#7b3fb8;--pl6:#6b7280;--pl0:var(--ink,#16181d);
  margin:1.5em 0 1.8em;font-family:var(--font-ui,serif)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .pv{--pl1:#8fb0f5;--pl2:#f08a84;--pl3:#6fcf97;--pl4:#f2a65a;--pl5:#c3a0f0;--pl6:#a0a6b0}}
:root[data-theme="dark"] .pv{--pl1:#8fb0f5;--pl2:#f08a84;--pl3:#6fcf97;--pl4:#f2a65a;--pl5:#c3a0f0;--pl6:#a0a6b0}
.pv-box{position:relative;border:1px solid var(--rule,#d9dce1);border-radius:10px;background:var(--paper,#fff);overflow:hidden;
  box-shadow:0 1px 2px rgba(0,0,0,.05)}
.pv-svg{display:block;width:100%;height:auto;touch-action:pan-y;cursor:crosshair;user-select:none;-webkit-user-select:none}
.pv-svg.is-drag{cursor:grabbing}
.pv-svg text{font-family:var(--font-ui,serif);font-size:12.5px;fill:var(--muted,#5a606b);paint-order:stroke;stroke:var(--paper,#fff);stroke-width:3px;stroke-linejoin:round;font-variant-numeric:tabular-nums}
.pv-grid{stroke:var(--rule,#d9dce1);stroke-width:1}
.pv-minor{stroke:var(--rule,#d9dce1);stroke-width:1;opacity:.45}
.pv-axis{stroke:var(--muted,#5a606b);stroke-width:1.25}
.pv-svg .pv-ttl{font-style:italic;fill:var(--ink,#16181d)}
.pv-c0{--c:var(--pl0)}.pv-c1{--c:var(--pl1)}.pv-c2{--c:var(--pl2)}.pv-c3{--c:var(--pl3)}.pv-c4{--c:var(--pl4)}.pv-c5{--c:var(--pl5)}.pv-c6{--c:var(--pl6)}
.pv-line{fill:none;stroke:var(--c);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.pv-line.thick{stroke-width:3.4}.pv-line.dashed{stroke-dasharray:8 6}.pv-line.dotted{stroke-dasharray:1.5 5}
.pv-fill{fill:var(--c);fill-opacity:.17;stroke:none}
.pv-rect{fill:var(--c);fill-opacity:.16;stroke:var(--c);stroke-opacity:.75;stroke-width:1.1}
.pv-band{fill:var(--c);fill-opacity:.11}.pv-bandline{stroke:var(--c);stroke-opacity:.7;stroke-width:1.2;stroke-dasharray:5 4}
.pv-dot{fill:var(--c);stroke:var(--paper,#fff);stroke-width:2}.pv-dot.open{fill:var(--paper,#fff);stroke:var(--c);stroke-width:2.2}
.pv-arrow{fill:var(--c)}
.pv-hov line{stroke:var(--muted,#5a606b);stroke-width:1;stroke-dasharray:3 3}
.pv-hov circle{fill:var(--c);stroke:var(--paper,#fff);stroke-width:2}
.pv-labels{position:absolute;inset:0;pointer-events:none}
.pv-lab{position:absolute;left:0;top:0;white-space:nowrap;font-size:.86em;color:var(--c);line-height:1.2;
  text-shadow:0 0 3px var(--paper,#fff),0 0 3px var(--paper,#fff),0 0 2px var(--paper,#fff)}
.pv-lab.pv-c0{color:var(--ink,#16181d)}
.pv-read{position:absolute;left:8px;top:8px;padding:.3em .55em;border-radius:7px;background:var(--paper,#fff);border:1px solid var(--rule,#d9dce1);
  font-size:.8em;line-height:1.45;color:var(--ink,#16181d);pointer-events:none;font-variant-numeric:tabular-nums;box-shadow:0 2px 8px rgba(0,0,0,.08);opacity:0;transition:opacity .12s}
.pv-read.on{opacity:1}
.pv-read i{display:inline-block;width:.6em;height:.6em;border-radius:50%;background:var(--c);margin-right:.4em;vertical-align:.05em}
.pv-tools{position:absolute;right:6px;top:6px;display:flex;gap:4px;opacity:.6;transition:opacity .15s}
.pv-box:hover .pv-tools,.pv-tools:focus-within{opacity:1}
.pv-btn{width:1.9em;height:1.9em;border-radius:7px;border:1px solid var(--rule,#d9dce1);background:var(--paper,#fff);color:var(--ink,#16181d);
  display:inline-flex;align-items:center;justify-content:center;padding:0;cursor:pointer;font:inherit;font-size:.85em;line-height:1}
.pv-btn:hover{border-color:var(--accent,#1d4ba0);color:var(--accent,#1d4ba0)}
.pv-btn svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.pv-btn[aria-pressed="true"]{background:var(--accent-soft,#e6ecf7);border-color:var(--accent,#1d4ba0);color:var(--accent,#1d4ba0)}
.pv-legend{display:flex;flex-wrap:wrap;gap:.3em 1.1em;margin:.6em .2em 0;font-size:.9em;color:var(--ink,#16181d)}
.pv-key{display:inline-flex;align-items:center;gap:.45em}
.pv-sw{width:1.3em;height:0;border-top:2.6px solid var(--c);border-radius:2px}
.pv-sw.dashed{border-top-style:dashed}.pv-sw.dotted{border-top-style:dotted}
.pv-sw.box{height:.8em;border:1.3px solid var(--c);background:color-mix(in srgb,var(--c) 20%,transparent);width:.9em}
.pv-val{color:var(--muted,#5a606b);font-variant-numeric:tabular-nums}
.pv-sliders{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:.35em .7em;margin:.7em .2em 0;font-size:.92em}
.pv-sliders input{width:100%;accent-color:var(--accent,#1d4ba0);margin:0;min-width:0}
.pv-sliders output{min-width:3.6em;text-align:right;font-variant-numeric:tabular-nums;color:var(--ink,#16181d)}
.pv-cap{margin:.7em .3em 0;font-size:.93em;line-height:1.4;color:var(--muted,#5a606b);font-style:italic;text-align:center}
.pv-err{margin:1em 0;padding:.6em .9em;border-radius:8px;border:1px solid #d62828;color:#d62828;font-size:.9em}
`;
const ICON = {
  plus: '<svg viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"/></svg>',
  minus: '<svg viewBox="0 0 16 16"><path d="M3 8h10"/></svg>',
  reset: '<svg viewBox="0 0 16 16"><path d="M3.5 6.5A5 5 0 1 1 3 9"/><path d="M3 3v3.5h3.5"/></svg>',
  play: '<svg viewBox="0 0 16 16"><path d="M5 3.5v9l7-4.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 16 16"><path d="M5.5 3.5v9M10.5 3.5v9"/></svg>'
};

let installed = false, uid = 0;
function install() {
  if (installed) return; installed = true;
  const st = document.createElement('style'); st.id = 'pv-style'; st.textContent = CSS; document.head.appendChild(st);
}
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }
// $…$ in labels becomes the site's inline-maths placeholder, which app.js typesets with the rest of the note
const tex = s => esc(s).replace(/\$([^$]+)\$/g, (_, m) => `<span class="math-i">\\(${m}\\)</span>`);
const minus = s => s.replace(/^-/, '−');

function fmt(v, step) {
  if (Math.abs(v) < step * 1e-6) return '0';
  const dec = Math.max(0, Math.min(6, -Math.floor(Math.log10(step) + 1e-9)));
  return minus(v.toFixed(dec));
}
function fmtVal(v) {
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  const s = a !== 0 && (a >= 1e5 || a < 1e-3) ? v.toExponential(2) : v.toFixed(a >= 100 ? 1 : a >= 10 ? 2 : 3);
  return minus(s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, ''));
}
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }
function piLabel(v) {
  const r = v / Math.PI;
  for (let q = 1; q <= 12; q++) {
    const p = Math.round(r * q); if (Math.abs(r * q - p) > 1e-6) continue;
    if (p === 0) return '0';
    const g = gcd(p, q), n = p / g, d = q / g;
    return (n < 0 ? '−' : '') + (Math.abs(n) === 1 ? '' : Math.abs(n)) + 'π' + (d === 1 ? '' : '/' + d);
  }
  return fmt(v, 0.01);
}
function niceStep(span, count) {
  const raw = span / Math.max(2, count), mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag;
}
// a fixed step (like pi/2) is kept while it gives sensibly spaced ticks, otherwise doubled or halved
function stepFor(fixed, isPi, span, px) {
  if (!fixed) return { step: niceStep(span, px / 80), pi: false };
  let s = fixed; while (px * s / span < 45) s *= 2; while (px * s / span > 220) s /= 2;
  return { step: s, pi: !!isPi };
}

function Plot(pre, spec) {
  const id = ++uid, root = el('figure', 'pv'), box = el('div', 'pv-box');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'pv-svg'); svg.setAttribute('role', 'img');
  if (spec.caption) svg.setAttribute('aria-label', spec.caption.replace(/\$/g, ''));
  const labels = el('div', 'pv-labels'), read = el('div', 'pv-read'), tools = el('div', 'pv-tools');
  box.append(svg, labels, read, tools); root.append(box);
  const env = Object.assign({}, spec.env);
  const items = spec.items;

  // starting view; y is fitted to what is drawn if not given
  function fitY() {
    const [x0, x1] = spec.x, ys = [];
    for (const it of items) {
      if (it.style.has('hidden')) continue;
      const fs = it.k === 'fn' ? [it.f] : it.k === 'area' ? [it.f, it.g].filter(Boolean) : it.k === 'riemann' ? [it.f] : [];
      for (const f of fs) for (let i = 0; i <= 160; i++) { env.x = x0 + (x1 - x0) * i / 160; const v = f(env); if (Number.isFinite(v)) ys.push(v); }
      if (it.k === 'curve') { const a = it.a(env), b = it.b(env); for (let i = 0; i <= 160; i++) { env[it.tv] = a + (b - a) * i / 160; const v = it.Y(env); if (Number.isFinite(v)) ys.push(v); } }
      if (it.k === 'point' || it.k === 'text') ys.push(it.Y(env));
      if (it.k === 'vector') { const y = it.Y(env); ys.push(y, y + it.DY(env)); }
      if (it.k === 'hband') ys.push(it.lo(env), it.hi(env));
      if (it.k === 'area' || it.k === 'riemann') ys.push(0);
    }
    const v = ys.filter(Number.isFinite).sort((a, b) => a - b);
    if (!v.length) return [-1, 1];
    const q = p => v[Math.min(v.length - 1, Math.max(0, Math.round(p * (v.length - 1))))];
    let lo = v.length > 40 ? q(0.02) : v[0], hi = v.length > 40 ? q(0.98) : v[v.length - 1];
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    if (lo > 0 && lo < (hi - lo) * 0.6) lo = 0;
    if (hi < 0 && -hi < (hi - lo) * 0.6) hi = 0;
    const pad = (hi - lo) * 0.08; return [lo - pad, hi + pad];
  }
  const home = { x: spec.x.slice(), y: spec.y ? spec.y.slice() : fitY() };
  let view = { x: home.x.slice(), y: home.y.slice() }, W = 640, H = 400;

  // equal scale: widen whichever range is needed so both requested ranges fit the box
  function shaped(v) {
    if (!spec.equal) return v;
    const u = Math.max((v.x[1] - v.x[0]) / W, (v.y[1] - v.y[0]) / H), cx = (v.x[0] + v.x[1]) / 2, cy = (v.y[0] + v.y[1]) / 2;
    return { x: [cx - u * W / 2, cx + u * W / 2], y: [cy - u * H / 2, cy + u * H / 2] };
  }

  /* ---- HTML around the graph ---- */
  const keyed = items.filter(it => it.label && !it.style.has('hidden') && !['point', 'text', 'vector'].includes(it.k));
  const vals = new Map();
  if (keyed.length) {
    const lg = el('div', 'pv-legend');
    for (const it of keyed) {
      const k = el('span', `pv-key pv-c${it.color}`);
      const boxy = ['area', 'riemann', 'hband', 'vband'].includes(it.k);
      k.innerHTML = `<span class="pv-sw${boxy ? ' box' : ''}${it.style.has('dashed') ? ' dashed' : ''}${it.style.has('dotted') ? ' dotted' : ''}"></span><span>${tex(it.label)}</span>`;
      if (it.k === 'area' || it.k === 'riemann') { const v = el('span', 'pv-val'); k.append(v); vals.set(it, v); }
      lg.append(k);
    }
    root.append(lg);
  }
  const floating = items.filter(it => it.label && ['point', 'text', 'vector'].includes(it.k)).map(it => {
    const l = el('div', `pv-lab pv-c${it.color}`, tex(it.label)); labels.append(l); return [it, l];
  });
  const outs = new Map();
  let playing = null;
  if (spec.sliders.length) {
    const sl = el('div', 'pv-sliders');
    for (const s of spec.sliders) {
      const step = s.step || Math.pow(10, Math.floor(Math.log10((s.max - s.min) / 100))); // a round step, so values read 0.3 not 0.2995
      const name = el('label', null, s.label ? tex(s.label) : tex(`$${s.name}$`));
      const inp = el('input'); Object.assign(inp, { type: 'range', min: s.min, max: s.max, step, value: s.value }); inp.id = `pv${id}-${s.name}`; name.htmlFor = inp.id;
      const out = el('output'); outs.set(s.name, out);
      const play = el('button', 'pv-btn', ICON.play); play.type = 'button'; play.setAttribute('aria-label', `Animate ${s.name}`); play.setAttribute('aria-pressed', 'false');
      inp.addEventListener('input', () => { stop(); env[s.name] = +inp.value; schedule(); });
      play.addEventListener('click', () => { if (playing && playing.s === s) stop(); else start(s, inp, play); });
      sl.append(name, inp, out, play);
      s.input = inp;
    }
    root.append(sl);
  }
  if (spec.caption) root.append(el('figcaption', 'pv-cap', tex(spec.caption)));

  // sweep a slider to its end and back
  function start(s, inp, btn) {
    stop(); playing = { s, inp, btn, dir: env[s.name] >= s.max ? -1 : 1, t: 0, v: env[s.name] };
    btn.innerHTML = ICON.pause; btn.setAttribute('aria-pressed', 'true');
    const tick = now => {
      if (!playing || playing.s !== s) return;
      const dt = playing.t ? Math.min(0.05, (now - playing.t) / 1000) : 0; playing.t = now;
      let v = playing.v + playing.dir * dt * (s.max - s.min) / 4;
      if (s.loop) v = s.min + (((v - s.min) % (s.max - s.min)) + (s.max - s.min)) % (s.max - s.min);
      else if (v >= s.max) { v = s.max; playing.dir = -1; } else if (v <= s.min) { v = s.min; playing.dir = 1; }
      playing.v = v; env[s.name] = s.step ? s.min + Math.round((v - s.min) / s.step) * s.step : v;
      inp.value = env[s.name]; render(); requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function stop() { if (!playing) return; playing.btn.innerHTML = ICON.play; playing.btn.setAttribute('aria-pressed', 'false'); playing = null; }

  const btn = (icon, label, fn) => { const b = el('button', 'pv-btn', ICON[icon]); b.type = 'button'; b.setAttribute('aria-label', label); b.title = label; b.addEventListener('click', fn); tools.append(b); };
  btn('plus', 'Zoom in', () => zoom(1 / 1.5)); btn('minus', 'Zoom out', () => zoom(1.5));
  btn('reset', 'Reset view', () => { view = { x: home.x.slice(), y: home.y.slice() }; render(); });
  function zoom(f, cx, cy) {
    const v = shaped(view);
    cx = cx ?? (v.x[0] + v.x[1]) / 2; cy = cy ?? (v.y[0] + v.y[1]) / 2;
    view = { x: [cx + (v.x[0] - cx) * f, cx + (v.x[1] - cx) * f], y: [cy + (v.y[0] - cy) * f, cy + (v.y[1] - cy) * f] };
    render();
  }

  /* ---- drawing ---- */
  let raf = 0;
  function schedule() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); }
  let sx, sy, cur;
  function render() {
    const v = cur = shaped(view), [x0, x1] = v.x, [y0, y1] = v.y;
    sx = x => (x - x0) / (x1 - x0) * W; sy = y => H - (y - y0) / (y1 - y0) * H;
    const P = n => Math.round(n * 10) / 10, out = [];
    const clip = `pv${id}-clip`;
    out.push(`<defs><clipPath id="${clip}"><rect width="${W}" height="${H}"/></clipPath></defs>`);

    // grid and axes
    const xs = stepFor(spec.xstep, spec.xpi, x1 - x0, W), ys = stepFor(spec.ystep, spec.ypi, y1 - y0, H);
    const originIn = sx(0) > 0 && sx(0) < W && sy(0) > 0 && sy(0) < H;
    const grid = [], minor = [], txt = [];
    const ax = Math.min(H - 1, Math.max(0, sy(0))), ay = Math.min(W - 1, Math.max(0, sx(0)));
    const xLabY = ax > H - 22 ? ax - 6 : ax + 16, yLabX = ay > W - 50 ? ay - 6 : ay + 6, yAnchor = ay > W - 50 ? 'end' : 'start';
    for (const [s, lo, hi, isX] of [[xs, x0, x1, true], [ys, y0, y1, false]]) {
      const m = s.pi ? s.step / 2 : s.step / (Math.round(s.step / Math.pow(10, Math.floor(Math.log10(s.step)))) === 2 ? 4 : 5);
      for (let k = Math.ceil(lo / m); k * m <= hi; k++) {
        const val = k * m, isMajor = Math.abs(val / s.step - Math.round(val / s.step)) < 1e-6;
        const p = P(isX ? sx(val) : sy(val));
        (isMajor ? grid : minor).push(isX ? `M${p} 0V${H}` : `M0 ${p}H${W}`);
        if (!isMajor || (originIn && Math.abs(val) < s.step * 1e-6)) continue;
        const lab = s.pi ? piLabel(val) : fmt(val, s.step);
        if (isX) { if (p > 12 && p < W - 12) txt.push(`<text x="${p}" y="${P(xLabY)}" text-anchor="middle">${lab}</text>`); }
        else if (p > 12 && p < H - 8) txt.push(`<text x="${P(yLabX)}" y="${P(p + 4)}" text-anchor="${yAnchor}">${lab}</text>`);
      }
    }
    if (originIn) txt.push(`<text x="${P(sx(0) - 5)}" y="${P(sy(0) + 16)}" text-anchor="end">0</text>`);
    out.push(`<path class="pv-minor" d="${minor.join('')}"/><path class="pv-grid" d="${grid.join('')}"/>`);
    out.push(`<path class="pv-axis" d="M0 ${P(ax)}H${W}M${P(ay)} 0V${H}"/>`);

    // shaded things first, so curves sit on top
    const body = [], marks = [];
    for (const it of items) {
      if (it.style.has('hidden')) continue;
      const c = `pv-c${it.color}`;
      if (it.k === 'hband' || it.k === 'vband') {
        const a = it.lo(env), b = it.hi(env); if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        if (it.k === 'hband') { const p = P(sy(Math.max(a, b))), q = P(sy(Math.min(a, b))); body.push(`<g class="${c}"><rect class="pv-band" x="0" y="${p}" width="${W}" height="${P(q - p)}"/><path class="pv-bandline" d="M0 ${p}H${W}M0 ${q}H${W}"/></g>`); }
        else { const p = P(sx(Math.min(a, b))), q = P(sx(Math.max(a, b))); body.push(`<g class="${c}"><rect class="pv-band" x="${p}" y="0" width="${P(q - p)}" height="${H}"/><path class="pv-bandline" d="M${p} 0V${H}M${q} 0V${H}"/></g>`); }
      } else if (it.k === 'area') {
        const a = it.a(env), b = it.b(env), n = 240, top = [], bot = [];
        for (let i = 0; i <= n; i++) {
          env.x = a + (b - a) * i / n; const f = it.f(env), g = it.g ? it.g(env) : 0;
          if (Number.isFinite(f) && Number.isFinite(g)) { top.push(`${P(sx(env.x))} ${P(clampY(sy(f)))}`); bot.push(`${P(sx(env.x))} ${P(clampY(sy(g)))}`); }
        }
        if (top.length) body.push(`<path class="pv-fill ${c}" d="M${top.join('L')}L${bot.reverse().join('L')}Z"/>`);
        if (vals.has(it)) vals.get(it).textContent = '≈ ' + fmtVal(simpson(e => it.f(e) - (it.g ? it.g(e) : 0), a, b));
      } else if (it.k === 'riemann') {
        const a = it.a(env), b = it.b(env), n = Math.max(1, Math.min(500, Math.round(it.n(env)))), dx = (b - a) / n, rs = [];
        let sum = 0;
        for (let i = 0; i < n; i++) {
          const l = a + i * dx, r = l + dx;
          if (it.rule === 'trap') {
            env.x = l; const fl = it.f(env); env.x = r; const fr = it.f(env); sum += (fl + fr) / 2 * dx;
            rs.push(`M${P(sx(l))} ${P(sy(0))}L${P(sx(l))} ${P(clampY(sy(fl)))}L${P(sx(r))} ${P(clampY(sy(fr)))}L${P(sx(r))} ${P(sy(0))}Z`);
          } else {
            env.x = it.rule === 'left' ? l : it.rule === 'right' ? r : l + dx / 2; const f = it.f(env); sum += f * dx;
            const t = clampY(sy(f)), z = sy(0);
            rs.push(`M${P(sx(l))} ${P(z)}V${P(t)}H${P(sx(r))}V${P(z)}Z`);
          }
        }
        body.push(`<path class="pv-rect ${c}" d="${rs.join('')}"/>`);
        if (vals.has(it)) vals.get(it).textContent = `n = ${n}, sum ≈ ${fmtVal(sum)}`;
      } else if (it.k === 'fn') body.push(`<path class="pv-line ${c} ${[...it.style].join(' ')}" d="${trace(it.f)}"/>`);
      else if (it.k === 'vline') { const x = it.v(env); if (Number.isFinite(x)) body.push(`<path class="pv-line ${c} ${[...it.style].join(' ')}" d="M${P(sx(x))} 0V${H}"/>`); }
      else if (it.k === 'curve') body.push(`<path class="pv-line ${c} ${[...it.style].join(' ')}" d="${traceParam(it)}"/>`);
      else if (it.k === 'vector') {
        const X = it.X(env), Y = it.Y(env), dx = it.DX(env), dy = it.DY(env);
        const p0 = [sx(X), sy(Y)], p1 = [sx(X + dx), sy(Y + dy)], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        if (L > 1) {
          const ux = (p1[0] - p0[0]) / L, uy = (p1[1] - p0[1]) / L, hl = Math.min(13, L * 0.45), hw = hl * 0.42;
          const bx = p1[0] - ux * hl, by = p1[1] - uy * hl;
          marks.push(`<g class="${c}"><path class="pv-line ${[...it.style].join(' ')}" d="M${P(p0[0])} ${P(p0[1])}L${P(bx)} ${P(by)}"/><path class="pv-arrow" d="M${P(p1[0])} ${P(p1[1])}L${P(bx - uy * hw)} ${P(by + ux * hw)}L${P(bx + uy * hw)} ${P(by - ux * hw)}Z"/></g>`);
        }
      } else if (it.k === 'point') {
        const X = it.X(env), Y = it.Y(env);
        if (Number.isFinite(X) && Number.isFinite(Y)) marks.push(`<circle class="pv-dot ${c}${it.style.has('open') ? ' open' : ''}" cx="${P(sx(X))}" cy="${P(sy(Y))}" r="4.6"/>`);
      }
    }
    out.push(`<g clip-path="url(#${clip})">${body.join('')}${marks.join('')}</g>`, txt.join(''));
    if (spec.xlabel) out.push(`<text class="pv-ttl" x="${W - 8}" y="${P(ax > H - 40 ? ax - 22 : ax - 8)}" text-anchor="end">${esc(spec.xlabel)}</text>`);
    if (spec.ylabel) out.push(`<text class="pv-ttl" x="${P(ay > W - 80 ? ay - 8 : ay + 8)}" y="18" text-anchor="${ay > W - 80 ? 'end' : 'start'}">${esc(spec.ylabel)}</text>`);
    out.push(`<g class="pv-hov"></g>`);
    svg.innerHTML = out.join('');
    hov = svg.lastChild;

    // HTML labels follow their points
    for (const [it, l] of floating) {
      let X = it.X(env), Y = it.Y(env);
      if (it.k === 'vector') { X += it.DX(env); Y += it.DY(env); }
      const px = sx(X), py = sy(Y), ok = Number.isFinite(px) && Number.isFinite(py) && px > -20 && px < W + 20 && py > -20 && py < H + 20;
      l.style.display = ok ? '' : 'none';
      if (ok) {
        const left = px > W - 90, up = py > 26;
        l.style.transform = `translate(${P(px * box.clientWidth / W)}px,${P(py * box.clientHeight / H)}px) translate(${left ? 'calc(-100% - 8px)' : '8px'},${up ? 'calc(-100% - 4px)' : '6px'})`;
      }
    }
    for (const s of spec.sliders) outs.get(s.name).textContent = fmtVal(env[s.name]);
    if (hoverX != null) showHover(hoverX);
  }
  const clampY = y => Math.max(-3 * H, Math.min(4 * H, y));

  // sample a function across the view, lifting the pen at gaps and jumps
  function trace(f) {
    const [x0, x1] = cur.x, n = Math.max(240, Math.round(W * 1.5)), dx = (x1 - x0) / n, ev = x => { env.x = x; const v = f(env); return Number.isFinite(v) ? v : NaN; };
    const P = n => Math.round(n * 10) / 10;
    let d = '', px = x0, py = ev(x0);
    if (!isNaN(py)) d += `M${P(sx(px))} ${P(clampY(sy(py)))}`;
    for (let i = 1; i <= n; i++) {
      const x = x0 + i * dx, y = ev(x);
      if (!isNaN(y)) d += (isNaN(py) || jump(px, py, x, y, ev) ? 'M' : 'L') + `${P(sx(x))} ${P(clampY(sy(y)))}`;
      px = x; py = y;
    }
    return d;
  }
  // a big step between neighbouring samples is a jump if it doesn't shrink when the interval is halved
  function jump(xa, ya, xb, yb, ev) {
    const gap0 = Math.abs(sy(ya) - sy(yb)); if (gap0 < 30) return false;
    let a = xa, b = xb, fa = ya, fb = yb;
    for (let k = 0; k < 12; k++) {
      const m = (a + b) / 2, fm = ev(m); if (isNaN(fm)) return true;
      if (Math.abs(fm - fa) > Math.abs(fb - fm)) { b = m; fb = fm; } else { a = m; fa = fm; }
    }
    return Math.abs(sy(fa) - sy(fb)) > gap0 * 0.25;
  }
  function traceParam(it) {
    const a = it.a(env), b = it.b(env), n = 600, P = n => Math.round(n * 10) / 10; let d = '', pen = false;
    for (let i = 0; i <= n; i++) {
      env[it.tv] = a + (b - a) * i / n; const X = it.X(env), Y = it.Y(env);
      if (!Number.isFinite(X) || !Number.isFinite(Y)) { pen = false; continue; }
      d += (pen ? 'L' : 'M') + `${P(sx(X))} ${P(clampY(sy(Y)))}`; pen = true;
    }
    return d;
  }
  function simpson(f, a, b) {
    const n = 400, h = (b - a) / n; let s = 0;
    for (let i = 0; i <= n; i++) { env.x = a + i * h; const v = f(env); s += v * (i === 0 || i === n ? 1 : i % 2 ? 4 : 2); }
    return s * h / 3;
  }

  /* ---- hover read-out, pan, zoom ---- */
  let hov = null, hoverX = null;
  const curves = items.filter(it => it.k === 'fn' && !it.style.has('hidden'));
  function showHover(x) {
    if (!hov) return;
    const P = n => Math.round(n * 10) / 10, px = P(sx(x)), rows = [`x = ${fmtVal(x)}`], dots = [];
    for (const it of curves) {
      env.x = x; const y = it.f(env); if (!Number.isFinite(y)) continue;
      const py = sy(y); if (py >= -2 && py <= H + 2) dots.push(`<circle class="pv-c${it.color}" cx="${px}" cy="${P(py)}" r="4"/>`);
      rows.push(`<span class="pv-c${it.color}"><i></i>${fmtVal(y)}</span>`);
    }
    hov.innerHTML = `<line x1="${px}" x2="${px}" y1="0" y2="${H}"/>${dots.join('')}`;
    read.innerHTML = rows.join('<br>'); read.classList.add('on');
  }
  const toModelX = ev => { const r = svg.getBoundingClientRect(); return cur.x[0] + (ev.clientX - r.left) / r.width * (cur.x[1] - cur.x[0]); };
  let drag = null;
  svg.addEventListener('pointerdown', ev => {
    if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
    drag = { x: ev.clientX, y: ev.clientY, v: shaped(view) }; svg.setPointerCapture(ev.pointerId); svg.classList.add('is-drag');
  });
  svg.addEventListener('pointermove', ev => {
    if (drag) {
      const r = svg.getBoundingClientRect(), v = drag.v;
      const dx = (ev.clientX - drag.x) / r.width * (v.x[1] - v.x[0]), dy = (ev.clientY - drag.y) / r.height * (v.y[1] - v.y[0]);
      view = { x: [v.x[0] - dx, v.x[1] - dx], y: [v.y[0] + dy, v.y[1] + dy] }; hoverX = null; read.classList.remove('on'); schedule(); return;
    }
    hoverX = toModelX(ev); showHover(hoverX);
  });
  const endDrag = () => { drag = null; svg.classList.remove('is-drag'); };
  svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);
  svg.addEventListener('pointerleave', () => { if (drag) return; hoverX = null; if (hov) hov.innerHTML = ''; read.classList.remove('on'); });
  // ctrl/cmd + wheel zooms at the pointer; a plain wheel still scrolls the page
  svg.addEventListener('wheel', ev => {
    if (!ev.ctrlKey && !ev.metaKey) return;
    ev.preventDefault(); const r = svg.getBoundingClientRect();
    const cx = cur.x[0] + (ev.clientX - r.left) / r.width * (cur.x[1] - cur.x[0]), cy = cur.y[1] - (ev.clientY - r.top) / r.height * (cur.y[1] - cur.y[0]);
    zoom(ev.deltaY > 0 ? 1.15 : 1 / 1.15, cx, cy);
  }, { passive: false });

  // size to the column; redraw when it changes
  function resize() {
    const w = Math.round(box.clientWidth) || 640; if (Math.abs(w - W) < 1 && svg.getAttribute('viewBox')) return;
    W = w; H = Math.round(Math.max(220, Math.min(430, w * 0.62)));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); render();
  }
  pre.replaceWith(root);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resize).observe(box);
  resize();
  return root;
}

function mount(rootEl) {
  install();
  for (const code of rootEl.querySelectorAll('pre > code.language-plot')) {
    const pre = code.parentElement; if (pre.dataset.pvDone) continue; pre.dataset.pvDone = '1';
    try { Plot(pre, parseBlock(code.textContent)); }
    catch (e) { pre.after(el('div', 'pv-err', 'Plot error: ' + esc(e.message))); }
  }
}

const api = { parseExpr, parseBlock, mount };
if (typeof window !== 'undefined') window.PlotViewer = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();

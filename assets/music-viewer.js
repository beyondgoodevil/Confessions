/* Notation player for the notebook.
   Turns ```abc blocks into engraved scores (abcjs, assets/vendor/) that play back, with each note lighting up as it sounds.

   Block format: optional settings first, then ordinary ABC notation.
     caption: text           shown under the score ($maths$ allowed)
     instrument: piano       piano (default), harpsichord, organ, strings, violin, cello, choir, flute, oboe, clarinet,
                             bassoon, horn, trumpet, trombone, tuba, sax, guitar, bass, vibraphone
     chords: off             don't play chord symbols ("C7") as an accompaniment
     X:1                     (added if missing)
     M:2/4  L:1/8  Q:1/4=108  K:Cm
     z G G G | !fermata!E4 | ...
   A second instrument for one voice can be set in the ABC itself with %%MIDI program N.

   check() (used by tools/check.mjs) parses a block with abcjs and reports warnings and any bar whose length
   doesn't match the metre (the first and last bars may be short, for upbeats).
   Like the other viewers, the DOM is only touched in mount(), so tools can load this in Node. */
(function () {
'use strict';

const PROGRAM = {
  piano: 0, harpsichord: 6, vibraphone: 11, organ: 19, guitar: 24, bass: 32, violin: 40, cello: 42, strings: 48, choir: 52,
  trumpet: 56, trombone: 57, tuba: 58, horn: 60, sax: 65, oboe: 68, bassoon: 70, clarinet: 71, flute: 73
};
const SETTINGS = /^(caption|instrument|chords)\s*:\s*(.*)$/i;

function parseBlock(src) {
  const out = { caption: '', program: 0, chords: true, abc: '' }, music = [];
  let started = false;
  for (const line of src.replace(/\r/g, '').split('\n')) {
    const m = !started && line.trim().match(SETTINGS);
    if (m) {
      const key = m[1].toLowerCase(), v = m[2].trim();
      if (key === 'caption') out.caption = v;
      else if (key === 'chords') out.chords = !/^(off|no|false)$/i.test(v);
      else {
        if (!(v.toLowerCase() in PROGRAM)) throw new Error(`unknown instrument "${v}" (try ${Object.keys(PROGRAM).join(', ')})`);
        out.program = PROGRAM[v.toLowerCase()];
      }
      continue;
    }
    if (line.trim()) started = true;
    music.push(line);
  }
  let abc = music.join('\n').trim();
  if (!/^K:/m.test(abc)) throw new Error('the ABC needs a key line, e.g. K:C');
  if (!/^X:/m.test(abc)) abc = 'X:1\n' + abc;
  out.abc = abc;
  return out;
}

const frac = x => {
  for (let d = 1; d <= 64; d *= 2) { const n = x * d; if (Math.abs(n - Math.round(n)) < 1e-6) return `${Math.round(n)}/${d}`; }
  return x.toFixed(3);
};
// Parse with abcjs and measure every bar against the metre; returns a list of problems (empty when all is well).
function check(src, ABCJS) {
  const spec = parseBlock(src), problems = [];
  const tune = ABCJS.parseOnly(spec.abc)[0];
  if (!tune) return ['no tune found'];
  for (const w of tune.warnings || []) problems.push(w.replace(/<[^>]+>/g, ''));
  const mf = tune.getMeterFraction && tune.getMeterFraction();
  if (!mf || !mf.den) return problems; // free metre
  let voiceNo = 0;
  const voices = [];
  for (const line of tune.lines) if (line.staff) line.staff.forEach((st, si) => st.voices.forEach((v, vi) => {
    const key = si + ':' + vi; let rec = voices.find(r => r.key === key);
    if (!rec) voices.push(rec = { key, els: [], n: ++voiceNo });
    rec.els.push(...v);
  }));
  for (const { els, n } of voices) {
    let bar = mf.num / mf.den, acc = 0, mult = 1, bars = [];
    for (const el of els) {
      if (el.el_type === 'meter' && el.value && el.value[0]) bar = +el.value[0].num / +el.value[0].den;
      if (el.el_type === 'note') {
        if (el.startTriplet) mult = el.tripletMultiplier || 1;
        if (el.rest && el.rest.type === 'multimeasure') acc += bar * (el.rest.text || 1);
        else acc += (el.duration || 0) * mult;
        if (el.endTriplet) mult = 1;
      } else if (el.el_type === 'bar' && acc > 1e-9) { bars.push([acc, bar]); acc = 0; }
    }
    if (acc > 1e-9) bars.push([acc, bar]);
    bars.forEach(([len, want], i) => {
      const edge = i === 0 || i === bars.length - 1;
      if (Math.abs(len - want) > 1e-6 && !(edge && len < want) && !(len > want && Math.abs(len / want - Math.round(len / want)) < 1e-6 && /Z/.test(spec.abc)))
        problems.push(`${voices.length > 1 ? `voice ${n}, ` : ''}bar ${i + 1} lasts ${frac(len)} of a whole note, but the metre needs ${frac(want)}`);
    });
  }
  return problems;
}

/* ======================= view ======================= */
const CSS = `
.mv{margin:1.5em 0 1.8em;font-family:var(--font-ui,serif)}
.mv-box{border:1px solid var(--rule,#d9dce1);border-radius:10px;background:var(--paper,#fff);padding:.6em .7em .55em;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.mv-score{color:var(--ink,#16181d);overflow:hidden}
.mv-score svg{display:block;max-width:100%;margin:0 auto}
.mv-score .abcjs-note,.mv-score .abcjs-rest{transition:fill .08s,color .08s}
.mv-score .mv-hl,.mv-score .mv-hl path{fill:var(--accent,#1d4ba0);color:var(--accent,#1d4ba0)}
.mv-score .abcjs-title{font-style:italic}
.mv-ctl{margin-top:.45em}
.mv .abcjs-inline-audio{display:flex;align-items:center;gap:.25em;height:2.3em;padding:0 .35em;border-radius:8px;background:var(--surface,#f4f5f7);border:1px solid var(--rule,#d9dce1);box-sizing:border-box}
.mv .abcjs-inline-audio.abcjs-disabled{opacity:.5}
.mv .abcjs-inline-audio .abcjs-btn{display:block;width:2em;height:1.8em;padding:.3em;margin:0;background:none!important;border:1px solid transparent;border-radius:6px;box-sizing:border-box;line-height:1;cursor:pointer}
.mv .abcjs-btn g{fill:var(--ink,#16181d);stroke:var(--ink,#16181d)}
.mv .abcjs-inline-audio .abcjs-btn:hover g{fill:var(--accent,#1d4ba0);stroke:var(--accent,#1d4ba0)}
.mv .abcjs-inline-audio .abcjs-btn:focus-visible{border-color:var(--accent,#1d4ba0)}
.mv .abcjs-inline-audio .abcjs-midi-loop.abcjs-pushed,.mv .abcjs-inline-audio .abcjs-midi-reset.abcjs-pushed{border-color:var(--accent,#1d4ba0);background:var(--accent-soft,#e6ecf7)!important}
.mv .abcjs-inline-audio .abcjs-midi-start .abcjs-pause-svg,.mv .abcjs-inline-audio .abcjs-midi-start .abcjs-loading-svg{display:none}
.mv .abcjs-inline-audio .abcjs-midi-start.abcjs-pushed .abcjs-play-svg,.mv .abcjs-inline-audio .abcjs-midi-start.abcjs-loading .abcjs-play-svg{display:none}
.mv .abcjs-inline-audio .abcjs-midi-start.abcjs-pushed .abcjs-pause-svg{display:block}
.mv .abcjs-inline-audio .abcjs-loading .abcjs-loading-svg{display:inherit}
.mv .abcjs-inline-audio .abcjs-loading{animation:mv-spin 1s linear infinite}
.mv .abcjs-inline-audio .abcjs-loading-svg circle{stroke:var(--ink,#16181d)}
@keyframes mv-spin{to{transform:rotate(360deg)}}
.mv .abcjs-inline-audio .abcjs-midi-progress-background{flex:1;position:relative;height:6px;margin:0 .6em;padding:0;border-radius:3px;background:var(--rule,#d9dce1);border:0;cursor:pointer;box-sizing:border-box}
.mv .abcjs-inline-audio .abcjs-midi-progress-indicator{position:absolute;top:-4px;left:0;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:var(--accent,#1d4ba0);box-shadow:0 1px 3px rgba(0,0,0,.25)}
.mv .abcjs-inline-audio .abcjs-midi-clock{font-size:.85em;color:var(--muted,#5a606b);font-variant-numeric:tabular-nums;margin:0 .3em}
.mv .abcjs-inline-audio .abcjs-tempo-wrapper{display:flex;align-items:center;font-size:.8em;color:var(--muted,#5a606b)}
.mv .abcjs-inline-audio .abcjs-midi-tempo{width:3.4em;margin:0 .3em;padding:.1em .2em;border-radius:5px;border:1px solid var(--rule,#d9dce1);background:var(--paper,#fff);color:var(--ink,#16181d);font:inherit}
.mv .abcjs-css-warning{display:none}
.mv-cap{margin:.7em .3em 0;font-size:.93em;line-height:1.4;color:var(--muted,#5a606b);font-style:italic;text-align:center}
.mv-err{margin:1em 0;padding:.6em .9em;border-radius:8px;border:1px solid #d62828;color:#d62828;font-size:.9em}
@media (max-width:480px){.mv .abcjs-inline-audio .abcjs-tempo-wrapper{display:none}}
`;

let installed = false, uid = 0, playing = null;
function install() {
  if (installed) return; installed = true;
  const st = document.createElement('style'); st.id = 'mv-style'; st.textContent = CSS; document.head.appendChild(st);
}
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }
// $…$ becomes the site's inline-maths placeholder, typeset by app.js with the rest of the note
const tex = s => esc(s).replace(/\$([^$]+)\$/g, (_, m) => `<span class="math-i">\\(${m}\\)</span>`);

function Score(pre, spec) {
  const ABCJS = window.ABCJS, id = ++uid;
  const root = el('figure', 'mv'), box = el('div', 'mv-box'), score = el('div', 'mv-score'), ctl = el('div', 'mv-ctl');
  score.id = `mv-score-${id}`; ctl.id = `mv-ctl-${id}`;
  box.append(score, ctl); root.append(box);
  if (spec.caption) root.append(el('figcaption', 'mv-cap', tex(spec.caption)));
  pre.replaceWith(root);

  // The staff is sized to its busiest line, so a four-note example stays compact; anything wider than the column is fitted to it.
  const base = { add_classes: true, foregroundColor: 'currentColor', paddingtop: 4, paddingbottom: 4, paddingleft: 0, paddingright: 0 };
  const parsed = ABCJS.parseOnly(spec.abc)[0], perLine = (parsed.lines || []).map(l => (l.staff || []).reduce((m, st) =>
    Math.max(m, ...st.voices.map(v => v.filter(e => e.el_type === 'note' || e.el_type === 'bar').length)), 0));
  const room = score.clientWidth || 600, want = 150 + 34 * Math.max(4, ...perLine);
  const tune = want * 1.1 <= room
    ? ABCJS.renderAbc(score, spec.abc, Object.assign({ scale: 1.1, staffwidth: want }, base))[0]
    : ABCJS.renderAbc(score, spec.abc, Object.assign({ responsive: 'resize', staffwidth: Math.max(300, room / 1.05) }, base))[0];
  if (!ABCJS.synth.supportsAudio()) { ctl.remove(); return; }

  let lit = [];
  const clear = () => { lit.forEach(n => n.classList.remove('mv-hl')); lit = []; };
  const cursor = {
    onStart() { clear(); },
    onEvent(ev) {
      clear();
      for (const group of ev.elements || []) for (const n of group) { n.classList.add('mv-hl'); lit.push(n); }
    },
    onFinished() { clear(); }
  };
  const synth = new ABCJS.synth.SynthController();
  synth.load(ctl, cursor, { displayRestart: true, displayPlay: true, displayProgress: true, displayWarp: true, displayLoop: true });
  synth.setTune(tune, false, { program: spec.program, chordsOff: !spec.chords }).catch(e => console.warn('music:', e));
  // only one score sounds at a time
  ctl.addEventListener('click', ev => {
    if (!ev.target.closest('.abcjs-midi-start')) return;
    if (playing && playing !== synth) { try { playing.pause(); } catch (e) {} }
    playing = synth;
  }, true);
}

function mount(rootEl) {
  install();
  for (const code of rootEl.querySelectorAll('pre > code.language-abc')) {
    const pre = code.parentElement; if (pre.dataset.mvDone) continue; pre.dataset.mvDone = '1';
    try { Score(pre, parseBlock(code.textContent)); }
    catch (e) { pre.after(el('div', 'mv-err', 'Music notation error: ' + esc(e.message))); }
  }
}

const api = { parseBlock, check, mount, PROGRAM };
if (typeof window !== 'undefined') window.MusicViewer = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();

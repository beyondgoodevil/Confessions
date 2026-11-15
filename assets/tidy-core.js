/* Cleaning up after a deleted note: one implementation, used by the Writer page (in the browser) and by
   tools/tidy.mjs (in Node), so both do exactly the same thing.
     CommonplaceTidy.unlink(raw, targets) -> { text, removed, unlinked, changed }
   `targets` are the deleted notes: [{ title, id, aliases: [], path }].
   - A list item that is only a link to a deleted note ("- [[Title]]" in Related lists, "3. [[Title]] — summary"
     in guides) is removed, and the numbered list it sat in is renumbered.
   - A "## Related" heading left with nothing under it is removed too.
   - A link inside a sentence becomes plain text: [[Title]] -> Title, [[Title|shown]] -> shown.
   - An embed of the note (![[Title]]) is removed.
   Front matter and fenced code are left alone. */
(function (root) {
  'use strict';
  const slug = s => String(s == null ? '' : s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/['’`]/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
  const base = p => String(p || '').split('/').pop().replace(/\.(md|markdown)$/i, '');

  function keysOf(targets) {
    const exact = new Set(), slugs = new Set();
    for (const t of targets) {
      for (const k of [t.title, t.id, base(t.path), ...(t.aliases || [])]) {
        const v = String(k == null ? '' : k).trim(); if (!v) continue;
        exact.add(v.toLowerCase()); const s = slug(v); if (s) slugs.add(s);
      }
    }
    return { exact, slugs };
  }

  function unlink(raw, targets) {
    const keys = keysOf(targets);
    const hits = t => { const v = String(t).trim(); return !!v && !/\.(png|jpe?g|gif|svg|webp|avif|bmp|pdf)$/i.test(v) && (keys.exact.has(v.toLowerCase()) || keys.slugs.has(slug(v))); };
    const text = String(raw), nl = text.includes('\r\n') ? '\r\n' : '\n';
    const lines = text.split(/\r?\n/);
    // where the body starts
    let start = 0;
    if (/^﻿?---[ \t]*$/.test(lines[0] || '')) { const e = lines.findIndex((l, i) => i > 0 && /^---[ \t]*$/.test(l)); if (e > 0) start = e + 1; }
    const LINK = /(!?)\[\[([^\[\]\n|#]+)(#[^\[\]\n|]*)?(?:\\?\|([^\[\]\n]*))?\]\]/g;
    // a list item that is nothing but a link to a deleted note, with an optional "— summary" after it
    const ITEM = /^(\s*)(?:[-*+]|(\d+)([.)]))\s+\[\[([^\[\]\n|#]+)(?:#[^\[\]\n|]*)?(?:\\?\|[^\[\]\n]*)?\]\]\s*(?:[—–:-]\s.*)?$/;
    let removed = 0, unlinked = 0, fence = false;
    const out = lines.slice(0, start), dropped = [];
    for (let i = start; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*(```|~~~)/.test(line)) { fence = !fence; out.push(line); continue; }
      if (fence) { out.push(line); continue; }
      const m = line.match(ITEM);
      if (m && hits(m[4])) {
        removed++; dropped.push(out.length);
        while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1]) && lines[i + 1].match(/^\s*/)[0].length > m[1].length && !/^\s*(?:[-*+]|\d+[.)])\s/.test(lines[i + 1])) i++;   // the item's own continuation lines
        continue;
      }
      out.push(line.replace(LINK, (all, bang, target, hash, shown) => {
        if (!hits(target)) return all;
        unlinked++;
        return bang ? '' : (shown && shown.trim()) || target.trim();
      }));
    }
    // renumber the numbered lists that lost an item: walk each contiguous run of "N. " items at the same indent
    if (removed) {
      const seen = new Set();
      for (const at of dropped) {
        let a = Math.min(at, out.length - 1);
        const numbered = l => (out[l] || '').match(/^(\s*)(\d+)([.)])(\s+)/);
        // find a numbered item next to the hole (above or at it)
        let probe = numbered(a) ? a : (numbered(a - 1) ? a - 1 : -1);
        if (probe < 0) continue;
        const indent = numbered(probe)[1];
        const inList = l => { const n = numbered(l); if (n && n[1] === indent) return true; return l < out.length && /^\s+\S/.test(out[l] || '') && (out[l].match(/^\s*/)[0].length > indent.length); };
        let top = probe; while (top - 1 >= start && inList(top - 1)) top--;
        if (seen.has(top)) continue; seen.add(top);
        let end = probe; while (end + 1 < out.length && inList(end + 1)) end++;
        const first = numbered(top); let n = first ? +first[2] : 1;
        if (first && +first[2] > 1 && top === Math.min(at, out.length - 1)) n = +first[2] - 1;   // the first item of the list was the one removed
        for (let l = top; l <= end; l++) { const k = numbered(l); if (k && k[1] === indent) { out[l] = out[l].replace(/^(\s*)\d+([.)])/, `$1${n}$2`); n++; } }
      }
      // a "## Related" (or similar) heading with nothing left under it
      for (let l = out.length - 1; l >= start; l--) {
        if (!/^##\s+(Related|See also)\s*$/i.test(out[l])) continue;
        let e = l + 1; while (e < out.length && !/^#{1,6}\s/.test(out[e])) e++;
        if (out.slice(l + 1, e).every(x => !x.trim())) { out.splice(l, e - l); while (l > start && l <= out.length && !(out[l - 1] || '').trim() && (l === out.length || !(out[l] || '').trim())) { out.splice(l - 1, 1); l--; } }
      }
    }
    if (!removed && !unlinked) return { text, removed: 0, unlinked: 0, changed: false };   // untouched files stay byte-for-byte the same
    let result = out.join(nl);
    if (removed || unlinked) result = result.replace(/[ \t]+(\r?\n)/g, '$1').replace(/(\r?\n){4,}/g, nl + nl + nl).replace(/\s*$/, nl);
    return { text: result, removed, unlinked, changed: result !== text };
  }

  root.CommonplaceTidy = { unlink, slug };
})(typeof globalThis !== 'undefined' ? globalThis : this);

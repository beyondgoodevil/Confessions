/* What to look at before a note is published, and the fixes that can be applied safely.
   One implementation, used by the Writer page (in the browser) and by tools/obsidian.mjs (in Node, for the
   Obsidian plugin), so both report the same things in the same words and fix them the same way.

     CommonplaceChecks.check(meta, ctx) -> [{ id, text, level, field?, line?, fix? }]
       meta: { title, tags: [], summary, body, path, source, draft, kind }      (body = the text under the front matter)
       ctx:  { linkExists(target) -> bool, titleTaken(title) -> bool }
       level: 'problem' (would show wrongly on the site) or 'warning' (a reminder)
       field: 'title' | 'tags' | 'summary' | 'source'      line: 0-based line of the body
       fix:  { id, label }  — apply with applyFix(); { id: 'related', ui: true } needs the related-notes picker
     CommonplaceChecks.applyFix(id, { title, summary, body }) -> the fields that change, e.g. { body: '…' }

   Add a check here and it appears in both places. */
(function (root) {
  'use strict';
  const UNNUMBERED = /^(related|references|footnotes|see also|sources|further reading|conclusion)$/i;
  const NUM_PREFIX = /^(\d+|[IVXLC]+)[.)]\s+/;
  const SMALL_WORDS = /^(a|an|and|as|at|but|by|for|from|if|in|into|is|nor|of|on|or|over|per|so|than|the|to|up|upon|via|vs|with|yet)$/i;

  // Every heading in the body with its line number, skipping fenced code.
  function headings(body) {
    const out = []; let fence = false;
    String(body).split('\n').forEach((line, i) => {
      if (/^\s*(```|~~~)/.test(line)) { fence = !fence; return; }
      const m = !fence && line.match(/^(#{1,6})[ \t]+(.+?)[ \t#]*$/);
      if (m) out.push({ level: m[1].length, text: m[2], line: i });
    });
    return out;
  }
  // The level a note's sections sit at: ### when it has two or more of those and fewer than two ## sections
  // (the house style: "### 1. Title", then "### Conclusion" and "## Related"), otherwise ##.
  function sectionLevel(hs) {
    const real = l => hs.filter(h => h.level === l && !UNNUMBERED.test(h.text.replace(NUM_PREFIX, ''))).length;
    return real(3) >= 2 && real(2) < 2 ? 3 : 2;
  }
  function numberSections(body, strip) {
    const lines = String(body).split('\n'), hs = headings(body), lvl = sectionLevel(hs); let n = 0;
    for (const h of hs) {
      if (h.level !== lvl) continue;
      const bare = h.text.replace(NUM_PREFIX, '');
      lines[h.line] = '#'.repeat(lvl) + ' ' + (strip || UNNUMBERED.test(bare) ? bare : `${++n}. ${bare}`);
    }
    return lines.join('\n');
  }
  // How the sections are numbered: { lvl, real (the headings that take a number), numbered (how many have one), inOrder }
  function numbering(body) {
    const hs = headings(body), lvl = sectionLevel(hs);
    const real = hs.filter(h => h.level === lvl && !UNNUMBERED.test(h.text.replace(NUM_PREFIX, '')));
    const nums = real.map(h => (h.text.match(/^(\d+)[.)]\s/) || [])[1]).map(x => x ? +x : null);
    return { lvl, real, numbered: nums.filter(x => x != null).length, inOrder: nums.every((x, i) => x === i + 1) };
  }
  const wikiLinks = body => [...String(body).matchAll(/(!?)\[\[([^\]\n|#]+)(?:#[^\]\n|]*)?(?:\\?\|[^\]\n]*)?\]\]/g)].filter(m => !m[1]).map(m => m[2].trim());
  // Splits the body into what comes before "## Related", the titles listed there, and anything after it.
  function splitRelated(body) {
    const hs = headings(body), lines = String(body).split('\n');
    const i = hs.findIndex(h => h.level === 2 && /^related$/i.test(h.text.replace(NUM_PREFIX, '')));
    if (i < 0) return { before: String(body).replace(/\s+$/, ''), listed: [], after: '', has: false };
    const start = hs[i].line, next = hs.slice(i + 1).find(h => h.level <= 2), end = next ? next.line : lines.length;
    return { before: lines.slice(0, start).join('\n').replace(/\s+$/, ''), listed: wikiLinks(lines.slice(start, end).join('\n')), after: lines.slice(end).join('\n').replace(/\s+$/, ''), has: true };
  }
  const titleCase = t => String(t).split(/(\s+)/).map((w, i) => /^[a-z]/.test(w) && (i === 0 || !SMALL_WORDS.test(w)) ? w[0].toUpperCase() + w.slice(1) : w).join('');
  // The opening paragraph as plain text, cut at a sentence end: a starting point for the summary.
  function firstParagraph(body) {
    const para = String(body).split(/\n\s*\n/).map(x => x.trim()).find(x => x && !/^(#|>|\||```|~~~|[-*+]\s|\d+[.)]\s|!\[)/.test(x)) || '';
    let t = para.replace(/!?\[\[([^\]|]+\|)?([^\]]+)\]\]/g, '$2').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_=`]+/g, '').replace(/\$+/g, '').replace(/\s+/g, ' ').trim();
    if (t.length > 300) { const cut = t.slice(0, 300), dot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? ')); t = dot > 80 ? cut.slice(0, dot + 1) : cut.replace(/\s+\S*$/, '') + '…'; }
    return t;
  }
  const words = body => String(body).trim().split(/\s+/).filter(Boolean).length;

  function check(meta, ctx) {
    ctx = ctx || {};
    const out = [], body = meta.body || '', hs = headings(body), tags = meta.tags || [], n = words(body);
    const lineOf = re => { const i = body.split('\n').findIndex(l => re.test(l)); return i < 0 ? null : i; };
    const add = (id, level, text, o) => out.push(Object.assign({ id, level, text }, o || {}));
    const isGuide = /^notes\/guides\//.test(meta.path || '') || tags.includes('guide');

    if (!meta.title) add('no-title', 'warning', 'The note has no title.', { field: 'title' });
    else {
      const w = meta.title.split(/\s+/), bad = w.filter((x, i) => /^[a-z]/.test(x) && (i === 0 || !SMALL_WORDS.test(x)));
      if (bad.length) add('title-case', 'warning', `Title isn't in title case (“${bad[0]}”).`, { field: 'title', fix: { id: 'title-case', label: 'Capitalise it' } });
      if (ctx.titleTaken && ctx.titleTaken(meta.title)) add('title-taken', 'problem', 'Another note already has this title, so links to it will be ambiguous.', { field: 'title' });
      if (/^notes\/guides\//.test(meta.path || '') && !/^guide:\s/i.test(meta.title)) add('guide-prefix', 'warning', 'Guide titles start with “Guide: ”, like the others.', { field: 'title', fix: { id: 'guide-prefix', label: 'Add it' } });
    }
    if (!tags.length) add('no-tags', 'warning', 'No tags.', { field: 'tags' });
    if (!meta.summary) add('no-summary', 'warning', 'No summary. It is what shows under the title in lists and guides.', { field: 'summary', fix: firstParagraph(body) ? { id: 'draft-summary', label: 'Draft it from the first paragraph' } : null });
    if (meta.kind === 'misc' && meta.source === '') add('no-source', 'warning', 'No source. Miscellany notes say there what they draw on.', { field: 'source' });
    if (meta.draft) add('draft', 'warning', 'Marked as a draft: it is saved to GitHub but not shown on the site.');

    if (ctx.linkExists) {
      const missing = [...new Set(wikiLinks(body).filter(t => !ctx.linkExists(t)))];
      if (missing.length) add('missing-links', 'warning', `Links to notes that don't exist: ${missing.slice(0, 4).map(t => `“${t}”`).join(', ')}${missing.length > 4 ? ` and ${missing.length - 4} more` : ''}.`,
        { line: lineOf(new RegExp('\\[\\[' + missing[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) });
    }
    if (/\[\[\s*\]\]/.test(body)) add('empty-link', 'warning', 'An empty [[ ]] link is left in the note.', { line: lineOf(/\[\[\s*\]\]/) });
    if (hs.some(h => h.level === 1)) add('h1', 'warning', 'A single # heading repeats the title. Use ## for sections.', { line: hs.find(h => h.level === 1).line, fix: { id: 'h1-to-h2', label: 'Make it ##' } });

    const nb = numbering(body);
    if (!isGuide && n > 120 && nb.real.length < 2) add('no-sections', 'problem', 'No contents box: the note needs two or more “### 1. …” sections.');
    if (nb.numbered && (!nb.inOrder || nb.numbered < nb.real.length)) add('numbering', 'warning', 'Section numbers are out of order.', { line: nb.real[0].line, fix: { id: 'renumber', label: 'Renumber' } });
    if (!isGuide && n > 250 && nb.real.length >= 2 && !hs.some(h => /^conclusion$/i.test(h.text.replace(NUM_PREFIX, '')))) add('no-conclusion', 'warning', 'No Conclusion section.', { fix: { id: 'add-conclusion', label: 'Add the heading' } });
    if (!isGuide && n > 80 && !hs.some(h => /^related$/i.test(h.text.replace(NUM_PREFIX, '')))) add('no-related', 'warning', 'No Related list.', { fix: { id: 'related', label: 'Suggest one…', ui: true } });
    return out;
  }

  // Returns only the fields that change.
  function applyFix(id, f) {
    const body = String(f.body || ''), title = String(f.title || '');
    if (id === 'title-case') return { title: titleCase(title) };
    if (id === 'guide-prefix') return { title: /^guide:\s/i.test(title) ? title : 'Guide: ' + title };
    if (id === 'draft-summary') return { summary: firstParagraph(body) };
    if (id === 'h1-to-h2') { const ls = body.split('\n'); for (const h of headings(body)) if (h.level === 1) ls[h.line] = '#' + ls[h.line]; return { body: ls.join('\n') }; }
    if (id === 'renumber') return { body: numberSections(body, false) };
    if (id === 'add-conclusion') {
      const lvl = numbering(body).lvl, r = splitRelated(body), head = '#'.repeat(lvl) + ' Conclusion';
      return { body: r.before + '\n\n' + head + '\n\n' + (r.has ? '\n## Related\n\n' + r.listed.map(t => `- [[${t}]]`).join('\n') : '') + (r.after ? '\n\n' + r.after : '') + '\n', caret: head };
    }
    return {};
  }

  root.CommonplaceChecks = { check, applyFix, headings, sectionLevel, numberSections, numbering, wikiLinks, splitRelated, titleCase, firstParagraph, words, UNNUMBERED, NUM_PREFIX, SMALL_WORDS };
})(typeof globalThis !== 'undefined' ? globalThis : this);

// Renders notes to HTML at build time with the site's own code (assets/app.js running in jsdom), so the page
// the build writes for a note is exactly what the browser would draw. Needs the packages in package.json
// (npm install); without them makeRenderer() returns null and the build falls back to forwarding pages.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

export async function makeRenderer(cfg, notes, files) {
  let JSDOM, libs;
  const lib = p => fs.readFileSync(path.join(ROOT, 'node_modules', p), 'utf8');   // read by path: some packages don't export their browser builds
  try { ({ JSDOM } = await import('jsdom')); libs = [lib('marked/marked.min.js'), lib('js-yaml/dist/js-yaml.min.js'), lib('dompurify/dist/purify.min.js')]; }
  catch { return null; }
  const dom = new JSDOM('<!doctype html><html lang="en"><head></head><body></body></html>', { url: 'https://notebook.invalid/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.COMMONPLACE_LIBRARY = true;
  for (const code of libs) w.eval(code);
  w.eval(fs.readFileSync(path.join(ROOT, 'assets', 'app.js'), 'utf8'));
  const C = w.Commonplace;
  C.S.files = new Map((files || []).flatMap(f => [[f.toLowerCase(), f], [f.replace(/^notes\//, '').toLowerCase(), f], [f.split('/').pop().toLowerCase(), f]]));
  C.index(cfg, notes);
  const ids = new Set(C.S.notes.filter(n => n.explicitId).map(n => n.id));
  // in the written page, links to other notes are real addresses (the app turns them back into quick in-page moves)
  const realLinks = html => html.replace(/href="#\/([A-Za-z]+-\d+)(?:\/([^"?]*))?(?:\?[^"]*)?"/g, (all, id, anchor) => ids.has(id.toUpperCase()) ? `href="${id.toUpperCase()}/${anchor ? '#' + anchor : ''}"` : all);
  return {
    has: id => ids.has(id),
    // the whole <body> content for a note's page: top bar, then the note
    page(id) { const n = C.S.byId.get(id); return n ? realLinks(C.shellHTML(C.viewNote(n))) : null; },
    close() { w.close(); }
  };
}

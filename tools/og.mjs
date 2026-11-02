// Preview cards: a 1200×630 picture for each entry (section, address, title, site name), shown when a note's
// link is pasted into a chat or a post. Drawn with resvg in the site's own font (STIX Two, SIL Open Font Licence,
// tools/og-fonts/). If resvg isn't installed (npm install), the build simply skips the pictures.
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT } from './lib.mjs';

const require = createRequire(import.meta.url);
let Resvg = null;
try { ({ Resvg } = require('@resvg/resvg-js')); } catch { /* not installed: no pictures */ }
export const canDrawCards = () => !!Resvg;

const W = 1200, H = 630, FONT = path.join(ROOT, 'tools', 'og-fonts', 'STIXTwoText.ttf');
const xml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

// break the title into lines that fit, judging width by an average letter (close enough for a serif face)
function wrap(text, size, maxWidth, maxLines) {
  const per = Math.floor(maxWidth / (size * 0.47)), words = text.split(/\s+/), lines = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= per) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { const kept = lines.slice(0, maxLines); kept[maxLines - 1] = kept[maxLines - 1].replace(/[\s,;:.]*\S*$/, '') + '…'; return kept; }
  return lines;
}

export function drawCard({ id, title, label, site }) {
  if (!Resvg) return null;
  const size = title.length <= 45 ? 74 : title.length <= 90 ? 62 : 52, lh = size * 1.18;
  const lines = wrap(title, size, 1000, 4);
  const block = lines.length * lh, top = (H - block) / 2 + size * 0.82 + 10;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="#D9DCE1" stroke-width="2"/>
  <text x="${W / 2}" y="98" text-anchor="middle" font-family="STIX Two Text" font-size="30" letter-spacing="3" fill="#5A606B">${xml(label.toUpperCase())}  ·  ${xml(id)}</text>
  ${lines.map((l, i) => `<text x="${W / 2}" y="${(top + i * lh).toFixed(1)}" text-anchor="middle" font-family="STIX Two Text" font-size="${size}" fill="#16181D">${xml(l)}</text>`).join('\n  ')}
  <line x1="${W / 2 - 60}" y1="${H - 120}" x2="${W / 2 + 60}" y2="${H - 120}" stroke="#1D4BA0" stroke-width="3"/>
  <text x="${W / 2}" y="${H - 72}" text-anchor="middle" font-family="STIX Two Text" font-size="32" font-style="italic" fill="#30343B">${xml(site)}</text>
</svg>`;
  return new Resvg(svg, { font: { fontFiles: [FONT], loadSystemFonts: false, defaultFontFamily: 'STIX Two Text' }, fitTo: { mode: 'width', value: W } }).render().asPng();
}

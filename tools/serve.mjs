// Local preview: node tools/serve.mjs   then open http://localhost:8000
// Notes are re-read on every page load, and an open page reloads itself (keeping its place)
// whenever a note, config.json or the site's own files change.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, collectNotes, collectLibrary } from './build.mjs';
import { loadConfig } from './lib.mjs';

const PORT = Number(process.env.PORT) || 8000;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.md': 'text/markdown',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.pdf': 'application/pdf' };

// live reload: pages listen on /__reload and are told when something they show has changed
const listeners = new Set();
let pending = null;
const changed = () => { clearTimeout(pending); pending = setTimeout(() => { for (const res of listeners) res.write('data: reload\n\n'); }, 200); };
for (const target of ['notes', 'assets', 'library', 'config.json', 'index.html']) {
  try { fs.watch(path.join(ROOT, target), { recursive: true }, changed).on('error', () => {}); } catch { /* no file watching here: refresh by hand */ }
}
const RELOAD = '<script>new EventSource("/__reload").onmessage = () => location.reload();</script>';

http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (url === '/__reload') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
    res.write(': listening\n\n'); listeners.add(res); req.on('close', () => listeners.delete(res));
    return;
  }
  if (url === '/notes.json') {
    try { loadConfig(); } catch (e) { res.writeHead(500); return res.end(e.message); }
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    return res.end(JSON.stringify(collectNotes({ withGit: false })));
  }
  if (url === '/library.json') {
    let lib; try { lib = collectLibrary({ withGit: false }); } catch (e) { res.writeHead(500); return res.end(e.message); }
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    return res.end(JSON.stringify(lib));
  }
  const file = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
  res.setHeader('content-type', TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream'); res.setHeader('cache-control', 'no-store');
  if (file === path.join(ROOT, 'index.html')) return res.end(fs.readFileSync(file, 'utf8').replace('</body>', RELOAD + '\n</body>'));
  // byte ranges, so the PDF reader can fetch only the pages it shows (GitHub Pages does the same)
  const size = fs.statSync(file).size, range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range && (range[1] || range[2])) {
    const start = range[1] ? +range[1] : Math.max(0, size - +range[2]), end = range[1] && range[2] ? Math.min(+range[2], size - 1) : size - 1;
    if (start >= size || start > end) { res.writeHead(416, { 'content-range': `bytes */${size}` }); return res.end(); }
    res.statusCode = 206; res.setHeader('content-range', `bytes ${start}-${end}/${size}`); res.setHeader('content-length', end - start + 1); res.setHeader('accept-ranges', 'bytes');
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.setHeader('content-length', size); res.setHeader('accept-ranges', 'bytes');
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Previewing at http://localhost:${PORT}  (Ctrl+C to stop; the page reloads when you save a note)`));

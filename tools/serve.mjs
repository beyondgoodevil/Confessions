// Local preview: node tools/serve.mjs   then open http://localhost:8000
// Notes are re-read on every page load, and an open page reloads itself (keeping its place)
// whenever a note, config.json or the site's own files change.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, collectNotes } from './build.mjs';
import { loadConfig } from './lib.mjs';

const PORT = Number(process.env.PORT) || 8000;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.md': 'text/markdown',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.pdf': 'application/pdf' };

// live reload: pages listen on /__reload and are told when something they show has changed
const listeners = new Set();
let pending = null;
const changed = () => { clearTimeout(pending); pending = setTimeout(() => { for (const res of listeners) res.write('data: reload\n\n'); }, 200); };
for (const target of ['notes', 'assets', 'config.json', 'index.html']) {
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
  const file = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
  if (file === path.join(ROOT, 'index.html')) return res.end(fs.readFileSync(file, 'utf8').replace('</body>', RELOAD + '\n</body>'));
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Previewing at http://localhost:${PORT}  (Ctrl+C to stop; the page reloads when you save a note)`));

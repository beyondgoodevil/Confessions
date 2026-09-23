// Local preview: node tools/serve.mjs   then open http://localhost:8000
// Notes are re-read on every page load, so edit, save, refresh.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, collectNotes } from './build.mjs';

const PORT = Number(process.env.PORT) || 8000;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.md': 'text/markdown',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.pdf': 'application/pdf' };

http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (url === '/notes.json') {
    try { JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8')); }
    catch (e) { res.writeHead(500); return res.end('config.json is not valid JSON: ' + e.message); }
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    return res.end(JSON.stringify(collectNotes({ withGit: false })));
  }
  const file = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Previewing at http://localhost:${PORT}  (Ctrl+C to stop)`));

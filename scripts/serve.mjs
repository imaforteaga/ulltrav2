// Tiny static server that mimics GitHub Pages: the site lives under /ultra/ (a sub-path), so any absolute
// path hiding in the code would break here exactly as it would in production.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const BASE = '/ultra/';

export function startServer(port = 0) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x'); let p = decodeURIComponent(url.pathname);
    if (p === '/') { res.writeHead(302, { Location: BASE }); return res.end(); }
    if (!p.startsWith(BASE)) { res.writeHead(404); return res.end('not found'); }
    p = p.slice(BASE.length) || 'index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => server.listen(port, '127.0.0.1', () => r({ server, url: `http://127.0.0.1:${server.address().port}${BASE}` })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { url } = await startServer(Number(process.env.PORT) || 8080);
  console.log('Ultra en ' + url);
}

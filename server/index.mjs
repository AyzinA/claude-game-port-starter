/** Production static shell + local file routes. Intended for loopback/Docker-local use. */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleLibraryRequest } from './library.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(projectRoot, 'dist');
const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 5317);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json; charset=utf-8' };

createServer(async (req, res) => {
  try {
    if (await handleLibraryRequest(req, res, projectRoot)) return;
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
    const raw = new URL(req.url ?? '/', 'http://localhost').pathname;
    const segments = raw.split('/').filter(Boolean).map(s => decodeURIComponent(s));
    if (segments.some(s => s.startsWith('.') || s === '..' || s.includes('\\') || s.includes('/') || s.includes(':'))) {
      res.writeHead(400); res.end(); return;
    }
    let target = path.join(dist, ...segments);
    if (segments.length === 0) target = path.join(dist, 'index.html');
    let info;
    try { info = await stat(target); }
    catch (e) { if (e.code !== 'ENOENT') throw e; res.writeHead(404); res.end(); return; }
    if (!info.isFile() || !(await realpath(target)).startsWith((await realpath(dist)) + path.sep)) {
      res.writeHead(404); res.end(); return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] ?? 'application/octet-stream', 'Content-Length': info.size, 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') { res.end(); return; }
    createReadStream(target).pipe(res);
  } catch (e) { res.writeHead(500); res.end('Internal server error'); console.error(e); }
}).listen(port, host, () => console.log(`Game Port Lab on http://${host}:${port} (local-only; do not publish publicly)`));

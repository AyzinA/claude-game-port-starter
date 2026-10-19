/** Local-only, read-only game/mod library. Shared by Vite and the production server.
 * This is not an authenticated public file hosting service. Never deploy it to a public interface.
 */
import { createReadStream } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export const MAX_INDEXED_FILES = 40_000;
const ID = /^[a-z0-9][a-z0-9_-]{1,63}$/i;
const EXECUTABLE = /\.(?:exe|dll|so|dylib|js|mjs|cjs|html?|wasm|bat|cmd|sh|ps1)$/i;
const JSON_LIMIT = 8192;

function parseSafeSegments(value) {
  // Decode once, rejecting encoded separators, dot segments and control chars.
  const parts = value.split('/');
  if (!parts.length || parts.some(p => !p)) throw new Error('Invalid path');
  return parts.map(part => {
    const s = decodeURIComponent(part);
    if (s === '.' || s === '..' || s.startsWith('.') || s.includes('/') || s.includes('\\') || s.includes(':') || /[\x00-\x1f\x7f]/.test(s)) {
      throw new Error('Unsafe file path');
    }
    return s;
  });
}
function urlPath(parts) { return parts.map(s => encodeURIComponent(s)).join('/'); }
function isAllowedFile(name) { return !name.startsWith('.') && !EXECUTABLE.test(name); }
async function walkFiles(root, maxFiles = MAX_INDEXED_FILES) {
  const files = [];
  const todo = [{ abs: root, relative: [] }];
  while (todo.length) {
    const node = todo.pop();
    let entries;
    try { entries = await readdir(node.abs, { withFileTypes: true }); }
    catch (e) { if (e.code === 'ENOENT') continue; throw e; }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (!isAllowedFile(entry.name) || entry.isSymbolicLink()) continue;
      const segments = [...node.relative, entry.name];
      if (entry.isDirectory()) todo.push({ abs: path.join(node.abs, entry.name), relative: segments });
      else if (entry.isFile()) {
        if (files.length >= maxFiles) throw new Error(`More than ${maxFiles} files; increase the configured indexing cap`);
        const info = await stat(path.join(node.abs, entry.name));
        files.push({ path: segments.join('/'), size: info.size, segments });
      }
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}
async function smallJson(filename) {
  const info = await stat(filename);
  if (info.size > JSON_LIMIT) throw new Error('Manifest exceeds 8 KiB');
  return JSON.parse(await readFile(filename, 'utf8'));
}
function normalizedGameMeta(data) {
  const id = data?.id ?? 'local-game';
  const name = data?.name ?? 'Preloaded game';
  if (typeof id !== 'string' || !ID.test(id)) throw new Error('Invalid public/game/game.json id');
  if (typeof name !== 'string' || !name.trim() || name.length > 128) throw new Error('Invalid game name');
  return { id, name };
}
function normalizedModMeta(data) {
  if (!data || typeof data !== 'object' || !ID.test(data.id) || !ID.test(data.targetGame) ||
      typeof data.name !== 'string' || !data.name.trim() || data.name.length > 128 ||
      typeof data.version !== 'string' || !data.version || data.version.length > 64) throw new Error('Invalid mod manifest');
  const priority = data.priority ?? 300;
  if (!Number.isInteger(priority) || priority < 300 || priority > 1000) throw new Error('Mod priority must be 300–1000');
  return { id: data.id, name: data.name, targetGame: data.targetGame, version: data.version, priority };
}

export async function indexLibrary(projectRoot = process.cwd()) {
  const gameRoot = path.join(projectRoot, 'public', 'game');
  const modRoot = path.join(projectRoot, 'public', 'mods');
  const warnings = [];
  let meta = { id: 'local-game', name: 'Preloaded game' };
  try { meta = normalizedGameMeta(await smallJson(path.join(gameRoot, 'game.json'))); }
  catch (e) { if (e.code !== 'ENOENT') warnings.push(`game.json: ${e.message}`); }
  const indexed = await walkFiles(gameRoot);
  const gameFiles = indexed.filter(f => f.path !== 'game.json' && f.path !== 'README.md')
    .map(f => ({ path: f.path, size: f.size, url: `/api/local-library/file/game/${urlPath(f.segments)}` }));
  const game = gameFiles.length ? { ...meta, files: gameFiles } : null;
  const mods = [];
  let items = [];
  try { items = await readdir(modRoot, { withFileTypes: true }); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
  items.sort((a, b) => a.name.localeCompare(b.name));
  for (const item of items) {
    if (item.name.startsWith('.') || item.isSymbolicLink()) continue;
    if (item.isFile() && item.name.toLowerCase().endsWith('.zip')) {
      const file = path.join(modRoot, item.name);
      const size = (await stat(file)).size;
      if (size > 30 * 1024 * 1024) { warnings.push(`${item.name}: ZIP exceeds 30 MiB preview limit`); continue; }
      mods.push({ kind: 'zip', name: item.name, url: `/api/local-library/zip/${encodeURIComponent(item.name)}`, size });
      continue;
    }
    if (!item.isDirectory() || !ID.test(item.name)) continue;
    try {
      const manifest = normalizedModMeta(await smallJson(path.join(modRoot, item.name, 'mod.json')));
      const entries = (await walkFiles(path.join(modRoot, item.name, 'assets'), 1200))
        .filter(f => f.path !== 'README.md')
        .map(f => ({ path: f.path, size: f.size, url: `/api/local-library/file/mod/${encodeURIComponent(item.name)}/assets/${urlPath(f.segments)}` }));
      mods.push({ kind: 'folder', manifest, files: entries });
    } catch (e) { warnings.push(`${item.name}: ${e.message}`); }
  }
  return { game, mods, warnings };
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}

/** Returns true if handled. GET/HEAD only. Recheck file type/path on every request. */
export async function handleLibraryRequest(req, res, projectRoot = process.cwd()) {
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
  if (!pathname.startsWith('/api/local-library')) return false;
  if (req.method !== 'GET' && req.method !== 'HEAD') { sendJson(res, { error: 'Method not allowed' }, 405); return true; }
  if (pathname === '/api/local-library') {
    try { sendJson(res, await indexLibrary(projectRoot)); }
    catch (e) { sendJson(res, { error: 'Index failed', detail: e.message }, 500); }
    return true;
  }
  let root;
  let parts;
  try {
    let raw;
    if (pathname.startsWith('/api/local-library/file/game/')) {
      root = path.join(projectRoot, 'public', 'game');
      raw = pathname.slice('/api/local-library/file/game/'.length);
    } else if (pathname.startsWith('/api/local-library/file/mod/')) {
      const rawMod = pathname.slice('/api/local-library/file/mod/'.length);
      const pos = rawMod.indexOf('/assets/');
      if (pos < 0) throw new Error('Invalid mod file path');
      const [modId] = parseSafeSegments(rawMod.slice(0, pos));
      if (!ID.test(modId)) throw new Error('Invalid mod');
      root = path.join(projectRoot, 'public', 'mods', modId, 'assets');
      raw = rawMod.slice(pos + '/assets/'.length);
    } else if (pathname.startsWith('/api/local-library/zip/')) {
      root = path.join(projectRoot, 'public', 'mods');
      raw = pathname.slice('/api/local-library/zip/'.length);
      parts = parseSafeSegments(raw);
      if (parts.length !== 1 || !parts[0].toLowerCase().endsWith('.zip')) throw new Error('Invalid zip');
    } else throw new Error('Unknown resource route');
    parts ??= parseSafeSegments(raw);
    if (!parts.every(isAllowedFile)) throw new Error('Executable content not served');
    // lstat each path component to reject symlinks, including race-safe final realpath check.
    let absolute = root;
    const { lstat, realpath } = await import('node:fs/promises');
    for (const segment of parts) {
      absolute = path.join(absolute, segment);
      const s = await lstat(absolute);
      if (s.isSymbolicLink()) throw new Error('Symlink rejected');
    }
    const realRoot = await realpath(root);
    const realFile = await realpath(absolute);
    if (!realFile.startsWith(realRoot + path.sep)) throw new Error('Outside library');
    const info = await stat(realFile);
    if (!info.isFile()) throw new Error('Not a file');
    const headers = {
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Accept-Ranges': 'bytes',
    };
    let start = 0;
    let end = info.size - 1;
    let status = 200;
    if (req.headers.range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
      if (!match) { res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); res.end(); return true; }
      start = Number(match[1]);
      end = match[2] ? Number(match[2]) : end;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || end >= info.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); res.end(); return true;
      }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    }
    headers['Content-Length'] = status === 206 ? end - start + 1 : info.size;
    res.writeHead(status, headers);
    if (req.method === 'HEAD' || info.size === 0) { res.end(); return true; }
    const stream = createReadStream(realFile, { start, end });
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  } catch (e) { sendJson(res, { error: 'File unavailable' }, e.code === 'ENOENT' ? 404 : 400); }
  return true;
}

export function localLibraryMiddleware(projectRoot) {
  return (req, res, next) => {
    handleLibraryRequest(req, res, projectRoot).then(handled => { if (!handled) next(); }).catch(next);
  };
}

import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import path from 'node:path';
import { handleLibraryRequest, indexLibrary } from './library.mjs';

const temp = await mkdtemp(path.join(tmpdir(), 'game-port-test-'));
let server;
let base;
before(async () => {
  const game = path.join(temp, 'public/game');
  const mod = path.join(temp, 'public/mods/sky-pack');
  await mkdir(path.join(game, 'Data'), { recursive: true });
  await mkdir(path.join(mod, 'assets/Data'), { recursive: true });
  await writeFile(path.join(game, 'game.json'), JSON.stringify({ id: 'example', name: 'Example' }));
  await writeFile(path.join(game, 'Data/texture.bin'), Buffer.from('BASE'));
  await writeFile(path.join(game, 'game.exe'), Buffer.from('NATIVE'));
  await writeFile(path.join(mod, 'mod.json'), JSON.stringify({ id: 'sky-pack', name: 'Sky', version: '1', targetGame: 'example' }));
  await writeFile(path.join(mod, 'assets/Data/texture.bin'), Buffer.from('MOD'));
  server = createServer(async (req, res) => {
    if (!(await handleLibraryRequest(req, res, temp))) { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); await rm(temp, { recursive: true, force: true }); });

test('auto-indexes game and compatible folder mod without executable files', async () => {
  const data = await indexLibrary(temp);
  assert.equal(data.game.id, 'example');
  assert.deepEqual(data.game.files.map(f => f.path), ['Data/texture.bin']);
  assert.equal(data.mods[0].manifest.id, 'sky-pack');
  assert.deepEqual(data.mods[0].files.map(f => f.path), ['Data/texture.bin']);
});

test('serves lazy game files, mod assets and ranges', async () => {
  const response = await fetch(base + '/api/local-library');
  const data = await response.json();
  assert.equal(data.game.files.length, 1);
  const original = await fetch(base + data.game.files[0].url);
  assert.equal(await original.text(), 'BASE');
  const mod = await fetch(base + data.mods[0].files[0].url);
  assert.equal(await mod.text(), 'MOD');
  const range = await fetch(base + data.game.files[0].url, { headers: { Range: 'bytes=1-2' } });
  assert.equal(range.status, 206);
  assert.equal(await range.text(), 'AS');
});

test('rejects traversal, executable files and dotfiles', async () => {
  const bad = [
    '/api/local-library/file/game/game.exe',
    '/api/local-library/file/game/%2e%2e%2fprivate',
    '/api/local-library/file/game/%2e%2e/private',
    '/api/local-library/file/game/.hidden',
  ];
  for (const target of bad) {
    const r = await fetch(base + target);
    assert.notEqual(r.status, 200, target);
  }
});

test('empty public/game still discovers public/mods for manual game import', async () => {
  const emptyRoot = path.join(temp, 'empty-game-case');
  await mkdir(path.join(emptyRoot, 'public/game'), { recursive: true });
  await mkdir(path.join(emptyRoot, 'public/mods'), { recursive: true });
  await writeFile(path.join(emptyRoot, 'public/game/README.md'), 'No game files yet');
  await writeFile(path.join(emptyRoot, 'public/mods/example.zip'), Buffer.from('ZIP placeholder'));
  const index = await indexLibrary(emptyRoot);
  assert.equal(index.game, null);
  assert.deepEqual(index.mods.map(mod => [mod.kind, mod.name]), [['zip', 'example.zip']]);
});

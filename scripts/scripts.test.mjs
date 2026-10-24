import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { decide } from './lib/autopilot.mjs';
import { fingerprintEngines, inventory, listZipEntries, renderInventoryMarkdown, sniff } from './lib/fingerprint.mjs';
import { parsePlaythroughMap, summarize, TEMPLATE_MARKER } from './lib/playthrough.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const temp = await mkdtemp(path.join(tmpdir(), 'game-port-scripts-'));
after(() => rm(temp, { recursive: true, force: true }));

test('sniffs common game container and media signatures', () => {
  assert.equal(sniff(Buffer.from('UnityFS\0 5.x.x')).id, 'unityfs');
  assert.equal(sniff(Buffer.from('GDPC\x01\0\0\0')).id, 'gdpc');
  assert.equal(sniff(Buffer.from('OggS\0\x02')).id, 'ogg');
  assert.equal(sniff(Buffer.from('RIFF\0\0\0\0WAVEfmt ')).id, 'wav');
  assert.equal(sniff(Buffer.from('FORM\0\0\0\0GEN8')).id, 'iff-form');
  assert.equal(sniff(Buffer.from([0x00, 0x00, 0x00])), null);
});

test('fingerprints engines from paths, including entries inside packages', () => {
  const unity = fingerprintEngines(['unityplayer.dll', 'mygame_data/globalgamemanagers', 'mygame_data/managed/assembly-csharp.dll']);
  assert.equal(unity[0].engine, 'Unity');
  assert.match(unity[0].evidence.join(' '), /Mono build/);
  const apk = fingerprintEngines(['game.apk', 'game.apk!/androidmanifest.xml', 'game.apk!/lib/arm64-v8a/libyoyo.so', 'game.apk!/assets/game.droid']);
  assert.equal(apk[0].engine, 'GameMaker');
  assert.ok(apk.some(e => e.engine === 'Android package'));
});

test('lists ZIP central directory names without extracting', async () => {
  const names = await listZipEntries(path.join(here, '..', 'examples', 'demo-data-mod.zip'));
  assert.deepEqual(names.sort(), ['assets/demo/example-data.json', 'mod.json']);
});

test('inventory summarizes a tree with relative paths only', async () => {
  const game = path.join(temp, 'install');
  await mkdir(path.join(game, 'MyGame_Data'), { recursive: true });
  await writeFile(path.join(game, 'UnityPlayer.dll'), Buffer.from('MZ'));
  await writeFile(path.join(game, 'MyGame_Data', 'globalgamemanagers'), Buffer.from('x'));
  await writeFile(path.join(game, 'MyGame_Data', 'music.ogg'), Buffer.from('OggS\0'));
  const report = await inventory(game);
  assert.equal(report.fileCount, 3);
  assert.equal(report.engines[0].engine, 'Unity');
  const md = renderInventoryMarkdown(report);
  assert.ok(!md.includes(temp), 'absolute root must not leak into the report');
  assert.match(md, /Ogg/);
});

const map = (rows, template = false) => `${template ? TEMPLATE_MARKER : ''}
# Map
## Front-end
| ID | Kind | Name | Depends on | Status | Verification |
|---|---|---|---|---|---|
${rows.map(([id, status]) => `| ${id} | menu | Screen ${id} | UI | ${status} | — |`).join('\n')}
`;

test('parses playthrough map and picks in-progress before todo', () => {
  const summary = summarize(parsePlaythroughMap(map([['FE-01', 'verified'], ['FE-02', 'todo'], ['GP-01', 'in-progress'], ['GP-02', 'n/a']])));
  assert.equal(summary.initialized, true);
  assert.equal(summary.total, 4);
  assert.equal(summary.remaining, 2);
  assert.equal(summary.next.id, 'GP-01');
  assert.deepEqual(summary.problems, []);
});

test('flags unknown statuses and recognizes the template', () => {
  const parsed = parsePlaythroughMap(map([['FE-01', 'done?']], true));
  assert.equal(summarize(parsed).initialized, false);
  assert.match(parsed.problems[0], /unknown status/);
});

test('autopilot blocks only while enabled, unpaused and progressing', () => {
  const summary = summarize(parsePlaythroughMap(map([['FE-01', 'verified'], ['FE-02', 'todo']])));
  assert.equal(decide({ state: { enabled: false }, summary, paused: false }).block, false);
  assert.equal(decide({ state: { enabled: true }, summary, paused: true }).block, false);
  const first = decide({ state: { enabled: true }, summary, paused: false });
  assert.equal(first.block, true);
  assert.match(first.reason, /FE-02/);
  let state = first.state;
  for (let i = 0; i < 2; i++) state = decide({ state, summary, paused: false }).state;
  const stalled = decide({ state, summary, paused: false });
  assert.equal(stalled.block, false);
  assert.match(stalled.why, /no playthrough node changed/);
  assert.equal(decide({ state: { enabled: true, continuations: 40 }, summary, paused: false }).block, false);
  const done = decide({ state: { enabled: true }, summary: summarize(parsePlaythroughMap(map([['FE-01', 'verified']]))), paused: false });
  assert.equal(done.block, false);
  assert.equal(done.state.enabled, false);
});

test('stop hook end to end: blocks with JSON, persists state, silent when disabled', async () => {
  const project = path.join(temp, 'project-root');
  await mkdir(path.join(project, 'project', 'private'), { recursive: true });
  await writeFile(path.join(project, 'project', 'PLAYTHROUGH_MAP.md'), map([['FE-01', 'todo']]));
  const hook = path.join(here, '..', '.claude', 'hooks', 'autopilot-stop.mjs');
  const run = () => promisify(execFile)(process.execPath, [hook], { env: { ...process.env, CLAUDE_PROJECT_DIR: project } });
  assert.equal((await run()).stdout, '');
  await writeFile(path.join(project, 'project', 'private', 'autopilot.json'), JSON.stringify({ enabled: true }));
  const out = JSON.parse((await run()).stdout);
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /FE-01/);
  const saved = JSON.parse(await readFile(path.join(project, 'project', 'private', 'autopilot.json'), 'utf8'));
  assert.equal(saved.continuations, 1);
});

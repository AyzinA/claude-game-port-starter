#!/usr/bin/env node
/** Claude Code Stop hook. While autopilot is enabled (project/private/autopilot.json) and project/PLAYTHROUGH_MAP.md
 * still has unfinished nodes, it blocks the stop and tells the agent which node to continue with.
 * Off by default; never blocks when paused, when the map is a template, after the budget, or when progress stalls.
 * Any error lets Claude stop normally. */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.CLAUDE_PROJECT_DIR ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const statePath = path.join(root, 'project', 'private', 'autopilot.json');

try {
  const { decide } = await import(new URL('../../scripts/lib/autopilot.mjs', import.meta.url).href);
  const { parsePlaythroughMap, summarize } = await import(new URL('../../scripts/lib/playthrough.mjs', import.meta.url).href);
  if (!existsSync(statePath)) process.exit(0);
  const state = JSON.parse(await readFile(statePath, 'utf8'));
  const map = await readFile(path.join(root, 'project', 'PLAYTHROUGH_MAP.md'), 'utf8');
  const result = decide({
    state,
    summary: summarize(parsePlaythroughMap(map)),
    paused: existsSync(path.join(root, 'project', 'private', 'AUTOPILOT_PAUSE')),
  });
  if (JSON.stringify(result.state) !== JSON.stringify(state)) {
    await mkdir(path.dirname(statePath), { recursive: true });
    await writeFile(statePath, `${JSON.stringify(result.state, null, 2)}\n`);
  }
  if (result.block) process.stdout.write(JSON.stringify({ decision: 'block', reason: result.reason }));
  else if (state.enabled) process.stdout.write(JSON.stringify({ systemMessage: `Autopilot stopped: ${result.why}.` }));
} catch (error) {
  process.stderr.write(`autopilot-stop hook: ${error instanceof Error ? error.message : String(error)}\n`);
}
process.exit(0);

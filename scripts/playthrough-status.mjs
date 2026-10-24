#!/usr/bin/env node
/** Prints boot-to-credits progress from project/PLAYTHROUGH_MAP.md. Usage: npm run playthrough [-- --json] */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePlaythroughMap, summarize } from './lib/playthrough.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(projectRoot, 'project', 'PLAYTHROUGH_MAP.md');
const summary = summarize(parsePlaythroughMap(await readFile(file, 'utf8')));

if (process.argv.includes('--json')) {
  const { signature: _signature, ...rest } = summary;
  console.log(JSON.stringify(rest, null, 2));
} else if (!summary.initialized) {
  console.log('PLAYTHROUGH_MAP is still the template. Build it with the playthrough-cartographer agent (see docs/16-BOOT-TO-CREDITS.md).');
} else {
  const bar = summary.total ? Math.round((summary.verified / summary.total) * 30) : 0;
  console.log(`Boot-to-credits: [${'#'.repeat(bar)}${'.'.repeat(30 - bar)}] ${summary.verified}/${summary.total} verified`);
  console.log(Object.entries(summary.counts).filter(([, n]) => n).map(([s, n]) => `${s}: ${n}`).join(' · '));
  console.log(summary.complete ? 'Every node is terminal. Run /verify-playthrough for the final full run.' : `Next: ${summary.next?.id} ${summary.next?.name ?? ''} (${summary.next?.status}) at line ${summary.next?.line}`);
}
for (const problem of summary.problems) console.error(`warning: ${problem}`);

#!/usr/bin/env node
/** Read-only inventory of an authorized game installation.
 * Usage: npm run inventory [-- --root <dir>] [--max-files N] [--stdout]
 * Default root: public/game. Writes project/private/INVENTORY.md and INVENTORY.json (Git-ignored). */
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventory, renderInventoryMarkdown } from './lib/fingerprint.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const root = path.resolve(option('--root') ?? path.join(projectRoot, 'public', 'game'));
const maxFiles = Number(option('--max-files') ?? 200_000);

try {
  if (!(await stat(root)).isDirectory()) throw new Error('not a directory');
} catch (e) {
  console.error(`Cannot read installation root (${e.message}). Put the game in public/game or pass --root.`);
  process.exit(2);
}

const report = await inventory(root, { maxFiles });
if (report.fileCount === 0) {
  console.error('No game files found. Put the authorized installation in public/game or pass --root <dir>.');
  process.exit(3);
}
const markdown = renderInventoryMarkdown(report);
if (args.includes('--stdout')) process.stdout.write(markdown);
else {
  const out = path.join(projectRoot, 'project', 'private');
  await mkdir(out, { recursive: true });
  await writeFile(path.join(out, 'INVENTORY.md'), markdown);
  await writeFile(path.join(out, 'INVENTORY.json'), JSON.stringify(report, null, 2));
  const top = report.engines[0];
  console.log(`Indexed ${report.fileCount} files. Top engine candidate: ${top ? `${top.engine} (score ${top.score})` : 'none'}.`);
  console.log('Wrote project/private/INVENTORY.md and INVENTORY.json');
}

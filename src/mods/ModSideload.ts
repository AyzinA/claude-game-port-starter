import { strFromU8, unzipSync } from 'fflate';
import { normalizeVirtualPath, type VfsPayload } from '../vfs/OverlayVfs';

const MAX_COMPRESSED = 30 * 1024 * 1024;
const MAX_UNCOMPRESSED = 128 * 1024 * 1024;
const MAX_ENTRY = 16 * 1024 * 1024;
const MAX_FILES = 1200;
const SCRIPT_OR_BINARY = /\.(?:js|mjs|cjs|html?|dll|exe|so|dylib|bat|cmd|sh|ps1|wasm)$/i;

export interface NormalizedModManifest {
  id: string;
  name: string;
  version: string;
  targetGame: string;
  priority: number;
}
export interface SideloadedMod {
  manifest: NormalizedModManifest;
  entries: Map<string, VfsPayload>;
  rejected: string[];
}

export function parseModManifest(data: unknown): NormalizedModManifest {
  if (typeof data !== 'object' || data === null) throw new Error('mod.json must be an object');
  const m = data as Record<string, unknown>;
  if (typeof m.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{1,63}$/i.test(m.id)) {
    throw new Error('Invalid mod id');
  }
  if (typeof m.name !== 'string' || m.name.length > 128 || !m.name.trim()) {
    throw new Error('Invalid mod name');
  }
  if (typeof m.version !== 'string' || m.version.length > 64 || !m.version.trim()) {
    throw new Error('Invalid mod version');
  }
  if (typeof m.targetGame !== 'string' || !/^[a-z0-9][a-z0-9_-]{1,63}$/i.test(m.targetGame)) {
    throw new Error('Invalid target game identifier');
  }
  const priority = m.priority === undefined ? 300 : m.priority;
  if (typeof priority !== 'number' || !Number.isInteger(priority) || priority < 300 || priority > 1000) {
    throw new Error('Priority must be an integer 300–1000');
  }
  return { id: m.id, name: m.name, version: m.version, targetGame: m.targetGame, priority };
}

/** Preview importer, not a production archive sandbox. Executable entries are never mounted. */
export async function loadLocalModZip(file: File, expectedGameId: string): Promise<SideloadedMod> {
  if (file.size > MAX_COMPRESSED) throw new Error('Mod ZIP too large for preview importer');
  const rejected: string[] = [];
  let totalBytes = 0;
  let count = 0;
  const zipBytes = new Uint8Array(await file.arrayBuffer());
  const zipFiles = unzipSync(zipBytes, {
    filter: info => {
      count++;
      if (count > MAX_FILES || info.originalSize > MAX_ENTRY || totalBytes + info.originalSize > MAX_UNCOMPRESSED) {
        rejected.push(`Skipped over-limit file: ${info.name}`);
        return false;
      }
      try { normalizeVirtualPath(info.name.replace(/\/$/, '')); }
      catch { rejected.push(`Skipped unsafe path: ${info.name}`); return false; }
      if (SCRIPT_OR_BINARY.test(info.name)) {
        rejected.push(`Skipped executable file: ${info.name}`);
        return false;
      }
      totalBytes += info.originalSize;
      return true;
    },
  });
  const manifestFile = zipFiles['mod.json'];
  if (!manifestFile || manifestFile.byteLength > 8192) throw new Error('A small root mod.json is required');
  const manifest = parseModManifest(JSON.parse(strFromU8(manifestFile)));
  if (manifest.targetGame !== expectedGameId) {
    throw new Error(`Mod targets ${manifest.targetGame}, selected game is ${expectedGameId}`);
  }
  const entries = new Map<string, VfsPayload>();
  for (const [name, bytes] of Object.entries(zipFiles)) {
    if (name === 'mod.json') continue;
    if (!name.startsWith('assets/')) {
      rejected.push(`Skipped non-asset entry: ${name}`);
      continue;
    }
    const relative = name.slice('assets/'.length);
    try {
      const path = normalizeVirtualPath(relative);
      if (SCRIPT_OR_BINARY.test(path)) { rejected.push(`Skipped executable: ${path}`); continue; }
      if (entries.has(path)) { rejected.push(`Skipped case-colliding duplicate: ${path}`); continue; }
      entries.set(path, bytes);
    } catch { rejected.push(`Skipped unsafe asset path: ${name}`); }
  }
  return { manifest, entries, rejected };
}

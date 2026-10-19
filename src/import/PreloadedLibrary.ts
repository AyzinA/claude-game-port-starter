import { parseModManifest, loadLocalModZip } from '../mods/ModSideload';
import type { NormalizedModManifest } from '../mods/ModSideload';
import { normalizeVirtualPath, type VfsPayload } from '../vfs/OverlayVfs';
import type { OverlayVfs } from '../vfs/OverlayVfs';

interface RemoteFile { path: string; size: number; url: string; }
interface PreloadedGame { id: string; name: string; files: RemoteFile[]; }
interface FolderMod { kind: 'folder'; manifest: NormalizedModManifest; files: RemoteFile[]; }
interface ZipMod { kind: 'zip'; name: string; url: string; size: number; }
export interface LocalLibraryIndex { game: PreloadedGame | null; mods: Array<FolderMod | ZipMod>; warnings: string[]; }
export interface PreloadResult { game: PreloadedGame | null; loadedMods: string[]; warnings: string[]; }

function remoteEntries(files: RemoteFile[]): Map<string, VfsPayload> {
  const entries = new Map<string, VfsPayload>();
  for (const file of files) {
    const key = normalizeVirtualPath(file.path);
    if (entries.has(key)) throw new Error(`Duplicate case-insensitive path: ${file.path}`);
    if (!file.url.startsWith('/api/local-library/') || !Number.isSafeInteger(file.size) || file.size < 0) throw new Error('Invalid library response');
    entries.set(key, { kind: 'remote', url: file.url, size: file.size });
  }
  return entries;
}

async function fetchLibraryIndex(): Promise<LocalLibraryIndex> {
  const response = await fetch('/api/local-library', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Local library manifest failed (${response.status})`);
  return await response.json() as LocalLibraryIndex;
}

/** Register compatible preloaded folder/ZIP mods; supports both preloaded and browser-selected games. */
async function mountDiscoveredMods(vfs: OverlayVfs, gameId: string, index: LocalLibraryIndex): Promise<{ loadedMods: string[]; warnings: string[] }> {
  const result: { loadedMods: string[]; warnings: string[] } = { loadedMods: [], warnings: [] };
  for (const mod of index.mods) {
    try {
      if (mod.kind === 'folder') {
        const manifest = parseModManifest(mod.manifest);
        if (manifest.targetGame !== gameId) {
          result.warnings.push(`${manifest.id}: targets ${manifest.targetGame}, not ${gameId}`);
          continue;
        }
        vfs.mount(`mod:${manifest.id}`, manifest.priority, remoteEntries(mod.files));
        result.loadedMods.push(manifest.id);
      } else if (mod.kind === 'zip') {
        const zipResponse = await fetch(mod.url, { credentials: 'same-origin' });
        if (!zipResponse.ok) throw new Error(`Unable to fetch ${mod.name}`);
        const data = new File([await zipResponse.blob()], mod.name, { type: 'application/zip' });
        const parsed = await loadLocalModZip(data, gameId);
        vfs.mount(`mod:${parsed.manifest.id}`, parsed.manifest.priority, parsed.entries);
        result.loadedMods.push(parsed.manifest.id);
        if (parsed.rejected.length) result.warnings.push(`${mod.name}: ${parsed.rejected.length} skipped entries`);
      }
    } catch (e) {
      result.warnings.push(`${mod.kind === 'zip' ? mod.name : mod.manifest.id}: ${String(e)}`);
    }
  }
  return result;
}

/** When public/game is empty, still load local mods after the user chooses a game folder. */
export async function preloadModsForSelectedGame(vfs: OverlayVfs, gameId: string): Promise<{ loadedMods: string[]; warnings: string[] }> {
  return mountDiscoveredMods(vfs, gameId, await fetchLibraryIndex());
}

/** The neutral shell indexes resources; decoding still requires a game-specific adapter. */
export async function preloadLibrary(vfs: OverlayVfs): Promise<PreloadResult> {
  const index = await fetchLibraryIndex();
  const result: PreloadResult = { game: index.game, warnings: [...index.warnings], loadedMods: [] };
  if (!index.game) return result;
  vfs.mount('preloaded-game', 0, remoteEntries(index.game.files));
  const mods = await mountDiscoveredMods(vfs, index.game.id, index);
  result.loadedMods.push(...mods.loadedMods);
  result.warnings.push(...mods.warnings);
  return result;
}

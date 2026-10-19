/** Engine-neutral in-memory mount catalog; payloads are never executed. */
/** Browser-selected files/bytes or a lazy read-only server resource. */
export interface RemoteResource { kind: 'remote'; url: string; size: number; }
export type VfsPayload = Blob | Uint8Array | RemoteResource;

/** Fetch original bytes only when a game-specific decoder requests them. */
export async function readVfsPayload(payload: VfsPayload): Promise<Uint8Array> {
  if (payload instanceof Uint8Array) return payload;
  if (payload instanceof Blob) return new Uint8Array(await payload.arrayBuffer());
  if (!payload.url.startsWith('/api/local-library/')) throw new Error('Nonlocal resource URL');
  const response = await fetch(payload.url, { credentials: 'same-origin' });
  if (!response.ok) throw new Error(`Resource request failed: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}
export interface VirtualEntry {
  path: string;
  source: string;
  priority: number;
  payload: VfsPayload;
  order: number;
}
export interface ResourceResolution {
  winner: VirtualEntry;
  shadowed: VirtualEntry[];
}

export function normalizeVirtualPath(raw: string): string {
  if (!raw || raw.length > 1024 || /[\u0000-\u001f\u007f]/.test(raw)) {
    throw new Error('Invalid virtual file path');
  }
  const path = raw.replace(/\\/g, '/').normalize('NFC');
  if (path.startsWith('/') || /^[a-zA-Z]:/.test(path) || path.includes('//')) {
    throw new Error('Absolute or invalid file path');
  }
  const parts = path.split('/');
  if (parts.some(p => p === '..' || p.length === 0 || p.includes(':'))) {
    throw new Error('Unsafe relative path');
  }
  const valid = parts.filter(p => p !== '.').join('/');
  if (!valid || valid.length > 512) throw new Error('Invalid normalized file path');
  return valid.toLowerCase(); // Demo rule; game adapters must define exact case semantics.
}

export class OverlayVfs {
  private mounts = new Map<string, VirtualEntry[]>();
  private nextOrder = 0;

  mount(source: string, priority: number, entries: Iterable<readonly [string, VfsPayload]>): number {
    if (!source || !Number.isFinite(priority)) throw new Error('Invalid mount');
    const normalized: VirtualEntry[] = [];
    const seen = new Set<string>();
    for (const [name, payload] of entries) {
      const path = normalizeVirtualPath(name);
      if (seen.has(path)) throw new Error(`Duplicate path in mount: ${path}`);
      seen.add(path);
      normalized.push({ path, payload, source, priority, order: this.nextOrder++ });
      if (normalized.length > 40_000) throw new Error('Too many files in mount');
    }
    this.mounts.set(source, normalized);
    return normalized.length;
  }

  unmount(source: string): void { this.mounts.delete(source); }

  list(): Map<string, ResourceResolution> {
    const byPath = new Map<string, VirtualEntry[]>();
    for (const files of this.mounts.values()) {
      for (const file of files) {
        const versions = byPath.get(file.path) ?? [];
        versions.push(file);
        byPath.set(file.path, versions);
      }
    }
    const output = new Map<string, ResourceResolution>();
    for (const [path, versions] of byPath) {
      versions.sort((a, b) => b.priority - a.priority || b.order - a.order);
      const [winner, ...shadowed] = versions;
      if (winner) output.set(path, { winner, shadowed });
    }
    return output;
  }

  resolve(path: string): ResourceResolution | undefined {
    return this.list().get(normalizeVirtualPath(path));
  }

  stats(): { resolved: number; overridden: number; sources: number } {
    const entries = this.list();
    return {
      resolved: entries.size,
      overridden: [...entries.values()].filter(r => r.shadowed.length).length,
      sources: this.mounts.size,
    };
  }
}

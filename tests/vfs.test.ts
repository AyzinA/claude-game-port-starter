import { describe, expect, it } from 'vitest';
import { OverlayVfs, normalizeVirtualPath } from '../src/vfs/OverlayVfs';
import { parseModManifest } from '../src/mods/ModSideload';

describe('virtual path normalization', () => {
  it('normalizes separators and case for neutral demo', () => {
    expect(normalizeVirtualPath('Data\\Textures\\Sky.PNG')).toBe('data/textures/sky.png');
  });
  it.each(['../secret', '/etc/passwd', 'C:\\game', 'test//file', 'a/../b', 'a:\\b', 'a\u0000b'])(
    'rejects unsafe path: %s', value => { expect(() => normalizeVirtualPath(value)).toThrow(); },
  );
});

describe('overlay filesystem', () => {
  it('resolves higher-priority mod and preserves original in shadowed list', () => {
    const vfs = new OverlayVfs();
    vfs.mount('base', 0, [['textures/sky.png', new Uint8Array([1])]]);
    vfs.mount('mod:sky', 300, [['textures/sky.png', new Uint8Array([2])]]);
    expect(vfs.resolve('TEXTURES/SKY.PNG')?.winner.source).toBe('mod:sky');
    expect(vfs.resolve('textures/sky.png')?.shadowed[0]?.source).toBe('base');
    vfs.unmount('mod:sky');
    expect(vfs.resolve('textures/sky.png')?.winner.source).toBe('base');
  });
  it('rejects duplicate paths within a mount', () => {
    const vfs = new OverlayVfs();
    expect(() => vfs.mount('bad', 300, [
      ['A/FILE', new Uint8Array()], ['a/file', new Uint8Array()],
    ])).toThrow('Duplicate path');
  });
});

describe('mod manifest validation', () => {
  it('accepts data-only normalized manifest', () => {
    expect(parseModManifest({ id: 'sky-pack', name: 'Sky Pack', version: '1.0', targetGame: 'demo' }).priority).toBe(300);
  });
  it('rejects unsafe or missing manifest IDs', () => {
    expect(() => parseModManifest({ id: '../bad', name: 'x', version: '1', targetGame: 'demo' })).toThrow();
  });
});

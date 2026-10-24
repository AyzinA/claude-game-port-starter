/** Headless boot-to-credits runs for every registered adapter. A real port's `full` script is its definition of
 * done: it must reach the end credits from boot using only player inputs. */
import { describe, expect, it } from 'vitest';
import { runAutoplay } from '../src/engine/Automation';
import { adapters } from '../src/games';
import { demoAdapter } from '../src/games/demo/DemoGame';
import { GameRuntime } from '../src/runtime/GameRuntime';
import { OverlayVfs } from '../src/vfs/OverlayVfs';

function boot(adapter = demoAdapter) {
  const runtime = new GameRuntime(adapter, { vfs: new OverlayVfs(), seed: 1 });
  runtime.start();
  return runtime;
}

describe.each(adapters.map(a => [a.id, a] as const))('adapter %s', (_id, adapter) => {
  it('declares at least one full boot-to-credits autoplay script', () => {
    expect(adapter.autoplay.some(s => s.kind === 'full')).toBe(true);
  });

  it.each(adapter.autoplay.map(s => [s.id, s] as const))('autoplay %s passes headless', async (_sid, script) => {
    const runtime = boot(adapter);
    const report = await runAutoplay(runtime.automationTarget(), script);
    expect(report.error).toBeUndefined();
    expect(report.ok).toBe(true);
    if (script.kind === 'full') {
      expect(runtime.history.some(h => h.to !== null && runtime.flow.kindOf(h.to) === 'credits')).toBe(true);
    }
  });
});

describe('demo adapter flow', () => {
  it('visits every front-end, gameplay and ending state in order', async () => {
    const runtime = boot();
    const report = await runAutoplay(runtime.automationTarget(), demoAdapter.autoplay[0]!);
    expect(report.ok).toBe(true);
    const visited = runtime.history.map(h => h.to);
    for (const id of ['splash', 'title', 'main-menu', 'options', 'gameplay', 'pause', 'ending', 'credits']) expect(visited).toContain(id);
    expect(visited.indexOf('credits')).toBeGreaterThan(visited.indexOf('ending'));
    expect(runtime.topState).toBe('main-menu');
  });

  it('is deterministic: identical inputs give identical transition timing', async () => {
    const histories = [];
    for (let i = 0; i < 2; i++) {
      const runtime = boot();
      await runAutoplay(runtime.automationTarget(), demoAdapter.autoplay[0]!);
      histories.push(JSON.stringify(runtime.history));
    }
    expect(histories[0]).toBe(histories[1]);
  });

  it('quit to main menu from pause tears down gameplay', async () => {
    const runtime = boot();
    const report = await runAutoplay(runtime.automationTarget(), {
      id: 'quit', description: '', kind: 'segment',
      steps: [{ expect: 'title', within: 300 }, { press: 'confirm' }, { expect: 'main-menu' }, { press: 'confirm' }, { expect: 'gameplay' },
        { press: 'pause' }, { expect: 'pause' }, { press: 'menu_down' }, { press: 'confirm' }, { expect: 'main-menu' }],
    });
    expect(report.ok).toBe(true);
    expect(runtime.flow.stackIds).toEqual(['main-menu']);
  });
});

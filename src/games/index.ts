import type { OverlayVfs } from '../vfs/OverlayVfs';
import { demoAdapter } from './demo/DemoGame';
import type { GameAdapter } from './GameAdapter';

/** Register each game module here, e.g. `import { myGameAdapter } from './my-game/MyGame'`. */
export const adapters: GameAdapter[] = [demoAdapter];

/** Pick the adapter with the strongest detection evidence; fall back to the neutral demo. */
export function selectAdapter(vfs: OverlayVfs, gameId: string): GameAdapter {
  let best: { adapter: GameAdapter; score: number } | null = null;
  for (const adapter of adapters) {
    const score = adapter.id === gameId ? Math.max(1, adapter.detect(vfs, gameId)) : adapter.detect(vfs, gameId);
    if (score > 0 && (!best || score > best.score)) best = { adapter, score };
  }
  return best?.adapter ?? demoAdapter;
}

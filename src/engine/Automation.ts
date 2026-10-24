/** Autoplay: scripted input runs that drive a port from boot to end credits.
 * Steps only inject actions and observe state, the same as a player. They never poke game state, so a passing
 * run is evidence that the real flow works. Shared by headless Vitest runs and Playwright browser runs. */
import type { ActionId } from './Input';

export type AutoplayStep =
  /** Advance until the top state id equals `expect` (default limit 600 ticks). */
  | { expect: string; within?: number }
  /** Tap an action, then advance `ticks` (default 1) so the game consumes it. */
  | { press: ActionId; ticks?: number }
  /** Hold an action for `ticks`, then release it. */
  | { hold: ActionId; ticks: number }
  /** Advance a fixed number of ticks. */
  | { wait: number }
  /** Mark a node of project/PLAYTHROUGH_MAP.md as reached (browser runs capture a screenshot here). */
  | { checkpoint: string };

export interface AutoplayScript {
  id: string;
  description: string;
  /** `full` scripts start at boot and must reach the end credits with no warps. */
  kind: 'full' | 'segment';
  steps: AutoplayStep[];
}

export interface AutomationTarget {
  tick(): number | Promise<number>;
  topState(): string | undefined | Promise<string | undefined>;
  inject(action: ActionId, phase: 'press' | 'release' | 'tap'): void | Promise<void>;
  advance(ticks: number): void | Promise<void>;
}

export interface AutoplayCheckpoint { id: string; tick: number; state: string | undefined; }

export interface AutoplayReport {
  script: string;
  ok: boolean;
  stepsCompleted: number;
  ticks: number;
  checkpoints: AutoplayCheckpoint[];
  error?: string;
}

export interface AutoplayOptions {
  onCheckpoint?: (checkpoint: AutoplayCheckpoint) => void | Promise<void>;
  /** Ticks per advance() call while waiting for an `expect`; larger is faster in the browser. */
  pollTicks?: number;
}

export async function runAutoplay(target: AutomationTarget, script: AutoplayScript, options: AutoplayOptions = {}): Promise<AutoplayReport> {
  const checkpoints: AutoplayCheckpoint[] = [];
  const poll = Math.max(1, options.pollTicks ?? 1);
  const startTick = await target.tick();
  let index = 0;
  try {
    for (; index < script.steps.length; index++) {
      const step = script.steps[index];
      if (!step) break;
      if ('expect' in step) {
        const limit = step.within ?? 600;
        let waited = 0;
        while ((await target.topState()) !== step.expect) {
          if (waited >= limit) throw new Error(`Expected state "${step.expect}" within ${limit} ticks, still in "${await target.topState()}"`);
          const n = Math.min(poll, limit - waited);
          await target.advance(n);
          waited += n;
        }
      } else if ('press' in step) {
        await target.inject(step.press, 'tap');
        await target.advance(step.ticks ?? 1);
      } else if ('hold' in step) {
        await target.inject(step.hold, 'press');
        await target.advance(step.ticks);
        await target.inject(step.hold, 'release');
        await target.advance(1);
      } else if ('wait' in step) {
        await target.advance(step.wait);
      } else {
        const checkpoint = { id: step.checkpoint, tick: await target.tick(), state: await target.topState() };
        checkpoints.push(checkpoint);
        await options.onCheckpoint?.(checkpoint);
      }
    }
    return { script: script.id, ok: true, stepsCompleted: index, ticks: (await target.tick()) - startTick, checkpoints };
  } catch (error) {
    return {
      script: script.id, ok: false, stepsCompleted: index, ticks: (await target.tick()) - startTick, checkpoints,
      error: `step ${index}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

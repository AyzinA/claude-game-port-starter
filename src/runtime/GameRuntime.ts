/** Composes the fixed-tick simulation for one game adapter. Runs headless (tests, autoplay) or under BrowserHost. */
import type { AutomationTarget } from '../engine/Automation';
import { GameFlow, type FlowTransition } from '../engine/GameFlow';
import { ActionInput } from '../engine/Input';
import { Rng } from '../engine/Rng';
import type { GameAdapter } from '../games/GameAdapter';
import type { ThreeStage } from '../render/ThreeStage';
import type { UiDrawCommand, UiNavBindings, UiScreen } from '../ui/UiScreen';
import type { OverlayVfs } from '../vfs/OverlayVfs';

export interface RuntimeContext {
  readonly tick: number;
  readonly tickHz: number;
  readonly flow: GameFlow<RuntimeContext>;
  readonly input: ActionInput;
  readonly nav: UiNavBindings;
  readonly vfs: OverlayVfs;
  readonly rng: Rng;
  /** Null when headless: states must keep simulation independent of rendering. */
  readonly stage: ThreeStage | null;
  /** UI screens shown by each state id; the host draws visible ones in stack order. */
  readonly screens: Map<string, UiScreen>;
  log(message: string): void;
}

export interface RuntimeOptions {
  vfs: OverlayVfs;
  stage?: ThreeStage | null;
  seed?: number;
  log?: (message: string) => void;
}

export class GameRuntime {
  readonly ctx: RuntimeContext;
  readonly flow: GameFlow<RuntimeContext>;
  readonly input: ActionInput;
  private ticks = 0;

  constructor(readonly adapter: GameAdapter, options: RuntimeOptions) {
    this.input = new ActionInput(adapter.bindings);
    const runtime = this;
    const ctx: RuntimeContext = {
      get tick() { return runtime.ticks; },
      tickHz: adapter.tickHz,
      get flow() { return runtime.flow; },
      input: this.input,
      nav: adapter.uiNav,
      vfs: options.vfs,
      rng: new Rng(options.seed),
      stage: options.stage ?? null,
      screens: new Map(),
      log: options.log ?? (() => {}),
    };
    this.ctx = ctx;
    this.flow = new GameFlow(ctx, () => this.ticks);
    for (const state of adapter.createStates()) this.flow.register(state);
  }

  start(): void { this.flow.start(this.adapter.initialState); }

  /** One fixed simulation tick. */
  step(): void {
    this.input.beginTick();
    this.flow.update();
    this.ticks++;
  }

  render(alpha: number): void { this.flow.render(alpha); }

  uiDrawLists(): UiDrawCommand[][] {
    const lists: UiDrawCommand[][] = [];
    for (const state of this.flow.visibleStates()) {
      const screen = this.ctx.screens.get(state.id);
      if (screen) lists.push(screen.drawList());
    }
    return lists;
  }

  get tick(): number { return this.ticks; }
  get topState(): string | undefined { return this.flow.top?.id; }
  get history(): readonly FlowTransition[] { return this.flow.history; }

  /** Headless automation target: advancing is synchronous and deterministic. */
  automationTarget(): AutomationTarget {
    return {
      tick: () => this.ticks,
      topState: () => this.topState,
      inject: (action, phase) => this.input.inject(action, phase),
      advance: ticks => { for (let i = 0; i < ticks; i++) this.step(); },
    };
  }
}

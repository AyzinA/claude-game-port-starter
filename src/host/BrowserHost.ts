/** Runs a GameRuntime in the page: real-time loop, keyboard/pointer/gamepad input, stage and UI rendering.
 * With `automation` on, simulation advances only through the window.__gamePort bridge so Playwright runs are
 * deterministic and can screenshot each playthrough checkpoint. */
import type { AutoplayScript } from '../engine/Automation';
import { FixedClock } from '../engine/FixedClock';
import type { FlowTransition } from '../engine/GameFlow';
import type { GameAdapter } from '../games/GameAdapter';
import { CanvasUiRenderer } from '../render/CanvasUiRenderer';
import { ThreeStage } from '../render/ThreeStage';
import { GameRuntime } from '../runtime/GameRuntime';
import type { OverlayVfs } from '../vfs/OverlayVfs';

export interface GamePortBridge {
  adapter: { id: string; name: string; synthetic: boolean };
  tick(): number;
  state(): string | undefined;
  stack(): string[];
  history(): FlowTransition[];
  /** StateKind of a registered state id, e.g. 'credits'. */
  kindOf(id: string): string | undefined;
  inject(action: string, phase: 'press' | 'release' | 'tap'): void;
  /** Step the simulation `ticks` times, then render one frame. */
  advance(ticks: number): void;
  scripts(): AutoplayScript[];
}

declare global {
  interface Window { __gamePort?: GamePortBridge; }
}

export interface HostOptions {
  container: HTMLElement;
  adapter: GameAdapter;
  vfs: OverlayVfs;
  automation?: boolean;
  log?: (message: string) => void;
}

export class BrowserHost {
  readonly runtime: GameRuntime;
  private readonly stage: ThreeStage;
  private readonly ui: CanvasUiRenderer;
  private readonly clock: FixedClock;
  private readonly cleanup: Array<() => void> = [];
  private frameId = 0;

  static async create(options: HostOptions): Promise<BrowserHost> {
    const assets = await options.adapter.loadUiAssets(options.vfs);
    const host = new BrowserHost(options);
    host.ui.setAssets(assets);
    host.runtime.start();
    host.frameId = requestAnimationFrame(host.loop);
    return host;
  }

  private constructor(private readonly options: HostOptions) {
    const { adapter, container } = options;
    this.stage = new ThreeStage(container, adapter.virtualResolution, adapter.fit);
    this.ui = new CanvasUiRenderer(this.stage.uiCanvas, { images: new Map(), fonts: new Map() }, adapter.virtualResolution);
    this.runtime = new GameRuntime(adapter, { vfs: options.vfs, stage: this.stage, log: options.log });
    this.clock = new FixedClock(adapter.tickHz);
    this.bindInput();
    if (options.automation) this.installBridge();
  }

  dispose(): void {
    cancelAnimationFrame(this.frameId);
    for (const undo of this.cleanup) undo();
    this.runtime.flow.shutdown();
    this.stage.dispose();
    if (window.__gamePort?.adapter.id === this.runtime.adapter.id) delete window.__gamePort;
  }

  private loop = (now: number): void => {
    this.pollGamepads();
    if (!this.options.automation) {
      const steps = this.clock.advance(now);
      for (let i = 0; i < steps; i++) this.runtime.step();
    }
    this.renderFrame(this.options.automation ? 0 : this.clock.alpha);
    this.frameId = requestAnimationFrame(this.loop);
  };

  private renderFrame(alpha: number): void {
    this.runtime.render(alpha);
    this.stage.renderWorld();
    this.ui.render(this.runtime.uiDrawLists());
  }

  private listen<K extends keyof HTMLElementEventMap>(target: HTMLElement, type: K, handler: (event: HTMLElementEventMap[K]) => void): void {
    target.addEventListener(type, handler);
    this.cleanup.push(() => target.removeEventListener(type, handler));
  }

  private bindInput(): void {
    const { container } = this.options;
    const input = this.runtime.input;
    container.tabIndex = 0;
    this.listen(container, 'keydown', event => {
      if (event.repeat) { event.preventDefault(); return; }
      if (input.keyDown(event.code)) event.preventDefault();
    });
    this.listen(container, 'keyup', event => { if (input.keyUp(event.code)) event.preventDefault(); });
    this.listen(container, 'blur', () => input.releaseAll());
    const canvas = this.stage.uiCanvas;
    const virtual = this.options.adapter.virtualResolution;
    const pointer = (phase: 'move' | 'down' | 'up') => (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * virtual.width;
      const y = ((event.clientY - rect.top) / rect.height) * virtual.height;
      if (phase === 'down') container.focus();
      input.pointer({ phase, x, y });
    };
    this.listen(canvas, 'pointermove', pointer('move'));
    this.listen(canvas, 'pointerdown', pointer('down'));
    this.listen(canvas, 'pointerup', pointer('up'));
    const onVisibility = () => { if (document.hidden) { this.clock.reset(); input.releaseAll(); } };
    document.addEventListener('visibilitychange', onVisibility);
    this.cleanup.push(() => document.removeEventListener('visibilitychange', onVisibility));
  }

  private pollGamepads(): void {
    const pad = navigator.getGamepads?.().find(p => p?.connected && p.mapping === 'standard');
    if (!pad) return;
    pad.buttons.forEach((button, index) => this.runtime.input.gamepadButton(index, button.pressed));
  }

  private installBridge(): void {
    const { runtime } = this;
    window.__gamePort = {
      adapter: { id: runtime.adapter.id, name: runtime.adapter.name, synthetic: Boolean(runtime.adapter.synthetic) },
      tick: () => runtime.tick,
      state: () => runtime.topState,
      stack: () => runtime.flow.stackIds,
      history: () => [...runtime.history],
      kindOf: id => runtime.flow.kindOf(id),
      inject: (action, phase) => runtime.input.inject(action, phase),
      advance: ticks => {
        const n = Math.max(0, Math.min(100_000, Math.floor(ticks)));
        for (let i = 0; i < n; i++) runtime.step();
        this.renderFrame(0);
      },
      scripts: () => runtime.adapter.autoplay,
    };
  }
}

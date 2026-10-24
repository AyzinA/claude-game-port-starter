/** Game-neutral screen/state stack: boot, logos, title, menus, loading, gameplay, cutscenes, overlays, credits.
 * Every original screen from boot to end credits becomes one registered state; the transition history is what
 * autoplay verification and the playthrough map check against. */
export type StateKind =
  | 'boot' | 'splash' | 'intro' | 'title' | 'menu' | 'loading' | 'gameplay'
  | 'cutscene' | 'dialogue' | 'overlay' | 'ending' | 'credits';

export interface GameState<C> {
  readonly id: string;
  readonly kind: StateKind;
  /** Overlays (pause, inventory, dialogue) render on top of the state below instead of replacing it. */
  readonly overlay?: boolean;
  /** For overlays: keep simulating the state below (e.g. non-pausing dialogue). Default: below is paused. */
  readonly updatesBelow?: boolean;
  enter?(ctx: C, params?: unknown): void;
  exit?(ctx: C): void;
  /** Fixed simulation tick. Deterministic: no wall-clock reads, no Math.random. */
  update?(ctx: C): void;
  /** Per animation frame, presentation only. `alpha` is the fixed-tick interpolation factor. */
  render?(ctx: C, alpha: number): void;
}

export interface FlowTransition {
  tick: number;
  op: 'start' | 'replace' | 'push' | 'pop';
  from: string | null;
  to: string | null;
}

const MAX_HISTORY = 10_000;

export class GameFlow<C> {
  private states = new Map<string, GameState<C>>();
  private stack: GameState<C>[] = [];
  private pending: Array<() => void> = [];
  readonly history: FlowTransition[] = [];

  constructor(private readonly ctx: C, private readonly tick: () => number) {}

  register(state: GameState<C>): void {
    if (this.states.has(state.id)) throw new Error(`Duplicate game state: ${state.id}`);
    this.states.set(state.id, state);
  }

  has(id: string): boolean { return this.states.has(id); }

  kindOf(id: string): StateKind | undefined { return this.states.get(id)?.kind; }

  start(id: string, params?: unknown): void {
    this.shutdown();
    const state = this.get(id);
    this.record('start', null, id);
    this.stack.push(state);
    state.enter?.(this.ctx, params);
  }

  /** Exit every state immediately (host teardown). Pending transitions are dropped. */
  shutdown(): void {
    this.pending = [];
    while (this.stack.length) this.stack.pop()?.exit?.(this.ctx);
  }

  /** Transitions are queued and applied at the next tick boundary, never re-entrantly inside update(). */
  replace(id: string, params?: unknown): void {
    this.pending.push(() => {
      const target = this.get(id);
      const previous = this.stack.pop();
      previous?.exit?.(this.ctx);
      this.record('replace', previous?.id ?? null, id);
      this.stack.push(target);
      target.enter?.(this.ctx, params);
    });
  }

  /** Replace the whole stack (e.g. "quit to main menu" from a pause overlay over gameplay). */
  reset(id: string, params?: unknown): void {
    this.pending.push(() => {
      const from = this.top?.id ?? null;
      while (this.stack.length > 0) this.stack.pop()?.exit?.(this.ctx);
      const target = this.get(id);
      this.record('replace', from, id);
      this.stack.push(target);
      target.enter?.(this.ctx, params);
    });
  }

  push(id: string, params?: unknown): void {
    this.pending.push(() => {
      const target = this.get(id);
      this.record('push', this.top?.id ?? null, id);
      this.stack.push(target);
      target.enter?.(this.ctx, params);
    });
  }

  pop(): void {
    this.pending.push(() => {
      if (this.stack.length <= 1) throw new Error('Cannot pop the last game state');
      const previous = this.stack.pop();
      previous?.exit?.(this.ctx);
      this.record('pop', previous?.id ?? null, this.top?.id ?? null);
    });
  }

  get top(): GameState<C> | undefined { return this.stack[this.stack.length - 1]; }
  get stackIds(): string[] { return this.stack.map(s => s.id); }

  /** States drawn this frame, bottom to top: the topmost non-overlay state and every overlay above it. */
  visibleStates(): GameState<C>[] {
    let first = this.stack.length - 1;
    while (first > 0 && this.stack[first]?.overlay) first--;
    return this.stack.slice(Math.max(0, first));
  }

  update(): void {
    this.applyPending();
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const state = this.stack[i];
      if (!state) break;
      state.update?.(this.ctx);
      if (!(state.overlay && state.updatesBelow)) break;
    }
  }

  render(alpha: number): void {
    for (const state of this.visibleStates()) state.render?.(this.ctx, alpha);
  }

  private applyPending(): void {
    let guard = 0;
    while (this.pending.length) {
      if (++guard > 64) throw new Error('Transition loop detected');
      const batch = this.pending;
      this.pending = [];
      for (const apply of batch) apply();
    }
  }

  private get(id: string): GameState<C> {
    const state = this.states.get(id);
    if (!state) throw new Error(`Unknown game state: ${id}`);
    return state;
  }

  private record(op: FlowTransition['op'], from: string | null, to: string | null): void {
    this.history.push({ tick: this.tick(), op, from, to });
    if (this.history.length > MAX_HISTORY) this.history.splice(0, this.history.length - MAX_HISTORY);
  }
}

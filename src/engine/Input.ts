/** Action-based input. Raw devices map to game actions using the original game's bindings;
 * automation injects the same actions, so autoplay exercises the real input path. */
export type ActionId = string;

export interface InputBindings {
  /** KeyboardEvent.code -> actions, e.g. { ArrowUp: ['menu_up', 'move_forward'] }. */
  keys: Record<string, ActionId[]>;
  /** Standard-mapping gamepad button index -> actions. */
  gamepadButtons?: Record<number, ActionId[]>;
}

export type PointerPhase = 'move' | 'down' | 'up';
/** Pointer position in the game's virtual UI coordinates. */
export interface PointerEvent2D { phase: PointerPhase; x: number; y: number; }

type QueuedEvent = { action: ActionId; down: boolean };

export class ActionInput {
  private held = new Set<ActionId>();
  private pressed = new Set<ActionId>();
  private released = new Set<ActionId>();
  private queue: QueuedEvent[] = [];
  private pointerQueue: PointerEvent2D[] = [];
  private pointerTick: PointerEvent2D[] = [];
  private heldKeys = new Set<string>();
  private heldButtons = new Set<number>();

  constructor(private bindings: InputBindings) {}

  setBindings(bindings: InputBindings): void { this.releaseAll(); this.bindings = bindings; }

  /** Returns true if the key is bound (callers may then preventDefault). */
  keyDown(code: string): boolean {
    const actions = this.bindings.keys[code];
    if (!actions) return false;
    if (!this.heldKeys.has(code)) {
      this.heldKeys.add(code);
      for (const action of actions) this.queue.push({ action, down: true });
    }
    return true;
  }

  keyUp(code: string): boolean {
    const actions = this.bindings.keys[code];
    if (!actions) return false;
    if (this.heldKeys.delete(code)) for (const action of actions) this.queue.push({ action, down: false });
    return true;
  }

  gamepadButton(index: number, down: boolean): void {
    const actions = this.bindings.gamepadButtons?.[index];
    if (!actions || this.heldButtons.has(index) === down) return;
    if (down) this.heldButtons.add(index); else this.heldButtons.delete(index);
    for (const action of actions) this.queue.push({ action, down });
  }

  pointer(event: PointerEvent2D): void {
    if (this.pointerQueue.length < 256) this.pointerQueue.push(event);
  }

  /** Inject an action exactly as a device would. `tap` presses and releases within one tick. */
  inject(action: ActionId, phase: 'press' | 'release' | 'tap' = 'tap'): void {
    if (phase !== 'release') this.queue.push({ action, down: true });
    if (phase !== 'press') this.queue.push({ action, down: false });
  }

  /** Release everything, e.g. on window blur so keys do not stick. */
  releaseAll(): void {
    for (const action of this.held) this.queue.push({ action, down: false });
    this.heldKeys.clear();
    this.heldButtons.clear();
  }

  /** Call once at the start of every simulation tick. */
  beginTick(): void {
    this.pressed.clear();
    this.released.clear();
    for (const event of this.queue) {
      if (event.down) {
        if (!this.held.has(event.action)) this.pressed.add(event.action);
        this.held.add(event.action);
      } else if (this.held.delete(event.action)) {
        this.released.add(event.action);
      }
    }
    this.queue = [];
    this.pointerTick = this.pointerQueue;
    this.pointerQueue = [];
  }

  isHeld(action: ActionId): boolean { return this.held.has(action); }
  wasPressed(action: ActionId): boolean { return this.pressed.has(action); }
  wasReleased(action: ActionId): boolean { return this.released.has(action); }
  get pointerEvents(): readonly PointerEvent2D[] { return this.pointerTick; }
}

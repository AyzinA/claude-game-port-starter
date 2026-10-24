/** Engine-neutral UI tree for reconstructing original menus, HUDs, dialogue boxes and credits.
 * Coordinates are virtual pixels of the original resolution, relative to the parent node. Game adapters build
 * these trees from the original layout data (menu scripts, layout files, hard-coded positions verified against
 * reference screenshots). Rendering is a separate adapter that consumes `drawList()`. */
import type { ActionInput } from '../engine/Input';
import { contains, type Rect } from './Viewport';

interface UiBase {
  id: string;
  rect: Rect;
  visible?: boolean;
  children?: UiNode[];
}

export interface UiPanel extends UiBase { type: 'panel'; fill?: string; }

export interface UiImage extends UiBase {
  type: 'image';
  /** UiAssets image key, decoded from an original texture. */
  image: string;
  /** Sub-rectangle of the source image (sprite sheets / atlases). */
  src?: Rect;
  alpha?: number;
}

export interface UiTextStyle {
  font: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  wrap?: boolean;
}

export interface UiText extends UiBase, UiTextStyle { type: 'text'; text: string; }

export interface UiButton extends UiBase {
  type: 'button';
  /** Command string returned by navigate() when activated. */
  command: string;
  disabled?: boolean;
  label?: UiTextStyle & { text: string; focusColor?: string; disabledColor?: string };
  /** Image keys per visual state, from the original UI textures. */
  skin?: { normal?: string; focused?: string; disabled?: string };
  /** Explicit neighbours (ids). Without them, focus moves to the nearest button in that direction. */
  nav?: { up?: string; down?: string; left?: string; right?: string };
}

export type UiNode = UiPanel | UiImage | UiText | UiButton;

export type UiDrawCommand =
  | { op: 'fill'; rect: Rect; color: string }
  | { op: 'image'; rect: Rect; image: string; src?: Rect; alpha?: number }
  | { op: 'text'; rect: Rect; text: string; style: UiTextStyle };

/** Which actions drive menu navigation; adapters map these from the original key bindings. */
export interface UiNavBindings { up: string; down: string; left: string; right: string; confirm: string; back: string; }

export type NavDirection = 'up' | 'down' | 'left' | 'right';

interface Placed<T extends UiNode = UiNode> { node: T; abs: Rect; }

export class UiScreen {
  focusedId: string | null;

  constructor(readonly root: UiNode, options: { initialFocus?: string } = {}) {
    this.focusedId = options.initialFocus ?? this.focusables()[0]?.node.id ?? null;
  }

  find(id: string): UiNode | undefined {
    return this.placed().find(p => p.node.id === id)?.node;
  }

  /** Mutate text at runtime (HUD counters, localized strings). */
  setText(id: string, text: string): void {
    const node = this.find(id);
    if (node?.type === 'text') node.text = text;
    else if (node?.type === 'button' && node.label) node.label.text = text;
  }

  setVisible(id: string, visible: boolean): void {
    const node = this.find(id);
    if (node) node.visible = visible;
  }

  focusables(): Placed<UiButton>[] {
    return this.placed().filter((p): p is Placed<UiButton> => p.node.type === 'button' && !p.node.disabled);
  }

  focus(id: string): void {
    if (this.focusables().some(p => p.node.id === id)) this.focusedId = id;
  }

  moveFocus(direction: NavDirection): void {
    const buttons = this.focusables();
    const current = buttons.find(b => b.node.id === this.focusedId);
    if (!current) { this.focusedId = buttons[0]?.node.id ?? null; return; }
    const explicit = current.node.nav?.[direction];
    if (explicit) { this.focus(explicit); return; }
    const cx = current.abs.x + current.abs.w / 2;
    const cy = current.abs.y + current.abs.h / 2;
    let best: { id: string; score: number } | null = null;
    for (const candidate of buttons) {
      if (candidate === current) continue;
      const dx = candidate.abs.x + candidate.abs.w / 2 - cx;
      const dy = candidate.abs.y + candidate.abs.h / 2 - cy;
      const along = direction === 'up' ? -dy : direction === 'down' ? dy : direction === 'left' ? -dx : dx;
      const across = direction === 'up' || direction === 'down' ? Math.abs(dx) : Math.abs(dy);
      if (along <= 0) continue;
      const score = along + across * 2;
      if (!best || score < best.score) best = { id: candidate.node.id, score };
    }
    if (best) this.focusedId = best.id;
  }

  hitTest(x: number, y: number): UiButton | undefined {
    const hits = this.focusables().filter(p => contains(p.abs, x, y));
    return hits[hits.length - 1]?.node;
  }

  /** Consume this tick's navigation input. Returns the activated button's command, if any. */
  navigate(input: ActionInput, nav: UiNavBindings): string | null {
    for (const event of input.pointerEvents) {
      const hit = this.hitTest(event.x, event.y);
      if (hit && event.phase !== 'up') this.focusedId = hit.id;
      if (hit && event.phase === 'up' && hit.id === this.focusedId) return hit.command;
    }
    if (input.wasPressed(nav.up)) this.moveFocus('up');
    if (input.wasPressed(nav.down)) this.moveFocus('down');
    if (input.wasPressed(nav.left)) this.moveFocus('left');
    if (input.wasPressed(nav.right)) this.moveFocus('right');
    if (input.wasPressed(nav.confirm) && this.focusedId) {
      const focused = this.find(this.focusedId);
      if (focused?.type === 'button' && !focused.disabled) return focused.command;
    }
    return null;
  }

  drawList(): UiDrawCommand[] {
    const out: UiDrawCommand[] = [];
    for (const { node, abs } of this.placed()) {
      switch (node.type) {
        case 'panel':
          if (node.fill) out.push({ op: 'fill', rect: abs, color: node.fill });
          break;
        case 'image':
          out.push({ op: 'image', rect: abs, image: node.image, src: node.src, alpha: node.alpha });
          break;
        case 'text':
          out.push({ op: 'text', rect: abs, text: node.text, style: node });
          break;
        case 'button': {
          const focused = node.id === this.focusedId;
          const skin = node.disabled ? node.skin?.disabled : focused ? node.skin?.focused ?? node.skin?.normal : node.skin?.normal;
          if (skin) out.push({ op: 'image', rect: abs, image: skin });
          if (node.label) {
            const color = node.disabled ? node.label.disabledColor ?? node.label.color : focused ? node.label.focusColor ?? node.label.color : node.label.color;
            out.push({ op: 'text', rect: abs, text: node.label.text, style: { ...node.label, color } });
          }
          break;
        }
      }
    }
    return out;
  }

  /** Depth-first visible nodes with absolute rectangles, in paint order. */
  private placed(): Placed[] {
    const out: Placed[] = [];
    const visit = (node: UiNode, ox: number, oy: number): void => {
      if (node.visible === false) return;
      const abs = { x: ox + node.rect.x, y: oy + node.rect.y, w: node.rect.w, h: node.rect.h };
      out.push({ node, abs });
      for (const child of node.children ?? []) visit(child, abs.x, abs.y);
    };
    visit(this.root, 0, 0);
    return out;
  }
}

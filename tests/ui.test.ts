import { describe, expect, it } from 'vitest';
import { ActionInput } from '../src/engine/Input';
import { layoutText, measureText, type BitmapFontData } from '../src/ui/Fonts';
import { UiScreen, type UiNode } from '../src/ui/UiScreen';
import { fitViewport, toVirtual } from '../src/ui/Viewport';

describe('viewport fitting', () => {
  it('letterboxes 4:3 into 16:9', () => {
    expect(fitViewport({ width: 1920, height: 1080 }, { width: 640, height: 480 }, 'letterbox')).toEqual({ x: 240, y: 0, w: 1440, h: 1080 });
  });
  it('uses whole-number scales for pixel art', () => {
    expect(fitViewport({ width: 1000, height: 800 }, { width: 320, height: 200 }, 'integer')).toEqual({ x: 20, y: 100, w: 960, h: 600 });
  });
  it('maps container pixels to virtual coordinates', () => {
    const vp = { x: 240, y: 0, w: 1440, h: 1080 };
    expect(toVirtual(vp, { width: 640, height: 480 }, 240 + 720, 540)).toEqual({ x: 320, y: 240 });
    expect(toVirtual(vp, { width: 640, height: 480 }, 100, 540)).toBeNull();
  });
});

const glyph = (x: number) => ({ x, y: 0, w: 8, h: 8, xOffset: 0, yOffset: 0, xAdvance: 8 });
const font: BitmapFontData = {
  kind: 'bitmap', image: 'atlas', lineHeight: 10, fallback: 63,
  glyphs: new Map([[65, glyph(0)], [66, glyph(8)], [32, glyph(16)], [63, glyph(24)]]),
  kerning: new Map([['65,66', -2]]),
};

describe('bitmap font layout', () => {
  it('applies advances and kerning', () => {
    expect(measureText(font, 'AB')).toBe(14);
    expect(layoutText(font, 'AB').lines[0]?.glyphs.map(g => g.x)).toEqual([0, 6]);
  });
  it('wraps on spaces and honours newlines', () => {
    const layout = layoutText(font, 'AA AA AA\nB', 40);
    expect(layout.lines.map(l => l.text)).toEqual(['AA AA', 'AA', 'B']);
    expect(layout.height).toBe(30);
  });
  it('uses the fallback glyph advance for unknown characters', () => {
    expect(measureText(font, 'Z')).toBe(8);
  });
});

function menuTree(): UiNode {
  const button = (id: string, x: number, y: number, extra = {}): UiNode => ({
    type: 'button', id, command: id, rect: { x, y, w: 100, h: 20 }, label: { text: id, font: 'f' }, ...extra,
  });
  return {
    type: 'panel', id: 'root', rect: { x: 10, y: 10, w: 300, h: 200 }, children: [
      button('new', 0, 0), button('load', 0, 30, { disabled: true }), button('options', 0, 60), button('side', 150, 60),
    ],
  };
}

describe('ui screen', () => {
  const nav = { up: 'up', down: 'down', left: 'left', right: 'right', confirm: 'ok', back: 'back' };

  it('skips disabled buttons and moves spatially', () => {
    const screen = new UiScreen(menuTree());
    expect(screen.focusedId).toBe('new');
    screen.moveFocus('down');
    expect(screen.focusedId).toBe('options');
    screen.moveFocus('right');
    expect(screen.focusedId).toBe('side');
    screen.moveFocus('right');
    expect(screen.focusedId).toBe('side');
  });

  it('activates via confirm and via pointer click in virtual coordinates', () => {
    const screen = new UiScreen(menuTree());
    const input = new ActionInput({ keys: {} });
    input.inject('down');
    input.beginTick();
    expect(screen.navigate(input, nav)).toBeNull();
    input.inject('ok');
    input.beginTick();
    expect(screen.navigate(input, nav)).toBe('options');
    input.pointer({ phase: 'down', x: 15, y: 15 });
    input.pointer({ phase: 'up', x: 15, y: 15 });
    input.beginTick();
    expect(screen.navigate(input, nav)).toBe('new');
  });

  it('emits draw commands with absolute rectangles and focus colours', () => {
    const tree = menuTree();
    if (tree.children?.[0]?.type === 'button' && tree.children[0].label) tree.children[0].label.focusColor = 'gold';
    const commands = new UiScreen(tree).drawList();
    const first = commands.find(c => c.op === 'text');
    expect(first).toMatchObject({ op: 'text', text: 'new', rect: { x: 10, y: 10 }, style: { color: 'gold' } });
  });
});

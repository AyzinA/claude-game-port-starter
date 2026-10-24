import { layoutText, type BitmapFontData, type UiFont } from '../ui/Fonts';
import type { UiDrawCommand, UiTextStyle } from '../ui/UiScreen';
import type { Rect, Size } from '../ui/Viewport';

/** Decoded original UI resources, keyed by the ids the adapter's UI trees reference. */
export interface UiAssets {
  images: Map<string, CanvasImageSource>;
  fonts: Map<string, UiFont>;
  /** Nearest-neighbour scaling for pixel-art / low-resolution originals. */
  pixelated?: boolean;
}

export function emptyUiAssets(): UiAssets { return { images: new Map(), fonts: new Map() }; }

/** Draws UI command lists in virtual coordinates onto the stage's 2D overlay canvas. */
export class CanvasUiRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly warned = new Set<string>();

  constructor(private readonly canvas: HTMLCanvasElement, private assets: UiAssets, private readonly virtual: Size) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
  }

  setAssets(assets: UiAssets): void { this.assets = assets; }

  render(lists: UiDrawCommand[][]): void {
    const { ctx, canvas } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(canvas.width / this.virtual.width, 0, 0, canvas.height / this.virtual.height, 0, 0);
    ctx.imageSmoothingEnabled = !this.assets.pixelated;
    for (const list of lists) for (const command of list) this.draw(command);
  }

  private draw(command: UiDrawCommand): void {
    const { ctx } = this;
    if (command.op === 'fill') {
      ctx.fillStyle = command.color;
      ctx.fillRect(command.rect.x, command.rect.y, command.rect.w, command.rect.h);
    } else if (command.op === 'image') {
      const image = this.assets.images.get(command.image);
      if (!image) { this.missing(`image:${command.image}`, command.rect); return; }
      ctx.globalAlpha = command.alpha ?? 1;
      const { rect, src } = command;
      if (src) ctx.drawImage(image, src.x, src.y, src.w, src.h, rect.x, rect.y, rect.w, rect.h);
      else ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h);
      ctx.globalAlpha = 1;
    } else {
      const font = this.assets.fonts.get(command.style.font);
      if (!font) { this.missing(`font:${command.style.font}`, command.rect); return; }
      if (font.kind === 'bitmap') this.drawBitmapText(font, command.text, command.rect, command.style);
      else this.drawCssText(font.css, font.lineHeight, command.text, command.rect, command.style);
    }
  }

  private drawBitmapText(font: BitmapFontData, text: string, rect: Rect, style: UiTextStyle): void {
    const atlas = this.assets.images.get(font.image);
    if (!atlas) { this.missing(`image:${font.image}`, rect); return; }
    const layout = layoutText(font, text, style.wrap ? rect.w : undefined);
    let y = alignY(rect, layout.height, style.valign);
    for (const line of layout.lines) {
      const x0 = alignX(rect, line.width, style.align);
      for (const { code, x } of line.glyphs) {
        const glyph = font.glyphs.get(code) ?? (font.fallback !== undefined ? font.glyphs.get(font.fallback) : undefined);
        if (!glyph || !glyph.w || !glyph.h) continue;
        this.ctx.drawImage(atlas, glyph.x, glyph.y, glyph.w, glyph.h, x0 + x + glyph.xOffset, y + glyph.yOffset, glyph.w, glyph.h);
      }
      y += font.lineHeight;
    }
    // Tinting bitmap fonts needs per-colour atlases; adapters pre-tint when the original does.
  }

  private drawCssText(css: string, lineHeight: number, text: string, rect: Rect, style: UiTextStyle): void {
    const { ctx } = this;
    ctx.font = css;
    ctx.fillStyle = style.color ?? '#fff';
    ctx.textBaseline = 'top';
    const lines = style.wrap ? wrapCss(ctx, text, rect.w) : text.split('\n');
    let y = alignY(rect, lines.length * lineHeight, style.valign);
    for (const line of lines) {
      ctx.fillText(line, alignX(rect, ctx.measureText(line).width, style.align), y);
      y += lineHeight;
    }
  }

  /** Missing original resources are drawn as a magenta box, never silently replaced. */
  private missing(key: string, rect: Rect): void {
    this.ctx.strokeStyle = '#ff00ff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
    if (!this.warned.has(key)) { this.warned.add(key); console.warn(`UI resource missing: ${key}`); }
  }
}

function alignX(rect: Rect, width: number, align: UiTextStyle['align']): number {
  if (align === 'center') return rect.x + (rect.w - width) / 2;
  if (align === 'right') return rect.x + rect.w - width;
  return rect.x;
}

function alignY(rect: Rect, height: number, valign: UiTextStyle['valign']): number {
  if (valign === 'middle') return rect.y + (rect.h - height) / 2;
  if (valign === 'bottom') return rect.y + rect.h - height;
  return rect.y;
}

function wrapCss(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let current = '';
    for (const word of paragraph.split(' ')) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && ctx.measureText(candidate).width > maxWidth) { lines.push(current); current = word; }
      else current = candidate;
    }
    lines.push(current);
  }
  return lines;
}

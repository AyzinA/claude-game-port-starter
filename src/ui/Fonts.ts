/** Engine-neutral font descriptions and text layout.
 * Original games almost always ship bitmap fonts (glyph atlas + metrics); decode those into `BitmapFontData`
 * so text matches pixel-for-pixel. `CssFont` exists for the neutral demo and debug overlays only and must be
 * listed as a deviation in project/UI_INVENTORY.md if it is ever used for original UI. */
export interface BitmapGlyph {
  /** Source rectangle in the atlas image. */
  x: number; y: number; w: number; h: number;
  xOffset: number; yOffset: number; xAdvance: number;
}

export interface BitmapFontData {
  kind: 'bitmap';
  /** UiAssets image key of the glyph atlas. */
  image: string;
  lineHeight: number;
  glyphs: Map<number, BitmapGlyph>;
  /** `${first},${second}` code points -> advance adjustment. */
  kerning?: Map<string, number>;
  /** Code point drawn for missing glyphs (original engines often use '?'). */
  fallback?: number;
  letterSpacing?: number;
}

export interface CssFont {
  kind: 'css';
  /** Canvas font shorthand, e.g. '16px monospace'. */
  css: string;
  lineHeight: number;
  /** Fixed advance used for headless layout; the canvas renderer measures for real. */
  approxAdvance: number;
}

export type UiFont = BitmapFontData | CssFont;

export interface LaidOutGlyph { code: number; x: number; }
export interface LaidOutLine { text: string; width: number; glyphs: LaidOutGlyph[]; }
export interface TextLayout { lines: LaidOutLine[]; width: number; height: number; }

function glyphFor(font: BitmapFontData, code: number): BitmapGlyph | undefined {
  return font.glyphs.get(code) ?? (font.fallback !== undefined ? font.glyphs.get(font.fallback) : undefined);
}

function layoutWord(font: BitmapFontData, codes: number[], startX: number, previous: number | null): { glyphs: LaidOutGlyph[]; end: number } {
  const glyphs: LaidOutGlyph[] = [];
  let x = startX;
  let prev = previous;
  for (const code of codes) {
    if (prev !== null) x += font.kerning?.get(`${prev},${code}`) ?? 0;
    const glyph = glyphFor(font, code);
    glyphs.push({ code, x });
    x += (glyph?.xAdvance ?? 0) + (font.letterSpacing ?? 0);
    prev = code;
  }
  return { glyphs, end: x };
}

export function measureText(font: UiFont, text: string): number {
  const codes = Array.from(text, ch => ch.codePointAt(0) ?? 0);
  if (font.kind === 'css') return codes.length * font.approxAdvance;
  return layoutWord(font, codes, 0, null).end;
}

/** Word-wraps on spaces when `maxWidth` is given; honours explicit newlines. */
export function layoutText(font: UiFont, text: string, maxWidth?: number): TextLayout {
  const lines: LaidOutLine[] = [];
  for (const paragraph of text.split('\n')) {
    if (maxWidth === undefined || measureText(font, paragraph) <= maxWidth) {
      lines.push(lineOf(font, paragraph));
      continue;
    }
    // Greedy word wrap; a single over-long word stays on its own line.
    let current = '';
    for (const word of paragraph.split(' ')) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && measureText(font, candidate) > maxWidth) {
        lines.push(lineOf(font, current));
        current = word;
      } else current = candidate;
    }
    lines.push(lineOf(font, current));
  }
  const width = lines.reduce((max, line) => Math.max(max, line.width), 0);
  return { lines, width, height: lines.length * font.lineHeight };
}

function lineOf(font: UiFont, text: string): LaidOutLine {
  const codes = Array.from(text, ch => ch.codePointAt(0) ?? 0);
  if (font.kind === 'css') return { text, width: codes.length * font.approxAdvance, glyphs: [] };
  const { glyphs, end } = layoutWord(font, codes, 0, null);
  return { text, width: end, glyphs };
}

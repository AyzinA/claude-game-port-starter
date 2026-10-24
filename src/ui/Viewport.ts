/** Maps the original game's virtual resolution (e.g. 640x480) onto the browser container. */
export interface Size { width: number; height: number; }
export interface Rect { x: number; y: number; w: number; h: number; }

/** letterbox: keep aspect, bars on the sides. integer: largest whole-number scale (pixel-art games).
 * stretch: fill the container (only when the original also stretched). */
export type FitMode = 'letterbox' | 'integer' | 'stretch';

export function fitViewport(container: Size, virtual: Size, mode: FitMode): Rect {
  const cw = Math.max(1, container.width);
  const ch = Math.max(1, container.height);
  if (mode === 'stretch') return { x: 0, y: 0, w: cw, h: ch };
  let scale = Math.min(cw / virtual.width, ch / virtual.height);
  // Integer scaling falls back to fractional when the container is smaller than the native resolution.
  if (mode === 'integer' && scale >= 1) scale = Math.floor(scale);
  const w = Math.round(virtual.width * scale);
  const h = Math.round(virtual.height * scale);
  return { x: Math.floor((cw - w) / 2), y: Math.floor((ch - h) / 2), w, h };
}

/** Container-relative CSS pixel position -> virtual coordinates, or null when outside the game area. */
export function toVirtual(viewport: Rect, virtual: Size, px: number, py: number): { x: number; y: number } | null {
  const x = ((px - viewport.x) / viewport.w) * virtual.width;
  const y = ((py - viewport.y) / viewport.h) * virtual.height;
  if (x < 0 || y < 0 || x >= virtual.width || y >= virtual.height) return null;
  return { x, y };
}

export function contains(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h;
}

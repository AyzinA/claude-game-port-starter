import * as THREE from 'three';
import { fitViewport, type FitMode, type Rect, type Size } from '../ui/Viewport';

/** Owns the WebGL canvas (world) and a 2D canvas stacked above it (original UI), both fitted to the game's
 * virtual resolution. Game states hand it a scene/camera; it never knows which game is running. */
export class ThreeStage {
  readonly renderer: THREE.WebGLRenderer;
  readonly uiCanvas: HTMLCanvasElement;
  private scene: THREE.Scene | null = null;
  private camera: THREE.Camera | null = null;
  private rect: Rect = { x: 0, y: 0, w: 1, h: 1 };
  private readonly observer: ResizeObserver;

  constructor(private readonly container: HTMLElement, readonly virtual: Size, private readonly fit: FitMode, clearColor = 0x000000) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(clearColor);
    this.uiCanvas = document.createElement('canvas');
    for (const canvas of [this.renderer.domElement, this.uiCanvas]) {
      canvas.style.position = 'absolute';
      container.appendChild(canvas);
    }
    this.uiCanvas.style.touchAction = 'none';
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.resize();
  }

  /** Letterboxed game area in container CSS pixels. */
  get viewport(): Rect { return this.rect; }

  show(scene: THREE.Scene, camera: THREE.Camera): void {
    this.scene = scene;
    this.camera = camera;
    this.syncCamera();
  }

  clear(): void { this.scene = null; this.camera = null; }

  renderWorld(): void {
    if (this.scene && this.camera) this.renderer.render(this.scene, this.camera);
    else this.renderer.clear();
  }

  dispose(): void {
    this.observer.disconnect();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.uiCanvas.remove();
  }

  private resize(): void {
    this.rect = fitViewport({ width: this.container.clientWidth, height: this.container.clientHeight }, this.virtual, this.fit);
    for (const canvas of [this.renderer.domElement, this.uiCanvas]) {
      canvas.style.left = `${this.rect.x}px`;
      canvas.style.top = `${this.rect.y}px`;
      canvas.style.width = `${this.rect.w}px`;
      canvas.style.height = `${this.rect.h}px`;
    }
    this.renderer.setSize(this.rect.w, this.rect.h, false);
    const ratio = Math.min(window.devicePixelRatio, 2);
    this.uiCanvas.width = Math.max(1, Math.round(this.rect.w * ratio));
    this.uiCanvas.height = Math.max(1, Math.round(this.rect.h * ratio));
    this.syncCamera();
  }

  private syncCamera(): void {
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = this.rect.w / this.rect.h;
      this.camera.updateProjectionMatrix();
    }
  }
}

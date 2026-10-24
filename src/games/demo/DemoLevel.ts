import * as THREE from 'three';

/** Synthetic grid level: pure simulation state, independent of rendering. */
export class DemoLevel {
  readonly size = 5;
  readonly goal = { x: 4, z: 0 };
  x = 0;
  z = 4;
  steps = 0;

  move(dx: number, dz: number): void {
    const nx = Math.min(this.size - 1, Math.max(0, this.x + dx));
    const nz = Math.min(this.size - 1, Math.max(0, this.z + dz));
    if (nx === this.x && nz === this.z) return;
    this.x = nx;
    this.z = nz;
    this.steps++;
  }

  get complete(): boolean { return this.x === this.goal.x && this.z === this.goal.z; }
}

/** Three.js presentation of DemoLevel. Owns and disposes its GPU resources. */
export class DemoLevelView {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 150);
  private readonly player: THREE.Mesh;
  private readonly goal: THREE.Mesh;

  constructor(level: DemoLevel) {
    this.scene.background = new THREE.Color(0x101827);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x476077, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(5, 10, 4);
    this.scene.add(sun);
    const extent = level.size;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(extent, extent), new THREE.MeshStandardMaterial({ color: 0x274b4b, roughness: 0.96 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set((extent - 1) / 2, 0, (extent - 1) / 2);
    this.scene.add(ground);
    const grid = new THREE.GridHelper(extent, extent, 0x517c92, 0x3c6868);
    grid.position.set((extent - 1) / 2, 0.003, (extent - 1) / 2);
    this.scene.add(grid);
    this.player = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x82c6ef, roughness: 0.35 }));
    this.scene.add(this.player);
    this.goal = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.06, 10, 40), new THREE.MeshStandardMaterial({ color: 0xf0c97a, metalness: 0.5, roughness: 0.3 }));
    this.goal.position.set(level.goal.x, 0.5, level.goal.z);
    this.scene.add(this.goal);
    this.camera.position.set(2, 6, 8.5);
    this.camera.lookAt(2, 0, 2);
  }

  sync(level: DemoLevel, tick: number): void {
    this.player.position.set(level.x, 0.3, level.z);
    this.goal.rotation.y = tick * 0.03;
  }

  dispose(): void {
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => material.dispose());
      }
    });
  }
}

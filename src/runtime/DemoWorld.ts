import * as THREE from 'three';

export class DemoWorld {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private group = new THREE.Group();
  private readonly onResize: ResizeObserver;
  private frameId = 0;
  private lastTime = 0;

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x101827);
    this.container.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 150);
    this.camera.position.set(5, 4, 8);
    this.camera.lookAt(0, 0.6, 0);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x476077, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(5, 10, 4);
    this.scene.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), new THREE.MeshStandardMaterial({ color: 0x274b4b, roughness: 0.96 }));
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
    const grid = new THREE.GridHelper(13, 13, 0x517c92, 0x3c6868);
    grid.position.y = 0.003;
    this.scene.add(grid);

    const cube = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: 0x82c6ef, roughness: 0.35, metalness: 0.08 }));
    cube.position.y = 1.2;
    this.group.add(cube);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.07, 10, 60), new THREE.MeshStandardMaterial({ color: 0xf0c97a, metalness: 0.5, roughness: 0.3 }));
    ring.position.y = 1.2;
    ring.rotation.x = Math.PI / 2.6;
    this.group.add(ring);
    this.scene.add(this.group);

    this.onResize = new ResizeObserver(() => this.resize());
    this.onResize.observe(this.container);
    this.resize();
    this.frameId = requestAnimationFrame(this.animate);
  }

  private resize(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private animate = (time: number): void => {
    const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.05) : 0;
    this.lastTime = time;
    this.group.rotation.y += dt * 0.45;
    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame(this.animate);
  };

  dispose(): void {
    cancelAnimationFrame(this.frameId);
    this.onResize.disconnect();
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => material.dispose());
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

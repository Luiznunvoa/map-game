import {
  Object3D,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'

export interface SceneState {
  objects: Object3D[];
  camera: PerspectiveCamera;
  animateCallback?: (
    scene: Scene,
    camera: PerspectiveCamera,
    renderer: WebGLRenderer,
  ) => void;
}

export class CustomScene {
  private container: HTMLElement;
  public scene: Scene;
  public renderer: WebGLRenderer;
  private camera: PerspectiveCamera;
  private resizeObserver: ResizeObserver;
  private animationFrameId: number = 0;

  constructor(container: HTMLElement, state: SceneState) {
    this.container = container;
    this.scene = new Scene();
    this.camera = state.camera;

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.renderer = new WebGLRenderer({
      antialias: true,
    });
    this.renderer.setSize(width, height);

    this.container.appendChild(this.renderer.domElement);

    state.objects.forEach((object) => {
      this.scene.add(object);
    });

    this.resizeObserver = new ResizeObserver(() => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;

      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(w, h);
    });

    this.resizeObserver.observe(this.container);

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      state.animateCallback?.(
        this.scene,
        this.camera,
        this.renderer,
      );

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  public setObjects(objects: Object3D[]) {
    this.scene.clear();
    objects.forEach(obj => {
      this.scene.add(obj);
    });
  }

  public dispose() {
    cancelAnimationFrame(this.animationFrameId);
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

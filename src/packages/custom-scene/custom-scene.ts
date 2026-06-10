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
  private paused: boolean = false;
  private animateCallback: SceneState['animateCallback'];

  constructor(container: HTMLElement, state: SceneState) {
    this.container = container;
    this.scene = new Scene();
    this.camera = state.camera;
    this.animateCallback = state.animateCallback;

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    state.objects.forEach((object) => this.scene.add(object));

    this.resizeObserver = new ResizeObserver(() => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
    this.resizeObserver.observe(this.container);

    this.scheduleFrame();
  }

  private scheduleFrame(): void {
    this.animationFrameId = requestAnimationFrame(() => {
      if (this.paused) return;
      this.animateCallback?.(this.scene, this.camera, this.renderer);
      this.renderer.render(this.scene, this.camera);
      this.scheduleFrame();
    });
  }

  public pause(): void {
    if (this.paused) return;
    this.paused = true;
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = 0;
  }

  public resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.scheduleFrame();
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public setObjects(objects: Object3D[]): void {
    this.scene.clear();
    objects.forEach(obj => this.scene.add(obj));
  }

  public dispose(): void {
    this.pause();
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

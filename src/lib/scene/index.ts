import {
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'

import type { Entity } from '@/game/types/entity'

export interface CameraConfig {
  fov?: number
  near?: number
  far?: number
  position?: Vector3
  lookAt?: Vector3
  up?: Vector3
}

export interface FrameState {
  scene: Scene,
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
}

export interface SceneState {
  entities: Entity[]
  camera?: CameraConfig
  onFrame?: (state: FrameState) => void
}

export class CustomScene {
  private container: HTMLElement
  public scene: Scene
  public renderer: WebGLRenderer
  public camera: PerspectiveCamera
  private resizeObserver: ResizeObserver
  private animationFrameId: number = 0
  private paused: boolean = false
  private animateCallback: SceneState['onFrame']

  constructor(container: HTMLElement, state: SceneState) {
    this.container = container
    this.scene = new Scene()
    this.animateCallback = state.onFrame

    const width = container.clientWidth
    const height = container.clientHeight
    const aspect = width / height

    const camConfig = state.camera || {}
    const fov = camConfig.fov ?? 50
    const near = camConfig.near ?? 0.1
    const far = camConfig.far ?? 1000

    this.camera = new PerspectiveCamera(fov, aspect, near, far)

    if (camConfig.position) {
      this.camera.position.copy(camConfig.position)
    }

    if (camConfig.up) {
      this.camera.up.copy(camConfig.up)
    }

    if (camConfig.lookAt) {
      this.camera.lookAt(camConfig.lookAt)
    }

    this.renderer = new WebGLRenderer({ antialias: true })
    this.renderer.setSize(width, height)
    this.container.appendChild(this.renderer.domElement)

    state.entities.forEach((entity) => this.scene.add(entity.group))

    this.resizeObserver = new ResizeObserver(() => {
      const w = this.container.clientWidth
      const h = this.container.clientHeight
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(w, h)
    })
    this.resizeObserver.observe(this.container)

    this.scheduleFrame()
  }

  private scheduleFrame(): void {
    this.animationFrameId = requestAnimationFrame(() => {
      if (this.paused) return
      this.animateCallback?.({
        scene: this.scene,
        camera: this.camera,
        renderer: this.renderer,
      })
      this.renderer.render(this.scene, this.camera)
      this.scheduleFrame()
    })
  }

  public pause(): void {
    if (this.paused) return
    this.paused = true
    cancelAnimationFrame(this.animationFrameId)
    this.animationFrameId = 0
  }

  public resume(): void {
    if (!this.paused) return
    this.paused = false
    this.scheduleFrame()
  }

  public isPaused(): boolean {
    return this.paused
  }

  public setEntities(entities: Entity[]): void {
    this.scene.clear()
    entities.forEach(entity => this.scene.add(entity.group))
  }

  public dispose(): void {
    this.pause()
    this.resizeObserver.disconnect()
    this.renderer.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}

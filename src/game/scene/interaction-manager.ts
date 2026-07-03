import { PerspectiveCamera, Raycaster, Vector2 } from 'three'

import type { Entity } from '@/types/entity'

import type { CustomScene } from './index'

export interface IntersectionResult {
  entity: Entity
  distance: number
  uv?: { x: number; y: number }
  point: { x: number; y: number; z: number }
  objectName: string
}

export class InteractionManager {
  // Raycaster state
  private raycaster = new Raycaster()
  private mouse = new Vector2()

  // Mouse & Camera dragging state
  private isCameraDragging = false
  private isSelecting = false
  private startX = 0
  private startY = 0
  private dragDeltaX = 0
  private dragDeltaY = 0
  private zoomDelta = 0
  private onClickCallback?: (e: MouseEvent) => void

  // Keyboard state
  private keys = { w: false, a: false, s: false, d: false }

  // Orbit state
  private radius = 5
  private theta = 0
  private phi = Math.PI / 2
  private readonly minRadius = 1.125
  private readonly maxRadius = 20
  private readonly minPhi = 0.5
  private readonly maxPhi = Math.PI - 0.5
  private readonly zoomSpeed = 0.0015
  private readonly keyOrbitSpeed = 0.03
  private readonly mouseOrbitSpeed = 0.0025

  private sceneCore: CustomScene
  private container: HTMLElement

  constructor(sceneCore: CustomScene, container: HTMLElement) {
    this.sceneCore = sceneCore
    this.container = container
    this.attachEvents()
  }

  public onClick(callback: (e: MouseEvent) => void): void {
    this.onClickCallback = callback
  }

  // --- MOUSE EVENTS ---
  private onMouseDown = (e: Event): void => {
    const mouseEvent = e as MouseEvent

    // Left button (0) for selection, middle button (1) for camera
    if (mouseEvent.button === 0) {
      this.isSelecting = true
      this.startX = mouseEvent.clientX
      this.startY = mouseEvent.clientY
    } else if (mouseEvent.button === 1) {
      mouseEvent.preventDefault()
      this.isCameraDragging = true
      this.startX = mouseEvent.clientX
      this.startY = mouseEvent.clientY
    }
  }

  private onMouseUp = (e: Event): void => {
    const mouseEvent = e as MouseEvent

    if (mouseEvent.button === 0 && this.isSelecting) {
      this.isSelecting = false
      const dx = mouseEvent.clientX - this.startX
      const dy = mouseEvent.clientY - this.startY
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Se o arraste foi insignificante (menos de 5 pixels), trata-se de um clique
      if (dist < 5 && this.onClickCallback) {
        this.onClickCallback(mouseEvent)
      }
    } else if (mouseEvent.button === 1 && this.isCameraDragging) {
      this.isCameraDragging = false
    }
  }

  private onMouseMove = (e: Event): void => {
    const mouseEvent = e as MouseEvent

    if (this.isCameraDragging) {
      this.dragDeltaX += mouseEvent.movementX
      this.dragDeltaY += mouseEvent.movementY
    }
  }

  private onWheel = (e: Event): void => {
    const wheelEvent = e as WheelEvent
    wheelEvent.preventDefault() // Evita o scroll da página
    this.zoomDelta += wheelEvent.deltaY
  }

  // --- KEYBOARD EVENTS ---
  private handleKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase()
    if (key in this.keys) {
      this.keys[key as keyof typeof this.keys] = true
    }
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase()
    if (key in this.keys) {
      this.keys[key as keyof typeof this.keys] = false
    }
  }

  private attachEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    this.container.addEventListener('mousedown', this.onMouseDown)
    this.container.addEventListener('mouseup', this.onMouseUp)
    this.container.addEventListener('mousemove', this.onMouseMove)
    this.container.addEventListener('wheel', this.onWheel, { passive: false })
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    this.container.removeEventListener('mousedown', this.onMouseDown)
    this.container.removeEventListener('mouseup', this.onMouseUp)
    this.container.removeEventListener('mousemove', this.onMouseMove)
    this.container.removeEventListener('wheel', this.onWheel)
  }

  // --- UPDATE LOGIC ---
  public updateCamera(camera: PerspectiveCamera): void {
    const distMultiplier = camera.position.length() / 10
    const keySpeed = this.keyOrbitSpeed * distMultiplier

    // 1. Rotação via Teclado
    if (this.keys.a) this.theta -= keySpeed
    if (this.keys.d) this.theta += keySpeed
    if (this.keys.w) this.phi -= keySpeed
    if (this.keys.s) this.phi += keySpeed

    // 2. Rotação via Mouse (Drag)
    if (this.dragDeltaX !== 0) {
      this.theta -= this.dragDeltaX * this.mouseOrbitSpeed
    }
    if (this.dragDeltaY !== 0) {
      this.phi -= this.dragDeltaY * this.mouseOrbitSpeed
    }

    // 3. Zoom via Mouse (Wheel)
    if (this.zoomDelta !== 0) {
      this.radius += this.zoomDelta * this.zoomSpeed * distMultiplier * 1.5
      this.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.radius))
    }

    // Limitar o ângulo polar (phi)
    this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, this.phi))

    // Atualizar posição da câmera
    camera.position.set(
      this.radius * Math.sin(this.phi) * Math.sin(this.theta),
      this.radius * Math.cos(this.phi),
      this.radius * Math.sin(this.phi) * Math.cos(this.theta),
    )
    camera.lookAt(0, 0, 0)

    // Resetar deltas
    this.dragDeltaX = 0
    this.dragDeltaY = 0
    this.zoomDelta = 0
  }

  public getCameraState() {
    return { radius: this.radius, theta: this.theta, phi: this.phi }
  }

  public setCameraState(radius: number, theta: number, phi: number) {
    this.radius = radius
    this.theta = theta
    this.phi = phi
  }

  public getIntersections(
    clientX: number,
    clientY: number,
    entities: Entity[],
  ): IntersectionResult[] {
    const rect = this.container.getBoundingClientRect()

    // Normalize coordinates to -1 to 1
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.sceneCore.camera)

    const results: IntersectionResult[] = []

    for (const entity of entities) {
      if (!entity.group) continue

      const intersects = this.raycaster.intersectObject(entity.group, true)
      for (const hit of intersects) {
        results.push({
          entity,
          distance: hit.distance,
          uv: hit.uv ? { x: hit.uv.x, y: hit.uv.y } : undefined,
          point: { x: hit.point.x, y: hit.point.y, z: hit.point.z },
          objectName: hit.object.name,
        })
      }
    }

    // Sort by distance to return closest hits first
    results.sort((a, b) => a.distance - b.distance)

    return results
  }
}

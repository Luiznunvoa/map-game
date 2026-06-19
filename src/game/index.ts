import { bg } from '@/assets'
import type { NormalizedColor, RichMapData, WorldData } from '@/types/data'
import type { Entity } from '@/types/entity'
import type { GameEventHandler, IGameEngine } from '@/types/game'
import type { MapColorMode } from '@/types/globe'

import { StaticBackground } from './entities/background'
import { Map3D } from './entities/globe'
import { CustomScene, type FrameState } from './scene'
import { InteractionManager } from './scene/interaction-manager'

export class GameEngine implements IGameEngine {
  public container: HTMLElement
  private nextEntityId = 1

  public scene!: CustomScene
  public interaction!: InteractionManager
  public map: Map3D | null = null
  public entities: Entity[] = []

  public mapData!: RichMapData
  public worldData: WorldData | null = null
  public colorMode: MapColorMode = 'political'

  public onEvent?: GameEventHandler
  public onFrame?: (fps: number) => void

  private lastFps = 0

  constructor(
    container: HTMLElement,
    worldData: WorldData,
    mapData: RichMapData,
    colorMode: MapColorMode = 'political',
  ) {
    this.container = container
    this.worldData = worldData
    this.mapData = mapData
    this.colorMode = colorMode

    const background = new StaticBackground(this.generateEntityId(), this.container, bg)

    this.entities.push(background)

    this.map = new Map3D(this.generateEntityId(), this.mapData, {
      radius: 1.0,
      widthSegments: 128,
      heightSegments: 64,
      initialColorMode: this.colorMode,
    })

    this.setColorMode(this.colorMode)

    this.scene = new CustomScene(this.container, {
      camera: {
        fov: 20,
        near: 0.1,
        far: 1000,
      },
      entities: [...this.entities],
      onFrame: this.handleFrameTick,
    })

    this.scene.setEntities([this.map, ...this.entities])

    this.interaction = new InteractionManager(this.scene, this.container)
    this.interaction.onClick(this.onClick)
  }

  private onClick = (event: MouseEvent): void => {
    if (!this.container || !this.interaction) return

    const raycastEntities = this.map ? [this.map, ...this.entities] : this.entities
    const hits = this.interaction.getIntersections(event.clientX, event.clientY, raycastEntities)
    if (hits.length === 0) return

    // Procurar se atingimos o mapa (a esfera da província)
    const mapHit = hits.find(
      (hit) => hit.entity === this.map && hit.objectName === 'province-sphere',
    )

    if (mapHit && mapHit.uv && this.map) {
      const provinceId = this.map.pickProvinceAt(mapHit.uv.x, mapHit.uv.y)

      if (provinceId > 0) {
        this.map.selectProvince(provinceId)
      }
    }
  }

  private handleFrameTick = (state: FrameState): void => {
    const currentObject = this.map?.group
    if (currentObject?.rotation && state.camera.position.length() > 8) {
      currentObject.rotation.y += 0.001
    }

    this.interaction.updateCamera(state.camera)
    this.map?.updateTime(performance.now() / 1000)

    if (this.onFrame && state.fps !== this.lastFps) {
      this.lastFps = state.fps
      this.onFrame(state.fps)
    }
  }

  public setColorMode(viewName: MapColorMode): void {
    if (!this.worldData) return

    let customColors: Record<number, NormalizedColor> | undefined

    if (viewName === 'political') {
      customColors = {}
      for (const prov of this.worldData.provinces) {
        if (prov.owner && this.worldData.countries) {
          const ownerCountry = this.worldData.countries.find((c) => c.tag === prov.owner)
          if (ownerCountry) {
            customColors[prov.id] = ownerCountry.color
          }
        }
      }
    }

    this.colorMode = viewName
    this.map?.setColorMode(viewName, customColors)
  }

  public generateEntityId(): number {
    return this.nextEntityId++
  }

  start(): void {
    this.scene.resume()
  }

  stop(): void {
    this.scene.pause()
  }

  async unload(): Promise<void> {
    this.interaction.dispose()
    this.scene.dispose()
    for (const entity of this.entities) {
      entity.dispose()
    }
    this.map?.dispose()
  }
}

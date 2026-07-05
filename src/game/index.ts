import { bg } from '@/assets'
import type { RichMapData, WorldData } from '@/types/data'
import type { Entity } from '@/types/entity'
import type { GameEventHandler, IGameEngine, GameEvent } from '@/types/game'
import type { MapColorMode } from '@/types/globe'

import { StaticBackground } from './entities/background'
import { Map3D } from './entities/globe'
import { CustomScene, type FrameState } from './scene'
import { InteractionManager } from './scene/interaction-manager'
import { processColorMode } from './processors/color-processor'

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

    this.entities.push(this.map)

    this.setColorMode(this.colorMode)

    this.scene = new CustomScene(this.container, {
      camera: {
        fov: 20,
        near: 0.1,
        far: 1000,
      },
      entities: this.entities,
      onFrame: this.handleFrameTick,
    })

    this.interaction = new InteractionManager(this.scene, this.container)
    this.interaction.onClick(this.onClick)
    this.interaction.onSpecialKey(this.onSpecialKey)
  }

  private onSpecialKey = (key: string): void => {
    if (this.onEvent) {
      this.onEvent({ type: 'SPECIAL_KEY', payload: { key } })
    }
  }

  private onClick = (event: MouseEvent): void => {
    if (!this.container || !this.interaction) return

    const hits = this.interaction.getIntersections(event.clientX, event.clientY, this.entities)
    if (hits.length === 0) return

    const firstHit = hits[0]
    
    if (firstHit.entity.onClick) {
      const generatedEvents = firstHit.entity.onClick(firstHit)
      
      if (generatedEvents) {
        for (const e of generatedEvents) {
          this.handleEntityEvent(e)
        }
      }
    }
  }

  private handleEntityEvent(event: GameEvent): void {
    if (event.type === 'SELECT_PROVINCE') {
      if (this.onEvent) {
        this.onEvent(event)
      }

      if (this.worldData) {
        const prov = this.worldData.provinces.find(p => p.id === event.payload.province_id)
        if (prov && prov.owner) {
          if (this.onEvent) {
            this.onEvent({ type: 'SELECT_COUNTRY', payload: { country_id: prov.owner } })
          }
        }
      }
    } else {
      if (this.onEvent) {
        this.onEvent(event)
      }
    }
  }

  private handleFrameTick = (state: FrameState): void => {
    this.interaction.updateCamera(state.camera)
    
    for (const entity of this.entities) {
      if (entity.update) {
        entity.update(state)
      }
    }

    if (this.onFrame) {
      this.onFrame(state.fps)
    }
  }

  public setColorMode(viewName: MapColorMode): void {
    if (!this.worldData) return

    const { customColors, customSecondaryColors } = processColorMode(this.worldData, viewName)

    this.colorMode = viewName
    this.map?.setColorMode(viewName, customColors, customSecondaryColors)
  }

  public setBordersVisible(visible: boolean): void {
    this.map?.setBordersVisible(visible)
  }

  public setRiversVisible(visible: boolean): void {
    this.map?.setRiversVisible(visible)
  }

  public generateEntityId(): number {
    return this.nextEntityId++
  }

  public getCameraPosition() {
    return this.interaction.getCameraState()
  }

  public setCameraPosition(radius: number, theta: number, phi: number) {
    this.interaction.setCameraState(radius, theta, phi)
  }

  public centerOnProvince(provinceId: number): void {
    if (!this.map) return

    const focus = this.map.getProvinceCameraFocus(provinceId)
    if (focus) {
      const theta = focus.baseTheta + this.map.group.rotation.y
      this.setCameraPosition(1.5, theta, focus.phi)
      console.log(this.getCameraPosition())
      this.map.selectProvince(provinceId)

      if (this.onEvent) {
        this.onEvent({ type: 'SELECT_PROVINCE', payload: { province_id: provinceId } })
      }
    }
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
  }
}

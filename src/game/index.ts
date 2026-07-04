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
        
        if (this.onEvent) {
          this.onEvent({ type: 'SELECT_PROVINCE', payload: { province_id: provinceId } })
        }

        if (this.worldData) {
          const prov = this.worldData.provinces.find(p => p.id === provinceId)
          if (prov && prov.owner) {
            if (this.onEvent) {
              this.onEvent({ type: 'SELECT_COUNTRY', payload: { country_id: prov.owner } })
            }
          }
        }
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

    if (this.onFrame) {
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
            continue
          }
        } else {
          customColors[prov.id] = [1, 1, 1]
          continue
        }
      }
    } else if (viewName === 'population') {
      customColors = {}
      let maxPop = 0
      for (const prov of this.worldData.provinces) {
        if (prov.population > maxPop) maxPop = prov.population
      }
      
      const maxLog = Math.log(maxPop + 1)
      for (const prov of this.worldData.provinces) {
        if (prov.population === 0) {
          customColors[prov.id] = [0, 0, 0]
        } else {
          const ratio = maxPop > 0 ? Math.log(prov.population + 1) / maxLog : 0
          customColors[prov.id] = [ratio, 1 - ratio, 0]
        }
      }
    } else if (viewName === 'culture') {
      customColors = {}
      
      const hexToRGB = (hex: string): NormalizedColor => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255
        ] : [1, 1, 1]
      }

      for (const prov of this.worldData.provinces) {
        if (prov.population === 0 || !prov.pops || prov.pops.length === 0) {
          customColors[prov.id] = [0, 0, 0]
          continue
        }
        
        const cultureCount: Record<string, number> = {}
        let dominantCulture = ''
        let maxPop = -1
        
        for (const pop of prov.pops) {
          cultureCount[pop.culture] = (cultureCount[pop.culture] || 0) + pop.size
          if (cultureCount[pop.culture] > maxPop) {
            maxPop = cultureCount[pop.culture]
            dominantCulture = pop.culture
          }
        }

        const hexColor = this.worldData.cultures?.[dominantCulture]?.color || '#FFFFFF'
        customColors[prov.id] = hexToRGB(hexColor)
      }
    }

    this.colorMode = viewName
    this.map?.setColorMode(viewName, customColors)
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
    this.map?.dispose()
  }
}

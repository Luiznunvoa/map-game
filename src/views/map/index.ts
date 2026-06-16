import { Raycaster, Vector2 } from 'three'

import { bg } from '@/assets'
import { KeyboardControls } from '@/controls/keyboard-control'
import { MouseControls } from '@/controls/mouse-controls'
import { OrbitControl } from '@/controls/orbit-control'
import { StaticBackground } from '@/entities/background'
import { Map3D } from '@/entities/globe'
import { CustomScene, type FrameState } from '@/lib/scene'
import { mapService } from '@/services/http/map-service'
import type { NormalizedColor, RichMapData, WorldData } from '@/types/data'
import type { Entity } from '@/types/entity'
import type { MapColorMode } from '@/types/globe'
import { PerformanceMonitor } from '@/ui/fps-counter'
import { GenericSelector } from '@/ui/selector'
import { GenericTextBox } from '@/ui/text-box'

import { handleClicks } from './handle-clicks'
import { setupControls } from './setup-controls'
import { setupElements } from './setup-elements'
import { handleFrame, setupMapEntity, setupScene } from './setup-map'
import type { MapViewContext } from './types'
import { BackButtonUI } from '@/ui/back-button'
import type { ViewEventHandler } from '@/types/view'

export class MapView implements MapViewContext {
  public onEvent?: ViewEventHandler
  public container: HTMLElement

  public keyboard!: KeyboardControls
  public mouseControls!: MouseControls 
  public orbit!: OrbitControl

  public map: Map3D | null = null
  public background: StaticBackground | null = null
  public entities: Entity[] = []
  public monitor!: PerformanceMonitor 
  public textBox!: GenericTextBox
  public mapModeSelector!: GenericSelector<MapColorMode>
  public backButton!: BackButtonUI
  
  public scene!: CustomScene
  public mapData!: RichMapData
  public colorMode: MapColorMode = 'political'
  public worldData: WorldData | null = null

  public raycaster = new Raycaster()
  public mouse = new Vector2()

  constructor(container: HTMLElement, colorMode: MapColorMode = 'political') {
    this.container = container
    this.colorMode = colorMode
  }

  async load(): Promise<void> {
    try {
      const [countriesData, provincesData, rawMapData, provincesBitmap] = await Promise.all([
        mapService.fetchCountries(),
        mapService.fetchDefinitions(),
        mapService.fetchParsedMapData(),
        mapService.fetchMapImage('/api/maps/current/provinces.png'),
      ])
      
      this.worldData = {
        countries: countriesData,
        provinces: provincesData,
      }

      this.mapData = {
        ...rawMapData,
        provincesBitmap,
        idBufferResult: {
          ...rawMapData.idBufferResult,
          idBuffer: new Uint16Array(rawMapData.idBufferResult.idBuffer.slice().buffer),
        },
      }
    } catch (e) {
      console.warn('Failed to load map data in MapView', e)
    }

    if (!this.mapData) throw new Error('Failed to load map data')

    this.background = new StaticBackground(this.container, bg)
    this.entities.push(this.background)

    setupScene(this, this.onFrame)
    setupControls(this, this.onClick)
    setupElements(this)
    setupMapEntity(this)
    
    this.backButton = new BackButtonUI(this.container, () => {
      if (this.onEvent) {
        this.onEvent({ type: 'BACK_TO_MENU' })
      }
    })
  }

  private onClick = (event: MouseEvent): void => {
    handleClicks(this, event)
  }

  private onFrame = (state: FrameState): void => {
    handleFrame(this, state)
  }

  start(): void {
    this.scene.resume()
  }

  stop(): void {
    this.scene.pause()
  }

  async unload(): Promise<void> {
    this.scene.dispose()
    this.keyboard.dispose()
    this.mouseControls.dispose()
    this.map?.dispose()
    this.background?.dispose()
    this.monitor.dispose()
    this.textBox?.dispose()
    this.mapModeSelector?.dispose()
    this.backButton?.dispose()
  }

  public setColorMode(viewName: MapColorMode): void {
    if (!this.worldData) return

    let customColors: Record<number, NormalizedColor> | undefined

    if (viewName === 'political') {
      customColors = {}
      for (const prov of this.worldData.provinces) {
        if (prov.owner && this.worldData.countries) {
          const ownerCountry = this.worldData.countries.find(c => c.tag === prov.owner)
          if (ownerCountry) {
            customColors[prov.id] = ownerCountry.color
          }
        }
      }
    }

    this.map?.setColorMode(viewName, customColors)
  }
}

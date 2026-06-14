import { Raycaster, Vector2 } from 'three'

import { KeyboardControls } from '@/controls/keyboard-control'
import { MouseControls } from '@/controls/mouse-controls'
import { OrbitControl } from '@/controls/orbit-control'
import { StaticBackground } from '@/entities/background'
import { Map3D } from '@/entities/globe'
import type { MapColorMode } from '@/entities/globe/types'
import { CustomScene, type FrameState } from '@/lib/scene'
import type { Entity } from '@/types/entity'
import { PerformanceMonitor } from '@/ui/fps-counter'
import { GenericSelector } from '@/ui/selector'
import { GenericTextBox } from '@/ui/text-box'

import { handleClicks } from './handle-clicks'
import { setupControls } from './setup-controls'
import { setupElements } from './setup-elements'
import { handleFrame, setupParser, setupScene } from './setup-map'
import type { MapViewContext } from './types'
import type { WorldData } from '@/types/data'
import type { MapParser } from '@/services/map'

export class MapView implements MapViewContext {
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
  
  public scene!: CustomScene
  public parser!: MapParser
  public colorMode: MapColorMode = 'political'
  public worldData: WorldData | null = null

  public raycaster = new Raycaster()
  public mouse = new Vector2()

  constructor(container: HTMLElement, worldData: WorldData | null = null, colorMode: MapColorMode = 'political') {
    this.container = container
    this.worldData = worldData
    this.colorMode = colorMode
  }

  async load(): Promise<void> {
    this.background = new StaticBackground(this.container, '/bg.png')
    this.entities.push(this.background)

    setupScene(this, this.onFrame)
    setupControls(this, this.onClick)
    setupElements(this)
    await setupParser(this)
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
    this.parser.dispose()
    this.map?.dispose()
    this.background?.dispose()
    this.monitor.dispose()
    this.textBox?.dispose()
    this.mapModeSelector?.dispose()
  }

  setColorMode(mode: MapColorMode): void {
    this.colorMode = mode
    let customColors: Map<number, [number, number, number]> | undefined = undefined

    if (mode === 'political' && this.worldData) {
      customColors = new Map()
      const { countries, provinces } = this.worldData
      const countryMap = new Map(countries.map(c => [c.tag, c]))
      
      for (const prov of provinces) {
        const country = countryMap.get(prov.owner)
        if (country && country.color) {
          customColors.set(prov.id, country.color)
        }
      }
    }

    this.map?.setColorMode(mode, customColors)
  }
}

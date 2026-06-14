import { Raycaster, Vector2 } from 'three'

import { KeyboardControls } from '@/controls/keyboard-control'
import { MouseControls } from '@/controls/mouse-controls'
import { OrbitControl } from '@/controls/orbit-control'
import { StaticBackground } from '@/entities/background'
import { Map3D } from '@/entities/globe'
import { CustomScene, type FrameState } from '@/lib/scene'
import type { MapParser } from '@/services/map'
import type { NormalizedColor,WorldData } from '@/types/data'
import type { Entity } from '@/types/entity'
import type { MapColorMode } from '@/types/globe'
import { PerformanceMonitor } from '@/ui/fps-counter'
import { GenericSelector } from '@/ui/selector'
import { GenericTextBox } from '@/ui/text-box'

import { handleClicks } from './handle-clicks'
import { setupControls } from './setup-controls'
import { setupElements } from './setup-elements'
import { handleFrame, setupParser, setupScene } from './setup-map'
import type { MapViewContext } from './types'

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

import { Raycaster, Vector2 } from 'three'

import { KeyboardControls } from '@/game/controls/keyboard-control'
import { MouseControls } from '@/game/controls/mouse-controls'
import { OrbitControl } from '@/game/controls/orbit-control'
import { StaticBackground } from '@/game/entities/background'
import { Map3D } from '@/game/entities/globe'
import type { MapColorMode } from '@/game/entities/globe/types'
import { MapParser } from '@/game/services/map-parser'
import type { Entity } from '@/game/types/entity'
import { PerformanceMonitor } from '@/game/ui/fps-counter'
import { GenericSelector } from '@/game/ui/selector'
import { GenericTextBox } from '@/game/ui/text-box'
import { CustomScene, type FrameState } from '@/lib/scene'

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
  public colorMode: MapColorMode = 'continent'

  public raycaster = new Raycaster()
  public mouse = new Vector2()

  constructor(container: HTMLElement, colorMode: MapColorMode = 'continent') {
    this.container = container
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
    this.map?.setColorMode(mode)
  }
}

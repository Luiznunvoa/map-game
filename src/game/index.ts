import { Raycaster, Vector2 } from 'three'

import { bg } from '@/assets'
import { CustomScene, type FrameState } from '@/lib/scene'
import type { NormalizedColor, RichMapData, WorldData } from '@/types/data'
import type { Entity } from '@/types/entity'
import type { GameEventHandler, IGameEngine } from '@/types/game'
import type { MapColorMode } from '@/types/globe'

import type { KeyboardControls } from './controls/keyboard-control'
import type { MouseControls } from './controls/mouse-controls'
import type { OrbitControl } from './controls/orbit-control'
import { StaticBackground } from './entities/background'
import type { Map3D } from './entities/globe'
import { handleClicks } from './handle-clicks'
import { setupControls } from './setup-controls'
import { setupElements } from './setup-elements'
import { handleFrame, setupMapEntity, setupScene } from './setup-map'

export class GameEngine implements IGameEngine {
  public onEvent?: GameEventHandler
  public container: HTMLElement

  public keyboard!: KeyboardControls
  public mouseControls!: MouseControls 
  public orbit!: OrbitControl

  public map: Map3D | null = null
  public background: StaticBackground | null = null
  public entities: Entity[] = []
  
  public scene!: CustomScene
  public mapData!: RichMapData
  public colorMode: MapColorMode = 'political'
  public worldData: WorldData | null = null

  public raycaster = new Raycaster()
  public mouse = new Vector2()

  constructor(container: HTMLElement, worldData: WorldData, mapData: RichMapData, colorMode: MapColorMode = 'political') {
    this.container = container
    this.colorMode = colorMode
    this.worldData = worldData
    this.mapData = mapData

    this.background = new StaticBackground(this.container, bg)
    this.entities.push(this.background)

    setupScene(this, this.onFrame)
    setupControls(this, this.onClick)
    setupElements(this)
    setupMapEntity(this)
  }

  async load(): Promise<void> {
    // Carregamento agora é feito pelo SolidJS via useMapData hook
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

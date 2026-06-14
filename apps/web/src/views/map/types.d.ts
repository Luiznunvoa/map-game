import { WorldData } from '@map-game/shared'
import { Raycaster, Vector2 } from 'three'

import { KeyboardControls } from '@/controls/keyboard-control'
import { MouseControls } from '@/controls/mouse-controls'
import { OrbitControl } from '@/controls/orbit-control'
import { StaticBackground } from '@/entities/background'
import { Map3D } from '@/entities/globe'
import type { MapColorMode, NormalizedColor } from '@/entities/globe/types'
import { CustomScene } from '@/lib/scene'
import { MapParser } from '@/services/map-parser'
import type { Entity } from '@/types/entity'
import type { IView } from '@/types/view'
import { PerformanceMonitor } from '@/ui/fps-counter'
import { GenericSelector } from '@/ui/selector'
import { GenericTextBox } from '@/ui/text-box'

export interface MapViewContext extends IView {
  container: HTMLElement
  keyboard: KeyboardControls
  mouseControls: MouseControls
  orbit: OrbitControl
  monitor: PerformanceMonitor
  map: Map3D | null
  background: StaticBackground | null
  entities: Entity[]
  scene: CustomScene
  parser: MapParser
  colorMode: MapColorMode
  worldData: WorldData | null
  textBox: GenericTextBox
  mapModeSelector: GenericSelector<MapColorMode>
  raycaster: Raycaster
  mouse: Vector2

  setColorMode(mode: MapColorMode): void
}


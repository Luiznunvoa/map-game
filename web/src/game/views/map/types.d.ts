import { Raycaster, Vector2 } from 'three'

import { KeyboardControls } from '@/game/controls/keyboard-control'
import { MouseControls } from '@/game/controls/mouse-controls'
import { OrbitControl } from '@/game/controls/orbit-control'
import { Map3D } from '@/game/entities/globe'
import type { MapColorMode } from '@/game/entities/globe/types'
import { MapParser } from '@/game/services/map-parser'
import type { Entity } from '@/game/types/entity'
import type { IView } from '@/game/types/view'
import { PerformanceMonitor } from '@/game/ui/fps-counter'
import { GenericSelector } from '@/game/ui/selector'
import { GenericTextBox } from '@/game/ui/text-box'
import { CustomScene } from '@/lib/scene'

export interface MapViewContext extends IView {
  container: HTMLElement
  keyboard: KeyboardControls
  mouseControls: MouseControls
  orbit: OrbitControl
  monitor: PerformanceMonitor
  map: Map3D | null
  entities: Entity[]
  scene: CustomScene
  parser: MapParser
  colorMode: MapColorMode
  textBox: GenericTextBox
  mapModeSelector: GenericSelector<MapColorMode>
  raycaster: Raycaster
  mouse: Vector2

  setColorMode(mode: MapColorMode): void
}


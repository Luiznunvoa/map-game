import { Raycaster, Vector2 } from 'three'

import { KeyboardControls } from '@/game/controls/keyboard-control'
import { MouseControls } from '@/game/controls/mouse-controls'
import { OrbitControl } from '@/game/controls/orbit-control'
import { StaticBackground } from '@/game/entities/background'
import { Map3D } from '@/game/entities/globe'
import type { MapColorMode, NormalizedColor } from '@/game/entities/globe/types'

export interface ProvinceData {
  id: number
  controller: string
  owner: string
}

export interface CountriesData {
  tags: Record<string, { color: NormalizedColor }>
  provinces: ProvinceData[]
}
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
  background: StaticBackground | null
  entities: Entity[]
  scene: CustomScene
  parser: MapParser
  colorMode: MapColorMode
  countryData: CountriesData | null
  textBox: GenericTextBox
  mapModeSelector: GenericSelector<MapColorMode>
  raycaster: Raycaster
  mouse: Vector2

  setColorMode(mode: MapColorMode): void
}


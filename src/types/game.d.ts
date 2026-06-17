import { Raycaster, Vector2 } from 'three'

import { KeyboardControls } from '@/controls/keyboard-control'
import { MouseControls } from '@/controls/mouse-controls'
import { OrbitControl } from '@/controls/orbit-control'
import { StaticBackground } from '@/entities/background'
import { Map3D } from '@/entities/globe'
import { CustomScene } from '@/lib/scene'
import type { RichMapData, WorldData } from '@/types/data'
import type { Entity } from '@/types/entity'
import type { MapColorMode } from '@/types/globe'
import type { IView } from '@/types/view'

export type GameEvent = 
  | { type: 'NAVIGATE'; payload: { to: string } }
  // | { type: 'SELECT_PROVINCE'; payload: { id: number } }
  // | { type: 'MOVE_TROOP'; payload: { troop_id: number, destiny_id: number }}


export type GameEventHandler = (event: GameEvent) => void

export interface IGameEngine extends IView {
  container: HTMLElement
  keyboard: KeyboardControls
  mouseControls: MouseControls
  orbit: OrbitControl
  map: Map3D | null
  background: StaticBackground | null
  entities: Entity[]
  scene: CustomScene
  mapData: RichMapData
  colorMode: MapColorMode
  worldData: WorldData | null
  raycaster: Raycaster
  mouse: Vector2

  onEvent?: GameEventHandler;
  onFrame?: (fps: number) => void;
  load(): Promise<void>
  unload(): Promise<void> | void
  start(): void
  stop(): void
}

export type GameConstructor<T> = new (...args: unknown[]) => T

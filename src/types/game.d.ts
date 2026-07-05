import { Map3D } from '@/entities/globe'
import type { CustomScene } from '@/game/scene'
import type { InteractionManager } from '@/game/scene/interaction-manager'
import type { InteractionManager } from '@/game/scene/interaction-manager'
import type { RichMapData, WorldData } from '@/types/data'
import type { Entity } from '@/types/entity'
import type { MapColorMode } from '@/types/globe'
import type { IView } from '@/types/view'

export type GameEvent =
  | { type: 'NAVIGATE'; payload: { to: string } }
  | { type: 'SELECT_COUNTRY'; payload: { country_id: string } }
  | { type: 'SELECT_PROVINCE'; payload: { province_id: number } }
  | { type: 'SPECIAL_KEY'; payload: { key: string } }
// | { type: 'MOVE_TROOP'; payload: { troop_id: number, destiny_id: number }}

export type GameEventHandler = (event: GameEvent) => void

export interface IGameEngine extends IView {
  container: HTMLElement

  scene: CustomScene
  interaction: InteractionManager
  map: Map3D | null
  entities: Entity[]

  mapData: RichMapData
  worldData: WorldData | null
  colorMode: MapColorMode

  onEvent?: GameEventHandler
  onFrame?: (fps: number) => void

  unload(): Promise<void> | void
  start(): void
  stop(): void
  setColorMode(viewName: MapColorMode): void
  generateEntityId(): number
  getCameraPosition(): { radius: number; theta: number; phi: number }
  setCameraPosition(radius: number, theta: number, phi: number): void
  centerOnProvince(provinceId: number): void
}

export type GameConstructor<T> = new (...args: unknown[]) => T

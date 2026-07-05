import { Object3D } from 'three'

import type { IntersectionResult } from '@/game/scene/interaction-manager'
import type { GameEvent } from '@/types/game'

export interface Entity {
  id: number
  type: string
  group: Object3D
  update?(state: import('@/game/scene').FrameState): void
  onClick?(hit: IntersectionResult): GameEvent[] | void
  dispose(): void
}

import { KeyboardControls } from '@/game/controls/keyboard-control'
import { MouseControls } from '@/game/controls/mouse-controls'
import { OrbitControl } from '@/game/controls/orbit-control'

import type { MapViewContext } from './types'

export function setupControls(ctx: MapViewContext, onClick: (event: MouseEvent) => void): void {
  ctx.keyboard = new KeyboardControls()
  ctx.mouseControls = new MouseControls(ctx.container)
  ctx.orbit = new OrbitControl(5)
  
  ctx.mouseControls.onClick(onClick)
}

import { KeyboardControls } from '@/controls/keyboard-control'
import { MouseControls } from '@/controls/mouse-controls'
import { OrbitControl } from '@/controls/orbit-control'

import type { MapViewContext } from './types'

export function setupControls(ctx: MapViewContext, onClick: (event: MouseEvent) => void): void {
  ctx.keyboard = new KeyboardControls()
  ctx.mouseControls = new MouseControls(ctx.container)
  ctx.orbit = new OrbitControl(5)
  
  ctx.mouseControls.onClick(onClick)
}

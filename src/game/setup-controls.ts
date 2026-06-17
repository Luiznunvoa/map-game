import type { IGameEngine } from '@/types/game'

import { KeyboardControls } from './controls/keyboard-control'
import { MouseControls } from './controls/mouse-controls'
import { OrbitControl } from './controls/orbit-control'


export function setupControls(ctx: IGameEngine, onClick: (event: MouseEvent) => void): void {
  ctx.keyboard = new KeyboardControls()
  ctx.mouseControls = new MouseControls(ctx.container)
  ctx.orbit = new OrbitControl(5)
  
  ctx.mouseControls.onClick(onClick)
}

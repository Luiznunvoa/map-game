import type { MapColorMode } from '@/game/entities/globe/types'
import { PerformanceMonitor } from '@/game/ui/fps-counter'
import { GenericSelector } from '@/game/ui/selector'
import { GenericTextBox } from '@/game/ui/text-box'

import type { MapViewContext } from './types'

export function setupElements(ctx: MapViewContext): void {
  ctx.monitor = new PerformanceMonitor(ctx.container)
  ctx.textBox = new GenericTextBox(ctx.container, 'No province selected')

  ctx.mapModeSelector = new GenericSelector<MapColorMode>({
    container: ctx.container,
    options: [
      { value: 'political', label: 'Political' },
      { value: 'continent', label: 'Continents' },
      { value: 'province', label: 'Provinces' },
      { value: 'terrain', label: 'Terrain' },
    ],
    initialValue: ctx.colorMode,
    title: 'Modes',
    onChange: (mode) => {
      ctx.setColorMode(mode)
    },
  })
}

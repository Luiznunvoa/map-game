import type { MapColorMode } from '@/entities/globe/types'
import { PerformanceMonitor } from '@/ui/fps-counter'
import { GenericSelector } from '@/ui/selector'
import { GenericTextBox } from '@/ui/text-box'

import type { MapViewContext } from './types'

export function setupElements(ctx: MapViewContext): void {
  ctx.monitor = new PerformanceMonitor(ctx.container)
  ctx.textBox = new GenericTextBox(ctx.container, 'No province selected')

  ctx.mapModeSelector = new GenericSelector<MapColorMode>({
    container: ctx.container,
    options: [
      { value: 'political', label: 'Political' },
      { value: 'continent', label: 'Continents' },
      { value: 'region', label: 'Regions' },
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

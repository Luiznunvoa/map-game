import type { MapColorMode } from '@/types/globe'
import { Select } from '@/components/ui/select'

interface MapModeSelectProps {
  onModeChange: (mode: MapColorMode) => void
}

export function MapModeSelect(props: MapModeSelectProps) {
  return (
    <Select
      class="bg-gray-900/90 py-1.5 text-sm shadow pointer-events-auto"
      onChange={(e) => props.onModeChange(e.currentTarget.value as MapColorMode)}
    >
      <option value="political">Political Map</option>
      <option value="terrain">Terrain Map</option>
      <option value="province">Province Map</option>
      <option value="continent">Continent Map</option>
      <option value="region">Region Map</option>
      <option value="population">Population Map</option>
      <option value="culture">Culture Map</option>
    </Select>
  )
}

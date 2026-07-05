import { createSignal, Show } from 'solid-js'

import { bg } from '@/assets'
import { Loading } from '@/components/features/loading'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers/AuthProvider'
import { FpsCounter } from '../features/rooms/fps-counter'
import { ProvincePanel } from '../features/rooms/province-panel'
import { MapModeSelect } from '../features/rooms/map-mode-select'
import { ProvinceSearch } from '../features/rooms/province-search'
import { MapSettings } from '../features/rooms/map-settings'
import { useGameEngine } from '@/hooks/use-game-engine'

export function RoomPage() {
  const [showBorders, setShowBorders] = createSignal(true)
  const [showRivers, setShowRivers] = createSignal(true)
  const { logout } = useAuth()

  const {
    fps,
    selectedProvinceId,
    setContainerRef,
    mapDataResource,
    engine,
  } = useGameEngine({ showBorders, showRivers })

  return (
    <div
      class="relative h-screen w-full overflow-hidden"
      style={{ 'background-image': `url('${bg}')` }}
    >
      <Show when={mapDataResource()} fallback={<Loading message="LOADING MAP..." />}>
        {/* Canvas */}
        <div ref={setContainerRef} class="absolute inset-0" />
      </Show>

      {/* UI Overlay */}
      <div class="absolute top-0 left-0 right-0 p-4 flex justify-between pointer-events-none z-10">
        <div class="flex flex-col gap-6 pointer-events-auto">
          <FpsCounter fps={fps} />

          <MapModeSelect onModeChange={(mode) => engine()?.setColorMode(mode)} />

          <ProvinceSearch onSearch={(id) => engine()?.centerOnProvince(id)} />

          <MapSettings
            showBorders={showBorders()}
            showRivers={showRivers()}
            onBordersChange={setShowBorders}
            onRiversChange={setShowRivers}
          />
        </div>
        <Button
          class="bg-red-600 hover:bg-red-700 py-1.5 px-4 h-fit text-sm shadow pointer-events-auto"
          onClick={() => logout()}
        >
          Sair
        </Button>
      </div>

      {/* Bottom Left Overlay */}
      <div class="absolute bottom-0 right-0 p-4 pointer-events-none z-10">
        <ProvincePanel
          provinceId={selectedProvinceId()}
          mapData={mapDataResource()?.mapData}
          worldData={mapDataResource()?.worldData}
        />
      </div>
    </div>
  )
}


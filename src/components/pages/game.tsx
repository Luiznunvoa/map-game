import { useNavigate } from '@solidjs/router'
import { createEffect, createSignal, onCleanup, Show } from 'solid-js'

import { bg } from '@/assets'
import { Loading } from '@/components/features/loading'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { GameEngine } from '@/game'
import { useMapData } from '@/hooks/map/useMapData'
import { useCameraStorage } from '@/hooks/map/useCameraStorage'
import { useAuth } from '@/components/providers/AuthProvider'
import type { GameEvent } from '@/types/game'
import type { MapColorMode } from '@/types/globe'
import { FpsCounter } from '../features/rooms/fps-counter'
import { ProvincePanel } from '../features/rooms/province-panel'

export function RoomPage() {
  const [fps, setFps] = createSignal(0)
  const [selectedProvinceId, setSelectedProvinceId] = createSignal<number | null>(null)
  const [showBorders, setShowBorders] = createSignal(true)
  const [showRivers, setShowRivers] = createSignal(true)
  const navigate = useNavigate()
  const { logout } = useAuth()

  let containerRef!: HTMLDivElement
  let engine: GameEngine | null = null

  const { updateStoredCameraPosition, getStoredCameraPosition } = useCameraStorage()

  const mapDataResource = useMapData()

  function handleFrame(fps: number) {
    setFps(fps)
  }

  const saveCameraState = () => {
    if (engine) {
      updateStoredCameraPosition(engine.getCameraPosition())
    }
  }

  createEffect(() => {
    window.addEventListener('beforeunload', saveCameraState)
    onCleanup(() => {
      window.removeEventListener('beforeunload', saveCameraState)
    })
  })

  createEffect(() => {
    const data = mapDataResource()
    if (data && containerRef && !engine) {
      console.log("Entrando no mapa do jogo")

      engine = new GameEngine(containerRef, data.worldData, data.mapData)

      const savedCamera = getStoredCameraPosition()
      if (savedCamera) {
        engine.setCameraPosition(savedCamera.radius, savedCamera.theta, savedCamera.phi)
      }

      engine.onEvent = (event: GameEvent) => {
        if (event.type === 'NAVIGATE') {
          navigate(event.payload.to)
        }
        if (event.type === 'SELECT_PROVINCE') {
          setSelectedProvinceId(event.payload.province_id)
        }
      }

      engine.onFrame = (currentFps: number) => {
        handleFrame(currentFps)
      }

      engine.setBordersVisible(showBorders())
      engine.setRiversVisible(showRivers())

      engine.start()
    }
  })

  onCleanup(async () => {
    if (engine) {
      engine.stop()
      await engine.unload()
      engine = null
    }
  })

  return (
    <div
      class="relative h-screen w-full overflow-hidden"
      style={{ 'background-image': `url('${bg}')` }}
    >
      <Show when={mapDataResource()} fallback={<Loading message="LOADING MAP..." />}>
        {/* Canvas */}
        <div ref={containerRef} class="absolute inset-0" />
      </Show>

      {/* UI Overlay */}
      <div class="absolute top-0 left-0 right-0 p-4 flex justify-between pointer-events-none z-10">
        <div class="flex flex-col gap-6 pointer-events-auto">
          <FpsCounter fps={fps} />

          <Select
            class="bg-gray-900/90 py-1.5 text-sm shadow pointer-events-auto"
            onChange={(e) => engine?.setColorMode(e.currentTarget.value as MapColorMode)}
          >
            <option value="political">Political Map</option>
            <option value="terrain">Terrain Map</option>
            <option value="province">Province Map</option>
            <option value="continent">Continent Map</option>
            <option value="region">Region Map</option>
          </Select>

          <div class="flex flex-col gap-2 pointer-events-auto bg-gray-900/90 p-3 rounded shadow text-sm text-white">
            <div class="font-semibold text-xs text-gray-400 uppercase tracking-wider mb-1">Search</div>
            <div class="flex items-center gap-2">
              <input
                type="text"
                placeholder="Province ID"
                class="bg-gray-800 text-white px-2 py-1 rounded w-28 outline-none border border-gray-700 focus:border-red-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const id = parseInt(e.currentTarget.value)
                    if (!isNaN(id)) engine?.centerOnProvince(id)
                    e.currentTarget.value = ''
                    e.currentTarget.blur()
                  }
                }}
              />
              <Button
                class="bg-red-600 hover:bg-red-700 py-1 px-3 text-xs h-auto"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement
                  const id = parseInt(input.value)
                  if (!isNaN(id)) engine?.centerOnProvince(id)
                  input.value = ''
                  input.blur()
                }}
              >
                Go
              </Button>
            </div>
          </div>

          <div class="flex flex-col gap-2 pointer-events-auto bg-gray-900/90 p-3 rounded shadow text-sm text-white">
            <label class="flex items-center gap-2 cursor-pointer hover:text-gray-300">
              <input type="checkbox" checked={showBorders()} onChange={(e) => {
                setShowBorders(e.currentTarget.checked);
                engine?.setBordersVisible(e.currentTarget.checked);
              }} class="accent-red-600" />
              Show Province Borders
            </label>
            <label class="flex items-center gap-2 cursor-pointer hover:text-gray-300">
              <input type="checkbox" checked={showRivers()} onChange={(e) => {
                setShowRivers(e.currentTarget.checked);
                engine?.setRiversVisible(e.currentTarget.checked);
              }} class="accent-red-600" />
              Show Rivers
            </label>
          </div>
        </div>
        <Button
          class="bg-red-600 hover:bg-red-700 py-1.5 px-4 h-fit text-sm shadow pointer-events-auto"
          onClick={() => logout()}
        >
          Sair
        </Button>
      </div>

      {/* Bottom Left Overlay */}
      <div class="absolute bottom-0 left-0 p-4 pointer-events-none z-10">
        <ProvincePanel
          provinceId={selectedProvinceId()}
          mapData={mapDataResource()?.mapData}
          worldData={mapDataResource()?.worldData}
        />
      </div>
    </div>
  )
}


import { useNavigate } from '@solidjs/router'
import { createEffect, createSignal, onCleanup, Show } from 'solid-js'

import { bg } from '@/assets'
import { Loading } from '@/components/features/loading'
import { Button } from '@/components/ui/button'
import { GameEngine } from '@/game'
import { useMapData } from '@/hooks/map/useMapData'
import { useCameraStorage } from '@/hooks/map/useCameraStorage'
import { useAuth } from '@/components/providers/AuthProvider'
import type { GameEvent } from '@/types/game'
import { FpsCounter } from '../features/rooms/fps-counter'
import { ProvincePanel } from '../features/rooms/province-panel'
import { MapModeSelect } from '../features/rooms/map-mode-select'
import { ProvinceSearch } from '../features/rooms/province-search'
import { MapSettings } from '../features/rooms/map-settings'

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProvinceId(null)
        if (engine && engine.map) {
          engine.map.selectProvince(0)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown)
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

          <MapModeSelect onModeChange={(mode) => engine?.setColorMode(mode)} />

          <ProvinceSearch onSearch={(id) => engine?.centerOnProvince(id)} />

          <MapSettings
            showBorders={showBorders()}
            showRivers={showRivers()}
            onBordersChange={(show) => {
              setShowBorders(show)
              engine?.setBordersVisible(show)
            }}
            onRiversChange={(show) => {
              setShowRivers(show)
              engine?.setRiversVisible(show)
            }}
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


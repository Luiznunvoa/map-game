import { createEffect, createSignal, onCleanup, type Accessor } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { GameEngine } from '@/game'
import { useMapData } from '@/hooks/map/useMapData'
import { useCameraStorage } from '@/hooks/map/useCameraStorage'
import type { GameEvent } from '@/types/game'

interface UseGameEngineProps {
  showBorders: Accessor<boolean>
  showRivers: Accessor<boolean>
}

export function useGameEngine(props: UseGameEngineProps) {
  const [fps, setFps] = createSignal(0)
  const [selectedProvinceId, setSelectedProvinceId] = createSignal<number | null>(null)
  const [containerRef, setContainerRef] = createSignal<HTMLDivElement>()
  const [engine, setEngine] = createSignal<GameEngine | null>(null)

  const navigate = useNavigate()
  const { updateStoredCameraPosition, getStoredCameraPosition } = useCameraStorage()
  const mapDataResource = useMapData()

  const saveCameraState = () => {
    const currentEngine = engine()
    if (currentEngine) {
      updateStoredCameraPosition(currentEngine.getCameraPosition())
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
    const container = containerRef()
    const currentEngine = engine()

    if (data && container && !currentEngine) {
      console.log("Entrando no mapa do jogo")

      const newEngine = new GameEngine(container, data.worldData, data.mapData)
      setEngine(newEngine)

      const savedCamera = getStoredCameraPosition()
      if (savedCamera) {
        newEngine.setCameraPosition(savedCamera.radius, savedCamera.theta, savedCamera.phi)
      }

      newEngine.onEvent = (event: GameEvent) => {
        if (event.type === 'NAVIGATE') {
          navigate(event.payload.to)
        }
        if (event.type === 'SELECT_PROVINCE') {
          setSelectedProvinceId(event.payload.province_id)
        }
        if (event.type === 'SPECIAL_KEY' && event.payload.key === 'Escape') {
          setSelectedProvinceId(null)
          if (newEngine.map) {
            newEngine.map.selectProvince(0)
          }
        }
      }

      newEngine.onFrame = (currentFps: number) => {
        setFps(currentFps)
      }

      newEngine.start()
    }
  })

  createEffect(() => {
    const currentEngine = engine()
    if (currentEngine) {
      currentEngine.setBordersVisible(props.showBorders())
    }
  })

  createEffect(() => {
    const currentEngine = engine()
    if (currentEngine) {
      currentEngine.setRiversVisible(props.showRivers())
    }
  })

  onCleanup(async () => {
    const currentEngine = engine()
    if (currentEngine) {
      currentEngine.stop()
      await currentEngine.unload()
    }
  })

  return {
    fps,
    selectedProvinceId,
    setContainerRef,
    mapDataResource,
    engine,
  }
}

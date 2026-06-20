import { useNavigate, useParams } from '@solidjs/router'
import { createEffect, createSignal, onCleanup, Show } from 'solid-js'

import { bg } from '@/assets'
import { Loading } from '@/components/features/loading'
import { PlayerTable } from '@/components/features/rooms/player-table'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { GameEngine } from '@/game'
import { useMapData } from '@/hooks/map/useMapData'
import { useLeaveRoom } from '@/hooks/rooms/use-leave-room'
import { useGameSessionWs } from '@/hooks/rooms/use-game-session-ws'
import { useGameTime } from '@/hooks/rooms/use-game-time'
import type { GameEvent } from '@/types/game'
import type { MapColorMode } from '@/types/globe'

export function RoomPage() {
  const params: { id: string } = useParams()
  const navigate = useNavigate()
  let containerRef!: HTMLDivElement
  let engine: GameEngine | null = null

  const {
    mutate: leaveRoom,
    resource: leaveRoomResource,
  } = useLeaveRoom(() => navigate('/lobby'))

  // Per-room WebSocket — tracks connected players and handles room closure
  const { players } = useGameSessionWs(
    () => params.id,
    () => navigate('/lobby'), // called when host leaves and room_closed is broadcast
  )

  const { date, period, speed, isPaused, play, pause, changeSpeed } = useGameTime()

  const mapDataResource = useMapData(() => params.id)
  const [fps, setFps] = createSignal(0)

  function handleFrame(fps: number) {
    setFps(fps)
  }

  createEffect(() => {
    const data = mapDataResource()
    if (data && containerRef && !engine) {
      console.log(`Entrando na sala: ${params.id}`)

      engine = new GameEngine(containerRef, data.worldData, data.mapData)

      engine.onEvent = (event: GameEvent) => {
        if (event.type === 'NAVIGATE') {
          navigate(event.payload.to)
        }
      }

      engine.onFrame = (currentFps: number) => {
        handleFrame(currentFps)
      }

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
        {/* Left: FPS + Player Table */}
        <div class="flex flex-col gap-2 pointer-events-auto">
          <div class="bg-gray-900/90 text-white px-3 py-1 rounded border border-gray-700 font-mono text-sm shadow">
            FPS: {fps()}
          </div>
          <PlayerTable players={players()} />
        </div>

        {/* Center: Game Clock */}
        <div class="flex flex-col items-center gap-1 pointer-events-auto mt-2">
          <div class="bg-gray-900/90 text-white px-4 py-2 rounded border border-gray-700 shadow flex items-center gap-4">
            <div class="flex flex-col items-center min-w-[100px]">
              <span class="text-xs text-gray-400 font-bold uppercase tracking-wider">
                {period() === 0 && 'Manhã'}
                {period() === 1 && 'Tarde'}
                {period() === 2 && 'Noite'}
                {period() === 3 && 'Madrugada'}
              </span>
              <span class="font-mono text-lg font-bold">{date()}</span>
            </div>
            
            <div class="flex items-center gap-2 border-l border-gray-700 pl-4">
              <Show when={isPaused()} fallback={
                <button onClick={() => pause()} class="px-3 py-1.5 bg-yellow-600/20 text-yellow-500 rounded hover:bg-yellow-600/40 transition-colors font-bold text-sm">
                  PAUSE
                </button>
              }>
                <button onClick={() => play()} class="px-3 py-1.5 bg-green-600/20 text-green-500 rounded hover:bg-green-600/40 transition-colors font-bold text-sm">
                  PLAY
                </button>
              </Show>
              
              <div class="flex items-center gap-1 bg-gray-800 rounded p-1 ml-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    class={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                      speed() === s ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                    onClick={() => changeSpeed(s)}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: map mode selector + leave button */}
        <div class="flex gap-3 pointer-events-auto items-start">
          <Select
            class="bg-gray-900/90 py-1.5 text-sm shadow"
            onChange={(e) => engine?.setColorMode(e.currentTarget.value as MapColorMode)}
          >
            <option value="political">Modo Político</option>
            <option value="terrain">Modo Terreno</option>
            <option value="province">Modo Províncias</option>
            <option value="continent">Modo Continentes</option>
            <option value="region">Modo Regiões</option>
          </Select>

          <Button
            class="bg-red-600 hover:bg-red-700 py-1.5 px-4 text-sm shadow"
            disabled={leaveRoomResource.loading}
            onClick={() => leaveRoom({ room_id: params.id as string })}
          >
            {leaveRoomResource.loading ? 'Saindo...' : 'Sair da Sala'}
          </Button>
        </div>
      </div>
    </div>
  )
}

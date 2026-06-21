import { useNavigate, useParams } from '@solidjs/router'
import { createEffect, createSignal, onCleanup, Show } from 'solid-js'

import { bg } from '@/assets'
import { Loading } from '@/components/features/loading'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { getCookie } from '@/lib/utils/cookies'
import { getJwtPayload } from '@/lib/utils/jwt'
import { GameEngine } from '@/game'
import { useMapData } from '@/hooks/map/useMapData'
import { useLeaveRoom } from '@/hooks/rooms/use-leave-room'
import type { GameEvent } from '@/types/game'
import type { MapColorMode } from '@/types/globe'
import { FpsCounter } from '../features/rooms/fps-counter'
import { PlayerTable } from '../features/rooms/player-table'
import { GameClock } from '../features/rooms/game-clock'
import { useRoomLobby } from '@/hooks/rooms/use-room-lobby'
import { useGameTime } from '@/hooks/rooms/use-game-time'

export function RoomPage() {
  const params: { id: string } = useParams()
  const [fps, setFps] = createSignal(0)
  const [phase, setPhase] = createSignal<'WATING' | 'RUNNING' | 'ENDED'>('WATING')

  const { players, startGame, selectCountry } = useRoomLobby(
    params.id,
    () => {
      setPhase('RUNNING')
    },
    () => {
      alert('A sala foi fechada pelo anfitrião.')
      navigate('/lobby')
    },
    () => {
      alert('Não foi possível entrar na sala. Ela pode não existir ou já ter começado.')
      navigate('/lobby')
    }
  )

  const gameTime = useGameTime(
    params.id,
    () => phase() === 'RUNNING',
    () => {
      alert('A sala foi fechada pelo anfitrião.')
      navigate('/lobby')
    }
  )

  const navigate = useNavigate()

  const token = getCookie('auth_token')
  const payload = token ? getJwtPayload(token) : null
  const userUuid = payload?.sub

  const isHost = () => players().find((p) => p.user_uuid === userUuid)?.role === 'HOST'

  let containerRef!: HTMLDivElement
  let engine: GameEngine | null = null

  const {
    mutate: leaveRoom,
    resource: leaveRoomResource,
  } = useLeaveRoom(() => navigate('/lobby'))

  const mapDataResource = useMapData(() => params.id)

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
        if (event.type === 'SELECT_COUNTRY' && phase() === 'WATING') {
          selectCountry(event.payload.country_id)
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
        <div class="flex flex-col gap-6 pointer-events-auto">
          <FpsCounter fps={fps()} />

          <Show when={phase() === 'WATING'} fallback={null}>
            <PlayerTable players={players()} />

            <Show when={isHost()}>
              <button
                type='button'
                class='p-3 bg-green-500 rounded-lg text-white font-medium cursor-pointer pointer-events-auto hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed'
                onClick={startGame}
                disabled={players().length === 0 || !players().every(p => p.is_ready)}
              >
                Começar jogo!
              </button>
            </Show>
          </Show>
        </div>

        <Show when={phase() === 'RUNNING'} fallback={null}>
          <>
            <GameClock
              date={gameTime.date}
              period={gameTime.period}
              speed={gameTime.speed}
              isPaused={gameTime.isPaused}
              play={gameTime.play}
              pause={gameTime.pause}
              changeSpeed={gameTime.changeSpeed}
              isHost={isHost() ?? false}
            />

            <Select
              class="bg-gray-900/90 py-1.5 text-sm shadow pointer-events-auto"
              onChange={(e) => engine?.setColorMode(e.currentTarget.value as MapColorMode)}
            >
              <option value="political">Modo Político</option>
              <option value="terrain">Modo Terreno</option>
              <option value="province">Modo Províncias</option>
              <option value="continent">Modo Continentes</option>
              <option value="region">Modo Regiões</option>
            </Select>
          </>
        </Show>

        <Show when={phase() === 'ENDED'} fallback={null}>
          <div>
            O jogo acabou!
          </div>
        </Show>

          <Button
            class="bg-red-600 hover:bg-red-700 py-1.5 px-4 h-fit text-sm shadow pointer-events-auto"
            disabled={leaveRoomResource.loading}
            onClick={() => leaveRoom({ room_id: params.id as string })}
          >
            {leaveRoomResource.loading ? 'Saindo...' : 'Sair da Sala'}
          </Button>
      </div>
    </div>
  )
}

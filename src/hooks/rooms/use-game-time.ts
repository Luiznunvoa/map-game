import { createEffect, createSignal, onCleanup } from 'solid-js'

import { BASE_URL } from '@/env'
import { networkAdapter } from '@/lib/network'
import type { GameTickPayload } from '@/types/room'

export function useGameTime(roomId: string, isActive: () => boolean, onRoomClosed: () => void) {
  const [date, setDate] = createSignal<string>('1836-01-01')
  const [period, setPeriod] = createSignal<number>(0)
  const [speed, setSpeed] = createSignal<number>(2)
  const [isPaused, setIsPaused] = createSignal<boolean>(true)

  createEffect(() => {
    if (!isActive()) return

    const tickWsUrl = BASE_URL
      ? BASE_URL.replace(/^http/, 'ws') + `/ws/rooms/${roomId}/tick`
      : `ws://localhost:3000/ws/rooms/${roomId}/tick`

    const stateWsUrl = BASE_URL
      ? BASE_URL.replace(/^http/, 'ws') + `/ws/rooms/${roomId}/state`
      : `ws://localhost:3000/ws/rooms/${roomId}/state`

    const handleGameTick = (data: GameTickPayload) => {
      setDate(data.date)
      setPeriod(data.period)
      setSpeed(data.speed)
      setIsPaused(data.paused)
    }

    const handleRoomClosed = () => {
      onRoomClosed()
    }

    networkAdapter.tickWs.on('game_tick', handleGameTick)
    networkAdapter.tickWs.on('room_closed', handleRoomClosed)

    try {
      networkAdapter.tickWs.connect(tickWsUrl).catch((err: unknown) => {
        console.error('Failed to connect to tick WS:', err)
      })
      networkAdapter.stateWs.connect(stateWsUrl).catch((err: unknown) => {
        console.error('Failed to connect to state WS:', err)
      })
    } catch (e) {
      // Ignora se já estiver conectado
    }

    onCleanup(() => {
      networkAdapter.tickWs.off('game_tick', handleGameTick)
      networkAdapter.tickWs.off('room_closed', handleRoomClosed)
      networkAdapter.tickWs.disconnect()
      networkAdapter.stateWs.disconnect()
    })
  })

  const play = (newSpeed?: number) => {
    networkAdapter.stateWs.send('action', {
      action: 'play',
      speed: newSpeed ?? speed(),
    })
  }

  const pause = () => {
    networkAdapter.stateWs.send('action', {
      action: 'pause',
      speed: speed(),
    })
  }

  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed) // Optimistic update, but engine will confirm
    networkAdapter.stateWs.send('action', {
      action: isPaused() ? 'pause' : 'play',
      speed: newSpeed,
    })
  }

  return {
    date,
    period,
    speed,
    isPaused,
    play,
    pause,
    changeSpeed,
  }
}

import { createSignal, onCleanup, onMount } from 'solid-js'

import { networkAdapter } from '@/lib/network'
import type { GameTickPayload } from '@/types/room'

export function useGameTime() {
  const [date, setDate] = createSignal<string>('1836-01-01')
  const [period, setPeriod] = createSignal<number>(0)
  const [speed, setSpeed] = createSignal<number>(1)
  const [isPaused, setIsPaused] = createSignal<boolean>(true)

  const handleTick = (data: GameTickPayload) => {
    setDate(data.date)
    setPeriod(data.period)
    setSpeed(data.speed)
    setIsPaused(data.paused)
  }

  const play = (newSpeed?: number) => {
    networkAdapter.stateWs.send('action', {
      action: 'play',
      speed: newSpeed ?? speed(),
    })
  }

  const pause = () => {
    networkAdapter.stateWs.send('action', { action: 'pause' })
  }

  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed)
    if (!isPaused()) {
      play(newSpeed)
    }
  }

  onMount(() => {
    networkAdapter.tickWs.on('game_tick', handleTick)
  })

  onCleanup(() => {
    networkAdapter.tickWs.off('game_tick', handleTick)
  })

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

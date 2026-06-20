import { createSignal, onCleanup, onMount } from 'solid-js'

import { BASE_URL } from '@/env'
import { getCookie } from '@/lib/utils/cookies'
import { networkAdapter } from '@/lib/network'
import type { PlayerInRoom } from '@/types/room'

/**
 * Connects to the per-room WebSocket and keeps a reactive list of players.
 * Automatically disconnects on cleanup.
 *
 * @param roomId  - The room UUID (from route params)
 * @param onRoomClosed - Called when the host leaves and the room is destroyed
 */
export function useRoomWs(roomId: () => string, onRoomClosed: () => void) {
  const [players, setPlayers] = createSignal<PlayerInRoom[]>([])
  const [isConnected, setIsConnected] = createSignal(false)

  const handlePlayersUpdate = (data: PlayerInRoom[]) => {
    setPlayers(data)
  }

  const handleRoomClosed = (_data: { reason: string }) => {
    onRoomClosed()
  }

  onMount(() => {
    const token = getCookie('auth_token')
    if (!token) {
      console.error('[useRoomWs] No auth token found')
      return
    }

    const base = BASE_URL
      ? BASE_URL.replace(/^http/, 'ws')
      : 'ws://localhost:3000'

    const wsUrl = `${base}/ws/rooms/${roomId()}?token=${token}`

    networkAdapter.ws.on('players_update', handlePlayersUpdate)
    networkAdapter.ws.on('room_closed', handleRoomClosed)

    networkAdapter.ws.onConnect(() => {
      setIsConnected(true)
    })

    networkAdapter.ws
      .connect(wsUrl)
      .then(() => setIsConnected(true))
      .catch((err: unknown) => {
        console.error('[useRoomWs] connection failed:', err)
      })
  })

  onCleanup(() => {
    networkAdapter.ws.off('players_update', handlePlayersUpdate)
    networkAdapter.ws.off('room_closed', handleRoomClosed)
    networkAdapter.ws.disconnect()
    setIsConnected(false)
  })

  return {
    players,
    isConnected,
  }
}

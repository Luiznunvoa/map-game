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
export function useGameSessionWs(roomId: () => string, onRoomClosed: () => void) {
  const [players, setPlayers] = createSignal<PlayerInRoom[]>([])
  const [isConnected, setIsConnected] = createSignal(false)

  const handlePlayersUpdate = (data: PlayerInRoom[]) => {
    if (data.length === 0) {
      // Se a lista vier vazia, a sala foi deletada do banco (o Host saiu de vez pelo botão)
      onRoomClosed()
      return
    }
    setPlayers(data)
  }

  const handleRoomClosed = (_data: { reason: string }) => {
    onRoomClosed()
  }

  onMount(() => {
    const token = getCookie('auth_token')
    if (!token) {
      console.error('[useGameSessionWs] No auth token found')
      return
    }

    const base = BASE_URL
      ? BASE_URL.replace(/^http/, 'ws')
      : 'ws://localhost:3000'

    const tickWsUrl = `${base}/ws/rooms/${roomId()}/tick`
    const stateWsUrl = `${base}/ws/rooms/${roomId()}/state`

    networkAdapter.stateWs.on('players_update', handlePlayersUpdate)
    networkAdapter.stateWs.on('room_closed', handleRoomClosed)

    networkAdapter.stateWs.onConnect(() => {
      setIsConnected(true)
    })

    networkAdapter.stateWs
      .connect(stateWsUrl)
      .catch((err: unknown) => {
        console.error('[useGameSessionWs] state connection failed:', err)
      })

    networkAdapter.tickWs
      .connect(tickWsUrl)
      .catch((err: unknown) => {
        console.error('[useGameSessionWs] tick connection failed:', err)
      })
  })

  onCleanup(() => {
    networkAdapter.stateWs.off('players_update', handlePlayersUpdate)
    networkAdapter.stateWs.off('room_closed', handleRoomClosed)
    networkAdapter.stateWs.disconnect()
    networkAdapter.tickWs.disconnect()
    setIsConnected(false)
  })

  return {
    players,
    isConnected,
  }
}

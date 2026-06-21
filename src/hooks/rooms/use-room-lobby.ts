import { createSignal, onCleanup, onMount } from 'solid-js'

import { BASE_URL } from '@/env'
import { networkAdapter } from '@/lib/network'
import type { LobbyPlayer } from '@/types/room'

export function useRoomLobby(roomId: string, onGameStarted: () => void, onRoomClosed: () => void, onConnectionError: () => void) {
  const [players, setPlayers] = createSignal<LobbyPlayer[]>([])

  const startGame = () => {
    networkAdapter.lobbyWs.send('start_game', undefined)
  }

  const selectCountry = (countryId: string) => {
    networkAdapter.lobbyWs.send('select_country', { country_id: countryId })
  }

  onMount(() => {
    const wsUrl = BASE_URL
      ? BASE_URL.replace(/^http/, 'ws') + `/ws/rooms/${roomId}/lobby`
      : `ws://localhost:3000/ws/rooms/${roomId}/lobby`

    const handlePlayersUpdate = (data: LobbyPlayer[]) => {
      if (Array.isArray(data)) {
        setPlayers(data)
      }
    }

    const handleGameStarted = () => {
      networkAdapter.lobbyWs.disconnect()
      onGameStarted()
    }

    const handleRoomClosed = () => {
      networkAdapter.lobbyWs.disconnect()
      onRoomClosed()
    }

    networkAdapter.lobbyWs.on('players_update', handlePlayersUpdate)
    networkAdapter.lobbyWs.on('game_started', handleGameStarted)
    networkAdapter.lobbyWs.on('room_closed', handleRoomClosed)

    try {
      networkAdapter.lobbyWs.connect(wsUrl).catch((err: unknown) => {
        console.error('Failed to connect to room lobby WS:', err)
        onConnectionError()
      })
    } catch (e) {
      console.error(e)
      onConnectionError()
    }

    onCleanup(() => {
      networkAdapter.lobbyWs.off('players_update', handlePlayersUpdate)
      networkAdapter.lobbyWs.off('game_started', handleGameStarted)
      networkAdapter.lobbyWs.off('room_closed', handleRoomClosed)
      networkAdapter.lobbyWs.disconnect()
    })
  })

  return {
    players,
    startGame,
    selectCountry,
  }
}

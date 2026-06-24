import { createSignal, onCleanup, onMount } from 'solid-js'

import { BASE_URL } from '@/env'
import { networkAdapter } from '@/lib/network'
import type { LobbyPlayer } from '@/types/room'

export function useRoomLobby(roomId: string, onGameStarted: () => void, onRoomClosed: () => void, onConnectionError: () => void) {
  const [players, setPlayers] = createSignal<LobbyPlayer[]>([])

  const startGame = () => {
    networkAdapter.roomWs.send('start_game', undefined)
  }

  const selectCountry = (countryId: string) => {
    networkAdapter.roomWs.send('select_country', { country_id: countryId })
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
      networkAdapter.roomWs.disconnect()
      onGameStarted()
    }

    const handleRoomClosed = () => {
      networkAdapter.roomWs.disconnect()
      onRoomClosed()
    }

    networkAdapter.roomWs.on('players_update', handlePlayersUpdate)
    networkAdapter.roomWs.on('game_started', handleGameStarted)
    networkAdapter.roomWs.on('room_closed', handleRoomClosed)

    try {
      networkAdapter.roomWs.connect(wsUrl).catch((err: unknown) => {
        console.error('Failed to connect to room lobby WS:', err)
        onConnectionError()
      })
    } catch (e) {
      console.error(e)
      onConnectionError()
    }

    onCleanup(() => {
      networkAdapter.roomWs.off('players_update', handlePlayersUpdate)
      networkAdapter.roomWs.off('game_started', handleGameStarted)
      networkAdapter.roomWs.off('room_closed', handleRoomClosed)
      networkAdapter.roomWs.disconnect()
    })
  })

  return {
    players,
    startGame,
    selectCountry,
  }
}

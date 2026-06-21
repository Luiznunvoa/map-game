import { createSignal, onCleanup, onMount } from 'solid-js'

import { BASE_URL } from '@/env'
import { networkAdapter } from '@/lib/network'
import type { Room } from '@/types/room'

export function useLobbyWs() {
  const [rooms, setRooms] = createSignal<Room[]>([])
  const [isLoading, setIsLoading] = createSignal(true)
  const [isRefreshing, setIsRefreshing] = createSignal(false)

  const fetchRooms = () => {
    setIsRefreshing(true)
    networkAdapter.lobbyWs.send('fetch_rooms', { page: 1, per_page: 20 })
  }

  const handleRoomsUpdate = (data: { rooms: Room[] } | undefined) => {
    if (data && data.rooms) {
      setRooms(data.rooms)
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  onMount(() => {
    const wsUrl = BASE_URL
      ? BASE_URL.replace(/^http/, 'ws') + '/ws/lobby'
      : 'ws://localhost:3000/ws/lobby'

    networkAdapter.lobbyWs.onConnect(() => {
      networkAdapter.lobbyWs.send('subscribe_rooms', { page: 1, per_page: 20 })
    })

    networkAdapter.lobbyWs.on('rooms_update', handleRoomsUpdate)

    try {
      networkAdapter.lobbyWs.connect(wsUrl).catch((err: unknown) => {
        console.error('Failed to connect to lobby WS:', err)
      })
      fetchRooms()
    } catch (e) {
      // Ignora se já estiver conectado
    }
  })

  onCleanup(() => { 
    networkAdapter.lobbyWs.off('rooms_update', handleRoomsUpdate)
    networkAdapter.lobbyWs.disconnect()
  })

  return {
    rooms,
    isLoading,
    isRefreshing,
    fetchRooms,
  }
}

import { createSignal, onCleanup, onMount } from 'solid-js'

import { BASE_URL } from '@/env'
import { networkAdapter } from '@/lib/network'

export function useRoomsWs() {
  const [rooms, setRooms] = createSignal<any[]>([])
  const [isLoading, setIsLoading] = createSignal(true)
  const [isRefreshing, setIsRefreshing] = createSignal(false)

  const fetchRooms = () => {
    setIsRefreshing(true)
    networkAdapter.ws.send('fetch_rooms', { page: 1, per_page: 20 })
  }

  const handleRoomsUpdate = (data: any) => {
    if (data && data.rooms) {
      setRooms(data.rooms)
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  onMount(() => {
    const wsUrl = BASE_URL
      ? BASE_URL.replace(/^http/, 'ws') + '/ws/rooms'
      : 'ws://localhost:3000/ws/rooms'

    networkAdapter.ws.onConnect(() => {
      networkAdapter.ws.send('subscribe_rooms', { page: 1, per_page: 20 })
    })

    networkAdapter.ws.on('rooms_update', handleRoomsUpdate)

    try {
      networkAdapter.ws.connect(wsUrl).catch((err: unknown) => {
        console.error('Failed to connect to lobby WS:', err)
      })
      fetchRooms()
    } catch (e) {
      // Ignora se já estiver conectado
    }
  })

  onCleanup(() => { 
    networkAdapter.ws.off('rooms_update', handleRoomsUpdate)
    networkAdapter.ws.disconnect()
  })

  return {
    rooms,
    isLoading,
    isRefreshing,
    fetchRooms,
  }
}

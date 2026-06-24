import { createResource, createSignal } from 'solid-js'

import { networkAdapter } from '@/lib/network'
import type { Room } from '@/types/room'

interface PaginatedRoomsResponse {
  page: number
  per_page: number
  total_items: number
  total_pages: number
  rooms: Room[]
}

export function useLobby() {
  const [page, setPage] = createSignal(1)
  const perPage = 10

  const fetchRooms = async (source: { page: number; perPage: number }) => {
    const res = await networkAdapter.http.request<unknown, PaginatedRoomsResponse>({
      method: 'GET',
      url: '/api/lobby',
      params: { page: source.page, per_page: source.perPage },
    })
    return res.data
  }

  const [data, { refetch }] = createResource(() => ({ page: page(), perPage }), fetchRooms)

  return {
    rooms: () => data()?.rooms || [],
    totalPages: () => data()?.total_pages || 0,
    page,
    setPage,
    isLoading: () => data.loading,
    isRefreshing: () => data.loading && data() !== undefined,
    fetchRooms: refetch,
  }
}

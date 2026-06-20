import { createSignal } from 'solid-js'

import { networkAdapter } from '@/lib/network'
import { RoomService } from '@/services/http/room-service'
import type { LeaveRoomRequest } from '@/types/room'

const roomService = new RoomService(networkAdapter.http)

export function useLeaveRoom(onSuccess?: () => void) {
  const [loading, setLoading] = createSignal(false)

  const mutate = async (args: LeaveRoomRequest) => {
    if (loading()) return
    setLoading(true)
    try {
      await roomService.leaveRoom(args)
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Failed to leave room:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    mutate,
    resource: { get loading() { return loading() } },
  }
}

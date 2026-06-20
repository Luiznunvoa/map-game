import { createResource, createSignal } from 'solid-js'

import { networkAdapter } from '@/lib/network'
import { RoomService } from '@/services/http/room-service'
import type { LeaveRoomRequest } from '@/types/room'

const roomService = new RoomService(networkAdapter.http)

export function useLeaveRoom(onSuccess?: () => void) {
  const [roomArgs, setRoomArgs] = createSignal<LeaveRoomRequest>()

  const [resource] = createResource(roomArgs, async (args) => {
    await roomService.leaveRoom(args)

    // Chama o callback de sucesso para navegação ou fechamento de modais
    if (onSuccess) {
      onSuccess()
    }

    return true
  })

  const mutate = (args: LeaveRoomRequest) => {
    setRoomArgs(args)
  }

  return {
    mutate,
    resource,
  }
}

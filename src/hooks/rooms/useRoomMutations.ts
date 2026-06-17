import { createSignal, createResource } from 'solid-js';
import { RoomService } from '@/services/http/room-service';
import { networkAdapter } from '@/lib/network';
import type { CreateRoomRequest } from '@/types/room';

const roomService = new RoomService(networkAdapter.http);

export function useCreateRoom(onSuccess?: (roomId: string) => void) {
  const [roomArgs, setRoomArgs] = createSignal<CreateRoomRequest>();

  const [resource] = createResource(roomArgs, async (args) => {
    const res = await roomService.createRoom(args);
    
    // Chama o callback de sucesso para navegação ou fechamento de modais
    if (onSuccess && res.room_id) {
      onSuccess(res.room_id);
    }
    
    return res;
  });

  const mutate = (args: CreateRoomRequest) => {
    setRoomArgs(args);
  };

  return {
    mutate,
    resource,
  };
}

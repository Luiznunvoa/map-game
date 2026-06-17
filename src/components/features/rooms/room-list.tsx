import { For, Show } from 'solid-js';
import { RoomCard } from './room-card';
import type { Room } from '@/types/room';

interface RoomListProps {
  rooms: Room[];
  isLoading: boolean;
  onJoinRoom: (roomId: string) => void;
}

export function RoomList(props: RoomListProps) {
  return (
    <div>
      <Show when={!props.isLoading} fallback={<div class="p-4 text-center">Loading rooms...</div>}>
        <Show when={props.rooms.length > 0} fallback={<div class="p-4 text-center text-gray-500">No rooms available.</div>}>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <For each={props.rooms}>
              {(room) => (
                <RoomCard room={room} onClick={props.onJoinRoom} />
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
}



interface RoomCardProps {
  room: any;
  onClick: (roomId: string) => void;
}

export function RoomCard(props: RoomCardProps) {
  return (
    <div 
      onClick={() => props.onClick(props.room.room_id)} 
      class="border border-gray-700 bg-gray-800 p-4 rounded cursor-pointer hover:bg-gray-700 flex flex-col gap-2"
    >
      <div class="flex justify-between items-center">
        <span class="font-bold text-white">{props.room.name || `Room #${props.room.room_id.substring(0, 8)}`}</span>
        <span class="text-sm bg-gray-900 px-2 rounded border border-gray-600 text-gray-300">{props.room.status}</span>
      </div>
      <div class="text-sm text-gray-400">
        <div>Players: <span class="text-gray-200">{props.room.player_count}/{props.room.max_players || 10}</span></div>
        <div>Speed: <span class="text-gray-200">{props.room.speed}x</span></div>
      </div>
    </div>
  );
}

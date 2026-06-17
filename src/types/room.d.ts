export interface CreateRoomRequest {
  name: string
  visibility: string
  map_id: number
  speed: number
  save_size_limit: number
  max_players: number
}

export interface RoomResponse {
  room_id: string
  status: string
  map_id: number
  speed: number
  save_size_limit: number
  max_players: number
  role: string
}

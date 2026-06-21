export interface CreateRoomRequest {
  name: string
  visibility: string
  map_id: number
  speed: number
  save_size_limit: number
  max_players: number
}

export interface Room {
  room_id: string
  name: string
  status: string
  map_id: number
  speed: number
  player_count: number
  created_at: string
  save_size_limit: number
  max_players: number
  role: string
}

export type RoomResponse = Room

export interface LeaveRoomRequest {
  room_id: string
}

export interface PlayerInRoom {
  user_id: number
  name: string
  role: 'HOST' | 'GUEST' | 'SPECTATOR'
  joined_at: string
}

export interface GameTickPayload {
  date: string
  period: number
  speed: number
  paused: boolean
}

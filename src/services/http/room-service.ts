import type { IRequestClient } from '@/types/network'
import type { CreateRoomRequest, LeaveRoomRequest, RoomResponse } from '@/types/room'

export class RoomService {
  private http: IRequestClient

  constructor(http: IRequestClient) {
    this.http = http
  }

  public async createRoom(data: CreateRoomRequest): Promise<RoomResponse> {
    const response = await this.http.request<CreateRoomRequest, RoomResponse>({
      method: 'POST',
      url: '/api/rooms',
      data,
    })
    return response.data
  }

  public async leaveRoom(params: LeaveRoomRequest): Promise<void> {
    await this.http.request<void, void>({
      method: 'POST',
      url: `/api/rooms/${params.room_id}/leave`,
    })
  }
}

import type { CreateRoomRequest, RoomResponse } from '@/types/room'
import type { IRequestClient } from '@/types/network'

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
}

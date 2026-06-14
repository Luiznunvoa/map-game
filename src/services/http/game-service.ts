import type { WorldData } from '@/types/data'
import type { IRequestClient } from '@/types/network'

export class GameService {
  private http: IRequestClient

  constructor(http: IRequestClient) {
    this.http = http
  }

  public async fetchInitialWorldState(): Promise<WorldData> {
    const response = await this.http.request<unknown, WorldData>({
      method: 'GET',
      url: '/api/game/world',
    })
    return response.data
  }
}

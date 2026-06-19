import type { AppWebSocketEvents, IHttpStateService, INetworkAdapter } from '@/types/network'
import type { PlayerState } from '@/types/state'

export class PlayerService implements IHttpStateService<PlayerState, number> {
  private adapter: INetworkAdapter<AppWebSocketEvents>

  constructor(adapter: INetworkAdapter<AppWebSocketEvents>) {
    this.adapter = adapter
  }

  public onStateChange(handler: (data: PlayerState) => void): () => void {
    this.adapter.ws.on('user:state', handler)
    return () => this.adapter.ws.off('user:state', handler)
  }

  public sendStateUpdate(data: PlayerState): void {
    this.adapter.ws.send('user:state', data)
  }

  public async fetch(userId: number): Promise<PlayerState> {
    const response = await this.adapter.http.request<unknown, PlayerState>({
      method: 'GET',
      url: `/api/users/${userId}`,
    })
    return response.data
  }
}

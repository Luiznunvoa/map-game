import type { AppWebSocketEvents, IHttpStateService, INetworkAdapter } from '@/types/network'
import type { ProvinceState } from '@/types/state'

export class ProvinceService implements IHttpStateService<ProvinceState, number> {
  private adapter: INetworkAdapter<AppWebSocketEvents>

  constructor(adapter: INetworkAdapter<AppWebSocketEvents>) {
    this.adapter = adapter
  }

  public onStateChange(handler: (data: ProvinceState) => void): () => void {
    this.adapter.ws.on('province:state', handler)
    return () => this.adapter.ws.off('province:state', handler)
  }

  public sendStateUpdate(data: ProvinceState): void {
    this.adapter.ws.send('province:state', data)
  }

  public async fetch(provinceId: number): Promise<ProvinceState> {
    const response = await this.adapter.http.request<unknown, ProvinceState>({
      method: 'GET',
      url: `/api/provinces/${provinceId}`,
    })
    return response.data
  }
}

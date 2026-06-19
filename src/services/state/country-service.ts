import type { AppWebSocketEvents, IHttpStateService, INetworkAdapter } from '@/types/network'
import type { CountryState } from '@/types/state'

export class CountryService implements IHttpStateService<CountryState, string> {
  private adapter: INetworkAdapter<AppWebSocketEvents>

  constructor(adapter: INetworkAdapter<AppWebSocketEvents>) {
    this.adapter = adapter
  }

  public onStateChange(handler: (data: CountryState) => void): () => void {
    this.adapter.ws.on('country:state', handler)
    return () => this.adapter.ws.off('country:state', handler)
  }

  public sendStateUpdate(data: CountryState): void {
    this.adapter.ws.send('country:state', data)
  }

  public async fetch(tag: string): Promise<CountryState> {
    const response = await this.adapter.http.request<unknown, CountryState>({
      method: 'GET',
      url: `/api/countries/${tag}`,
    })
    return response.data
  }
}

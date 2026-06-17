import { RoomsUI } from '@/ui/rooms'
import { networkAdapter } from '@/lib/network'
import type { IView, ViewEventHandler } from '@/types/view'

import { BASE_URL } from '@/env'

export class RoomsView implements IView {
  public onEvent?: ViewEventHandler
  private container: HTMLElement
  private roomsUI: RoomsUI | null = null

  constructor(container: HTMLElement) {
    this.container = container
  }

  async load(): Promise<void> {
    this.roomsUI = new RoomsUI(this.container, (roomId) => {
      if (this.onEvent) {
        this.onEvent({ type: 'ENTER_ROOM', data: roomId })
      }
    })
  }

  start(): void {
    const wsUrl = BASE_URL.replace(/^http/, 'ws') + '/ws/rooms'

    networkAdapter.ws.onConnect(() => {
      networkAdapter.ws.send('subscribe_rooms', { page: 1, per_page: 20 })
    })

    networkAdapter.ws.on('rooms_update', (data: any) => {
      if (data && data.rooms && this.roomsUI) {
        this.roomsUI.updateList(data.rooms)
      }
    })

    networkAdapter.ws.connect(wsUrl).catch(err => {
      console.error('Failed to connect to lobby WS:', err)
    })
  }

  stop(): void {
    if (this.roomsUI) {
      this.roomsUI.dispose()
      this.roomsUI = null
    }
    networkAdapter.ws.disconnect()
  }

  async unload(): Promise<void> {
    this.stop()
  }
}

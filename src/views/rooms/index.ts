import { RoomsUI } from '@/ui/rooms'
import { networkAdapter } from '@/lib/network'
import type { IView, ViewEventHandler } from '@/types/view'

import { BASE_URL } from '@/env'
import { AuthService } from '@/services/http/auth-service'

import { removeCookie } from '@/lib/utils/cookies'

export class RoomsView implements IView {
  public onEvent?: ViewEventHandler
  private container: HTMLElement
  private roomsUI: RoomsUI | null = null
  private authService: AuthService
  private onWsConnect: () => void = () => {}
  private onRoomsUpdate: (data: any) => void = () => {}

  constructor(container: HTMLElement) {
    this.container = container
    this.authService = new AuthService(networkAdapter.http)
  }

  async load(): Promise<void> {
    this.roomsUI = new RoomsUI(
      this.container,
      (roomId) => {
        if (this.onEvent) {
          this.onEvent({ type: 'ENTER_ROOM', data: roomId })
        }
      },
      async () => {
        try {
          await this.authService.logout()
        } catch (err) {
          console.error('Logout failed:', err)
        }
        removeCookie('auth_token')
        removeCookie('user_email')
        
        if (this.onEvent) {
          this.onEvent({ type: 'BACK_TO_MENU' })
        }
      },
      () => {
        networkAdapter.ws.send('fetch_rooms', { page: 1, per_page: 20 })
      }
    )
  }

  start(): void {
    const wsUrl = BASE_URL.replace(/^http/, 'ws') + '/ws/rooms'

    this.onWsConnect = () => {
      networkAdapter.ws.send('subscribe_rooms', { page: 1, per_page: 20 })
    }

    this.onRoomsUpdate = (data: any) => {
      if (data && data.rooms && this.roomsUI) {
        this.roomsUI.updateList(data.rooms)
      }
    }

    networkAdapter.ws.onConnect(this.onWsConnect)
    networkAdapter.ws.on('rooms_update', this.onRoomsUpdate)

    networkAdapter.ws.connect(wsUrl).catch(err => {
      console.error('Failed to connect to lobby WS:', err)
    })
  }

  stop(): void {
    if (this.roomsUI) {
      this.roomsUI.dispose()
      this.roomsUI = null
    }
    networkAdapter.ws.offConnect(this.onWsConnect)
    networkAdapter.ws.off('rooms_update', this.onRoomsUpdate)
    networkAdapter.ws.disconnect()
  }

  async unload(): Promise<void> {
    this.stop()
  }
}

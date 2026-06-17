import { MainMenuUI } from '@/ui/main-menu'
import type { IView, ViewEventHandler } from '@/types/view'
import { AuthService } from '@/services/http/auth-service'
import { networkAdapter } from '@/lib/network'
import { setCookie, getCookie } from '@/lib/utils/cookies'

export class MenuView implements IView {
  public onEvent?: ViewEventHandler
  private container: HTMLElement
  private menuUI: MainMenuUI | null = null
  private authService: AuthService

  constructor(container: HTMLElement) {
    this.container = container
    this.authService = new AuthService(networkAdapter.http)
  }

  async load(): Promise<void> {
    // Check if we are already logged in via token
  }

  private startGame(): void {
    if (this.onEvent) {
      this.onEvent({ type: 'START_GAME' })
    }
  }

  start(): void {
    this.menuUI = new MainMenuUI(
      this.container,
      async (email: string, pass: string) => {
        const response = await this.authService.login({ email, password: pass })
        
        setCookie('auth_token', response.token)
        if (response.user) {
          setCookie('user_email', response.user.email)
        }

        this.startGame()

      },
      () => {
        this.startGame()
      }
    )

    if (getCookie('auth_token')) {
      this.startGame()
    }
  }

  stop(): void {
    if (this.menuUI) {
      this.menuUI.dispose()
      this.menuUI = null
    }
  }

  async unload(): Promise<void> {
    this.stop()
  }
}

import { MainMenuUI } from '@/ui/main-menu'
import type { IView, ViewEventHandler } from '@/types/view'
import { AuthService } from '@/services/http/auth-service'
import { networkAdapter } from '@/lib/network'

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
    // Could optionally auto-login here if a token exists
  }

  start(): void {
    this.menuUI = new MainMenuUI(
      this.container,
      async (email: string, pass: string) => {
        const response = await this.authService.login({ email, password: pass })
        
        // Simplesmente guardando o token por enquanto
        localStorage.setItem('auth_token', response.token)
        if (response.user) {
          localStorage.setItem('user_email', response.user.email)
        }

        // Mostra o botao de start game
        this.menuUI?.showStartGame()
      },
      () => {
        if (this.onEvent) {
          this.onEvent({ type: 'START_GAME' })
        }
      }
    )

    // Se ja estiver logado, podemos forcar a exibicao do Start Game direto
    if (localStorage.getItem('auth_token')) {
      this.menuUI?.showStartGame()
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

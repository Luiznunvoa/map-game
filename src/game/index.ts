
import { Router } from '@/lib/router'
import { LoadingScreen } from '@/ui/loading'
import { MapView } from '@/views/map'
import { MenuView } from '@/views/menu'
import { RoomsView } from '@/views/rooms'

import type { IView, ViewEvent } from '../types/view'

export class Game {
  private activeView: IView | null = null
  private container: HTMLElement
  private loadingScreen: LoadingScreen
  private router: Router

  constructor(container: HTMLElement) {
    this.container = container
    this.loadingScreen = new LoadingScreen(this.container)
    this.router = new Router()
    this.setupRoutes()
  }

  private setupRoutes() {
    this.router.add('/lobby', async () => {
      await this.switchView(new RoomsView(this.container))
    })

    this.router.add('/room/:id', async (/* params */) => {
      // O ID está disponível em params.id, ex: params.id
      // TODO: Passar o roomId para o MapView quando ele suportar
      await this.switchView(new MapView(this.container))
    })

    this.router.setFallback(async () => {
      await this.switchView(new MenuView(this.container))
    })
  }

  /**
   * Inicia o ciclo de vida do jogo e resolve a rota inicial
   */
  public async start(): Promise<void> {
    this.loadingScreen.show()
    try {
      this.router.resolve(window.location.pathname, false)
    } finally {
      this.loadingScreen.hide()
    }
  }

  /**
   * Transiciona para uma nova visualização (View),
   * cuidando de descarregar a view ativa anterior.
   */
  public async switchView(view: IView): Promise<void> {
    this.loadingScreen.show()

    if (this.activeView) {
      this.activeView.stop()
      await this.activeView.unload()
    }

    this.activeView = view
    this.activeView.onEvent = this.handleViewEvent.bind(this)
    
    try {
      await this.activeView.load()
      this.activeView.start()
    } finally {
      await this.loadingScreen.hide()
    }
  }

  private async handleViewEvent(event: ViewEvent): Promise<void> {
    if (event.type === 'START_GAME') {
      this.router.navigate('/lobby')
    } else if (event.type === 'ENTER_ROOM') {
      this.router.navigate(`/room/${event.data}`)
    } else if (event.type === 'BACK_TO_MENU') {
      this.router.navigate('/')
    }
  }

  /**
   * Pausa a execução da view ativa (ex: ao desfocar a aba).
   */
  public stop(): void {
    this.activeView?.stop()
  }

  /**
   * Destrói a view ativa atual e limpa os recursos.
   */
  public async destroy(): Promise<void> {
    this.loadingScreen.dispose()
    if (this.activeView) {
      this.activeView.stop()
      await this.activeView.unload()
      this.activeView = null
    }
  }

  /**
   * Retorna a view ativa no momento.
   */
  public getActiveView(): IView | null {
    return this.activeView
  }

  /**
   * Retorna o container principal da aplicação.
   */
  public getContainer(): HTMLElement {
    return this.container
  }
}

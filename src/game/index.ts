
import { LoadingScreen } from '@/ui/loading'
import { MapView } from '@/views/map'
import { MenuView } from '@/views/menu'

import type { IView, ViewEvent } from '../types/view'

export class Game {
  private activeView: IView | null = null
  private container: HTMLElement
  private loadingScreen: LoadingScreen

  constructor(container: HTMLElement) {
    this.container = container
    this.loadingScreen = new LoadingScreen(this.container)
  }

  /**
   * Inicia o ciclo de vida do jogo e carrega a tela inicial (Mapa)
   */
  public async start(): Promise<void> {
    this.loadingScreen.show()
    try {
      const menuView: IView = new MenuView(this.container)
      await this.switchView(menuView)
    } finally {
      await this.loadingScreen.hide()
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
      const mapView: IView = new MapView(this.container)
      await this.switchView(mapView)
    } else if (event.type === 'BACK_TO_MENU') {
      const menuView: IView = new MenuView(this.container)
      await this.switchView(menuView)
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

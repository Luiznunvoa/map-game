import { MapView } from '@/game/views/map'
import { LoadingScreen } from '@/game/ui/loading'

import type { IView } from './types/view'

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
    // A primeira view já começa sendo o mapa
    const mapView: IView = new MapView(this.container)

    await this.switchView(mapView)
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
    
    try {
      await this.activeView.load()
      this.activeView.start()
    } finally {
      await this.loadingScreen.hide()
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

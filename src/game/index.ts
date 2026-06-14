
import { LoadingScreen } from '@/ui/loading'
import { MapView } from '@/views/map'

import type { IView } from '../types/view'
import type { WorldData } from '@/types/data'

export class Game {
  private activeView: IView | null = null
  private container: HTMLElement
  private loadingScreen: LoadingScreen
  private worldData: WorldData | null = null

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
      // Busca o estado do jogo (contexto de países)
      await this.loadGameState()

      // A primeira view já começa sendo o mapa, recebendo o estado buscado pelo Game
      const mapView: IView = new MapView(this.container, this.worldData)

      await this.switchView(mapView)
    } finally {
      await this.loadingScreen.hide()
    }
  }

  /**
   * Busca e salva o estado geral do jogo
   */
  private async loadGameState(): Promise<void> {
    try {
      const [countriesRes, provincesRes] = await Promise.all([
        fetch('/countries.json'),
        fetch('/definitions.json'),
      ])
      
      this.worldData = {
        countries: await countriesRes.json(),
        provinces: await provincesRes.json(),
      }
    } catch (e) {
      console.warn('Failed to load map data in Game state', e)
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


import type { RichMapData, WorldData } from '@/types/data'
import { LoadingScreen } from '@/ui/loading'
import { MapView } from '@/views/map'
import { mapService } from "@/services/http/map-service"

import type { IView } from '../types/view'

export class Game {
  private activeView: IView | null = null
  private container: HTMLElement
  private loadingScreen: LoadingScreen
  private worldData: WorldData | null = null
  private mapData: RichMapData | null = null

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
      if (!this.mapData) throw new Error("Failed to load map data")
      const mapView: IView = new MapView(this.container, this.mapData, this.worldData)

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
      // Carregando dados do jogo
      const [countriesData, provincesData, rawMapData, provincesBitmap] = await Promise.all([
        mapService.fetchCountries(),
        mapService.fetchDefinitions(),
        mapService.fetchParsedMapData(),
        mapService.fetchBmp('/api/maps/current/provinces.bmp'),
      ])
      
      this.worldData = {
        countries: countriesData,
        provinces: provincesData,
      }

      this.mapData = {
        ...rawMapData,
        provincesBitmap,
        idBufferResult: {
          ...rawMapData.idBufferResult,
          idBuffer: new Uint16Array(rawMapData.idBufferResult.idBuffer),
        },
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

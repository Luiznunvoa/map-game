import type { ParsedMapData } from '@/types/data'
import type { IRequestClient } from '@/types/network'

export class MapService {
  private http: IRequestClient

  constructor(http: IRequestClient) {
    this.http = http
  }

  /**
   * Requisita o parsing completo do mapa em formato JSON pronto.
   * Substitui todo o parsing-pipeline no cliente.
   */
  public async fetchParsedMapData(): Promise<ParsedMapData> {
    const res = await this.http.request<void, ParsedMapData>({
      method: 'GET',
      url: '/api/maps/current',
    })
    return res.data
  }

  /**
   * Baixa a imagem do mapa (ex: mapa de províncias ou terreno) do servidor estático
   * e retorna um ImageBitmap pronto para ser usado no WebGL ou Canvas.
   */
  public async fetchMapImage(url: string): Promise<ImageBitmap> {
    // Usamos fetch nativo para arquivos grandes de mídia em vez do axios
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load image from ${url}`)
    }
    const blob = await response.blob()
    return createImageBitmap(blob)
  }

  /**
   * Baixa a imagem BMP e faz o parse manualmente sem depender da Canvas API
   * (que falha e joga DOMException para BMPs de 24 bits ou formato bottom-up).
   */
  public async fetchBmp(url: string) {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load bmp from ${url}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const { parseBmp } = await import('@/lib/parsing-pipeline/BmpParser')
    return await parseBmp(new Uint8Array(arrayBuffer), url)
  }

  /**
   * (Opcional) Helper para extrair RGBA array puro da imagem
   * caso seu engine necessite do RawBitmap do formato anterior.
   */
  public async fetchRawImageData(url: string): Promise<ImageData> {
    const imgBitmap = await this.fetchMapImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = imgBitmap.width
    canvas.height = imgBitmap.height
    
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D not supported')
    
    ctx.drawImage(imgBitmap, 0, 0)
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  /**
   * Retorna os dados dos países do jogo
   */
  public async fetchCountries(): Promise<any> {
    const res = await this.http.request<void, any>({
      method: 'GET',
      url: '/api/maps/current/countries.json',
    })
    return res.data
  }

  /**
   * Retorna as definições base de todas as províncias
   */
  public async fetchDefinitions(): Promise<any> {
    const res = await this.http.request<void, any>({
      method: 'GET',
      url: '/api/maps/current/definitions.json',
    })
    return res.data
  }
}

import { networkAdapter } from '@/lib/network'
export const mapService = new MapService(networkAdapter.http)

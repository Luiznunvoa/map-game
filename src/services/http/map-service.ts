import { BASE_URL } from '@/env'
import { networkAdapter } from '@/lib/network'
import { parseBmp } from '@/lib/utils/bmp-parser'
import type { CountryData, ParsedMapData, ProvinceData } from '@/types/data'
import type { IRequestClient } from '@/types/network'

export class MapService {
  private http: IRequestClient

  // Caches
  private mapDataPromise: Promise<ParsedMapData> | null = null
  private countriesPromise: Promise<CountryData[]> | null = null
  private definitionsPromise: Promise<ProvinceData[]> | null = null
  private bmpCache: Record<string, Promise<any>> = {}
  private imageCache: Record<string, Promise<ImageBitmap>> = {}

  constructor(http: IRequestClient) {
    this.http = http
  }

  /**
   * Requisita o parsing completo do mapa em formato JSON pronto.
   * Substitui todo o parsing-pipeline no cliente.
   */
  public fetchParsedMapData(): Promise<ParsedMapData> {
    if (!this.mapDataPromise) {
      this.mapDataPromise = (async () => {
        const res = await fetch(`${BASE_URL}/api/maps/current`)
        if (!res.ok) throw new Error('Failed to fetch maps data')
        const ds = new DecompressionStream('gzip')
        const decompressedStream = res.body!.pipeThrough(ds)
        const decompressedResponse = new Response(decompressedStream)
        return await decompressedResponse.json()
      })().catch(e => {
        this.mapDataPromise = null // Invalida o cache em caso de erro
        throw e
      })
    }
    return this.mapDataPromise
  }

  /**
   * Baixa a imagem do mapa (ex: mapa de províncias ou terreno) do servidor estático
   * e retorna um ImageBitmap pronto para ser usado no WebGL ou Canvas.
   */
  public fetchMapImage(url: string): Promise<ImageBitmap> {
    if (!this.imageCache[url]) {
      this.imageCache[url] = (async () => {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed to load image from ${url}`)
        const blob = await response.blob()
        return createImageBitmap(blob)
      })().catch(e => {
        delete this.imageCache[url]
        throw e
      })
    }
    return this.imageCache[url]
  }

  /**
   * Baixa a imagem BMP e faz o parse manualmente sem depender da Canvas API
   * (que falha e joga DOMException para BMPs de 24 bits ou formato bottom-up).
   */
  public fetchBmp(url: string) {
    if (!this.bmpCache[url]) {
      this.bmpCache[url] = (async () => {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed to load bmp from ${url}`)
        const arrayBuffer = await response.arrayBuffer()
        return await parseBmp(new Uint8Array(arrayBuffer), url)
      })().catch(e => {
        delete this.bmpCache[url]
        throw e
      })
    }
    return this.bmpCache[url]
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
  public fetchCountries(): Promise<CountryData[]> {
    if (!this.countriesPromise) {
      this.countriesPromise = this.http.request<void, CountryData[]>({
        method: 'GET',
        url: '/api/maps/current/countries.json',
      }).then(res => res.data).catch(e => {
        this.countriesPromise = null
        throw e
      })
    }
    return this.countriesPromise
  }

  /**
   * Retorna as definições base de todas as províncias
   */
  public fetchDefinitions(): Promise<ProvinceData[]> {
    if (!this.definitionsPromise) {
      this.definitionsPromise = this.http.request<void, ProvinceData[]>({
        method: 'GET',
        url: '/api/maps/current/definitions.json',
      }).then(res => res.data).catch(e => {
        this.definitionsPromise = null
        throw e
      })
    }
    return this.definitionsPromise
  }

  /**
   * Limpa todos os caches de memória armazenados no serviço.
   * Útil para recarregar o mapa completamente do zero ou liberar memória RAM.
   */
  public clearCache(): void {
    this.mapDataPromise = null
    this.countriesPromise = null
    this.definitionsPromise = null
    this.bmpCache = {}
    this.imageCache = {}
  }
}

export const mapService = new MapService(networkAdapter.http)


import { networkAdapter } from '@/lib/network'
import { unpack } from 'msgpackr'
import type { CountryData, ParsedMapData, ProvinceData } from '@/types/data'
import type { IRequestClient } from '@/types/network'

export class MapService {
  private http: IRequestClient

  // Caches
  private mapDataPromise: Promise<ParsedMapData> | null = null
  private countriesPromise: Promise<CountryData[]> | null = null
  private definitionsPromise: Promise<ProvinceData[]> | null = null
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
        const res = await this.http.request<void, Blob>({
          method: 'GET',
          url: '/api/maps/current',
          responseType: 'blob'
        })
        
        const ds = new DecompressionStream('gzip')
        const decompressedStream = res.data.stream().pipeThrough(ds)
        const decompressedResponse = new Response(decompressedStream)
        
        // Lê o stream descompactado como buffer binário e decodifica o MessagePack
        const buffer = await decompressedResponse.arrayBuffer()
        return unpack(new Uint8Array(buffer)) as ParsedMapData
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
        const response = await this.http.request<void, Blob>({
          method: 'GET',
          url: url,
          responseType: 'blob'
        })
        return createImageBitmap(response.data)
      })().catch(e => {
        delete this.imageCache[url]
        throw e
      })
    }
    return this.imageCache[url]
  }


  /**
   * (Opcional) Helper para extrair RGBA array puro da imagem
   * caso seu engine necessite do RawBitmap do formato anterior.
   */
  public async fetchRawImageData(url: string): Promise<ImageData> {
    const imgBitmap = await this.fetchMapImage(url)
    const canvas = new OffscreenCanvas(imgBitmap.width, imgBitmap.height)
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D
    if (!ctx) throw new Error('OffscreenCanvas 2D not supported')
    
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
    this.imageCache = {}
  }
}

export const mapService = new MapService(networkAdapter.http)


import { MapService,mapService } from '@/services/http/map-service'
import type { IdBufferWithStats,ParsedMapData, RawBitmap } from '@/types/data'

export type ParserStatus = 'idle' | 'loading' | 'done' | 'error'

export interface ParserProgress {
  value: number  // 0.0 – 1.0
  stage: string
}

export interface MapParserState {
  status: ParserStatus
  progress: ParserProgress
  data: (ParsedMapData & { provincesBitmap: RawBitmap; idBufferResult: IdBufferWithStats }) | null
  error: string | null
}

type Listener = (state: MapParserState) => void

export class MapParser {
  private status: ParserStatus = 'idle'
  private progress: ParserProgress = { value: 0, stage: '' }
  private data: (ParsedMapData & { provincesBitmap: RawBitmap; idBufferResult: IdBufferWithStats }) | null = null
  private error: string | null = null

  private aborted = false
  private listeners = new Set<Listener>()
  private mapService: MapService

  constructor(customMapService?: MapService) {
    this.mapService = customMapService ?? mapService
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  public getState(): MapParserState {
    return {
      status: this.status,
      progress: this.progress,
      data: this.data,
      error: this.error,
    }
  }

  private notify(): void {
    const state = this.getState()
    this.listeners.forEach(fn => fn(state))
  }

  public async fetchMap(): Promise<void> {
    this.aborted = false
    this.status = 'loading'
    this.error = null
    this.data = null
    this.progress = { value: 0.5, stage: 'Baixando dados do servidor...' }
    this.notify()

    try {
      const rawData = await this.mapService.fetchParsedMapData()
      if (this.aborted) return

      this.progress = { value: 0.8, stage: 'Decodificando imagens...' }
      this.notify()

      const provincesUrl = rawData.provincesBitmapUrl || '/api/maps/current/provinces.bmp'
      const imgData = await this.mapService.fetchRawImageData(provincesUrl)
      if (this.aborted) return

      // Converte RGBA (4 canais) do Canvas para RGB linear (3 canais) exigido pelo IdBuffer
      const rgbData = new Uint8Array(imgData.width * imgData.height * 3)
      for (let i = 0; i < imgData.width * imgData.height; i++) {
        rgbData[i * 3 + 0] = imgData.data[i * 4 + 0]
        rgbData[i * 3 + 1] = imgData.data[i * 4 + 1]
        rgbData[i * 3 + 2] = imgData.data[i * 4 + 2]
      }

      const provincesBitmap = {
        width: imgData.width,
        height: imgData.height,
        data: rgbData,
      }

      const richData: ParsedMapData & { provincesBitmap: RawBitmap; idBufferResult: IdBufferWithStats } = {
        ...rawData,
        provincesBitmap,
        idBufferResult: rawData.idBufferResult,
      }

      this.progress = { value: 1.0, stage: 'Pronto!' }
      this.data = richData
      this.status = 'done'
      this.notify()
    } catch (err) {
      if (this.aborted) return
      this.error = err instanceof Error ? err.message : String(err)
      this.status = 'error'
      this.notify()
      console.error('[MapParser]', err)
    }
  }

  /** @deprecated Use fetchMap instead */
  public parse(): Promise<void> {
    return this.fetchMap()
  }

  /** @deprecated Use fetchMap instead */
  public parseFromUrl(): Promise<void> {
    return this.fetchMap()
  }

  public reset(): void {
    this.aborted = true
    this.status = 'idle'
    this.progress = { value: 0, stage: '' }
    this.data = null
    this.error = null
    this.notify()
  }

  public dispose(): void {
    this.aborted = true
    this.listeners.clear()
  }
}

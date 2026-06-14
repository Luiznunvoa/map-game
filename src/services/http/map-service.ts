import { createFetchFileLoader, runParserPipeline } from '@/lib/parsing-pipeline'
import type { ParsedMapData } from '@/types/data'
import type { IRequestClient } from '@/types/network'

export class MapService {
  // private _http: IRequestClient

  constructor(_http: IRequestClient) {
    // this._http = http
  }

  /**
   * Requisita o parsing completo do mapa em formato JSON pronto.
   * Substitui todo o parsing-pipeline no cliente.
   */
  public async fetchParsedMapData(): Promise<ParsedMapData> {
    console.warn('Rodando o parsing-pipeline em MOCK no front-end!')
    
    const loader = createFetchFileLoader('') // Arquivos estão na raiz do public/
    const oldData = await runParserPipeline(loader, {
      onProgress: (value, stage) => {
        console.log(`[Map Mock Pipeline] ${stage}: ${Math.round(value * 100)}%`)
      },
    })

    const bitmapToUrl = (bitmap: { width: number; height: number; data: Uint8Array }): string => {
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')!
      const imgData = ctx.createImageData(bitmap.width, bitmap.height)
      
      for (let i = 0; i < bitmap.width * bitmap.height; i++) {
        imgData.data[i * 4] = bitmap.data[i * 3]     
        imgData.data[i * 4 + 1] = bitmap.data[i * 3 + 1] 
        imgData.data[i * 4 + 2] = bitmap.data[i * 3 + 2] 
        imgData.data[i * 4 + 3] = 255                
      }
      ctx.putImageData(imgData, 0, 0)
      return canvas.toDataURL('image/png')
    }

    return {
      defaultMap: oldData.defaultMap,
      provinces: oldData.provinces,
      provinceById: oldData.provinceById,
      adjacencies: oldData.adjacencies,
      terrain: oldData.terrain,
      regions: oldData.regions,
      continents: oldData.continents,
      provincesBitmapUrl: bitmapToUrl(oldData.provincesBitmap),
      terrainBitmapUrl: bitmapToUrl(oldData.terrainBitmap),
    }
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
}

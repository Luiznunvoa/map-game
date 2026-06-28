import { unpack } from 'msgpackr'

import { networkAdapter } from '@/lib/network'
import type { CountryData, ProvinceData, RawMapData } from '@/types/data'
import type { IRequestClient } from '@/types/network'

export class MapService {
  private http: IRequestClient

  // Caches
  private currentRoomId: string | null = null
  private mapDataPromise: Promise<RawMapData> | null = null
  private countriesPromise: Promise<CountryData[]> | null = null
  private definitionsPromise: Promise<ProvinceData[]> | null = null
  private savegamePromise: Promise<any> | null = null
  private imageCache: Record<string, Promise<ImageBitmap>> = {}

  private checkRoomId(roomId: string) {
    if (this.currentRoomId !== roomId) {
      this.clearCache()
      this.currentRoomId = roomId
    }
  }

  constructor(http: IRequestClient) {
    this.http = http
  }

  /**
   * Requisita o parsing completo do mapa em formato JSON pronto.
   * Substitui todo o parsing-pipeline no cliente.
   */
  public fetchParsedMapData(roomId: string): Promise<RawMapData> {
    this.checkRoomId(roomId)
    if (!this.mapDataPromise) {
      this.mapDataPromise = (async () => {
        const res = await this.http.request<void, Blob>({
          method: 'GET',
          url: `/api/map`,
          responseType: 'blob',
        })

        const ds = new DecompressionStream('gzip')
        const decompressedStream = res.data.stream().pipeThrough(ds)
        const decompressedResponse = new Response(decompressedStream)

        // Lê o stream descompactado como buffer binário e decodifica o MessagePack
        const buffer = await decompressedResponse.arrayBuffer()
        const raw = unpack(new Uint8Array(buffer)) as any // it's FrontendResult in Go

        const foundIds = raw.Provinces ? raw.Provinces.map((p: any) => p.ID) : []
        const maxProvinceId = foundIds.length > 0 ? Math.max(...foundIds) : 0

        const terrainOverrides: Record<number, string> = {}
        if (raw.Provinces && raw.TerrainTypes) {
          raw.Provinces.forEach((p: any) => {
            const tType = raw.TerrainTypes[p.TerrainIdx]
            if (tType) {
              terrainOverrides[p.ID] = tType.Name
            }
          })
        }

        // Mapear o FrontendResult (backend) para o RawMapData (frontend) esperado pela engine
        const mapData: RawMapData = {
          defaultMap: {
            maxProvinces: raw.Provinces ? raw.Provinces.length : 0,
            seaStarts: raw.Sea || [],
          },
          provinces: {},
          provinceById: {},
          adjacencies: raw.Adjacencies ? raw.Adjacencies.map((a: any) => ({
            from: a.From,
            to: a.To,
            type: (a.Type === 0 ? 'land' : a.Type === 4 ? 'impassable' : 'sea'),
            through: a.Through
          })) : [],
          terrain: {
            paletteSize: raw.TerrainTypes ? raw.TerrainTypes.length : 0,
            categories: {},
            overrides: terrainOverrides,
          },
          regions: {},
          continents: {},
          provincesBitmapUrl: raw.ProvincesBitmapUrl,
          terrainBitmapUrl: raw.TerrainBitmapUrl,
          idBufferUrl: raw.IdBufferUrl,
          idBufferResult: {
            idBuffer: new Uint16Array(), // Filled later in useMapData
            maxProvinceId,
            orphanPixelCount: 0,
            foundIds,
            stats: raw.Stats ? Object.fromEntries(
              Object.entries(raw.Stats).map(([k, v]: [string, any]) => [k, {
                id: Number(k),
                pixelCount: Number(v.PixelCount),
                sumX: Number(v.SumX),
                sumY: Number(v.SumY),
                minX: Number(v.MinX),
                minY: Number(v.MinY),
                maxX: Number(v.MaxX),
                maxY: Number(v.MaxY),
              }])
            ) : {},
          }
        }

        if (raw.Provinces) {
          raw.Provinces.forEach((p: any) => {
            const def = { id: p.ID, color: p.Color, name: p.Name }
            mapData.provinceById[p.ID] = def
            mapData.provinces[p.Color.join(',')] = def
          })
        }

        if (raw.TerrainTypes) {
          raw.TerrainTypes.forEach((val: any) => {
            mapData.terrain.categories[val.Name] = {
              name: val.Name,
              color: val.Color,
              isWater: val.IsWater,
            }
          })
        }

        if (raw.Geography && raw.Geography.Continents) {
          Object.entries(raw.Geography.Continents).forEach(([contName, cont]: [string, any]) => {
            const contProvinces: number[] = []
            if (cont.Regions) {
              Object.entries(cont.Regions).forEach(([regName, reg]: [string, any]) => {
                const regProvinces = reg.Provinces || []
                mapData.regions[regName] = regProvinces
                contProvinces.push(...regProvinces)
              })
            }
            mapData.continents[contName] = contProvinces
          })
        }

        console.log(mapData);

        return mapData
      })().catch((e) => {
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
          responseType: 'blob',
        })
        return createImageBitmap(response.data)
      })().catch((e) => {
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

    const ctx = canvas.getContext('2d', {
      willReadFrequently: true,
    }) as OffscreenCanvasRenderingContext2D
    if (!ctx) throw new Error('OffscreenCanvas 2D not supported')

    ctx.drawImage(imgBitmap, 0, 0)
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  /**
   * Busca os dados do savegame (estado político e econômico)
   */
  public async fetchSavegame(roomId: string): Promise<any> {
    this.checkRoomId(roomId)
    if (!this.savegamePromise) {
      this.savegamePromise = (async () => {
        const res = await this.http.request<void, any>({
          method: 'GET',
          url: `/api/map/savegame`,
        })
        return res.data
      })().catch((e) => {
        this.savegamePromise = null
        throw e
      })
    }
    return this.savegamePromise
  }

  /**
   * Retorna os dados dos países do jogo
   */
  public async fetchCountries(roomId: string): Promise<CountryData[]> {
    this.checkRoomId(roomId)
    if (!this.countriesPromise) {
      this.countriesPromise = (async () => {
        const savegame = await this.fetchSavegame(roomId)
        const countries: CountryData[] = []
        
        if (savegame.countries) {
          for (const [tag, country] of Object.entries<any>(savegame.countries)) {
            const hex = country.color.replace('#', '')
            let r = 0, g = 0, b = 0
            if (hex.length === 6) {
              r = parseInt(hex.substring(0, 2), 16) / 255
              g = parseInt(hex.substring(2, 4), 16) / 255
              b = parseInt(hex.substring(4, 6), 16) / 255
            }
            countries.push({
              tag: tag,
              color: [r, g, b],
              money: 1000
            })
          }
        }
        return countries
      })().catch((e) => {
        this.countriesPromise = null
        throw e
      })
    }
    return this.countriesPromise
  }

  /**
   * Retorna as definições base de todas as províncias
   */
  public async fetchDefinitions(roomId: string): Promise<ProvinceData[]> {
    this.checkRoomId(roomId)
    if (!this.definitionsPromise) {
      this.definitionsPromise = (async () => {
        const [mapData, savegame] = await Promise.all([
          this.fetchParsedMapData(roomId),
          this.fetchSavegame(roomId)
        ])
        const defs: ProvinceData[] = []
        
        for (const prov of Object.values(mapData.provinceById)) {
          const provState = savegame.provinces && savegame.provinces[prov.id]
          defs.push({
            id: prov.id,
            color: prov.color,
            cores: [],
            owner: provState?.owner || 'NONE',
            controller: provState?.controller || null,
            population: 1000
          })
        }
        return defs
      })().catch((e) => {
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
    this.savegamePromise = null
    this.imageCache = {}
  }
}

export const mapService = new MapService(networkAdapter.http)

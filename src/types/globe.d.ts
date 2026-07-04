import type { IdBufferWithStats, RawMapData } from './data'

export type MapColorMode = 'political' | 'province' | 'terrain' | 'continent' | 'region' | 'population' | 'culture'

export type GlobeMapInput = Pick<
  RawMapData,
  'provinces' | 'provinceById' | 'defaultMap' | 'terrain' | 'continents' | 'regions'
> & {
  provincesBitmap: ImageBitmap
  riversBitmap?: ImageBitmap
  idBufferResult: IdBufferWithStats
}

export interface ProvinceGlobeConfig {
  radius?: number
  widthSegments?: number
  heightSegments?: number
  initialColorMode?: MapColorMode
  mapVMin?: number
  mapVMax?: number
}

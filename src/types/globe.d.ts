import type { IdBufferWithStats, RawMapData } from './data'

export type MapColorMode = 'political' | 'province' | 'terrain' | 'continent' | 'region'

export type GlobeMapInput = Pick<
  RawMapData,
  'provinces' | 'provinceById' | 'defaultMap' | 'terrain' | 'continents' | 'regions'
> & {
  provincesBitmap: ImageBitmap
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

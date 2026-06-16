import type { IdBufferWithStats,ParsedMapData } from './data'

export type MapColorMode = 'political' | 'province' | 'terrain' | 'continent' | 'region'

export type GlobeMapInput = Pick<
  ParsedMapData,
  | 'provinces'
  | 'provinceById'
  | 'defaultMap'
  | 'terrain'
  | 'continents'
  | 'regions'
> & {
  provincesBitmap: ImageBitmap;
  idBufferResult: IdBufferWithStats;
}

export interface ProvinceGlobeConfig {
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
  initialColorMode?: MapColorMode;
  mapVMin?: number;
  mapVMax?: number;
}

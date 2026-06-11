import type { ParsedMapData } from '@/packages/parser/index.js'

export type NormalizedColor = [number, number, number]

export type MapColorMode = 'political' | 'province' | 'terrain' | 'continent'

export type GlobeMapInput = Pick<
  ParsedMapData,
  | 'provincesBitmap'
  | 'provinces'
  | 'provinceById'
  | 'defaultMap'
  | 'terrain'
  | 'continents'
>

export interface ProvinceGlobeConfig {
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
  initialColorMode?: MapColorMode;
  mapVMin?: number;
  mapVMax?: number;
}

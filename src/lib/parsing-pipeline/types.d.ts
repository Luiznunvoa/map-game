/** Identificador único de província (inteiro >= 1; 0 = oceano) */
export type ProvinceId = number

/** Tag de país no formato Victoria 2 — 3 letras maiúsculas */
export type CountryTag = string

/**
 * Resultado do parsing de um arquivo BMP.
 * O buffer é linear RGB, 3 bytes por pixel, sem alpha.
 * Pixel (x, y) está em buffer[(y * width + x) * 3].
 */
export interface RawBitmap {
  width: number;
  height: number;
  /** Buffer linear RGB, 3 bytes/pixel. */
  data: Uint8Array;
}

export interface ProvinceDefinition {
  id: ProvinceId;
  r: number;
  g: number;
  b: number;
  name: string;
}

export type ColorToProvince = Map<string, ProvinceDefinition>

export type IdToProvince = Map<ProvinceId, ProvinceDefinition>

export type AdjacencyType = 'sea' | 'land' | 'impassable'

export interface Adjacency {
  from: ProvinceId;
  to: ProvinceId;
  type: AdjacencyType;
  through: ProvinceId;
  data: number;
  comment: string;
}

export interface DefaultMap {
  maxProvinces: number;
  seaStarts: Set<ProvinceId>;
  /** Caminhos de arquivo referenciados (relativos ao diretório data/) */
  files: {
    definitions: string;
    provinces: string;
    positions: string;
    terrain: string;
    rivers: string;
    terrainDefinition: string;
  };
}

export interface TerrainCategory {
  name: string;
  color: [number, number, number];
  isWater: boolean;
}

export interface TerrainDefinition {
  /** Número total de entradas no bitmap de terrain (palette size) */
  paletteSize: number;
  categories: Map<string, TerrainCategory>;
  /**
   * Override manual: Map de ProvinceId → nome da categoria de terreno.
   * Tem precedência sobre o cálculo por maioria de pixels.
   */
  overrides: Map<ProvinceId, string>;
  indexToTerrain?: Map<number, string>;
}

export type RegionMap = Map<string, ProvinceId[]>

export type ContinentMap = Map<string, ProvinceId[]>



/**
 * Valor genérico do parser Clausewitz.
 * Chaves repetidas viram arrays.
 */
export type ClausewitzValue =
  | string
  | number
  | boolean
  | ClausewitzObject
  | ClausewitzValue[]

export type ClausewitzObject = { [key: string]: ClausewitzValue }

/**
 * Saída consolidada de todos os parsers.
 * É o que o pipeline passa para a camada de simulação.
 */
export interface ParsedMapData {
  defaultMap: DefaultMap;
  provinces: ColorToProvince;
  provinceById: IdToProvince;
  adjacencies: Adjacency[];
  terrain: TerrainDefinition;
  regions: RegionMap;
  continents: ContinentMap;
  provincesBitmap: RawBitmap;
  terrainBitmap: RawBitmap;
}

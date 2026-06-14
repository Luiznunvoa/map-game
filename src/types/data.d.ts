export type ProvinceId = number
export type CountryTag = string

export type NormalizedColor = [number, number, number]

export type AdjacencyType = 'sea' | 'land' | 'impassable'

export interface Adjacency {
  from: ProvinceId;
  to: ProvinceId;
  type: AdjacencyType;
  through?: ProvinceId;
  data?: number;
  comment?: string;
}

// Game State Data
export interface ProvinceData {
  id: ProvinceId;
  color?: NormalizedColor;  // [r, g, b]
  cores: CountryTag[];
  owner: CountryTag;
  controller: CountryTag | null;
  adjacencies?: Adjacency[];
  population: number;
}

export interface CountryData {
  tag: CountryTag;
  color: NormalizedColor;
  money: number;
}

export interface PlayerData {
  id: number;
  name: string;
  countryTag?: CountryTag;
}

export interface WorldData {
  countries: CountryData[];
  provinces: ProvinceData[];
}

// Static Map Definitions (From backend parsing)
export interface RawBitmap {
  width: number;
  height: number;
  data: Uint8Array;
}

export interface ProvinceDefinition {
  id: ProvinceId;
  color: NormalizedColor;
  name: string;
}

export interface TerrainCategory {
  name: string;
  color: NormalizedColor;
  isWater: boolean;
}

export interface TerrainDefinition {
  paletteSize: number;
  categories: Record<string, TerrainCategory>;
  overrides: Record<number, string>;
  indexToTerrain?: Record<number, string>;
}

export interface DefaultMap {
  maxProvinces: number;
  seaStarts: ProvinceId[];
  files?: {
    definitions: string;
    provinces: string;
    positions: string;
    terrain: string;
    rivers: string;
    terrainDefinition: string;
  };
}

export type ColorToProvince = Record<string, ProvinceDefinition>;
export type IdToProvince = Record<number, ProvinceDefinition>;
export type RegionMap = Record<string, ProvinceId[]>;
export type ContinentMap = Record<string, ProvinceId[]>;

export interface ParsedMapData {
  defaultMap: DefaultMap;
  provinces: ColorToProvince;
  provinceById: IdToProvince;
  adjacencies: Adjacency[];
  terrain: TerrainDefinition;
  regions: RegionMap;
  continents: ContinentMap;
  provincesBitmapUrl: string; // Used to fetch the raw image
  terrainBitmapUrl?: string;
}

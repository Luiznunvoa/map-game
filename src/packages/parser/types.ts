/**
 * @module types
 *
 * Interfaces e tipos compartilhados da camada de parsing.
 * Zero dependências de runtime — pode ser importado tanto no browser quanto no Node.js.
 *
 * Convenções:
 *  - IDs de província: inteiro >= 1 (0 = oceano/wasteland)
 *  - Tags de país: string de 3 letras maiúsculas (ex: "BRZ", "FRA")
 *  - Coordenadas de pixel: inteiros em espaço de bitmap (y=0 no topo)
 */

// ---------------------------------------------------------------------------
// Primitive aliases (ajudam a tornar as assinaturas auto-documentadas)
// ---------------------------------------------------------------------------

/** Identificador único de província (inteiro >= 1; 0 = oceano) */
export type ProvinceId = number;

/** Tag de país no formato Victoria 2 — 3 letras maiúsculas */
export type CountryTag = string;

// ---------------------------------------------------------------------------
// Dados brutos do BMP
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Dados do definition.csv
// ---------------------------------------------------------------------------

/**
 * Uma linha do `definition.csv`.
 * Campos: province;red;green;blue;name;x
 */
export interface ProvinceDefinition {
  id: ProvinceId;
  r: number;
  g: number;
  b: number;
  name: string;
}

/** Mapa de cor → definição de província. Chave: "r,g,b" */
export type ColorToProvince = Map<string, ProvinceDefinition>;

/** Mapa de ID → definição de província */
export type IdToProvince = Map<ProvinceId, ProvinceDefinition>;

// ---------------------------------------------------------------------------
// Dados do adjacencies.csv
// ---------------------------------------------------------------------------

export type AdjacencyType = "sea" | "land" | "impassable";

/** Uma linha do `adjacencies.csv` */
export interface Adjacency {
  from: ProvinceId;
  to: ProvinceId;
  type: AdjacencyType;
  through: ProvinceId;
  data: number;
  comment: string;
}

// ---------------------------------------------------------------------------
// Dados do default.map
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Dados do terrain.txt
// ---------------------------------------------------------------------------

export interface TerrainCategory {
  name: string;
  color: [number, number, number];
  isWater: boolean;
  movementCost: number;
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

// ---------------------------------------------------------------------------
// Dados de região (region.txt)
// ---------------------------------------------------------------------------

/** Mapa de nome da região → lista de ProvinceIds */
export type RegionMap = Map<string, ProvinceId[]>;

// ---------------------------------------------------------------------------
// Dados de continente (continent.txt)
// ---------------------------------------------------------------------------

/** Mapa de nome do continente → lista de ProvinceIds */
export type ContinentMap = Map<string, ProvinceId[]>;

// ---------------------------------------------------------------------------
// Dados de clima (climate.txt)
// ---------------------------------------------------------------------------

export interface ClimateCategory {
  name: string;
  farmRgoSize: number;
  farmRgoEff: number;
  mineRgoSize: number;
  mineRgoEff: number;
  maxAttrition?: number;
}

/** Mapa de nome do clima → lista de ProvinceIds que o possuem */
export interface ClimateDefinition {
  categories: Map<string, ClimateCategory>;
  provinceClimate: Map<ProvinceId, string>;
}

// ---------------------------------------------------------------------------
// Resultado parseado do formato Clausewitz
// ---------------------------------------------------------------------------

/**
 * Valor genérico do parser Clausewitz.
 * Chaves repetidas viram arrays.
 */
export type ClausewitzValue =
  | string
  | number
  | boolean
  | ClausewitzObject
  | ClausewitzValue[];

export type ClausewitzObject = { [key: string]: ClausewitzValue };

// ---------------------------------------------------------------------------
// Resultado completo do pipeline de parsing
// ---------------------------------------------------------------------------

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
  climate: ClimateDefinition;
  /** BMP de províncias */
  provincesBitmap: RawBitmap;
  /** BMP de terreno (8-bit palettized ou RGB, dependendo do arquivo) */
  terrainBitmap: RawBitmap;
}

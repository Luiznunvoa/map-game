import {
  parseClausewitz,
  getNumber,
  getObject,
  getString,
} from "./ClausewitzParser.js";

import type {
  DefaultMap,
  TerrainDefinition,
  TerrainCategory,
  RegionMap,
  ContinentMap,
  ClimateDefinition,
  ClimateCategory,
  ClausewitzObject,
  ProvinceId,
} from "./types.js";

export function parseDefaultMap(content: string): DefaultMap {
  const obj = parseClausewitz(content);

  const maxProvinces = getNumber(obj, "max_provinces") ?? 0;

  // sea_starts é um bloco { 2703 2704 2705 ... }
  const seaStartsVal = obj["sea_starts"];
  let seaStarts = new Set<ProvinceId>();

  if (Array.isArray(seaStartsVal)) {
    for (const v of seaStartsVal) {
      if (typeof v === "number") seaStarts.add(v);
    }
  } else if (seaStartsVal && typeof seaStartsVal === "object" && !Array.isArray(seaStartsVal)) {
    // O parser pode ter interpretado como objeto com chave "__values__"
    const inner = seaStartsVal as ClausewitzObject;
    const values = inner["__values__"];
    if (Array.isArray(values)) {
      for (const v of values) {
        if (typeof v === "number") seaStarts.add(v);
      }
    }
  }

  // Alternativa: o parser retorna { sea_starts: [2703, 2704, ...] }
  // Se seaStarts ainda estiver vazio, tentar leitura direta como array
  if (seaStarts.size === 0 && Array.isArray(obj["sea_starts"])) {
    const arr = obj["sea_starts"] as unknown[];
    for (const v of arr) {
      if (typeof v === "number") seaStarts.add(v);
    }
  }

  return {
    maxProvinces,
    seaStarts,
    files: {
      definitions: (getString(obj, "definitions") ?? "definition.csv").replace(/"/g, ""),
      provinces: (getString(obj, "provinces") ?? "provinces.bmp").replace(/"/g, ""),
      positions: (getString(obj, "positions") ?? "positions.txt").replace(/"/g, ""),
      terrain: (getString(obj, "terrain") ?? "terrain.bmp").replace(/"/g, ""),
      rivers: (getString(obj, "rivers") ?? "rivers.bmp").replace(/"/g, ""),
      terrainDefinition: (getString(obj, "terrain_definition") ?? "terrain.txt").replace(/"/g, ""),
    },
  };
}

export function parseTerrainTxt(content: string): TerrainDefinition {
  const obj = parseClausewitz(content);

  const paletteSize = getNumber(obj, "terrain") ?? 64;
  const categoriesObj = getObject(obj, "categories");

  const categories = new Map<string, TerrainCategory>();
  const overrides = new Map<ProvinceId, string>();

  for (const [name, rawCat] of Object.entries(categoriesObj)) {
    if (typeof rawCat !== "object" || Array.isArray(rawCat)) continue;
    const cat = rawCat as ClausewitzObject;

    // Cor: color = { r g b }
    const colorVal = cat["color"];
    let color: [number, number, number] = [128, 128, 128];
    if (Array.isArray(colorVal)) {
      const nums = colorVal.filter((v): v is number => typeof v === "number");
      if (nums.length >= 3) color = [nums[0], nums[1], nums[2]];
    }

    const isWater = cat["is_water"] === true;
    const movementCost = typeof cat["movement_cost"] === "number" ? cat["movement_cost"] : 1.0;

    categories.set(name, { name, color, isWater, movementCost });

    // Overrides: lista de IDs de províncias dentro da categoria
    // Formato: terrain_override = { 1 2 3 } OU province_id = { 1 2 3 }
    // Victoria 2 usa uma lista numérica de IDs diretamente na categoria
    for (const [catKey, catVal] of Object.entries(cat)) {
      if (catKey.startsWith("__")) continue;
      if (Array.isArray(catVal)) {
        const numericIds = catVal.filter((v): v is number => typeof v === "number");
        if (numericIds.length > 0 && catKey !== "color") {
          // Lista de IDs de provincias com override de terreno
          for (const id of numericIds) {
            overrides.set(id, name);
          }
        }
      }
    }
  }

  console.info(
    `[TerrainParser] terrain.txt: ${categories.size} categorias, ${overrides.size} overrides`
  );

  return { paletteSize, categories, overrides };
}

export function parseRegionTxt(content: string): RegionMap {
  const obj = parseClausewitz(content);
  const regions: RegionMap = new Map();

  for (const [name, val] of Object.entries(obj)) {
    if (name.startsWith("__")) continue;
    const ids = extractProvinceIds(val);
    if (ids.length > 0) {
      regions.set(name, ids);
    }
  }

  console.info(`[RegionParser] region.txt: ${regions.size} regiões carregadas`);
  return regions;
}

export function parseContinentTxt(content: string): ContinentMap {
  const obj = parseClausewitz(content);
  const continents: ContinentMap = new Map();

  for (const [name, val] of Object.entries(obj)) {
    if (name.startsWith("__")) continue;
    if (typeof val !== "object" || Array.isArray(val)) continue;

    const block = val as ClausewitzObject;
    // O Victoria 2 usa `provinces = { ... }` dentro do bloco de continente
    const provincesVal = block["provinces"];
    const ids = extractProvinceIds(provincesVal);

    if (ids.length > 0) {
      continents.set(name, ids);
    }
  }

  console.info(`[ContinentParser] continent.txt: ${continents.size} continentes carregados`);
  return continents;
}

export function parseClimateTxt(content: string): ClimateDefinition {
  const obj = parseClausewitz(content);
  const categories = new Map<string, ClimateCategory>();
  const provinceClimate = new Map<ProvinceId, string>();

  for (const [name, val] of Object.entries(obj)) {
    if (name.startsWith("__")) continue;

    if (Array.isArray(val)) {
      // Chave repetida → array de dois blocos (definição + lista de IDs)
      for (const entry of val) {
        if (typeof entry !== "object" || Array.isArray(entry)) continue;
        const block = entry as ClausewitzObject;
        processClimateBlock(name, block, categories, provinceClimate);
      }
    } else if (typeof val === "object" && !Array.isArray(val)) {
      const block = val as ClausewitzObject;
      processClimateBlock(name, block, categories, provinceClimate);
    }
  }

  console.info(
    `[ClimateParser] climate.txt: ${categories.size} categorias, ${provinceClimate.size} províncias com clima atribuído`
  );

  return { categories, provinceClimate };
}

function processClimateBlock(
  name: string,
  block: ClausewitzObject,
  categories: Map<string, ClimateCategory>,
  provinceClimate: Map<ProvinceId, string>
): void {
  const values = block["__values__"];
  if (Array.isArray(values)) {
    // É um bloco de lista de IDs
    for (const v of values) {
      if (typeof v === "number") {
        provinceClimate.set(v, name);
      }
    }
    return;
  }

  // Verificar se há IDs numéricos diretamente no objeto (sem chave "provinces")
  let hasNumericIds = false;
  for (const v of Object.values(block)) {
    if (typeof v === "number") {
      hasNumericIds = true;
      break;
    }
  }

  if (hasNumericIds) {
    for (const v of Object.values(block)) {
      if (typeof v === "number") provinceClimate.set(v, name);
    }
    return;
  }

  // É um bloco de definição de categoria
  const cat: ClimateCategory = {
    name,
    farmRgoSize: typeof block["farm_rgo_size"] === "number" ? block["farm_rgo_size"] : 0,
    farmRgoEff: typeof block["farm_rgo_eff"] === "number" ? block["farm_rgo_eff"] : 0,
    mineRgoSize: typeof block["mine_rgo_size"] === "number" ? block["mine_rgo_size"] : 0,
    mineRgoEff: typeof block["mine_rgo_eff"] === "number" ? block["mine_rgo_eff"] : 0,
  };

  if (typeof block["max_attrition"] === "number") {
    cat.maxAttrition = block["max_attrition"];
  }

  categories.set(name, cat);
}

function extractProvinceIds(val: unknown): ProvinceId[] {
  if (typeof val === "number") return [val];

  if (Array.isArray(val)) {
    const ids: ProvinceId[] = [];
    for (const item of val) {
      ids.push(...extractProvinceIds(item));
    }
    return ids;
  }

  if (typeof val === "object" && val !== null) {
    const ids: ProvinceId[] = [];
    for (const v of Object.values(val as Record<string, unknown>)) {
      ids.push(...extractProvinceIds(v));
    }
    return ids;
  }

  return [];
}
